import 'reflect-metadata';
import { createHash, randomUUID } from 'node:crypto';
import {
  Controller,
  Get,
  HttpCode,
  Inject,
  Module,
  Post,
  UseGuards,
  type INestApplication,
} from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import type { AuthenticatedIdentity } from '../../src/auth/authenticated-identity.js';
import { CurrentIdentity } from '../../src/auth/current-identity.decorator.js';
import { SessionAuthenticationGuard } from '../../src/auth/session-authentication.guard.js';
import { SessionAuthenticationService } from '../../src/auth/session-authentication.service.js';
import {
  databaseConfiguration,
  ENVIRONMENT,
} from '../../src/config/environment.js';
import {
  createSession,
  findSessionByTokenDigest,
} from '../../src/persistence/auth-repositories.js';
import { DatabaseService } from '../../src/persistence/database.service.js';
import { resolveMembership } from '../../src/persistence/membership-bootstrap-repository.js';
import * as schema from '../../src/persistence/schema.js';
import {
  withTenant,
  type Database,
} from '../../src/persistence/tenant-transaction.js';
import type { AuthorizedTenantContext } from '../../src/tenant/authorized-tenant-context.js';
import { CurrentTenantContext } from '../../src/tenant/current-tenant-context.decorator.js';
import { TenantContextGuard } from '../../src/tenant/tenant-context.guard.js';
import { TenantContextService } from '../../src/tenant/tenant-context.service.js';
import {
  A,
  B,
  BU_A,
  BU_B,
  M_A,
  M_B,
  U,
  createTestDatabase,
} from './database.js';

const REQUIRED = {
  error: {
    code: 'ORGANIZATION_CONTEXT_REQUIRED',
    message: 'A organização da requisição é obrigatória.',
  },
};
const INVALID = {
  error: {
    code: 'INVALID_ORGANIZATION_CONTEXT',
    message: 'Contexto de organização inválido.',
  },
};
const DENIED = {
  error: {
    code: 'ORGANIZATION_ACCESS_DENIED',
    message: 'Acesso à organização não autorizado.',
  },
};

let fixture: Awaited<ReturnType<typeof createTestDatabase>>;
let requestPool: pg.Pool;
let requestDatabase: Database;
let tenantOperations = 0;
let membershipResolutions: Array<[string, string]> = [];
let transactionBarrier: (() => Promise<void>) | null = null;

class TenantRequestContextTestController {
  constructor(private readonly database: DatabaseService) {}

  async tenantEndpoint(
    identity: AuthenticatedIdentity,
    tenant: AuthorizedTenantContext,
  ) {
    return passContextsExplicitlyToUseCase(identity, tenant, this.database);
  }

  async tenantPostEndpoint(
    identity: AuthenticatedIdentity,
    tenant: AuthorizedTenantContext,
  ) {
    return passContextsExplicitlyToUseCase(identity, tenant, this.database);
  }

  tenantContextWithoutGuard(tenant: AuthorizedTenantContext) {
    return tenant;
  }
}

Controller('tenant-context')(TenantRequestContextTestController);
Inject(DatabaseService)(TenantRequestContextTestController, undefined, 0);
const controllerPrototype = TenantRequestContextTestController.prototype;
const tenantEndpointDescriptor = Object.getOwnPropertyDescriptor(
  controllerPrototype,
  'tenantEndpoint',
);
if (!tenantEndpointDescriptor)
  throw new Error('Endpoint de teste tenant ausente.');
Get()(controllerPrototype, 'tenantEndpoint', tenantEndpointDescriptor);
UseGuards(SessionAuthenticationGuard, TenantContextGuard)(
  controllerPrototype,
  'tenantEndpoint',
  tenantEndpointDescriptor,
);
CurrentIdentity()(controllerPrototype, 'tenantEndpoint', 0);
CurrentTenantContext()(controllerPrototype, 'tenantEndpoint', 1);

const tenantPostEndpointDescriptor = Object.getOwnPropertyDescriptor(
  controllerPrototype,
  'tenantPostEndpoint',
);
if (!tenantPostEndpointDescriptor)
  throw new Error('Endpoint POST de teste tenant ausente.');
