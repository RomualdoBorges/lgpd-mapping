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
  findVisibleProcessingActivityById as find,
  ProcessingActivityPersistenceError,
  ProcessingActivityTransactionError,
} from '../../src/persistence/processing-activity-repository.js';

const M = '00000000-0000-4000-8000-000000000001';
const O = '00000000-0000-4000-8000-000000000002';
const A = '00000000-0000-4000-8000-000000000003';
const B = '00000000-0000-4000-8000-000000000004';
const ID = 'abcdef00-0000-4000-8000-000000000005';
const context = () => ({ membershipId: M, authorizedOrganizationId: O });
const reach = () =>
  createD1ReadReach({
    permission: 'processing_activity:read',
    ...context(),
    scope: 'BUSINESS_UNIT',
    businessUnitIds: [A],
  });
const state = () => ({ organizationId: O, isolationLevel: 'repeatable read' });
const row = () => ({
  id: ID,
  organizationId: O,
  businessUnitId: A,
  name: ' Atividade\u00a0',
  createdAt: new Date('2026-01-01T10:20:30.123Z'),
  updatedAt: new Date('2026-01-02T10:20:30.456Z'),
});
function result(rows: Record<string, unknown>[]) {
  return { rows, command: 'SELECT', oid: 0, rowCount: rows.length, fields: [] };
}
const pool = new pg.Pool();
const dialect = new PgDialect();
const tx: TenantTransaction = new NodePgTransaction<
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>(dialect, new NodePgSession(pool, dialect, undefined), undefined);
const execute = vi.spyOn(tx, 'execute');
afterAll(async () => {
  await pool.end();
});
beforeEach(() => {
  execute.mockReset();
  execute
    .mockResolvedValueOnce(result([state()]))
    .mockResolvedValueOnce(result([row()]));
});
function queries() {
  return execute.mock.calls.map(([query]) => {
    if (typeof query === 'string')
      throw new Error('SQL sem parâmetros inesperado.');
    return dialect.sqlToQuery(query.getSQL());
  });
}

