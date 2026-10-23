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
import { MembershipGrantsService } from '../../src/authorization/membership-grants.service.js';
import {
  createResolvedMembershipGrants,
  type ResolvedMembershipGrants,
} from '../../src/authorization/resolved-membership-grants.js';
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
  type TenantTransaction,
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
  GRANT_A,
  GRANT_B,
  ROLE,
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
let transactionFault: 'sql' | 'exception' | null = null;
let grantTransactions: Array<{
  context: AuthorizedTenantContext;
  pid: number;
}> = [];
let resolvedResults: ResolvedMembershipGrants[] = [];

class TenantRequestContextTestController {
  constructor(
    private readonly database: DatabaseService,
    private readonly grants: MembershipGrantsService,
  ) {}

  async tenantEndpoint(
    identity: AuthenticatedIdentity,
    tenant: AuthorizedTenantContext,
  ) {
    return passContextsExplicitlyToUseCase(
      identity,
      tenant,
      this.database,
      this.grants,
    );
  }

  async tenantPostEndpoint(
    identity: AuthenticatedIdentity,
    tenant: AuthorizedTenantContext,
  ) {
    return passContextsExplicitlyToUseCase(
      identity,
      tenant,
      this.database,
      this.grants,
    );
  }

  tenantContextWithoutGuard(tenant: AuthorizedTenantContext) {
    return tenant;
  }
}

Controller('tenant-context')(TenantRequestContextTestController);
Inject(DatabaseService)(TenantRequestContextTestController, undefined, 0);
Inject(MembershipGrantsService)(
  TenantRequestContextTestController,
  undefined,
  1,
);
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
  grants: MembershipGrantsService,
) {
  tenantOperations += 1;
  const resolvedGrants = await grants.resolve(tenant);
  resolvedResults.push(resolvedGrants);
  return database.withAuthorizedTenant(tenant, async (transaction) => {
    const setting = await transaction.execute<{ organization_id: string }>(
      sql`select current_setting('lgpd.organization_id') as organization_id`,
    );
    const units = await transaction.execute<{ id: string }>(
      sql`select id from business_units order by id`,
    );
    return {
      identity,
      tenant,
      resolvedGrants,
      transactionOrganizationId: setting.rows[0]?.organization_id,
      businessUnitIds: units.rows.map((row) => row.id),
    };
  });
}

function expectedGrants(
  organizationId: string,
  membershipId: string,
  assignmentId: string,
  areaId: string,
) {
  return {
    membershipId,
    authorizedOrganizationId: organizationId,
    grants: [
      {
        roleAssignmentId: assignmentId,
        roleCode: 'MANAGER',
        scope: 'BUSINESS_UNIT',
        businessUnitIds: [areaId],
      },
    ],
  };
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
          withAuthorizedTenant: async <T>(
            context: AuthorizedTenantContext,
            operation: (transaction: TenantTransaction) => Promise<T>,
          ): Promise<T> =>
            withTenant(
              requestDatabase,
              context.authorizedOrganizationId,
              async (transaction) => {
                const pid = (
                  await transaction.execute<{ pid: number }>(
                    sql`select pg_backend_pid() as pid`,
                  )
                ).rows[0]?.pid;
                if (pid === undefined) throw new Error('PID de teste ausente.');
                grantTransactions.push({ context, pid });
                if (transactionBarrier) await transactionBarrier();
                if (transactionFault === 'sql')
                  await transaction.execute(sql`select 1/0`);
                if (transactionFault === 'exception')
                  throw new Error('Falha de teste dentro da transação.');
                return operation(transaction);
              },
            ),
        },
      },
      SessionAuthenticationService,
      SessionAuthenticationGuard,
      TenantContextService,
      TenantContextGuard,
      MembershipGrantsService,
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

async function successfulGrants(organizationId = A, secret = 'tenant-session') {
  const response = await request(application, organizationId, secret);
  expect(response.status).toBe(200);
  const body: unknown = await response.json();
  if (typeof body !== 'object' || body === null || !('resolvedGrants' in body))
    throw new Error('Resultado de grants ausente no endpoint de teste.');
  return createResolvedMembershipGrants(body.resolvedGrants);
}