Post()(controllerPrototype, 'tenantPostEndpoint', tenantPostEndpointDescriptor);
HttpCode(200)(
  controllerPrototype,
  'tenantPostEndpoint',
  tenantPostEndpointDescriptor,
);
UseGuards(SessionAuthenticationGuard, TenantContextGuard)(
  controllerPrototype,
  'tenantPostEndpoint',
  tenantPostEndpointDescriptor,
);
CurrentIdentity()(controllerPrototype, 'tenantPostEndpoint', 0);
CurrentTenantContext()(controllerPrototype, 'tenantPostEndpoint', 1);

const tenantContextWithoutGuardDescriptor = Object.getOwnPropertyDescriptor(
  controllerPrototype,
  'tenantContextWithoutGuard',
);
if (!tenantContextWithoutGuardDescriptor)
  throw new Error('Endpoint sem guard de teste tenant ausente.');
Get('without-guard')(
  controllerPrototype,
  'tenantContextWithoutGuard',
  tenantContextWithoutGuardDescriptor,
);
CurrentTenantContext()(controllerPrototype, 'tenantContextWithoutGuard', 0);

async function passContextsExplicitlyToUseCase(
  identity: AuthenticatedIdentity,
  tenant: AuthorizedTenantContext,
  database: Pick<DatabaseService, 'withAuthorizedTenant'>,
) {
  tenantOperations += 1;
  return database.withAuthorizedTenant(tenant, async (transaction) => {
    const setting = await transaction.execute<{ organization_id: string }>(
      sql`select current_setting('lgpd.organization_id') as organization_id`,
    );
    const units = await transaction.execute<{ id: string }>(
      sql`select id from business_units order by id`,
    );
    if (transactionBarrier) await transactionBarrier();
    return {
      identity,
      tenant,
      transactionOrganizationId: setting.rows[0]?.organization_id,
      businessUnitIds: units.rows.map((row) => row.id),
    };
  });
}

async function createApplication() {
  class TenantRequestContextTestModule {}
  Module({
    controllers: [TenantRequestContextTestController],
    providers: [
      {
        provide: ENVIRONMENT,
        useValue: {
          host: '127.0.0.1',
          port: 0,
          runtimeMode: 'test',
          database: {},
        },
      },
      {
        provide: DatabaseService,
        useValue: {
          resolveSessionByTokenDigest: (tokenDigest: string) =>
            findSessionByTokenDigest(requestDatabase, tokenDigest),
          resolveMembership: (
            authenticatedUserId: string,
            requestedOrganizationId: string,
          ) => {
            membershipResolutions.push([
              authenticatedUserId,
              requestedOrganizationId,
            ]);
            return resolveMembership(
              requestDatabase,
              authenticatedUserId,
              requestedOrganizationId,
            );
          },
          withAuthorizedTenant: <T>(
            context: AuthorizedTenantContext,
            operation: Parameters<DatabaseService['withAuthorizedTenant']>[1],
          ) =>
            withTenant(
              requestDatabase,
              context.authorizedOrganizationId,
              operation,
            ) as Promise<T>,
        },
      },
      SessionAuthenticationService,
      SessionAuthenticationGuard,
      TenantContextService,
      TenantContextGuard,
    ],
  })(TenantRequestContextTestModule);

  const application = await NestFactory.create(TenantRequestContextTestModule, {
    logger: false,
  });
  await application.listen(0, '127.0.0.1');
  return application;
}

function applicationUrl(
  application: INestApplication,
  path = 'tenant-context',
): string {
  const address = application.getHttpServer().address() as { port: number };
  return `http://127.0.0.1:${address.port}/${path}`;
}

async function request(
  application: INestApplication,
  organizationHeader?: string,
  secret = 'tenant-session',
  path = 'tenant-context',
  init: RequestInit = {},
) {
  const headers = new Headers(init.headers);
  headers.set('cookie', `lgpd_session=${secret}`);
  if (organizationHeader !== undefined)
    headers.set('x-organization-id', organizationHeader);
  return fetch(applicationUrl(application, path), { ...init, headers });
}

