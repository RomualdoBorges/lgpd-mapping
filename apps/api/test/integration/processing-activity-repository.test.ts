import { randomUUID } from 'node:crypto';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import { createTestDatabase, A, B, BU_A, BU_B, M_A, M_B } from './database.js';
import * as schema from '../../src/persistence/schema.js';
import type { AuthorizedTenantContext } from '../../src/tenant/authorized-tenant-context.js';
import type { TenantTransaction } from '../../src/persistence/tenant-transaction.js';
import {
  createD1ReadPolicyInput,
  D1ReadContractError,
  type D1ReadReach,
} from '../../src/authorization/d1-read-contracts.js';
import { evaluateD1ReadReach } from '../../src/authorization/d1-read-policy.js';
import {
  findVisibleProcessingActivityById as find,
  ProcessingActivityTransactionError,
} from '../../src/persistence/processing-activity-repository.js';

let fixture: Awaited<ReturnType<typeof createTestDatabase>>;
const UNIT_2 = randomUUID();
const ACT_A = randomUUID(),
  ACT_A2 = randomUUID(),
  ACT_B = randomUUID();
const ctxA = { membershipId: M_A, authorizedOrganizationId: A };
const ctxB = { membershipId: M_B, authorizedOrganizationId: B };
const created = '2026-01-01T10:20:30.123Z',
  updated = '2026-01-02T10:20:30.456Z';
function reach(
  context = ctxA,
  role = 'MANAGER',
  scope = 'BUSINESS_UNIT',
  areas = [BU_A],
) {
  // Real pure policy, supplied structural fixtures; shared grants snapshot is P.3.
  return evaluateD1ReadReach(
    createD1ReadPolicyInput({
      permission: 'processing_activity:read',
      authorizedTenantContext: context,
      resolvedMembershipGrants: {
        ...context,
        grants: [
          {
            roleAssignmentId: randomUUID(),
            roleCode: role,
            scope,
            businessUnitIds: areas,
          },
        ],
      },
    }),
  );
}
async function transaction<T>(
  operation: (tx: TenantTransaction) => Promise<T>,
  tenant: string | null = A,
  isolation: 'repeatable read' | 'read committed' = 'repeatable read',
) {
  return fixture.database.transaction(
    async (tx) => {
      if (tenant !== null)
        await tx.execute(
          sql`select set_config('lgpd.organization_id',${tenant},true)`,
        );
      return operation(tx);
    },
    { isolationLevel: isolation },
  );
}
async function read(
  id = ACT_A,
  r = reach(),
  context: AuthorizedTenantContext = ctxA,
) {
  return transaction(
    (tx) => find(tx, context, r, id),
    context.authorizedOrganizationId,
  );
}

beforeAll(async () => {
  fixture = await createTestDatabase();
});
beforeEach(async () => {
  await fixture.reset();
  await fixture.preparation.query(
    'insert into business_units(id,organization_id,name) values($1,$2,$3)',
    [UNIT_2, A, 'Segunda área'],
  );
  for (const [id, org, unit] of [
    [ACT_A, A, BU_A],
    [ACT_A2, A, UNIT_2],
    [ACT_B, B, BU_B],
  ]) {
    await fixture.preparation.query(
      'insert into processing_activities(id,organization_id,business_unit_id,name,created_at,updated_at) values($1,$2,$3,$4,$5,$6)',
      [id, org, unit, ' Atividade fictícia\u00a0', created, updated],
    );
  }
});
afterAll(async () => {
  if (fixture) await fixture.close();
});