async function assertCleanRequestPool() {
  const clients = await Promise.all([
    requestPool.connect(),
    requestPool.connect(),
  ]);
  try {
    for (const client of clients) {
      const state = (
        await client.query<{ pid: number; tenant: string | null }>(
          "select pg_backend_pid() as pid,nullif(current_setting('lgpd.organization_id',true),'') as tenant",
        )
      ).rows[0];
      expect(state?.tenant).toBeNull();
      expect(grantTransactions.some((entry) => entry.pid === state?.pid)).toBe(
        true,
      );
      expect(
        (await client.query('select id from role_assignments')).rows,
      ).toEqual([]);
    }
  } finally {
    for (const client of clients) client.release();
  }
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
  transactionFault = null;
  grantTransactions = [];
  resolvedResults = [];
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
    expect(grantTransactions).toEqual([]);
    expect(resolvedResults).toEqual([]);
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
      expect(grantTransactions).toEqual([]);
      expect(resolvedResults).toEqual([]);
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
      resolvedGrants: expectedGrants(A, M_A, GRANT_A, BU_A),
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
    expect(grantTransactions).toEqual([]);
    expect(resolvedResults).toEqual([]);
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
    expect(grantTransactions).toEqual([]);
    expect(resolvedResults).toEqual([]);
  });

  it('nega Organization inexistente e UUID arbitrário com o mesmo contrato', async () => {
    await persistSession();
    const arbitraryOrganizationId = randomUUID();
    const response = await request(application, arbitraryOrganizationId);
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual(DENIED);
    expect(tenantOperations).toBe(0);
    expect(grantTransactions).toEqual([]);
    expect(resolvedResults).toEqual([]);
  });

  it('nega Membership pertencente a outro User sem abrir tenant', async () => {
    await persistSession();
    const other = await addOrganizationWithMembership(randomUUID(), true);
    const response = await request(application, other.organizationId);
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual(DENIED);
    expect(membershipResolutions).toEqual([[U, other.organizationId]]);
    expect(tenantOperations).toBe(0);
    expect(grantTransactions).toEqual([]);
    expect(resolvedResults).toEqual([]);
  });

  it('não aceita header sozinho sem AuthenticatedIdentity', async () => {
    const response = await request(application, A, 'session-inexistente');
    expect(response.status).toBe(401);
    expect(membershipResolutions).toEqual([]);
    expect(tenantOperations).toBe(0);
    expect(grantTransactions).toEqual([]);
    expect(resolvedResults).toEqual([]);
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
      resolvedGrants: expectedGrants(A, M_A, GRANT_A, BU_A),
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
      resolvedGrants: expectedGrants(A, M_A, GRANT_A, BU_A),
    });
    expect(await responseB.json()).toEqual({
      identity: { sessionId: session.sessionId, authenticatedUserId: U },
      tenant: { membershipId: M_B, authorizedOrganizationId: B },
      transactionOrganizationId: B,
      businessUnitIds: [BU_B],
      resolvedGrants: expectedGrants(B, M_B, GRANT_B, BU_B),
    });
    expect(membershipResolutions.sort()).toEqual(
      [
        [U, A],
        [U, B],
      ].sort(),
    );
    expect(tenantOperations).toBe(2);
    const overlapping = grantTransactions.slice(0, 2);
    expect(new Set(overlapping.map((entry) => entry.pid)).size).toBe(2);
    expect(
      overlapping.map((entry) => entry.context.authorizedOrganizationId).sort(),
    ).toEqual([A, B].sort());

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

