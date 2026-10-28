import 'reflect-metadata';
import { createHash, randomUUID } from 'node:crypto';
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
import { TenantContextService } from '../../src/tenant/tenant-context.service.js';
import { DatabaseService } from '../../src/persistence/database.service.js';
import { AppModule } from '../../src/app.module.js';
import { ProcessingActivityListService } from '../../src/processing-activities/processing-activity-list.service.js';
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
const SECOND_ID = randomUUID();
const ID = randomUUID(),
  OTHER_ID = randomUUID(),
  HIDDEN_ID = randomUUID(),
  UNIT = randomUUID();
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
function get(query = '', headers: Record<string, string> = {}) {
  return fetch(`${base}/api/v1/processing-activities${query}`, {
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
    [SECOND_ID, A, BU_A],
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

const visibleIds = () => [ID, SECOND_ID].sort().reverse();
const empty = (page = 1, pageSize = 20) => ({
  data: [],
  pagination: { page, pageSize, hasNextPage: false },
});

describe('L.3A — HTTP e PostgreSQL reais', () => {
  it.each(['MANAGER', 'COLLABORATOR'])(
    '%s: defaults, seis campos, ordenação e contexto S3.4',
    async (role) => {
      await fixture.preparation.query('update roles set code=$1 where id=$2', [
        role,
        ROLE,
      ]);
      const spy = vi.spyOn(
        application.get(ProcessingActivityListService),
        'list',
      );
      const response = await get();
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        data: visibleIds().map((id) => ({
          id,
          organizationId: A,
          businessUnitId: BU_A,
          name: 'Atividade fictícia',
          createdAt: '2026-10-28T12:00:00.123456Z',
          updatedAt: '2026-10-28T12:01:00.654321Z',
        })),
        pagination: { page: 1, pageSize: 20, hasNextPage: false },
      });
      expect(spy).toHaveBeenCalledExactlyOnceWith(
        { membershipId: M_A, authorizedOrganizationId: A },
        { page: 1, pageSize: 20 },
      );
    },
  );
  it('paginação, desempate e hasNextPage consideram somente itens visíveis', async () => {
    for (const [page, ids, next] of [
      [1, [visibleIds()[0]], true],
      [2, [visibleIds()[1]], false],
      [3, [], false],
    ] as const) {
      const response = await get(`?page=${page}&pageSize=1`);
      expect(response.status).toBe(200);
      const body = await response.json();
      expect(body.data.map((item: { id: string }) => item.id)).toEqual(ids);
      expect(body.pagination).toEqual({ page, pageSize: 1, hasNextPage: next });
    }
    const response = await get('?page=9007199254740991&pageSize=100');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(empty(Number.MAX_SAFE_INTEGER, 100));
  });
  it('createdAt DESC precede id e preserva precisão UTC', async () => {
    await fixture.preparation.query(
      "update processing_activities set created_at='2026-10-29T12:00:00.000001Z' where id=$1",
      [ID],
    );
    const response = await get();
    expect(response.status).toBe(200);
    expect(
      (await response.json()).data.map((item: { id: string }) => item.id),
    ).toEqual([ID, SECOND_ID]);
  });
  it.each([
    'sem Activities',
    'sem grants',
    'BU vazia',
    'DPO/BU',
    'MANAGER/Organization',
  ])('%s retorna 200 vazio', async (mode) => {
    if (mode === 'sem Activities')
      await fixture.preparation.query(
        'delete from processing_activities where organization_id=$1',
        [A],
      );
    if (
      mode === 'sem grants' ||
      mode === 'BU vazia' ||
      mode === 'MANAGER/Organization'
    )
      await fixture.preparation.query(
        'delete from role_assignment_business_units where role_assignment_id=$1',
        [GRANT_A],
      );
    if (mode === 'sem grants')
      await fixture.preparation.query(
        'delete from role_assignments where id=$1',
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
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(empty());
  });
  it('DPO lê somente Organization selecionada', async () => {
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
    const response = await get();
    expect(response.status).toBe(200);
    expect(
      new Set(
        (await response.json()).data.map((item: { id: string }) => item.id),
      ),
    ).toEqual(new Set([ID, SECOND_ID, HIDDEN_ID]));
    // ROLE is global: give B its own organizational assignment as well.
    await fixture.preparation.query(
      'delete from role_assignment_business_units where organization_id=$1',
      [B],
    );
    await fixture.preparation.query(
      "update role_assignments set scope='ORGANIZATION' where organization_id=$1",
      [B],
    );
    const other = await get('', { 'X-Organization-Id': B });
    expect(other.status).toBe(200);
    expect(
      (await other.json()).data.map((item: { id: string }) => item.id),
    ).toEqual([OTHER_ID]);
  });
  it('união de grants permite outra área sem incluir outro tenant', async () => {
    const assignment = randomUUID(),
      role = randomUUID();
    await fixture.preparation.query(
      "insert into roles(id,code) values($1,'COLLABORATOR')",
      [role],
    );
    await fixture.preparation.query(
      "insert into role_assignments(id,organization_id,membership_id,role_id,scope) values($1,$2,$3,$4,'BUSINESS_UNIT')",
      [assignment, A, M_A, role],
    );
    await fixture.preparation.query(
      'insert into role_assignment_business_units(organization_id,role_assignment_id,business_unit_id) values($1,$2,$3)',
      [A, assignment, UNIT],
    );
    const response = await get();
    expect(response.status).toBe(200);
    expect(
      new Set(
        (await response.json()).data.map((item: { id: string }) => item.id),
      ),
    ).toEqual(new Set([ID, SECOND_ID, HIDDEN_ID]));
  });
  it.each(['', 'lgpd_session=', 'lgpd_session=unknown'])(
    'sessão %s precede query inválida',
    async (cookie) => {
      const spy = vi.spyOn(
        application.get(ProcessingActivityListService),
        'list',
      );
      const response = await get('?page=0', { cookie });
      expect(response.status).toBe(401);
      expect(await response.json()).toEqual(authRequired);
      expect(spy).not.toHaveBeenCalled();
    },
  );
  it('header ausente precede query inválida', async () => {
    const response = await fetch(
      `${base}/api/v1/processing-activities?page=0`,
      { headers: { cookie: 'lgpd_session=p4-test-session' } },
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: {
        code: 'ORGANIZATION_CONTEXT_REQUIRED',
        message: 'A organização da requisição é obrigatória.',
      },
    });
  });
  it('header inválido precede query inválida', async () => {
    const response = await get('?page=0', { 'X-Organization-Id': 'invalid' });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: {
        code: 'INVALID_ORGANIZATION_CONTEXT',
        message: 'Contexto de organização inválido.',
      },
    });
  });
  it.each(['Organization inexistente', 'Membership inativa'])(
    '%s precede query inválida: 403',
    async (mode) => {
      if (mode === 'Membership inativa')
        await fixture.preparation.query(
          'update memberships set active=false where id=$1',
          [M_A],
        );
      const response = await get('?page=0', {
        'X-Organization-Id': mode === 'Membership inativa' ? A : randomUUID(),
      });
      expect(response.status).toBe(403);
      expect(await response.json()).toEqual(denied);
    },
  );
  it.each([
    '?page=0',
    '?page=1&page=2',
    '?page=1&%70age=2',
    '?page[]=1',
    '?page[x]=1',
    '?organizationId=x',
    '?grants=x',
    '?reach=x',
    '?page=%',
    '?page=%C0%AF',
    '?page=01',
    '?page=1e2',
    '?pageSize=101',
    '?page=',
    '?page=+1',
  ])('query %s: 400 sem L.2', async (query) => {
    const spy = vi.spyOn(
      application.get(ProcessingActivityListService),
      'list',
    );
    const response = await get(query);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Falha na validação da requisição',
        details: [{ field: 'query', code: 'INVALID_PAGINATION' }],
      },
    });
    expect(spy).not.toHaveBeenCalled();
  });
  it('Membership desativada após bootstrap retorna coleção vazia', async () => {
    const tenant = application.get(TenantContextService),
      authorize = tenant.authorize.bind(tenant);
    vi.spyOn(tenant, 'authorize').mockImplementation(async (...args) => {
      const context = await authorize(...args);
      await fixture.preparation.query(
        'update memberships set active=false where id=$1',
        [M_A],
      );
      return context;
    });
    const response = await get();
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(empty());
  });
  it('falha SQL real produz somente 500 sanitizado', async () => {
    const read = grantsRepository.readMembershipGrants;
    vi.spyOn(grantsRepository, 'readMembershipGrants').mockImplementation(
      async (tx, ctx) => {
        await tx.execute(sql`select 1/0`);
        return read(tx, ctx);
      },
    );
    const response = await get();
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Ocorreu um erro inesperado.' },
    });
  });
  it('falha transacional não vira 200 vazio', async () => {
    vi.spyOn(
      application.get(DatabaseService),
      'withAuthorizedTenantReadSnapshot',
    ).mockRejectedValue(new Error('segredo SQL'));
    const response = await get();
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: { code: 'INTERNAL_ERROR', message: 'Ocorreu um erro inesperado.' },
    });
  });
  it('GET individual continua funcionando', async () => {
    const response = await fetch(`${base}/api/v1/processing-activities/${ID}`, {
      headers: {
        cookie: 'lgpd_session=p4-test-session',
        'X-Organization-Id': A,
      },
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.id).toBe(ID);
    expect(Object.keys(body)).toEqual(['data']);
  });
});
