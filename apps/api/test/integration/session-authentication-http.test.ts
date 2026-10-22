import 'reflect-metadata';
import { createHash } from 'node:crypto';
import {
  Controller,
  Get,
  HttpCode,
  Module,
  Post,
  UseGuards,
  type INestApplication,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { AuthenticatedIdentity } from '../../src/auth/authenticated-identity.js';
import { CurrentIdentity } from '../../src/auth/current-identity.decorator.js';
import { SessionAuthenticationGuard } from '../../src/auth/session-authentication.guard.js';
import { SessionAuthenticationService } from '../../src/auth/session-authentication.service.js';
import { ENVIRONMENT, type RuntimeMode } from '../../src/config/environment.js';
import {
  createSession,
  findSessionByTokenDigest,
  revokeSession,
} from '../../src/persistence/auth-repositories.js';
import { DatabaseService } from '../../src/persistence/database.service.js';
import { U, createTestDatabase } from './database.js';

const PUBLIC_RESPONSE = { public: true };
const AUTHENTICATION_REQUIRED = {
  error: {
    code: 'AUTHENTICATION_REQUIRED',
    message: 'Autenticação necessária.',
  },
};

class AuthenticationBoundaryTestController {
  publicEndpoint() {
    return PUBLIC_RESPONSE;
  }

  protectedEndpoint(identity: AuthenticatedIdentity) {
    return passIdentityExplicitlyToUseCase(identity);
  }

  protectedPostEndpoint(identity: AuthenticatedIdentity) {
    return passIdentityExplicitlyToUseCase(identity);
  }

  identityWithoutGuard(identity: AuthenticatedIdentity) {
    return passIdentityExplicitlyToUseCase(identity);
  }
}

Controller()(AuthenticationBoundaryTestController);
const controllerPrototype = AuthenticationBoundaryTestController.prototype;
function methodDescriptor(
  name:
    | 'publicEndpoint'
    | 'protectedEndpoint'
    | 'protectedPostEndpoint'
    | 'identityWithoutGuard',
) {
  const descriptor = Object.getOwnPropertyDescriptor(controllerPrototype, name);
  if (!descriptor) throw new Error(`Método de teste ausente: ${name}.`);
  return descriptor;
}
Get('public')(
  controllerPrototype,
  'publicEndpoint',
  methodDescriptor('publicEndpoint'),
);
Get('protected')(
  controllerPrototype,
  'protectedEndpoint',
  methodDescriptor('protectedEndpoint'),
);
UseGuards(SessionAuthenticationGuard)(
  controllerPrototype,
  'protectedEndpoint',
  methodDescriptor('protectedEndpoint'),
);
CurrentIdentity()(controllerPrototype, 'protectedEndpoint', 0);
Post('protected')(
  controllerPrototype,
  'protectedPostEndpoint',
  methodDescriptor('protectedPostEndpoint'),
);
HttpCode(200)(
  controllerPrototype,
  'protectedPostEndpoint',
  methodDescriptor('protectedPostEndpoint'),
);
UseGuards(SessionAuthenticationGuard)(
  controllerPrototype,
  'protectedPostEndpoint',
  methodDescriptor('protectedPostEndpoint'),
);
CurrentIdentity()(controllerPrototype, 'protectedPostEndpoint', 0);
Get('identity-without-guard')(
  controllerPrototype,
  'identityWithoutGuard',
  methodDescriptor('identityWithoutGuard'),
);
CurrentIdentity()(controllerPrototype, 'identityWithoutGuard', 0);

function passIdentityExplicitlyToUseCase(identity: AuthenticatedIdentity) {
  return {
    sessionId: identity.sessionId,
    authenticatedUserId: identity.authenticatedUserId,
    keys: Object.keys(identity).sort(),
  };
}

let fixture: Awaited<ReturnType<typeof createTestDatabase>>;

async function createHttpApplication(mode: RuntimeMode) {
  class AuthenticationBoundaryTestModule {}
  Module({
    controllers: [AuthenticationBoundaryTestController],
    providers: [
      {
        provide: ENVIRONMENT,
        useValue: {
          host: '127.0.0.1',
          port: 0,
          runtimeMode: mode,
          database: {},
        },
      },
      {
        provide: DatabaseService,
        useValue: {
          resolveSessionByTokenDigest: (tokenDigest: string) =>
            findSessionByTokenDigest(fixture.database, tokenDigest),
        },
      },
      SessionAuthenticationService,
      SessionAuthenticationGuard,
    ],
  })(AuthenticationBoundaryTestModule);
  const application = await NestFactory.create(
    AuthenticationBoundaryTestModule,
    { logger: false },
  );
  await application.listen(0, '127.0.0.1');
  return application;
}

function url(application: INestApplication, path: string): string {
  const address = application.getHttpServer().address() as {
    port: number;
  };
  return `http://127.0.0.1:${address.port}/${path}`;
}

async function request(
  application: INestApplication,
  path: string,
  cookie?: string,
  init: RequestInit = {},
) {
  const headers = new Headers(init.headers);
  if (cookie !== undefined) headers.set('cookie', cookie);
  return fetch(url(application, path), { ...init, headers });
}

async function persistSession(
  secret: string,
  expiresAt: Date = new Date('2099-01-01T00:00:00.000Z'),
) {
  return createSession(fixture.database, {
    userId: U,
    tokenDigest: createHash('sha256').update(secret).digest('hex'),
    expiresAt,
  });
}

let developmentApp: INestApplication;
let productionApp: INestApplication;

beforeAll(async () => {
  fixture = await createTestDatabase();
  developmentApp = await createHttpApplication('test');
  productionApp = await createHttpApplication('production');
});
beforeEach(async () => fixture.reset());
afterAll(async () => {
  await developmentApp.close();
  await productionApp.close();
  await fixture.close();
});

describe('Session Authentication Boundary HTTP', () => {
  it('mantém endpoint público alheio a cookie ausente ou inválido', async () => {
    for (const cookie of [undefined, 'lgpd_session=']) {
      const response = await request(developmentApp, 'public', cookie);
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual(PUBLIC_RESPONSE);
      expect(response.headers.get('set-cookie')).toBeNull();
    }
  });

  it('retorna contrato uniforme sem limpar cookie ausente', async () => {
    const response = await request(developmentApp, 'protected');
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual(AUTHENTICATION_REQUIRED);
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it('recusa cookie inválido e o expira no perfil HTTP', async () => {
    const response = await request(
      developmentApp,
      'protected',
      'lgpd_session=',
    );
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual(AUTHENTICATION_REQUIRED);
    const removed = response.headers.get('set-cookie') ?? '';
    expect(removed).toContain('lgpd_session=');
    expect(removed).toContain('Max-Age=0');
    expect(removed).not.toContain('Secure');
    expect(removed).not.toContain('Domain');
  });

  it('classifica cookie esperado sem igual como inválido e o remove', async () => {
    const response = await request(
      developmentApp,
      'protected',
      'outro-sem-igual; lgpd_session',
    );
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual(AUTHENTICATION_REQUIRED);
    expect(response.headers.get('set-cookie')).toContain('lgpd_session=');
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
  });

  it('recusa Session inexistente com a mesma resposta e limpa o cookie', async () => {
    const response = await request(
      developmentApp,
      'protected',
      'lgpd_session=inexistente',
    );
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual(AUTHENTICATION_REQUIRED);
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
  });

  it('recusa Session expirada com a mesma resposta e limpa o cookie', async () => {
    await persistSession('expirada', new Date('2020-01-01T00:00:00.000Z'));
    const response = await request(
      developmentApp,
      'protected',
      'lgpd_session=expirada',
    );
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual(AUTHENTICATION_REQUIRED);
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
  });

  it('recusa Session revogada sem revogá-la novamente e limpa o cookie', async () => {
    const persisted = await persistSession('revogada');
    const revokedAt = new Date('2030-01-01T00:00:00.000Z');
    await revokeSession(fixture.database, persisted.sessionId, revokedAt);
    const response = await request(
      developmentApp,
      'protected',
      'lgpd_session=revogada',
    );
    expect(response.status).toBe(401);
    expect(await response.json()).toEqual(AUTHENTICATION_REQUIRED);
    expect(response.headers.get('set-cookie')).toContain('Max-Age=0');
    const row = await fixture.migration.query<{ revoked_at: Date }>(
      'select revoked_at from sessions where id=$1',
      [persisted.sessionId],
    );
    expect(row.rows[0]?.revoked_at).toEqual(revokedAt);
  });

  it('resolve Session real e expõe somente AuthenticatedIdentity tipada', async () => {
    const persisted = await persistSession('valida');
    const response = await request(
      developmentApp,
      'protected',
      'lgpd_session=valida',
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      sessionId: persisted.sessionId,
      authenticatedUserId: U,
      keys: ['authenticatedUserId', 'sessionId'],
    });
    expect(response.headers.get('set-cookie')).toBeNull();
  });

  it.each([
    {
      channel: 'query',
      send: () =>
        request(
          developmentApp,
          'protected?authenticatedUserId=forjado&sessionId=forjada',
          'lgpd_session=identidade-real',
        ),
    },
    {
      channel: 'headers',
      send: () =>
        request(developmentApp, 'protected', 'lgpd_session=identidade-real', {
          headers: {
            'x-authenticated-user-id': 'forjado',
            'x-session-id': 'forjada',
          },
        }),
    },
    {
      channel: 'body',
      send: () =>
        request(developmentApp, 'protected', 'lgpd_session=identidade-real', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            authenticatedUserId: 'forjado',
            sessionId: 'forjada',
          }),
        }),
    },
  ])(
    'ignora identidade fornecida pelo cliente via $channel',
    async ({ send }) => {
      const persisted = await persistSession('identidade-real');
      const response = await send();
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        sessionId: persisted.sessionId,
        authenticatedUserId: U,
        keys: ['authenticatedUserId', 'sessionId'],
      });
    },
  );

  it('CurrentIdentity sem identidade falha sem aceitar fallback do cliente', async () => {
    const response = await request(
      developmentApp,
      'identity-without-guard?authenticatedUserId=forjado&sessionId=forjada',
      undefined,
      {
        headers: {
          'x-authenticated-user-id': 'forjado',
          'x-session-id': 'forjada',
        },
      },
    );
    expect(response.status).toBe(500);
    expect(JSON.stringify(await response.json())).not.toContain('forjado');
  });

  it('mantém no PostgreSQL somente o digest esperado para a Session autenticada', async () => {
    const secret = 'segredo-nao-persistido';
    await persistSession(secret);
    const response = await request(
      developmentApp,
      'protected',
      `lgpd_session=${secret}`,
    );
    expect(response.status).toBe(200);
    const persisted = await fixture.migration.query<{ token_digest: string }>(
      'select token_digest from sessions',
    );
    expect(persisted.rows).toEqual([
      { token_digest: createHash('sha256').update(secret).digest('hex') },
    ]);
    expect(JSON.stringify(persisted.rows)).not.toContain(secret);
  });

  it('401 de uma Session não altera ela nem outra Session', async () => {
    const first = await persistSession(
      'primeira-expirada',
      new Date('2020-01-01T00:00:00.000Z'),
    );
    const second = await persistSession('segunda-intacta');
    const ids = [first.sessionId, second.sessionId];
    const before = await fixture.migration.query(
      'select id,token_digest,expires_at,revoked_at from sessions where id=any($1::uuid[]) order by id',
      [ids],
    );

    const response = await request(
      developmentApp,
      'protected',
      'lgpd_session=primeira-expirada',
    );
    expect(response.status).toBe(401);

    const after = await fixture.migration.query(
      'select id,token_digest,expires_at,revoked_at from sessions where id=any($1::uuid[]) order by id',
      [ids],
    );
    expect(after.rows).toEqual(before.rows);
  });

  it('não vaza identidade entre requests concorrentes', async () => {
    const first = await persistSession('primeira');
    const second = await persistSession('segunda');
    const [firstResponse, secondResponse] = await Promise.all([
      request(developmentApp, 'protected', 'lgpd_session=primeira'),
      request(developmentApp, 'protected', 'lgpd_session=segunda'),
    ]);
    expect((await firstResponse.json()).sessionId).toBe(first.sessionId);
    expect((await secondResponse.json()).sessionId).toBe(second.sessionId);
  });

  it('usa exclusivamente o nome __Host no perfil de produção', async () => {
    await persistSession('producao');
    const wrongName = await request(
      productionApp,
      'protected',
      'lgpd_session=producao',
    );
    expect(wrongName.status).toBe(401);
    expect(wrongName.headers.get('set-cookie')).toBeNull();

    const valid = await request(
      productionApp,
      'protected',
      '__Host-lgpd_session=producao',
    );
    expect(valid.status).toBe(200);
  });

  it('remove cookie inválido de produção com atributos seguros', async () => {
    const response = await request(
      productionApp,
      'protected',
      '__Host-lgpd_session=',
    );
    expect(response.status).toBe(401);
    const removed = response.headers.get('set-cookie') ?? '';
    expect(removed).toContain('__Host-lgpd_session=');
    expect(removed).toContain('Path=/');
    expect(removed).toContain('HttpOnly');
    expect(removed).toContain('SameSite=Lax');
    expect(removed).toContain('Secure');
    expect(removed).not.toContain('Domain');
  });
});
