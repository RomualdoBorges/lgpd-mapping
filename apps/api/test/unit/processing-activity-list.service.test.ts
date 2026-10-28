import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
import { NodePgSession, NodePgTransaction } from 'drizzle-orm/node-postgres';
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import pg from 'pg';
import type * as schema from '../../src/persistence/schema.js';
import type { TenantTransaction } from '../../src/persistence/tenant-transaction.js';
import type { DatabaseService } from '../../src/persistence/database.service.js';
import type { AuthorizedTenantContext } from '../../src/tenant/authorized-tenant-context.js';
import { isMembershipActive } from '../../src/persistence/active-membership-repository.js';
import { readMembershipGrants } from '../../src/persistence/membership-grants-repository.js';
import {
  ProcessingActivityListPaginationError,
  listVisibleProcessingActivities,
} from '../../src/persistence/processing-activity-list-repository.js';
import { createResolvedMembershipGrants } from '../../src/authorization/resolved-membership-grants.js';
import { D1ReadContractError } from '../../src/authorization/d1-read-contracts.js';
import * as policy from '../../src/authorization/d1-read-policy.js';
import { ProcessingActivityListService } from '../../src/processing-activities/processing-activity-list.service.js';

vi.mock('../../src/persistence/active-membership-repository.js', () => ({
  isMembershipActive: vi.fn(),
}));
vi.mock('../../src/persistence/membership-grants-repository.js', () => ({
  readMembershipGrants: vi.fn(),
}));
vi.mock(
  '../../src/persistence/processing-activity-list-repository.js',
  async (original) => ({
    ...(await original<
      typeof import('../../src/persistence/processing-activity-list-repository.js')
    >()),
    listVisibleProcessingActivities: vi.fn(),
  }),
);
const realEvaluate = policy.evaluateD1ReadReach;
const M = '00000000-0000-4000-8000-000000000001',
  O = '00000000-0000-4000-8000-000000000002',
  BU = '00000000-0000-4000-8000-000000000003',
  OTHER = '00000000-0000-4000-8000-000000000004',
  ID = 'abcdef00-0000-4000-8000-000000000005';
const context = () => ({ membershipId: M, authorizedOrganizationId: O });
const item = Object.freeze({
  id: ID,
  organizationId: O,
  businessUnitId: BU,
  name: 'Atividade',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});
const summary = Object.freeze({
  items: Object.freeze([item]),
  hasNextPage: false,
});
const pagination = () => ({ page: 1, pageSize: 20 });
const pool = new pg.Pool();
const dialect = new PgDialect();
const tx: TenantTransaction = new NodePgTransaction<
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>(dialect, new NodePgSession(pool, dialect, undefined), undefined);
const active = vi.mocked(isMembershipActive),
  grants = vi.mocked(readMembershipGrants),
  find = vi.mocked(listVisibleProcessingActivities);
function resolved(
  c = context(),
  role = 'MANAGER',
  scope = 'BUSINESS_UNIT',
  areas = [BU],
) {
  return createResolvedMembershipGrants({
    ...c,
    grants: [
      { roleAssignmentId: ID, roleCode: role, scope, businessUnitIds: areas },
    ],
  });
}
function setup(
  before?: (local: AuthorizedTenantContext) => void,
  after?: () => Promise<void>,
) {
  const enter = vi.fn();
  const database: Pick<DatabaseService, 'withAuthorizedTenantReadSnapshot'> = {
    async withAuthorizedTenantReadSnapshot(local, operation) {
      enter(local);
      before?.(local);
      const result = await operation(tx);
      await after?.();
      return result;
    },
  };
  return { service: new ProcessingActivityListService(database), enter };
}
beforeEach(() => {
  vi.restoreAllMocks();
  active.mockReset().mockResolvedValue(true);
  grants.mockReset().mockResolvedValue(resolved());
  find.mockReset().mockResolvedValue(summary);
});
afterAll(async () => {
  await pool.end();
});
function signal() {
  let release: () => void = () => {
    throw Error('Sinal ausente.');
  };
  const promise = new Promise<void>((done) => {
    release = done;
  });
  return { promise, release };
}

