import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
import { NodePgSession, NodePgTransaction } from 'drizzle-orm/node-postgres';
import { sql, type ExtractTablesWithRelations } from 'drizzle-orm';
import { PgRaw } from 'drizzle-orm/pg-core/query-builders/raw';
import pg from 'pg';
import type * as schema from '../../src/persistence/schema.js';
import type { TenantTransaction } from '../../src/persistence/tenant-transaction.js';
import type { AuthorizedTenantContext } from '../../src/tenant/authorized-tenant-context.js';
import {
  createD1ReadReach,
  D1ReadContractError,
  type D1ReadReach,
} from '../../src/authorization/d1-read-contracts.js';
import {
  ProcessingActivityPersistenceError,
  ProcessingActivityTransactionError,
} from '../../src/persistence/processing-activity-repository.js';
import {
  listVisibleProcessingActivities as list,
  ProcessingActivityListPaginationError,
  type ProcessingActivityListPagination,
} from '../../src/persistence/processing-activity-list-repository.js';
const M = 'abcdef00-0000-4000-8000-000000000001',
  O = 'abcdef00-0000-4000-8000-000000000002',
  BU = 'abcdef00-0000-4000-8000-000000000003',
  OTHER = 'abcdef00-0000-4000-8000-000000000004';
const ctx = () => ({ membershipId: M, authorizedOrganizationId: O });
const reach = () => {
  const value = createD1ReadReach({
    permission: 'processing_activity:read',
    ...ctx(),
    scope: 'BUSINESS_UNIT',
    businessUnitIds: [BU],
  });
  if (value.scope !== 'BUSINESS_UNIT')
    throw new Error('Alcance de fixture inválido.');
  return value;
};
const pagination = () => ({ page: 1, pageSize: 2 });
const state = () => ({
  organizationId: O,
  isolationLevel: 'repeatable read',
  readOnly: 'on',
});
const row = (n = 1) => ({
  id: `aaaaaaaa-aaaa-4aaa-8aaa-${n.toString().padStart(12, '0')}`,
  organizationId: O,
  businessUnitId: BU,
  name: ' Nome\u00a0',
  createdAt: '2026-10-28T12:00:00.123456Z',
  updatedAt: '2026-10-28T12:01:00.123000Z',
});
const result = (rows: Record<string, unknown>[]) => ({
  rows,
  command: 'SELECT',
  oid: 0,
  rowCount: rows.length,
  fields: [],
});
const pool = new pg.Pool();
const dialect = new PgDialect();
const tx: TenantTransaction = new NodePgTransaction<
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>(dialect, new NodePgSession(pool, dialect, undefined), undefined);
const execute = vi.spyOn(tx, 'execute');
afterAll(() => pool.end());
beforeEach(() => {
  execute
    .mockReset()
    .mockResolvedValueOnce(result([state()]))
    .mockResolvedValueOnce(result([row(1), row(2), row(3)]));
});
function query(index = 1) {
  const value = execute.mock.calls[index]?.[0];
  if (!value || typeof value === 'string') throw Error('SQL ausente');
  return dialect.sqlToQuery(value.getSQL());
}