describe('S3.5.4 — composição estrutural por request', () => {
  it('mantém grants independentes e resultado imutável sem permissions funcionais', async () => {
    await persistSession();
    const area = randomUUID();
    const assignment = randomUUID();
    const organizationAssignment = randomUUID();
    await withTenant(fixture.database, A, async (tx) => {
      await tx.execute(
        sql`insert into business_units(id,organization_id,name) values(${area},${A},'Outra área fictícia')`,
      );
      await tx.execute(
        sql`insert into role_assignments(id,organization_id,membership_id,role_id,scope) values(${assignment},${A},${M_A},${ROLE},'BUSINESS_UNIT'),(${organizationAssignment},${A},${M_A},${ROLE},'ORGANIZATION')`,
      );
      await tx.execute(
        sql`insert into role_assignment_business_units(organization_id,role_assignment_id,business_unit_id) values(${A},${assignment},${area})`,
      );
    });
    const result = await successfulGrants();
    expect(result.grants).toHaveLength(3);
    expect(result.grants).toEqual(
      expect.arrayContaining([
        {
          roleAssignmentId: GRANT_A,
          roleCode: 'MANAGER',
          scope: 'BUSINESS_UNIT',
          businessUnitIds: [BU_A],
        },
        {
          roleAssignmentId: assignment,
          roleCode: 'MANAGER',
          scope: 'BUSINESS_UNIT',
          businessUnitIds: [area],
        },
        {
          roleAssignmentId: organizationAssignment,
          roleCode: 'MANAGER',
          scope: 'ORGANIZATION',
          businessUnitIds: [],
        },
      ]),
    );
    const original = resolvedResults[0];
    expect(Object.isFrozen(original)).toBe(true);
    expect(Object.isFrozen(original?.grants)).toBe(true);
    for (const grant of original?.grants ?? []) {
      expect(Object.isFrozen(grant)).toBe(true);
      expect(Object.isFrozen(grant.businessUnitIds)).toBe(true);
      expect(Object.keys(grant).sort()).toEqual([
        'businessUnitIds',
        'roleAssignmentId',
        'roleCode',
        'scope',
      ]);
      expect(() => Object.assign(grant, { scope: 'ORGANIZATION' })).toThrow(
        TypeError,
      );
    }
  });

  it('retorna grants vazios sem papel padrão e observa mudanças confirmadas entre requests', async () => {
    await persistSession();
    expect((await successfulGrants()).grants).toHaveLength(1);
    await withTenant(fixture.database, A, async (tx) => {
      await tx.execute(
        sql`delete from role_assignment_business_units where organization_id=${A} and role_assignment_id=${GRANT_A}`,
      );
      await tx.execute(
        sql`delete from role_assignments where organization_id=${A} and id=${GRANT_A}`,
      );
    });
    expect(await successfulGrants()).toEqual({
      membershipId: M_A,
      authorizedOrganizationId: A,
      grants: [],
    });
    const assignment = randomUUID();
    await withTenant(fixture.database, A, (tx) =>
      tx.execute(
        sql`insert into role_assignments(id,organization_id,membership_id,role_id,scope) values(${assignment},${A},${M_A},${ROLE},'BUSINESS_UNIT')`,
      ),
    );
    expect((await successfulGrants()).grants).toEqual([
      {
        roleAssignmentId: assignment,
        roleCode: 'MANAGER',
        scope: 'BUSINESS_UNIT',
        businessUnitIds: [],
      },
    ]);
    await withTenant(fixture.database, A, (tx) =>
      tx.execute(
        sql`update role_assignments set scope='ORGANIZATION' where organization_id=${A} and id=${assignment}`,
      ),
    );
    expect((await successfulGrants()).grants).toEqual([
      {
        roleAssignmentId: assignment,
        roleCode: 'MANAGER',
        scope: 'ORGANIZATION',
        businessUnitIds: [],
      },
    ]);
    expect(membershipResolutions).toEqual([
      [U, A],
      [U, A],
      [U, A],
      [U, A],
    ]);
  });

  it('isola dois Users/Memberships na mesma Organization', async () => {
    await persistSession();
    const user = randomUUID();
    const membership = randomUUID();
    const assignment = randomUUID();
    await fixture.migration.query(
      "insert into users(id,name,email) values($1,'Outra pessoa fictícia','second@example.invalid')",
      [user],
    );
    await withTenant(fixture.database, A, async (tx) => {
      await tx.execute(
        sql`insert into memberships(id,organization_id,user_id,active) values(${membership},${A},${user},true)`,
      );
      await tx.execute(
        sql`insert into role_assignments(id,organization_id,membership_id,role_id,scope) values(${assignment},${A},${membership},${ROLE},'ORGANIZATION')`,
      );
    });
    await createSession(fixture.database, {
      userId: user,
      tokenDigest: createHash('sha256').update('second-session').digest('hex'),
      expiresAt: new Date('2099-01-01T00:00:00Z'),
    });
    expect(await successfulGrants()).toEqual(
      expectedGrants(A, M_A, GRANT_A, BU_A),
    );
    expect(await successfulGrants(A, 'second-session')).toEqual({
      membershipId: membership,
      authorizedOrganizationId: A,
      grants: [
        {
          roleAssignmentId: assignment,
          roleCode: 'MANAGER',
          scope: 'ORGANIZATION',
          businessUnitIds: [],
        },
      ],
    });
    expect(membershipResolutions).toEqual([
      [U, A],
      [user, A],
    ]);
  });

  it('revalida Membership entre requests e não resolve grants depois da desativação', async () => {
    await persistSession();
    await successfulGrants();
    const previous = grantTransactions.length;
    await withTenant(fixture.database, A, (tx) =>
      tx.execute(
        sql`update memberships set active=false where organization_id=${A} and id=${M_A}`,
      ),
    );
    const response = await request(application, A);
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual(DENIED);
    expect(grantTransactions).toHaveLength(previous);
    expect(resolvedResults).toHaveLength(1);
  });

  it('não inicia composição para cookie ausente ou Session revogada', async () => {
    const session = await persistSession();
    const absent = await fetch(applicationUrl(application), {
      headers: { 'x-organization-id': A },
    });
    expect(absent.status).toBe(401);
    await fixture.runtime.query('select auth_private.revoke_session($1,$2)', [
      session.sessionId,
      new Date(),
    ]);
    const revoked = await request(application, A);
    expect(revoked.status).toBe(401);
    expect(membershipResolutions).toEqual([]);
    expect(grantTransactions).toEqual([]);
    expect(resolvedResults).toEqual([]);
  });

  it.each(['sql', 'exception'] as const)(
    'propaga falha %s sem sucesso vazio e deixa o pool limpo',
    async (fault) => {
      await persistSession();
      // Warm both physical connections, including the one that will roll back.
      transactionBarrier = createBarrier(2);
      await Promise.all([successfulGrants(A), successfulGrants(B)]);
      transactionBarrier = null;
      resolvedResults = [];
      transactionFault = fault;
      const response = await request(application, A);
      expect(response.status).toBe(500);
      const body = JSON.stringify(await response.json());
      expect(body).not.toContain('resolvedGrants');
      expect(body).not.toContain(M_A);
      expect(body).not.toContain('select 1/0');
      expect(resolvedResults).toEqual([]);
      transactionFault = null;
      await assertCleanRequestPool();
      expect(await successfulGrants()).toEqual(
        expectedGrants(A, M_A, GRANT_A, BU_A),
      );
    },
  );

  it('reutiliza a mesma conexão física após commit, rollback e exceção', async () => {
    const pid = (
      await fixture.runtime.query<{ pid: number }>(
        'select pg_backend_pid() as pid',
      )
    ).rows[0]?.pid;
    for (const mode of ['commit', 'sql', 'exception'] as const) {
      const failure = new Error('Exceção intencional após leitura.');
      const service = new MembershipGrantsService({
        withAuthorizedTenant: <T>(
          context: AuthorizedTenantContext,
          operation: (transaction: TenantTransaction) => Promise<T>,
        ) =>
          withTenant(
            fixture.database,
            context.authorizedOrganizationId,
            async (transaction) => {
              const result = await operation(transaction);
              if (mode === 'sql') await transaction.execute(sql`select 1/0`);
              if (mode === 'exception') throw failure;
              return result;
            },
          ),
      });
      const operation = service.resolve({
        membershipId: M_A,
        authorizedOrganizationId: A,
      });
      if (mode === 'commit')
        expect(await operation).toEqual(expectedGrants(A, M_A, GRANT_A, BU_A));
      else if (mode === 'exception')
        await expect(operation).rejects.toBe(failure);
      else
        await expect(operation).rejects.toMatchObject({
          cause: expect.objectContaining({ code: '22012' }),
        });
      const state = (
        await fixture.runtime.query<{ pid: number; tenant: string | null }>(
          "select pg_backend_pid() as pid,nullif(current_setting('lgpd.organization_id',true),'') as tenant",
        )
      ).rows[0];
      expect(state).toEqual({ pid, tenant: null });
      expect(
        (await fixture.runtime.query('select id from role_assignments')).rows,
      ).toEqual([]);
    }
  });

  it('resolve com Nest DI e DatabaseService reais após autenticação e bootstrap reais', async () => {
    await persistSession();
    class RealGrantsTestModule {}
    Module({
      providers: [
        {
          provide: ENVIRONMENT,
          useValue: {
            host: '127.0.0.1',
            port: 0,
            runtimeMode: 'test',
            database: {
              ...databaseConfiguration(process.env, 'RUNTIME'),
              database: fixture.name,
              max: 1,
            },
          },
        },
        DatabaseService,
        SessionAuthenticationService,
        TenantContextService,
        MembershipGrantsService,
      ],
    })(RealGrantsTestModule);
    const real = await NestFactory.createApplicationContext(
      RealGrantsTestModule,
      { logger: false },
    );
    try {
      const identity = await real
        .get(SessionAuthenticationService)
        .authenticate('tenant-session');
      if (!identity.authenticated)
        throw new Error('Session de teste inválida.');
      const context = await real
        .get(TenantContextService)
        .authorize(identity.identity, A);
      if (!context) throw new Error('Membership de teste não autorizada.');
      const result = await real.get(MembershipGrantsService).resolve(context);
      expect(result).toEqual(expectedGrants(A, M_A, GRANT_A, BU_A));
      expect(Object.isFrozen(result)).toBe(true);
      expect(Object.isFrozen(result.grants)).toBe(true);
    } finally {
      await real.close();
    }
  });
});