describe('repository de Activity — contratos e mapeamento', () => {
  it('consulta somente no handle recebido, com tenant/UUID/área vinculados e seis colunas', async () => {
    const summary = await find(tx, context(), reach(), ID);
    expect(summary).toEqual({
      ...row(),
      createdAt: '2026-01-01T10:20:30.123Z',
      updatedAt: '2026-01-02T10:20:30.456Z',
    });
    expect(execute).toHaveBeenCalledTimes(2);
    const [metadata, activity] = queries();
    expect(metadata?.sql).toContain("current_setting('transaction_isolation')");
    expect(metadata?.sql).not.toContain('from public.processing_activities');
    expect(activity?.params).toEqual([ID, O, A]);
    expect(activity?.sql).toContain('where id = $1 and organization_id = $2');
    expect(activity?.sql).toContain('business_unit_id in ($3)');
    expect(activity?.sql).not.toContain('select *');
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
  });
  it('ORGANIZATION conserva o filtro tenant e não enumera áreas', async () => {
    await find(
      tx,
      context(),
      createD1ReadReach({
        ...reach(),
        scope: 'ORGANIZATION',
        businessUnitIds: [],
      }),
      ID,
    );
    expect(queries()[1]?.params).toEqual([ID, O]);
    expect(queries()[1]?.sql).not.toContain('business_unit_id in');
  });
  it('aceita UUID de recurso em hexadecimal maiúsculo e consulta sua forma canônica', async () => {
    expect((await find(tx, context(), reach(), ID.toUpperCase()))?.id).toBe(ID);
    expect(queries()[1]?.params[0]).toBe(ID);
  });
  it('retorna null sem segunda consulta para BU vazio, após verificar a transação', async () => {
    expect(
      await find(
        tx,
        context(),
        createD1ReadReach({ ...reach(), businessUnitIds: [] }),
        ID,
      ),
    ).toBeNull();
    expect(execute).toHaveBeenCalledTimes(1);
  });
  it('retorna null para ausência sem lookup adicional', async () => {
    execute
      .mockReset()
      .mockResolvedValueOnce(result([state()]))
      .mockResolvedValueOnce(result([]));
    expect(await find(tx, context(), reach(), ID)).toBeNull();
    expect(execute).toHaveBeenCalledTimes(2);
  });
  it.each(['invalid', '', null, undefined, [], "' OR true --"])(
    'rejeita UUID inválido antes do banco: %j',
    async (id) => {
      await expect(
        find(tx, context(), reach(), id as string),
      ).rejects.toBeInstanceOf(D1ReadContractError);
      expect(execute).not.toHaveBeenCalled();
    },
  );
  it.each([
    null,
    undefined,
    [],
    {},
    { membershipId: 'invalid', authorizedOrganizationId: O },
    { membershipId: M, authorizedOrganizationId: 'invalid' },
  ])('rejeita contexto inválido: %j', async (c) => {
    await expect(
      find(tx, c as AuthorizedTenantContext, reach(), ID),
    ).rejects.toBeInstanceOf(D1ReadContractError);
    expect(execute).not.toHaveBeenCalled();
  });
  it.each([
    null,
    undefined,
    [],
    {},
    { ...reach(), membershipId: B },
    { ...reach(), authorizedOrganizationId: B },
    { ...reach(), permission: 'ropa:read' },
    { ...reach(), scope: 'OWN' },
    { ...reach(), businessUnitIds: ["' OR true --"] },
  ])('rejeita alcance inconsistente: %j', async (r) => {
    await expect(
      find(tx, context(), r as D1ReadReach, ID),
    ).rejects.toBeInstanceOf(D1ReadContractError);
    expect(execute).not.toHaveBeenCalled();
  });
  it.each(
    [
      [],
      [state(), state()],
      [{ ...state(), organizationId: null }],
      [{ ...state(), organizationId: B }],
      [{ ...state(), isolationLevel: 'read committed' }],
      [{ ...state(), isolationLevel: 'serializable' }],
    ].map((states) => ({ states })),
  )(
    'rejeita composição transacional antes de buscar Activity: %j',
    async ({ states }) => {
      execute.mockReset().mockResolvedValue(result(states));
      await expect(find(tx, context(), reach(), ID)).rejects.toBeInstanceOf(
        ProcessingActivityTransactionError,
      );
      expect(execute).toHaveBeenCalledTimes(1);
    },
  );
  it('BU vazio não esconde erro transacional', async () => {
    execute
      .mockReset()
      .mockResolvedValue(result([{ ...state(), organizationId: null }]));
    await expect(
      find(
        tx,
        context(),
        createD1ReadReach({ ...reach(), businessUnitIds: [] }),
        ID,
      ),
    ).rejects.toBeInstanceOf(ProcessingActivityTransactionError);
  });
  it.each([
    { ...row(), id: B },
    { ...row(), id: 'invalid' },
    { ...row(), organizationId: B },
    { ...row(), businessUnitId: B },
    { ...row(), businessUnitId: null },
    { ...row(), name: '' },
    { ...row(), name: '\u00a0\u2007\u202f' },
    { ...row(), createdAt: new Date(NaN) },
    { ...row(), updatedAt: '2026-01-01' },
  ])(
    'rejeita linha inconsistente em vez de liberá-la ou retornar null: %j',
    async (persisted) => {
      execute
        .mockReset()
        .mockResolvedValueOnce(result([state()]))
        .mockResolvedValueOnce(result([persisted]));
      await expect(find(tx, context(), reach(), ID)).rejects.toBeInstanceOf(
        ProcessingActivityPersistenceError,
      );
    },
  );
  it('rejeita mais de uma linha apesar do limite SQL', async () => {
    execute
      .mockReset()
      .mockResolvedValueOnce(result([state()]))
      .mockResolvedValueOnce(result([row(), row()]));
    await expect(find(tx, context(), reach(), ID)).rejects.toBeInstanceOf(
      ProcessingActivityPersistenceError,
    );
  });
  it.each([0, 1])(
    'propaga a mesma falha da consulta %s sem null',
    async (index) => {
      const failure = new Error('falha simulada');
      execute.mockReset();
      if (index === 1) execute.mockResolvedValueOnce(result([state()]));
      execute.mockRejectedValueOnce(failure);
      await expect(find(tx, context(), reach(), ID)).rejects.toBe(failure);
      expect(execute).toHaveBeenCalledTimes(index + 1);
    },
  );
  it('captura contexto e alcance uma vez e ignora autoridade por campos extras', async () => {
    let memberships = 0,
      organizations = 0,
      scopes = 0,
      areas = 0;
    const c = {
      get membershipId() {
        return ++memberships === 1 ? M : B;
      },
      get authorizedOrganizationId() {
        return ++organizations === 1 ? O : B;
      },
      organizationId: B,
    };
    const source = {
      ...reach(),
      get scope() {
        return ++scopes === 1 ? 'BUSINESS_UNIT' : 'ORGANIZATION';
      },
      get businessUnitIds() {
        return ++areas === 1 ? [A] : [B];
      },
      where: 'true',
      roleCode: 'DPO',
    };
    expect((await find(tx, c, source as D1ReadReach, ID))?.businessUnitId).toBe(
      A,
    );
    expect([memberships, organizations, scopes, areas]).toEqual([1, 1, 1, 1]);
    expect(queries()[1]?.params).toEqual([ID, O, A]);
  });
  it('usa cópias validadas quando a entrada muda durante o primeiro await', async () => {
    const c = context();
    const source = { ...reach(), businessUnitIds: [A] };
    execute
      .mockReset()
      .mockReturnValueOnce(
        new PgRaw(
          async () => {
            c.membershipId = B;
            c.authorizedOrganizationId = B;
            source.businessUnitIds.push(B);
            source.scope = 'ORGANIZATION';
            return result([state()]);
          },
          sql``,
          { sql: '', params: [] },
          (value) => value,
        ),
      )
      .mockResolvedValueOnce(result([row()]));
    expect((await find(tx, c, source as D1ReadReach, ID))?.organizationId).toBe(
      O,
    );
    expect(queries()[1]?.params).toEqual([ID, O, A]);
  });
  it('preserva precisão dos timestamps UTC entregues pelo SQL', async () => {
    execute
      .mockReset()
      .mockResolvedValueOnce(result([state()]))
      .mockResolvedValueOnce(
        result([
          {
            ...row(),
            createdAt: '2026-01-01T10:20:30.123456Z',
            updatedAt: '2026-01-02T10:20:30.456000Z',
          },
        ]),
      );
    const summary = await find(tx, context(), reach(), ID);
    expect(summary?.createdAt).toBe('2026-01-01T10:20:30.123456Z');
    expect(summary?.updatedAt).toBe('2026-01-02T10:20:30.456Z');
  });
  it('não modifica entradas e retorna somente primitivas em envelope congelado independente', async () => {
    const c = context();
    const r = reach();
    const persisted = { ...row(), secret: 'não retornar' };
    const before = JSON.stringify({ c, r, persisted });
    execute
      .mockReset()
      .mockResolvedValueOnce(result([state()]))
      .mockResolvedValueOnce(result([persisted]));
    const summary = await find(tx, c, r, ID);
    expect(JSON.stringify({ c, r, persisted })).toBe(before);
    expect(Object.isFrozen(summary)).toBe(true);
    expect(summary).not.toHaveProperty('secret');
    expect(() => Object.assign(summary ?? {}, { name: 'alterado' })).toThrow(
      TypeError,
    );
    persisted.name = 'alterado';
    persisted.createdAt.setTime(0);
    expect(summary?.name).toBe(' Atividade\u00a0');
    expect(summary?.createdAt).toBe('2026-01-01T10:20:30.123Z');
  });
});