function createBarrier(participants: number): () => Promise<void> {
  let arrivals = 0;
  let release: (() => void) | undefined;
  const ready = new Promise<void>((resolve) => {
    release = resolve;
  });
  return async () => {
    arrivals += 1;
    if (arrivals === participants) release?.();
    await ready;
  };
}

async function persistSession(secret = 'tenant-session') {
  return createSession(fixture.database, {
    userId: U,
    tokenDigest: createHash('sha256').update(secret).digest('hex'),
    expiresAt: new Date('2099-01-01T00:00:00.000Z'),
  });
}

async function addOrganizationWithMembership(userId: string, active: boolean) {
  const organizationId = randomUUID();
  const membershipId = randomUUID();
  await fixture.migration.query(
    'insert into users (id,name,email) values ($1,$2,$3) on conflict (id) do nothing',
    [userId, 'Outra pessoa fictícia', `${userId}@example.invalid`],
  );
  await withTenant(fixture.database, organizationId, async (transaction) => {
    await transaction.execute(
      sql`insert into organizations (id,name)
          values (${organizationId}, 'Outra organização fictícia')`,
    );
    await transaction.execute(
      sql`insert into memberships (id,organization_id,user_id,active)
          values (${membershipId},${organizationId},${userId},${active})`,
    );
  });
  return { organizationId, membershipId };
}

let application: INestApplication;

beforeAll(async () => {
  fixture = await createTestDatabase();
  requestPool = new pg.Pool({
    ...databaseConfiguration(process.env, 'RUNTIME'),
    database: fixture.name,
    max: 2,
  });
  requestDatabase = drizzle(requestPool, { schema });
  application = await createApplication();
});
beforeEach(async () => {
  await fixture.reset();
  tenantOperations = 0;
  membershipResolutions = [];
  transactionBarrier = null;
});
afterAll(async () => {
  await application.close();
  await requestPool.end();
  await fixture.close();
});