describe('P.2 — repository PostgreSQL com visibilidade D1', () => {
  it.each(['MANAGER', 'COLLABORATOR'])(
    '%s lê somente a área explicitamente autorizada',
    async (role) => {
      const r = reach(ctxA, role);
      expect(await read(ACT_A, r)).toEqual({
        id: ACT_A,
        organizationId: A,
        businessUnitId: BU_A,
        name: ' Atividade fictícia\u00a0',
        createdAt: created,
        updatedAt: updated,
      });
      expect(await read(ACT_A2, r)).toBeNull();
      expect(await read(ACT_B, r)).toBeNull();
      expect(await read(randomUUID(), r)).toBeNull();
    },
  );
  it('DPO/ORGANIZATION lê ambas as áreas próprias, sem ler B', async () => {
    const r = reach(ctxA, 'DPO', 'ORGANIZATION', []);
    expect((await read(ACT_A, r))?.id).toBe(ACT_A);
    expect((await read(ACT_A2, r))?.id).toBe(ACT_A2);
    expect(await read(ACT_B, r)).toBeNull();
    expect(
      (await read(ACT_B, reach(ctxB, 'DPO', 'ORGANIZATION', []), ctxB))
        ?.organizationId,
    ).toBe(B);
  });
  it('nega outro tenant mesmo se seu UUID de área for explicitamente fornecido', async () => {
    const r = reach(ctxA, 'MANAGER', 'BUSINESS_UNIT', [BU_B]);
    expect(await read(ACT_B, r)).toBeNull();
  });
  it('ausência, cross-tenant e área fora do alcance são indistinguíveis', async () => {
    const results = await Promise.all([
      read(randomUUID()),
      read(ACT_B),
      read(ACT_A2),
    ]);
    expect(results).toEqual([null, null, null]);
  });
  it('BU vazio valida a transação e não executa leitura de Activity', async () => {
    const queries: string[] = [];
    const db = drizzle(fixture.runtime, {
      schema,
      logger: {
        logQuery(query) {
          queries.push(query);
        },
      },
    });
    await db.transaction(
      async (tx) => {
        await tx.execute(
          sql`select set_config('lgpd.organization_id',${A},true)`,
        );
        queries.length = 0;
        expect(
          await find(
            tx,
            ctxA,
            reach(ctxA, 'MANAGER', 'BUSINESS_UNIT', []),
            ACT_A,
          ),
        ).toBeNull();
        expect(queries).toHaveLength(1);
        expect(queries[0]).toContain(
          "current_setting('transaction_isolation')",
        );
        expect(queries[0]).not.toContain('from public.processing_activities');
      },
      { isolationLevel: 'repeatable read' },
    );
  });
  it.each([
    { name: 'sem tenant', tenant: null, isolation: 'repeatable read' },
    { name: 'tenant divergente', tenant: B, isolation: 'repeatable read' },
    { name: 'isolamento inadequado', tenant: A, isolation: 'read committed' },
  ] as const)(
    'rejeita $name antes de consultar Activity',
    async ({ tenant, isolation }) => {
      const queries: string[] = [];
      const db = drizzle(fixture.runtime, {
        schema,
        logger: {
          logQuery(query) {
            queries.push(query);
          },
        },
      });
      await expect(
        db.transaction(
          async (tx) => {
            if (tenant !== null)
              await tx.execute(
                sql`select set_config('lgpd.organization_id',${tenant},true)`,
              );
            queries.length = 0;
            return find(tx, ctxA, reach(), ACT_A);
          },
          { isolationLevel: isolation },
        ),
      ).rejects.toBeInstanceOf(ProcessingActivityTransactionError);
      expect(
        queries.some((query) =>
          query.includes('from public.processing_activities'),
        ),
      ).toBe(false);
      expect(
        queries.some((query) =>
          query.includes("current_setting('transaction_isolation')"),
        ),
      ).toBe(true);
    },
  );
  it('BU vazio não esconde transação sem tenant', async () => {
    await expect(
      transaction(
        (tx) =>
          find(tx, ctxA, reach(ctxA, 'MANAGER', 'BUSINESS_UNIT', []), ACT_A),
        null,
      ),
    ).rejects.toBeInstanceOf(ProcessingActivityTransactionError);
  });
  it('rejeita identidades divergentes e ROPA em vez de retornar null', async () => {
    for (const r of [
      { ...reach(), membershipId: M_B },
      { ...reach(), authorizedOrganizationId: B },
      { ...reach(), permission: 'ropa:read' },
    ]) {
      await expect(
        transaction((tx) => find(tx, ctxA, r as D1ReadReach, ACT_A)),
      ).rejects.toBeInstanceOf(D1ReadContractError);
    }
  });
  it('usa uma conexão e a mesma transação: verifica contexto antes da consulta parametrizada', async () => {
    const queries: Array<{ query: string; params: unknown[] }> = [];
    const db = drizzle(fixture.runtime, {
      schema,
      logger: {
        logQuery(query, params) {
          queries.push({ query, params });
        },
      },
    });
    const connect = vi.spyOn(fixture.runtime, 'connect');
    try {
      await db.transaction(
        async (tx) => {
          await tx.execute(
            sql`select set_config('lgpd.organization_id',${A},true)`,
          );
          const pid = (await tx.execute(sql`select pg_backend_pid() as pid`))
            .rows[0]?.pid;
          queries.length = 0;
          const summary = await find(tx, ctxA, reach(), ACT_A);
          expect(summary?.id).toBe(ACT_A);
          expect(queries).toHaveLength(2);
          expect(queries[0]?.query).toContain(
            "current_setting('transaction_isolation')",
          );
          expect(queries[1]?.params).toEqual([ACT_A, A, BU_A]);
          expect(queries[1]?.query).toContain(
            'where id = $1 and organization_id = $2',
          );
          expect(queries[1]?.query).toContain('business_unit_id in ($3)');
          expect(queries[1]?.query).not.toContain('select *');
          expect(
            (await tx.execute(sql`select pg_backend_pid() as pid`)).rows[0]
              ?.pid,
          ).toBe(pid);
        },
        { isolationLevel: 'repeatable read' },
      );
      expect(connect).toHaveBeenCalledTimes(1);
    } finally {
      connect.mockRestore();
    }
  });
  it('propaga falha real de persistência e recupera a conexão na chamada seguinte', async () => {
    await expect(
      transaction(async (tx) => {
        await expect(tx.execute(sql`select 1/0`)).rejects.toMatchObject({
          cause: expect.objectContaining({ code: '22012' }),
        });
        return find(tx, ctxA, reach(), ACT_A);
      }),
    ).rejects.toMatchObject({
      cause: expect.objectContaining({ code: '25P02' }),
    });
    expect((await read())?.id).toBe(ACT_A);
  });
  it('retorna somente os seis campos em envelope imutável com timestamps ISO', async () => {
    const summary = await read();
    expect(Object.keys(summary ?? {}).sort()).toEqual(
      [
        'id',
        'organizationId',
        'businessUnitId',
        'name',
        'createdAt',
        'updatedAt',
      ].sort(),
    );
    expect(Object.isFrozen(summary)).toBe(true);
    expect(summary?.createdAt).toBe(created);
    expect(summary?.updatedAt).toBe(updated);
    expect(() => Object.assign(summary ?? {}, { name: 'alterado' })).toThrow(
      TypeError,
    );
  });
  it('preserva microssegundos e instante UTC dos timestamps persistidos', async () => {
    await fixture.preparation.query(
      'update processing_activities set created_at=$1::timestamptz,updated_at=$2::timestamptz where id=$3',
      [
        '2026-01-01T07:20:30.123456-03:00',
        '2026-01-02T10:20:30.456789Z',
        ACT_A,
      ],
    );
    const summary = await read();
    expect(summary?.createdAt).toBe('2026-01-01T10:20:30.123456Z');
    expect(summary?.updatedAt).toBe('2026-01-02T10:20:30.456789Z');
  });
  it.each(['sucesso', 'erro'] as const)(
    'não deixa tenant residual após %s',
    async (mode) => {
      const pid = (
        await fixture.runtime.query('select pg_backend_pid() as pid')
      ).rows[0].pid;
      if (mode === 'sucesso') expect((await read())?.id).toBe(ACT_A);
      else
        await expect(
          transaction((tx) => find(tx, ctxA, reach(), ACT_A), B),
        ).rejects.toBeInstanceOf(ProcessingActivityTransactionError);
      expect(
        (
          await fixture.runtime.query(
            "select pg_backend_pid() as pid,nullif(current_setting('lgpd.organization_id',true),'') as tenant",
          )
        ).rows[0],
      ).toEqual({ pid, tenant: null });
      expect(
        (await fixture.runtime.query('select id from processing_activities'))
          .rows,
      ).toEqual([]);
      expect(
        (
          await read(
            ACT_B,
            reach(ctxB, 'MANAGER', 'BUSINESS_UNIT', [BU_B]),
            ctxB,
          )
        )?.id,
      ).toBe(ACT_B);
    },
  );
});