describe('L.1 — SQL, paginação e resultados', () => {
  it('filtra antes da paginação, usa parâmetros, limite+1, sem COUNT/joins/transação própria', async () => {
    const transaction = vi.spyOn(tx, 'transaction');
    const out = await list(tx, ctx(), reach(), { page: 2, pageSize: 2 });
    expect(out).toEqual({
      items: [row(1), row(2)].map((r) => ({
        ...r,
        updatedAt: '2026-10-28T12:01:00.123Z',
      })),
      hasNextPage: true,
    });
    expect(query().params).toEqual([O, BU, 3, '2']);
    expect(query().sql).toMatch(
      /where organization_id = \$1\s+and business_unit_id in \(\$2\)\s+order by created_at desc, id desc\s+limit \$3 offset \$4::bigint/,
    );
    expect(query().sql).not.toMatch(
      /count\s*\(|join|select \*|begin|commit|rollback/i,
    );
    expect(execute).toHaveBeenCalledTimes(2);
    expect(transaction).not.toHaveBeenCalled();
    transaction.mockRestore();
    expect(Object.keys(out.items[0] ?? {}).sort()).toEqual([
      'businessUnitId',
      'createdAt',
      'id',
      'name',
      'organizationId',
      'updatedAt',
    ]);
  });
  it.each([0, 1, 2, 3])(
    'quantidade %s determina continuidade sem vazar excedente',
    async (n) => {
      execute
        .mockReset()
        .mockResolvedValueOnce(result([state()]))
        .mockResolvedValueOnce(
          result(Array.from({ length: n }, (_, i) => row(i + 1))),
        );
      const out = await list(tx, ctx(), reach(), pagination());
      expect(out.items).toHaveLength(Math.min(n, 2));
      expect(out.hasNextPage).toBe(n > 2);
    },
  );
  it('ORGANIZATION mantém tenant e não exige BU', async () => {
    await list(
      tx,
      ctx(),
      createD1ReadReach({
        ...reach(),
        scope: 'ORGANIZATION',
        businessUnitIds: [],
      }),
      pagination(),
    );
    expect(query().params).toEqual([O, 3, '0']);
    expect(query().sql).not.toContain('business_unit_id in');
  });
  it('BU vazia verifica estado e não consulta Activities', async () => {
    expect(
      await list(
        tx,
        ctx(),
        createD1ReadReach({ ...reach(), businessUnitIds: [] }),
        pagination(),
      ),
    ).toEqual({ items: [], hasNextPage: false });
    expect(execute).toHaveBeenCalledTimes(1);
  });
  it('OFFSET acima da precisão de number é enviado como decimal exato', async () => {
    await list(tx, ctx(), reach(), {
      page: Number.MAX_SAFE_INTEGER,
      pageSize: 100,
    });
    expect(query().params.slice(-2)).toEqual([101, '900719925474099000']);
  });
  it('normaliza apenas cópias de UUIDs maiúsculos e deduplica áreas equivalentes', async () => {
    const c = {
      membershipId: M.toUpperCase(),
      authorizedOrganizationId: O.toUpperCase(),
    };
    const r = {
      ...reach(),
      membershipId: M.toUpperCase(),
      authorizedOrganizationId: O.toUpperCase(),
      businessUnitIds: [BU.toUpperCase(), BU],
    };
    const original = JSON.stringify({ c, r });
    await list(tx, c, r, pagination());
    expect(query().params).toEqual([O, BU, 3, '0']);
    expect(JSON.stringify({ c, r })).toBe(original);
  });
  it('congela página, array e itens e não altera entradas/linhas', async () => {
    const source = row();
    execute
      .mockReset()
      .mockResolvedValueOnce(result([state()]))
      .mockResolvedValueOnce(result([source]));
    const c = ctx(),
      r = reach(),
      p = pagination();
    const before = JSON.stringify({ c, r, p, source });
    const out = await list(tx, c, r, p);
    expect(JSON.stringify({ c, r, p, source })).toBe(before);
    expect(out.items[0]).not.toBe(source);
    expect([out, out.items, ...out.items].every(Object.isFrozen)).toBe(true);
    expect(() => Object.assign(out, { hasNextPage: true })).toThrow(TypeError);
    expect(() => Object.assign(out.items, { 0: row(2) })).toThrow(TypeError);
    expect(() =>
      Object.assign(out.items[0] ?? {}, { name: 'mutação' }),
    ).toThrow(TypeError);
    source.name = 'mudou';
    expect(out.items[0]?.name).toBe(' Nome\u00a0');
  });
  it('captura getters de paginação uma vez e ignora mutação durante await', async () => {
    const c = ctx(),
      r = { ...reach(), businessUnitIds: [BU] };
    let pages = 0,
      sizes = 0;
    const p = {
      get page() {
        return ++pages === 1 ? 1 : 99;
      },
      get pageSize() {
        return ++sizes === 1 ? 2 : 100;
      },
    };
    execute
      .mockReset()
      .mockImplementationOnce(
        () =>
          new PgRaw(
            async () => {
              c.membershipId = OTHER;
              c.authorizedOrganizationId = OTHER;
              r.businessUnitIds[0] = OTHER;
              return result([state()]);
            },
            sql`select 1`,
            { sql: 'select 1', params: [] },
            (value) => value,
          ),
      )
      .mockResolvedValueOnce(result([row()]));
    await list(tx, c, r, p);
    expect([pages, sizes]).toEqual([1, 1]);
    expect(query().params).toEqual([O, BU, 3, '0']);
  });
  it('propaga erro SQL sem resultado parcial', async () => {
    const error = new Error('SQL');
    execute
      .mockReset()
      .mockResolvedValueOnce(result([state()]))
      .mockRejectedValueOnce(error);
    await expect(list(tx, ctx(), reach(), pagination())).rejects.toBe(error);
  });
});

describe('L.1 — validação anterior ao banco', () => {
  it.each(
    [
      null,
      undefined,
      [],
      {},
      { membershipId: 'invalid', authorizedOrganizationId: O },
    ].map((value) => ({ value })),
  )('contexto inválido $value', async ({ value }) => {
    await expect(
      list(tx, value as AuthorizedTenantContext, reach(), pagination()),
    ).rejects.toBeInstanceOf(D1ReadContractError);
    expect(execute).not.toHaveBeenCalled();
  });
  it.each([
    { permission: 'ropa:read' },
    { membershipId: OTHER },
    { authorizedOrganizationId: OTHER },
    { scope: 'UNKNOWN' },
    { scope: 'ORGANIZATION' },
    { businessUnitIds: ['invalid'] },
  ])('reach inválido %j', async (change) => {
    await expect(
      list(tx, ctx(), { ...reach(), ...change } as D1ReadReach, pagination()),
    ).rejects.toBeInstanceOf(D1ReadContractError);
    expect(execute).not.toHaveBeenCalled();
  });
  it.each([null, undefined, [], {}].map((value) => ({ value })))(
    'paginação malformada $value',
    async ({ value }) => {
      await expect(
        list(tx, ctx(), reach(), value as ProcessingActivityListPagination),
      ).rejects.toBeInstanceOf(ProcessingActivityListPaginationError);
      expect(execute).not.toHaveBeenCalled();
    },
  );
  it.each(['page', 'pageSize'] as const)(
    '%s inválido em runtime',
    async (field) => {
      for (const value of [
        0,
        -1,
        1.5,
        NaN,
        Infinity,
        Number.MAX_SAFE_INTEGER + 1,
        '1',
        null,
        undefined,
      ]) {
        await expect(
          list(tx, ctx(), reach(), {
            ...pagination(),
            [field]: value,
          } as ProcessingActivityListPagination),
        ).rejects.toBeInstanceOf(ProcessingActivityListPaginationError);
      }
      expect(execute).not.toHaveBeenCalled();
    },
  );
  it('pageSize 101 rejeitado sem banco', async () => {
    await expect(
      list(tx, ctx(), reach(), { page: 1, pageSize: 101 }),
    ).rejects.toBeInstanceOf(ProcessingActivityListPaginationError);
    expect(execute).not.toHaveBeenCalled();
  });
  it.each([null, undefined, {}, []].map((value) => ({ value })))(
    'handle inválido $value',
    async ({ value }) => {
      await expect(
        list(value as TenantTransaction, ctx(), reach(), pagination()),
      ).rejects.toBeInstanceOf(ProcessingActivityTransactionError);
      expect(execute).not.toHaveBeenCalled();
    },
  );
});

describe('L.1 — estado e linhas adversas', () => {
  it.each([
    { organizationId: null },
    { organizationId: OTHER },
    { isolationLevel: 'read committed' },
    { readOnly: 'off' },
  ])('estado inválido mesmo com BU vazia: %j', async (change) => {
    execute
      .mockReset()
      .mockResolvedValueOnce(result([{ ...state(), ...change }]));
    await expect(
      list(
        tx,
        ctx(),
        createD1ReadReach({ ...reach(), businessUnitIds: [] }),
        pagination(),
      ),
    ).rejects.toBeInstanceOf(ProcessingActivityTransactionError);
    expect(execute).toHaveBeenCalledTimes(1);
  });
  it.each([
    { id: 'invalid' },
    { organizationId: OTHER },
    { businessUnitId: OTHER },
    { name: '\u00a0\u2007\u202f' },
    { createdAt: 'invalid' },
    { updatedAt: '2026-02-30T12:00:00.123456Z' },
  ])('rejeita linha excedente inválida %j', async (change) => {
    execute
      .mockReset()
      .mockResolvedValueOnce(result([state()]))
      .mockResolvedValueOnce(
        result([row(1), row(2), { ...row(3), ...change }]),
      );
    await expect(list(tx, ctx(), reach(), pagination())).rejects.toBeInstanceOf(
      ProcessingActivityPersistenceError,
    );
  });
  it('rejeita IDs duplicados e resultado acima do limite', async () => {
    for (const records of [
      [row(), row()],
      [row(1), row(2), row(3), row(4)],
    ]) {
      execute
        .mockReset()
        .mockResolvedValueOnce(result([state()]))
        .mockResolvedValueOnce(result(records));
      await expect(
        list(tx, ctx(), reach(), pagination()),
      ).rejects.toBeInstanceOf(ProcessingActivityPersistenceError);
    }
  });
  it('resultado malformado não produz vazio', async () => {
    execute
      .mockReset()
      .mockResolvedValueOnce(result([state()]))
      .mockResolvedValueOnce(null as never);
    await expect(list(tx, ctx(), reach(), pagination())).rejects.toBeInstanceOf(
      ProcessingActivityPersistenceError,
    );
  });
});

describe('L.1 — regressão de arrays esparsos', () => {
  it.each(['posição única', 'lacuna intermediária', 'excedente ausente'])(
    '%s rejeita integralmente, sem itens ou metadados parciais',
    async (mode) => {
      const records: Record<string, unknown>[] = [];
      if (mode === 'posição única') {
        records.length = 1;
      } else if (mode === 'lacuna intermediária') {
        records[0] = row(1);
        records[2] = row(3);
      } else {
        records.push(row(1), row(2));
        records.length = 3;
      }
      expect(Object.keys(records).length).toBeLessThan(records.length);
      execute
        .mockReset()
        .mockResolvedValueOnce(result([state()]))
        .mockResolvedValueOnce(result(records));
      let delivered = false;
      await expect(
        list(tx, ctx(), reach(), pagination()).then((value) => {
          delivered = true;
          return value;
        }),
      ).rejects.toBeInstanceOf(ProcessingActivityPersistenceError);
      expect(delivered).toBe(false);
    },
  );
  it.each([2, 3])(
    'array denso com %s linhas mantém itens e continuidade',
    async (count) => {
      execute
        .mockReset()
        .mockResolvedValueOnce(result([state()]))
        .mockResolvedValueOnce(
          result(count === 2 ? [row(1), row(2)] : [row(1), row(2), row(3)]),
        );
      const output = await list(tx, ctx(), reach(), pagination());
      expect(output).toEqual({
        items: [
          { ...row(1), updatedAt: '2026-10-28T12:01:00.123Z' },
          { ...row(2), updatedAt: '2026-10-28T12:01:00.123Z' },
        ],
        hasNextPage: count === 3,
      });
      expect(output.items.map((value) => value.id)).toEqual([
        row(1).id,
        row(2).id,
      ]);
      expect(
        [output, output.items, ...output.items].every(Object.isFrozen),
      ).toBe(true);
    },
  );
});