describe('Tenant Request Context HTTP', () => {
  it('retorna 400 quando X-Organization-Id está ausente', async () => {
    await persistSession();
    const response = await request(application);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual(REQUIRED);
    expect(membershipResolutions).toEqual([]);
    expect(tenantOperations).toBe(0);
  });

  it.each(['inválido', `${A}, ${B}`])(
    'retorna 400 para header inválido ou múltiplo: %s',
    async (header) => {
      await persistSession();
      const response = await request(application, header);
      expect(response.status).toBe(400);
      expect(await response.json()).toEqual(INVALID);
      expect(membershipResolutions).toEqual([]);
      expect(tenantOperations).toBe(0);
    },
  );

  it('resolve Membership ativa, cria os dois contextos e abre withTenant depois', async () => {
    const session = await persistSession();
    const response = await request(application, A);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      identity: { sessionId: session.sessionId, authenticatedUserId: U },
      tenant: { membershipId: M_A, authorizedOrganizationId: A },
      transactionOrganizationId: A,
      businessUnitIds: [BU_A],
    });
    expect(membershipResolutions).toEqual([[U, A]]);
    expect(tenantOperations).toBe(1);
  });

  it('nega Membership inexistente em Organization existente sem abrir tenant', async () => {
    await persistSession();
    const organizationId = randomUUID();
    await withTenant(fixture.database, organizationId, (transaction) =>
      transaction.execute(
        sql`insert into organizations (id,name)
            values (${organizationId}, 'Organização sem Membership')`,
      ),
    );
    const response = await request(application, organizationId);
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual(DENIED);
    expect(tenantOperations).toBe(0);
  });

  it('nega Membership inativa com o mesmo contrato público', async () => {
    await persistSession();
    await withTenant(fixture.database, A, (transaction) =>
      transaction.execute(
        sql`update memberships set active=false where id=${M_A}`,
      ),
    );
    const response = await request(application, A);
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual(DENIED);
    expect(tenantOperations).toBe(0);
  });

  it('nega Organization inexistente e UUID arbitrário com o mesmo contrato', async () => {
    await persistSession();
    const arbitraryOrganizationId = randomUUID();
    const response = await request(application, arbitraryOrganizationId);
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual(DENIED);
    expect(tenantOperations).toBe(0);
  });

  it('nega Membership pertencente a outro User sem abrir tenant', async () => {
    await persistSession();
    const other = await addOrganizationWithMembership(randomUUID(), true);
    const response = await request(application, other.organizationId);
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual(DENIED);
    expect(membershipResolutions).toEqual([[U, other.organizationId]]);
    expect(tenantOperations).toBe(0);
  });

  it('não aceita header sozinho sem AuthenticatedIdentity', async () => {
    const response = await request(application, A, 'session-inexistente');
    expect(response.status).toBe(401);
    expect(membershipResolutions).toEqual([]);
    expect(tenantOperations).toBe(0);
  });

  it.each([
    {
      channel: 'query',
      path: `tenant-context?requestedOrganizationId=${B}&membershipId=${M_B}&authorizedOrganizationId=${B}`,
      init: {},
    },
    {
      channel: 'body',
      path: 'tenant-context',
      init: {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          requestedOrganizationId: B,
          membershipId: M_B,
          authorizedOrganizationId: B,
        }),
      },
    },
  ])('ignora contexto tenant forjado via $channel', async ({ path, init }) => {
    const session = await persistSession();
    const response = await request(
      application,
      A,
      'tenant-session',
      path,
      init,
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      identity: { sessionId: session.sessionId, authenticatedUserId: U },
      tenant: { membershipId: M_A, authorizedOrganizationId: A },
      transactionOrganizationId: A,
      businessUnitIds: [BU_A],
    });
    expect(membershipResolutions).toEqual([[U, A]]);
  });

  it('CurrentTenantContext sem contexto falha sem aceitar dados do cliente', async () => {
    const response = await request(
      application,
      undefined,
      'qualquer-segredo',
      `tenant-context/without-guard?membershipId=${M_A}&authorizedOrganizationId=${A}`,
      {
        headers: {
          'x-membership-id': M_A,
          'x-authorized-organization-id': A,
        },
      },
    );
    expect(response.status).toBe(500);
    const body = JSON.stringify(await response.json());
    expect(body).not.toContain(M_A);
    expect(body).not.toContain(A);
  });

  it('isola requests concorrentes da mesma Session em Organizations diferentes', async () => {
    const session = await persistSession();
    transactionBarrier = createBarrier(2);
    const [responseA, responseB] = await Promise.all([
      request(application, A),
      request(application, B),
    ]);
    transactionBarrier = null;

    expect(responseA.status).toBe(200);
    expect(responseB.status).toBe(200);
    expect(await responseA.json()).toEqual({
      identity: { sessionId: session.sessionId, authenticatedUserId: U },
      tenant: { membershipId: M_A, authorizedOrganizationId: A },
      transactionOrganizationId: A,
      businessUnitIds: [BU_A],
    });
    expect(await responseB.json()).toEqual({
      identity: { sessionId: session.sessionId, authenticatedUserId: U },
      tenant: { membershipId: M_B, authorizedOrganizationId: B },
      transactionOrganizationId: B,
      businessUnitIds: [BU_B],
    });
    expect(membershipResolutions.sort()).toEqual(
      [
        [U, A],
        [U, B],
      ].sort(),
    );
    expect(tenantOperations).toBe(2);

    const [firstClient, secondClient] = await Promise.all([
      requestPool.connect(),
      requestPool.connect(),
    ]);
    try {
      const residual = await Promise.all(
        [firstClient, secondClient].map(async (client) => ({
          context: (
            await client.query<{ context: string | null }>(
              "select nullif(current_setting('lgpd.organization_id',true),'') as context",
            )
          ).rows[0]?.context,
          visibleRows: (await client.query('select id from business_units'))
            .rows.length,
        })),
      );
      expect(residual).toEqual([
        { context: null, visibleRows: 0 },
        { context: null, visibleRows: 0 },
      ]);
    } finally {
      firstClient.release();
      secondClient.release();
    }
  });
});