describe('L.2 — serviço interno de leitura', () => {
  it('respeita ordem, contexto congelado único, mesma transação e alcance interno', async () => {
    const order: string[] = [];
    active.mockImplementation(async () => {
      order.push('active');
      return true;
    });
    grants.mockImplementation(async () => {
      order.push('grants');
      return resolved();
    });
    find.mockImplementation(async (_tx, _ctx, reach, page) => {
      order.push('activity');
      expect(reach).toEqual({
        permission: 'processing_activity:read',
        ...context(),
        scope: 'BUSINESS_UNIT',
        businessUnitIds: [BU],
      });
      expect(page).toEqual(pagination());
      expect(Object.isFrozen(page)).toBe(true);
      return summary;
    });
    vi.spyOn(policy, 'evaluateD1ReadReach').mockImplementationOnce((input) => {
      order.push('policy');
      return realEvaluate(input);
    });
    const source = {
      ...context(),
      reach: { scope: 'ORGANIZATION' },
      grants: [],
      organizationId: OTHER,
      transaction: {},
    };
    const before = JSON.stringify(source);
    const { service, enter } = setup(
      (local) => {
        order.push('begin');
        expect(local).toEqual(context());
        expect(local).not.toBe(source);
        expect(Object.isFrozen(local)).toBe(true);
        expect(Object.keys(local).sort()).toEqual([
          'authorizedOrganizationId',
          'membershipId',
        ]);
        expect(() => Object.assign(local, { membershipId: OTHER })).toThrow(
          TypeError,
        );
      },
      async () => {
        order.push('commit');
      },
    );
    expect(await service.list(source, pagination())).toBe(summary);
    expect(order).toEqual([
      'begin',
      'active',
      'grants',
      'policy',
      'activity',
      'commit',
    ]);
    const local = enter.mock.calls[0]?.[0];
    expect(active).toHaveBeenCalledExactlyOnceWith(tx, local);
    expect(grants).toHaveBeenCalledExactlyOnceWith(tx, local);
    expect(find.mock.calls[0]?.slice(0, 2)).toEqual([tx, local]);
    expect(find.mock.calls[0]?.[1]).toBe(local);
    expect(find).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(source)).toBe(before);
  });
  it.each(
    [
      null,
      undefined,
      [],
      {},
      { membershipId: 'invalid', authorizedOrganizationId: O },
      { membershipId: M, authorizedOrganizationId: 'invalid' },
    ].map((value) => ({ value })),
  )('rejeita contexto $value antes de abrir transação', async ({ value }) => {
    const { service, enter } = setup();
    await expect(
      service.list(value as AuthorizedTenantContext, pagination()),
    ).rejects.toBeInstanceOf(D1ReadContractError);
    expect(enter).not.toHaveBeenCalled();
    expect(active).not.toHaveBeenCalled();
  });
  it.each(
    [
      null,
      undefined,
      [],
      {},
      { page: 0, pageSize: 20 },
      { page: 1.5, pageSize: 20 },
      { page: Number.MAX_SAFE_INTEGER + 1, pageSize: 20 },
      { page: 1, pageSize: 0 },
      { page: 1, pageSize: 101 },
      { page: 1, pageSize: 1.5 },
      { page: '1', pageSize: 20 },
    ].map((value) => ({ value })),
  )('rejeita paginação $value antes da transação', async ({ value }) => {
    const { service, enter } = setup();
    await expect(
      service.list(context(), value as ReturnType<typeof pagination>),
    ).rejects.toBeInstanceOf(ProcessingActivityListPaginationError);
    expect(enter).not.toHaveBeenCalled();
    expect(active).not.toHaveBeenCalled();
  });
  it('Membership ausente/inativa retorna página vazia sem grants ou Activity', async () => {
    active.mockResolvedValue(false);
    const { service } = setup();
    expect(await service.list(context(), pagination())).toEqual({
      items: [],
      hasNextPage: false,
    });
    expect(grants).not.toHaveBeenCalled();
    expect(find).not.toHaveBeenCalled();
  });
  it('propaga falha da verificação de Membership sem avançar', async () => {
    const failure = new Error('membership');
    active.mockRejectedValue(failure);
    await expect(setup().service.list(context(), pagination())).rejects.toBe(
      failure,
    );
    expect(grants).not.toHaveBeenCalled();
    expect(find).not.toHaveBeenCalled();
  });
  it('propaga falha de grants sem consultar Activity', async () => {
    const failure = new Error('grants');
    grants.mockRejectedValue(failure);
    await expect(setup().service.list(context(), pagination())).rejects.toBe(
      failure,
    );
    expect(find).not.toHaveBeenCalled();
  });
  it('propaga falha no cálculo sem consultar Activity', async () => {
    const failure = new Error('policy');
    vi.spyOn(policy, 'evaluateD1ReadReach').mockImplementation(() => {
      throw failure;
    });
    await expect(setup().service.list(context(), pagination())).rejects.toBe(
      failure,
    );
    expect(find).not.toHaveBeenCalled();
  });
  it.each(['membershipId', 'authorizedOrganizationId'])(
    'rejeita grants divergentes em %s',
    async (field) => {
      grants.mockResolvedValue(
        createResolvedMembershipGrants({
          ...context(),
          [field]: OTHER,
          grants: [],
        }),
      );
      await expect(
        setup().service.list(context(), pagination()),
      ).rejects.toBeInstanceOf(D1ReadContractError);
      expect(find).not.toHaveBeenCalled();
    },
  );
  it('propaga falha do repository L.1 sem fallback', async () => {
    const failure = new Error('activity');
    find.mockRejectedValue(failure);
    await expect(setup().service.list(context(), pagination())).rejects.toBe(
      failure,
    );
  });
  it('captura getters uma única vez e não relê dados durante awaits', async () => {
    let m = 0,
      o = 0;
    const source = {
      get membershipId() {
        return ++m === 1 ? M : OTHER;
      },
      get authorizedOrganizationId() {
        return ++o === 1 ? O : OTHER;
      },
    };
    expect(await setup().service.list(source, pagination())).toBe(summary);
    expect([m, o]).toEqual([1, 1]);
    expect(find.mock.calls[0]?.[3]).toEqual(pagination());
  });
  it('mutação durante a transação não substitui as identidades locais', async () => {
    const source = context();
    const { service } = setup(() => {
      source.membershipId = OTHER;
      source.authorizedOrganizationId = OTHER;
    });
    expect(await service.list(source, pagination())).toBe(summary);
    expect(active.mock.calls[0]?.[1]).toEqual(context());
    expect(find.mock.calls[0]?.[1]).toEqual(context());
  });
  it('não entrega resultado enquanto a conclusão transacional estiver pendente', async () => {
    const computed = signal(),
      commit = signal();
    const { service } = setup(undefined, async () => {
      computed.release();
      await commit.promise;
    });
    let delivered = false;
    const pending = service.list(context(), pagination()).then((result) => {
      delivered = true;
      return result;
    });
    await computed.promise;
    expect(find).toHaveBeenCalledTimes(1);
    expect(delivered).toBe(false);
    commit.release();
    expect(await pending).toBe(summary);
    expect(delivered).toBe(true);
  });
  it('falha na conclusão transacional descarta resumo já calculado', async () => {
    const failure = new Error('commit');
    const { service } = setup(undefined, async () => {
      throw failure;
    });
    let delivered = false;
    await expect(
      service.list(context(), pagination()).then(() => {
        delivered = true;
      }),
    ).rejects.toBe(failure);
    expect(find).toHaveBeenCalledTimes(1);
    expect(delivered).toBe(false);
  });
  it('não usa alcance anterior nem deixa de resolver grants em nova operação', async () => {
    const second = { membershipId: OTHER, authorizedOrganizationId: OTHER };
    grants
      .mockResolvedValueOnce(resolved())
      .mockResolvedValueOnce(resolved(second));
    find
      .mockResolvedValueOnce(summary)
      .mockResolvedValueOnce(
        Object.freeze({ items: Object.freeze([]), hasNextPage: false }),
      );
    const { service, enter } = setup();
    expect(await service.list(context(), pagination())).toBe(summary);
    expect(await service.list(second, pagination())).toEqual({
      items: [],
      hasNextPage: false,
    });
    expect(active).toHaveBeenCalledTimes(2);
    expect(grants).toHaveBeenCalledTimes(2);
    expect(enter).toHaveBeenCalledTimes(2);
    expect(grants.mock.calls.map(([, c]) => c)).toEqual([context(), second]);
  });
});

