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
import { findVisibleProcessingActivityById } from '../../src/persistence/processing-activity-repository.js';
import { createResolvedMembershipGrants } from '../../src/authorization/resolved-membership-grants.js';
import { D1ReadContractError } from '../../src/authorization/d1-read-contracts.js';
import * as policy from '../../src/authorization/d1-read-policy.js';
import { ProcessingActivityReadService } from '../../src/processing-activities/processing-activity-read.service.js';

vi.mock('../../src/persistence/active-membership-repository.js', () => ({
  isMembershipActive: vi.fn(),
}));
vi.mock('../../src/persistence/membership-grants-repository.js', () => ({
  readMembershipGrants: vi.fn(),
}));
vi.mock('../../src/persistence/processing-activity-repository.js', () => ({
  findVisibleProcessingActivityById: vi.fn(),
}));
const M = '00000000-0000-4000-8000-000000000001',
  O = '00000000-0000-4000-8000-000000000002',
  BU = '00000000-0000-4000-8000-000000000003',
  OTHER = '00000000-0000-4000-8000-000000000004',
  ID = 'abcdef00-0000-4000-8000-000000000005';
const context = () => ({ membershipId: M, authorizedOrganizationId: O });
const summary = Object.freeze({
  id: ID,
  organizationId: O,
  businessUnitId: BU,
  name: 'Atividade',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});
const pool = new pg.Pool();
const dialect = new PgDialect();
const tx: TenantTransaction = new NodePgTransaction<
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>(dialect, new NodePgSession(pool, dialect, undefined), undefined);
const active = vi.mocked(isMembershipActive),
  grants = vi.mocked(readMembershipGrants),
  find = vi.mocked(findVisibleProcessingActivityById);
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
  return { service: new ProcessingActivityReadService(database), enter };
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

describe('P.3 — serviço interno de leitura', () => {
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
    find.mockImplementation(async (_tx, _ctx, reach, id) => {
      order.push('activity');
      expect(reach).toEqual({
        permission: 'processing_activity:read',
        ...context(),
        scope: 'BUSINESS_UNIT',
        businessUnitIds: [BU],
      });
      expect(id).toBe(ID);
      return summary;
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
    expect(await service.findById(source, ID)).toBe(summary);
    expect(order).toEqual(['begin', 'active', 'grants', 'activity', 'commit']);
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
      service.findById(value as AuthorizedTenantContext, ID),
    ).rejects.toBeInstanceOf(D1ReadContractError);
    expect(enter).not.toHaveBeenCalled();
    expect(active).not.toHaveBeenCalled();
  });
  it.each(
    ['invalid', '', null, undefined, [], "' OR true --"].map((value) => ({
      value,
    })),
  )('rejeita UUID $value antes de abrir transação', async ({ value }) => {
    const { service, enter } = setup();
    await expect(
      service.findById(context(), value as string),
    ).rejects.toBeInstanceOf(D1ReadContractError);
    expect(enter).not.toHaveBeenCalled();
    expect(active).not.toHaveBeenCalled();
  });
  it('Membership ausente/inativa retorna null sem grants ou Activity', async () => {
    active.mockResolvedValue(false);
    const { service } = setup();
    expect(await service.findById(context(), ID)).toBeNull();
    expect(grants).not.toHaveBeenCalled();
    expect(find).not.toHaveBeenCalled();
  });
  it('propaga falha da verificação de Membership sem avançar', async () => {
    const failure = new Error('membership');
    active.mockRejectedValue(failure);
    await expect(setup().service.findById(context(), ID)).rejects.toBe(failure);
    expect(grants).not.toHaveBeenCalled();
    expect(find).not.toHaveBeenCalled();
  });
  it('propaga falha de grants sem consultar Activity', async () => {
    const failure = new Error('grants');
    grants.mockRejectedValue(failure);
    await expect(setup().service.findById(context(), ID)).rejects.toBe(failure);
    expect(find).not.toHaveBeenCalled();
  });
  it('propaga falha no cálculo sem consultar Activity', async () => {
    const failure = new Error('policy');
    vi.spyOn(policy, 'evaluateD1ReadReach').mockImplementation(() => {
      throw failure;
    });
    await expect(setup().service.findById(context(), ID)).rejects.toBe(failure);
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
        setup().service.findById(context(), ID),
      ).rejects.toBeInstanceOf(D1ReadContractError);
      expect(find).not.toHaveBeenCalled();
    },
  );
  it('propaga falha do repository P.2 sem fallback', async () => {
    const failure = new Error('activity');
    find.mockRejectedValue(failure);
    await expect(setup().service.findById(context(), ID)).rejects.toBe(failure);
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
    expect(await setup().service.findById(source, ID.toUpperCase())).toBe(
      summary,
    );
    expect([m, o]).toEqual([1, 1]);
    expect(find.mock.calls[0]?.[3]).toBe(ID);
  });
  it('mutação durante a transação não substitui as identidades locais', async () => {
    const source = context();
    const { service } = setup(() => {
      source.membershipId = OTHER;
      source.authorizedOrganizationId = OTHER;
    });
    expect(await service.findById(source, ID)).toBe(summary);
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
    const pending = service.findById(context(), ID).then((result) => {
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
      service.findById(context(), ID).then(() => {
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
    find.mockResolvedValueOnce(summary).mockResolvedValueOnce(null);
    const { service, enter } = setup();
    expect(await service.findById(context(), ID)).toBe(summary);
    expect(await service.findById(second, ID)).toBeNull();
    expect(active).toHaveBeenCalledTimes(2);
    expect(grants).toHaveBeenCalledTimes(2);
    expect(enter).toHaveBeenCalledTimes(2);
    expect(grants.mock.calls.map(([, c]) => c)).toEqual([context(), second]);
  });
});
