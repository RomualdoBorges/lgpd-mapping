import 'reflect-metadata';
import { createHash, randomUUID } from 'node:crypto';
import { request as httpRequest } from 'node:http';
import { type INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { sql } from 'drizzle-orm';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { AppModule } from '../../src/app.module.js';
import { ProcessingActivityReadService } from '../../src/processing-activities/processing-activity-read.service.js';
import { createSession } from '../../src/persistence/auth-repositories.js';
import * as grantsRepository from '../../src/persistence/membership-grants-repository.js';
import {
  createTestDatabase,
  A,
  B,
  BU_A,
  BU_B,
  M_A,
  U,
  GRANT_A,
  ROLE,
} from './database.js';

let fixture: Awaited<ReturnType<typeof createTestDatabase>>;
let application: INestApplication;
let base: string;
const ID = randomUUID(),
  OTHER_ID = randomUUID(),
  HIDDEN_ID = randomUUID(),
  UNIT = randomUUID();
const notFound = {
  error: {
    code: 'PROCESSING_ACTIVITY_NOT_FOUND',
    message: 'Atividade de tratamento não encontrada.',
  },
};
const authRequired = {
  error: {
    code: 'AUTHENTICATION_REQUIRED',
    message: 'Autenticação necessária.',
  },
};
const denied = {
  error: {
    code: 'ORGANIZATION_ACCESS_DENIED',
    message: 'Acesso à organização não autorizado.',
  },
};
function get(
  id: string = ID,
  headers: Record<string, string> = {},
  query = '',
) {
  return fetch(`${base}/api/v1/processing-activities/${id}${query}`, {
    headers: {
      cookie: 'lgpd_session=p4-test-session',
      'X-Organization-Id': A,
      ...headers,
    },
  });
}
beforeAll(async () => {
  fixture = await createTestDatabase();
  const previous = process.env.DB_NAME;
  try {
    process.env.DB_NAME = fixture.name;
    application = await NestFactory.create(AppModule, {
      logger: false,
      abortOnError: false,
    });
    await application.listen(0, '127.0.0.1');
  } finally {
    if (previous === undefined) delete process.env.DB_NAME;
    else process.env.DB_NAME = previous;
  }
  const address = application.getHttpServer().address();
  if (!address || typeof address === 'string')
    throw Error('Porta HTTP ausente');
  base = `http://127.0.0.1:${address.port}`;
});
beforeEach(async () => {
  await fixture.reset();
  await createSession(fixture.database, {
    userId: U,
    tokenDigest: createHash('sha256').update('p4-test-session').digest('hex'),
    expiresAt: new Date('2099-01-01T00:00:00Z'),
  });
  await fixture.preparation.query(
    'insert into business_units(id,organization_id,name) values($1,$2,$3)',
    [UNIT, A, 'Outra área'],
  );
  for (const [id, org, unit] of [
    [ID, A, BU_A],
    [OTHER_ID, B, BU_B],
    [HIDDEN_ID, A, UNIT],
  ])
    await fixture.preparation.query(
      "insert into processing_activities(id,organization_id,business_unit_id,name,created_at,updated_at) values($1,$2,$3,$4,'2026-10-28T12:00:00.123456Z','2026-10-28T12:01:00.654321Z')",
      [id, org, unit, 'Atividade fictícia'],
    );
});
afterEach(() => vi.restoreAllMocks());
afterAll(async () => {
  try {
    if (application) await application.close();
  } finally {
    if (fixture) await fixture.close();
  }
});

describe('P.4 — HTTP e PostgreSQL reais', () => {
  it.each(['ausente', 'malformada', 'inexistente', 'expirada', 'revogada'])(
    'Session %s: 401 antes de P.3',
    async (mode) => {
      if (mode === 'expirada')
        await fixture.preparation.query(
          "update public.sessions set expires_at='2000-01-01T00:00:00Z'",
        );
      if (mode === 'revogada')
        await fixture.preparation.query(
          'update public.sessions set revoked_at=now()',
        );
      const spy = vi.spyOn(
        application.get(ProcessingActivityReadService),
        'findById',
      );
      const response = await get(ID, {
        cookie:
          mode === 'ausente'
            ? ''
            : mode === 'malformada'
              ? 'lgpd_session='
              : mode === 'inexistente'
                ? 'lgpd_session=unknown'
                : 'lgpd_session=p4-test-session',
      });
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual(authRequired);
      expect(spy).not.toHaveBeenCalled();
    },
  );
  it('header ausente produz 400 e não chama P.3', async () => {
    const spy = vi.spyOn(
      application.get(ProcessingActivityReadService),
      'findById',
    );
    const response = await fetch(`${base}/api/v1/processing-activities/${ID}`, {
      headers: { cookie: 'lgpd_session=p4-test-session' },
    });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: {
        code: 'ORGANIZATION_CONTEXT_REQUIRED',
        message: 'A organização da requisição é obrigatória.',
      },
    });
    expect(spy).not.toHaveBeenCalled();
  });
  it.each(['invalid', `${A},${B}`])(
    'header inválido %s produz contrato 400',
    async (header) => {
      const response = await get(ID, { 'X-Organization-Id': header });
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual({
        error: {
          code: 'INVALID_ORGANIZATION_CONTEXT',
          message: 'Contexto de organização inválido.',
        },
      });
    },
  );
  it('headers duplicados reais são rejeitados', async () => {
    const result = await new Promise<{
      status: number | undefined;
      body: string;
    }>((resolve, reject) => {
      const request = httpRequest(
        `${base}/api/v1/processing-activities/${ID}`,
        {
          headers: [
            'Host',
            new URL(base).host,
            'Cookie',
            'lgpd_session=p4-test-session',
            'X-Organization-Id',
            A,
            'X-Organization-Id',
            B,
          ],
        },
        (response) => {
          let body = '';
          response.setEncoding('utf8');
          response.on('data', (chunk) => (body += chunk));
          response.on('end', () =>
            resolve({ status: response.statusCode, body }),
          );
        },
      );
      request.on('error', reject);
      request.end();
    });
    expect(result.status).toBe(400);
    expect(JSON.parse(result.body)).toEqual({
      error: {
        code: 'INVALID_ORGANIZATION_CONTEXT',
        message: 'Contexto de organização inválido.',
      },
    });
  });
  it.each([
    'Organization inexistente',
    'Membership inativa',
    'Membership de outro User',
  ])('%s: 403 uniforme antes de P.3', async (mode) => {
    if (mode === 'Membership inativa')
      await fixture.preparation.query(
        'update memberships set active=false where id=$1',
        [M_A],
      );
    if (mode === 'Membership de outro User') {
      const user = randomUUID();
      await fixture.preparation.query(
        'insert into users(id,name,email) values($1,$2,$3)',
        [user, 'Pessoa fictícia', 'p4@example.invalid'],
      );
      await fixture.preparation.query(
        'update memberships set user_id=$1 where id=$2',
        [user, M_A],
      );
    }
    const spy = vi.spyOn(
      application.get(ProcessingActivityReadService),
      'findById',
    );
    const response = await get(ID, {
      'X-Organization-Id':
        mode === 'Organization inexistente' ? randomUUID() : A,
    });
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual(denied);
    expect(spy).not.toHaveBeenCalled();
  });
  it('UUID inválido é 400 sem chamada à P.3; guards precedem pipe', async () => {
    const spy = vi.spyOn(
      application.get(ProcessingActivityReadService),
      'findById',
    );
    const response = await get('invalid');
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Falha na validação da requisição',
        details: [{ field: 'id', code: 'INVALID_UUID' }],
      },
    });
    expect(spy).not.toHaveBeenCalled();
    expect((await get('invalid', { cookie: '' })).status).toBe(401);
  });
  it('inexistente, cross-tenant e invisível possuem 404 idêntico', async () => {
    for (const id of [randomUUID(), OTHER_ID, HIDDEN_ID]) {
      const response = await get(id);
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual(notFound);
    }
  });
  it.each(['COLLABORATOR', 'MANAGER'])(
    '%s/BU: envelope exato e uma chamada real à P.3',
    async (role) => {
      await fixture.preparation.query('update roles set code=$1 where id=$2', [
        role,
        ROLE,
      ]);
      const spy = vi.spyOn(
        application.get(ProcessingActivityReadService),
        'findById',
      );
      const response = await get(
        ID,
        {},
        `?organizationId=${B}&membershipId=${randomUUID()}&reach=ORGANIZATION&grants=anything`,
      );
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        data: {
          id: ID,
          organizationId: A,
          businessUnitId: BU_A,
          name: 'Atividade fictícia',
          createdAt: '2026-10-28T12:00:00.123456Z',
          updatedAt: '2026-10-28T12:01:00.654321Z',
        },
      });
      expect(spy).toHaveBeenCalledExactlyOnceWith(
        { membershipId: M_A, authorizedOrganizationId: A },
        ID,
      );
    },
  );
  it('DPO/Organization lê outra área do próprio tenant, nunca outro tenant', async () => {
    await fixture.preparation.query(
      'delete from role_assignment_business_units where role_assignment_id=$1',
      [GRANT_A],
    );
    await fixture.preparation.query(
      "update role_assignments set scope='ORGANIZATION' where id=$1",
      [GRANT_A],
    );
    await fixture.preparation.query("update roles set code='DPO' where id=$1", [
      ROLE,
    ]);
    expect((await get(HIDDEN_ID)).status).toBe(200);
    expect((await get(OTHER_ID)).status).toBe(404);
  });
  it.each(['BU vazia', 'DPO/BU', 'MANAGER/Organization'])(
    '%s não concede leitura',
    async (mode) => {
      if (mode !== 'DPO/BU')
        await fixture.preparation.query(
          'delete from role_assignment_business_units where role_assignment_id=$1',
          [GRANT_A],
        );
      if (mode === 'DPO/BU')
        await fixture.preparation.query(
          "update roles set code='DPO' where id=$1",
          [ROLE],
        );
      if (mode === 'MANAGER/Organization')
        await fixture.preparation.query(
          "update role_assignments set scope='ORGANIZATION' where id=$1",
          [GRANT_A],
        );
      const response = await get();
      expect(response.status).toBe(404);
      expect(await response.json()).toEqual(notFound);
    },
  );
  it('SQL real falha, chega como 500 sanitizado e operação posterior recupera', async () => {
    const read = grantsRepository.readMembershipGrants;
    const spy = vi
      .spyOn(grantsRepository, 'readMembershipGrants')
      .mockImplementation(async (tx, ctx) => {
        await tx.execute(sql`select 1/0`);
        return read(tx, ctx);
      });
    const response = await get();
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Ocorreu um erro inesperado.' },
    });
    spy.mockRestore();
    expect((await get()).status).toBe(200);
  });
  it('/health permanece público e funcional', async () => {
    const response = await fetch(`${base}/health`);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
  });
});