describe('L.2 — captura e política real', () => {
  it('captura paginação uma vez e preserva cópias durante await', async () => {
    let pages = 0,
      sizes = 0;
    const source = {
      get page() {
        return ++pages === 1 ? 2 : 0;
      },
      get pageSize() {
        return ++sizes === 1 ? 1 : 101;
      },
    };
    await setup().service.list(context(), source);
    expect([pages, sizes]).toEqual([1, 1]);
    expect(find.mock.calls[0]?.[3]).toEqual({ page: 2, pageSize: 1 });
    expect(Object.isFrozen(find.mock.calls[0]?.[3])).toBe(true);
    const mutable = { page: 2, pageSize: 1 };
    const entered = signal(),
      resume = signal();
    active.mockImplementationOnce(async () => {
      entered.release();
      await resume.promise;
      return true;
    });
    const pending = setup().service.list(context(), mutable);
    await entered.promise;
    mutable.page = 0;
    mutable.pageSize = 101;
    resume.release();
    await pending;
    expect(find.mock.calls[1]?.[3]).toEqual({ page: 2, pageSize: 1 });
  });
  it.each([
    ['COLLABORATOR', 'BUSINESS_UNIT', [BU], 'BUSINESS_UNIT', [BU]],
    ['MANAGER', 'BUSINESS_UNIT', [BU], 'BUSINESS_UNIT', [BU]],
    ['DPO', 'ORGANIZATION', [], 'ORGANIZATION', []],
    ['DPO', 'BUSINESS_UNIT', [BU], 'BUSINESS_UNIT', []],
    ['MANAGER', 'ORGANIZATION', [], 'BUSINESS_UNIT', []],
    ['UNKNOWN', 'BUSINESS_UNIT', [BU], 'BUSINESS_UNIT', []],
    ['MANAGER', 'BUSINESS_UNIT', [], 'BUSINESS_UNIT', []],
  ] as const)(
    'encaminha alcance real de %s/%s',
    async (role, scope, areas, expectedScope, expectedAreas) => {
      grants.mockResolvedValue(resolved(context(), role, scope, [...areas]));
      await setup().service.list(context(), pagination());
      expect(find.mock.calls[0]?.[2]).toEqual({
        permission: 'processing_activity:read',
        ...context(),
        scope: expectedScope,
        businessUnitIds: expectedAreas,
      });
    },
  );
  it('une somente assignments aplicáveis', async () => {
    grants.mockResolvedValue(
      createResolvedMembershipGrants({
        ...context(),
        grants: [
          {
            roleAssignmentId: ID,
            roleCode: 'COLLABORATOR',
            scope: 'BUSINESS_UNIT',
            businessUnitIds: [BU],
          },
          {
            roleAssignmentId: OTHER,
            roleCode: 'MANAGER',
            scope: 'BUSINESS_UNIT',
            businessUnitIds: [OTHER],
          },
          {
            roleAssignmentId: M,
            roleCode: 'DPO',
            scope: 'BUSINESS_UNIT',
            businessUnitIds: [O],
          },
        ],
      }),
    );
    await setup().service.list(context(), pagination());
    expect(find.mock.calls[0]?.[2]).toEqual({
      permission: 'processing_activity:read',
      ...context(),
      scope: 'BUSINESS_UNIT',
      businessUnitIds: [BU, OTHER],
    });
  });
  it('página de Membership inativa é imutável', async () => {
    active.mockResolvedValue(false);
    const result = await setup().service.list(context(), pagination());
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.items)).toBe(true);
    expect(() => Object.assign(result, { hasNextPage: true })).toThrow(
      TypeError,
    );
  });
  it('falha de abertura não inicia leituras', async () => {
    const failure = new Error('begin');
    const service = new ProcessingActivityListService({
      withAuthorizedTenantReadSnapshot: async () => {
        throw failure;
      },
    });
    await expect(service.list(context(), pagination())).rejects.toBe(failure);
    expect(active).not.toHaveBeenCalled();
  });
});
