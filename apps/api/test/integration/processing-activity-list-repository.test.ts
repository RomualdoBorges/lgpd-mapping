import { randomUUID } from 'node:crypto';
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
import {
  createD1ReadPolicyInput,
  type D1ReadReach,
} from '../../src/authorization/d1-read-contracts.js';
import { evaluateD1ReadReach } from '../../src/authorization/d1-read-policy.js';
import type { TenantTransaction } from '../../src/persistence/tenant-transaction.js';
import type { AuthorizedTenantContext } from '../../src/tenant/authorized-tenant-context.js';
import { ProcessingActivityTransactionError } from '../../src/persistence/processing-activity-repository.js';
import { listVisibleProcessingActivities as list } from '../../src/persistence/processing-activity-list-repository.js';

let fixture: Awaited<ReturnType<typeof createTestDatabase>>;
const UNIT = randomUUID();
const context: AuthorizedTenantContext = {
  membershipId: M_A,
  authorizedOrganizationId: A,
};
const id = (n: number) =>
  `aaaaaaaa-aaaa-4aaa-8aaa-${n.toString(16).padStart(12, '0')}`;
const time = (n: number) =>
  `2026-10-28T12:00:00.${n.toString().padStart(6, '0')}Z`;
function reach(
  areas: readonly string[] = [BU_A],
  organization = false,
  c: AuthorizedTenantContext = context,
): D1ReadReach {
  return evaluateD1ReadReach(
    createD1ReadPolicyInput({
      permission: 'processing_activity:read',
      authorizedTenantContext: c,
      resolvedMembershipGrants: {
        ...c,
        grants: [
          {
            roleAssignmentId: randomUUID(),
            roleCode: organization ? 'DPO' : 'MANAGER',
            scope: organization ? 'ORGANIZATION' : 'BUSINESS_UNIT',
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
  readOnly = true,
) {
  return fixture.database.transaction(
    async (tx) => {
      if (tenant !== null)
        await tx.execute(
          sql`select set_config('lgpd.organization_id',${tenant},true)`,
        );
      return operation(tx);
    },
    {
      isolationLevel: isolation,
      accessMode: readOnly ? 'read only' : 'read write',
    },
  );
}
async function seed(
  records: Array<{ n: number; org?: string; unit?: string; created?: string }>,
) {
  if (records.length === 0) return;
  const values: unknown[] = [];
  const tuples = records.map((r, i) => {
    values.push(
      id(r.n),
      r.org ?? A,
      r.unit ?? BU_A,
      ' Nome\u00a0',
      r.created ?? time(r.n),
    );
    const start = i * 5;
    return `($${start + 1},$${start + 2},$${start + 3},$${start + 4},$${start + 5},$${start + 5})`;
  });
  await fixture.preparation.query(
    `insert into processing_activities(id,organization_id,business_unit_id,name,created_at,updated_at) values ${tuples.join(',')}`,
    values,
  );
}
async function read(page = 1, pageSize = 2, r = reach(), c = context) {
  return transaction(
    (tx) => list(tx, c, r, { page, pageSize }),
    c.authorizedOrganizationId,
  );
}
beforeAll(async () => {
  fixture = await createTestDatabase();
});
beforeEach(async () => {
  await fixture.reset();
  await fixture.preparation.query(
    'insert into business_units(id,organization_id,name) values($1,$2,$3)',
    [UNIT, A, 'Outra área'],
  );
  await seed([
    { n: 1 },
    { n: 2 },
    { n: 3 },
    { n: 4 },
    { n: 5 },
    { n: 6, unit: UNIT },
    { n: 7, unit: UNIT },
    { n: 8, org: B, unit: BU_B },
  ]);
});
afterAll(async () => {
  if (fixture) await fixture.close();
});

describe('L.1 — PostgreSQL real', () => {
  it.each([
    { page: 1, ids: [5, 4], next: true },
    { page: 2, ids: [3, 2], next: true },
    { page: 3, ids: [1], next: false },
    { page: 4, ids: [], next: false },
  ])('página $page: itens e continuidade somente visíveis', async (test) => {
    const out = await read(test.page);
    expect(out.items.map((x) => x.id)).toEqual(test.ids.map(id));
    expect(out.hasNextPage).toBe(test.next);
  });
  it.each([1, 2, 3])(
    'pageSize 2 com %s registros: usa excedente corretamente',
    async (n) => {
      await fixture.preparation.query('delete from processing_activities');
      await seed(Array.from({ length: n }, (_, i) => ({ n: i + 1 })));
      const out = await read();
      expect(out.items.map((x) => x.id)).toEqual(
        Array.from({ length: Math.min(n, 2) }, (_, i) => id(n - i)),
      );
      expect(out.hasNextPage).toBe(n > 2);
    },
  );
  it('limites pageSize 1 e 100, sem contagem ou itens extras', async () => {
    await fixture.preparation.query('delete from processing_activities');
    await seed(Array.from({ length: 105 }, (_, i) => ({ n: i + 1 })));
    const first = await read(1, 1);
    expect(first.items.map((x) => x.id)).toEqual([id(105)]);
    expect(first.hasNextPage).toBe(true);
    const maximum = await read(1, 100);
    expect(maximum.items).toHaveLength(100);
    expect(maximum.items[99]?.id).toBe(id(6));
    expect(maximum.hasNextPage).toBe(true);
    const end = await read(2, 100);
    expect(end.items.map((x) => x.id)).toEqual([5, 4, 3, 2, 1].map(id));
    expect(end.hasNextPage).toBe(false);
  });
  it('ordena por instante completo e desempata por id DESC', async () => {
    await fixture.preparation.query('delete from processing_activities');
    await seed([
      { n: 1, created: time(3) },
      { n: 2, created: time(2) },
      { n: 3, created: time(2) },
      { n: 4, created: time(1) },
    ]);
    const first = await read();
    const second = await read(2);
    expect(first.items.map((x) => x.id)).toEqual([id(1), id(3)]);
    expect(second.items.map((x) => x.id)).toEqual([id(2), id(4)]);
    expect(first.items[0]?.createdAt).toBe(time(3));
    expect(first.items[1]?.createdAt).toBe(time(2));
  });
  it('DPO/ORGANIZATION lê áreas próprias sem incluir outro tenant', async () => {
    const out = await read(1, 100, reach([], true));
    expect(out.items.map((x) => x.id)).toEqual([7, 6, 5, 4, 3, 2, 1].map(id));
    expect(out.hasNextPage).toBe(false);
  });
  it('união de grants reais produz somente áreas aplicáveis à operação', async () => {
    const r = evaluateD1ReadReach(
      createD1ReadPolicyInput({
        permission: 'processing_activity:read',
        authorizedTenantContext: context,
        resolvedMembershipGrants: {
          ...context,
          grants: [
            {
              roleAssignmentId: randomUUID(),
              roleCode: 'COLLABORATOR',
              scope: 'BUSINESS_UNIT',
              businessUnitIds: [BU_A],
            },
            {
              roleAssignmentId: randomUUID(),
              roleCode: 'MANAGER',
              scope: 'BUSINESS_UNIT',
              businessUnitIds: [UNIT, BU_A],
            },
            {
              roleAssignmentId: randomUUID(),
              roleCode: 'DPO',
              scope: 'BUSINESS_UNIT',
              businessUnitIds: [BU_B],
            },
          ],
        },
      }),
    );
    expect((await read(1, 100, r)).items.map((x) => x.id)).toEqual(
      [7, 6, 5, 4, 3, 2, 1].map(id),
    );
  });
  it('área de outro tenant não amplia acesso nem hasNextPage', async () => {
    const out = await read(1, 100, reach([BU_A, BU_B]));
    expect(out.items.map((x) => x.id)).toEqual([5, 4, 3, 2, 1].map(id));
    expect(out.hasNextPage).toBe(false);
  });
  it('nenhum alcance valida estado e evita SELECT de Activities', async () => {
    await transaction(async (tx) => {
      const spy = vi.spyOn(tx, 'execute');
      try {
        expect(
          await list(tx, context, reach([]), { page: 1, pageSize: 20 }),
        ).toEqual({ items: [], hasNextPage: false });
        expect(spy).toHaveBeenCalledTimes(1);
      } finally {
        spy.mockRestore();
      }
    });
  });
  it('RLS/FORCE RLS e runtime restrito negam leitura sem tenant', async () => {
    const flags = (
      await fixture.preparation.query(
        "select relrowsecurity,relforcerowsecurity from pg_class where oid='public.processing_activities'::regclass",
      )
    ).rows[0];
    expect(flags).toEqual({ relrowsecurity: true, relforcerowsecurity: true });
    expect(
      (await fixture.runtime.query('select id from processing_activities'))
        .rows,
    ).toEqual([]);
    const role = (
      await fixture.runtime.query(
        "select r.rolsuper,r.rolbypassrls,c.relowner=r.oid as owner from pg_roles r cross join pg_class c where r.rolname=current_user and c.oid='public.processing_activities'::regclass",
      )
    ).rows[0];
    expect(role).toEqual({
      rolsuper: false,
      rolbypassrls: false,
      owner: false,
    });
  });
  it.each([
    {
      label: 'sem tenant',
      tenant: null,
      isolation: 'repeatable read',
      readOnly: true,
    },
    {
      label: 'tenant divergente',
      tenant: B,
      isolation: 'repeatable read',
      readOnly: true,
    },
    {
      label: 'isolamento incorreto',
      tenant: A,
      isolation: 'read committed',
      readOnly: true,
    },
    {
      label: 'read write',
      tenant: A,
      isolation: 'repeatable read',
      readOnly: false,
    },
  ] as const)('rejeita $label mesmo com alcance vazio', async (test) => {
    await expect(
      transaction(
        (tx) => list(tx, context, reach([]), { page: 1, pageSize: 20 }),
        test.tenant,
        test.isolation,
        test.readOnly,
      ),
    ).rejects.toBeInstanceOf(ProcessingActivityTransactionError);
  });
  it('propaga SQL real sem fallback e não deixa tenant residual após rollback', async () => {
    await expect(
      transaction(async (tx) => {
        await tx.execute(sql`select 1/0`);
        return list(tx, context, reach(), { page: 1, pageSize: 2 });
      }),
    ).rejects.toMatchObject({
      cause: expect.objectContaining({ code: '22012' }),
    });
    expect(
      (
        await fixture.runtime.query(
          "select nullif(current_setting('lgpd.organization_id',true),'') tenant",
        )
      ).rows[0]?.tenant,
    ).toBeNull();
    expect((await read()).items.map((x) => x.id)).toEqual([id(5), id(4)]);
  });
  it('falha SQL real na consulta de dados do repository é propagada', async () => {
    await expect(
      transaction(async (tx) => {
        const execute = tx.execute.bind(tx);
        let calls = 0;
        const spy = vi.spyOn(tx, 'execute').mockImplementation((query) => {
          calls += 1;
          return execute(calls === 2 ? sql`select 1/0` : query);
        });
        try {
          return await list(tx, context, reach(), { page: 1, pageSize: 2 });
        } finally {
          spy.mockRestore();
        }
      }),
    ).rejects.toMatchObject({
      cause: expect.objectContaining({ code: '22012' }),
    });
  });
  it('UUIDs maiúsculos nas cópias são compatíveis com linhas PostgreSQL canônicas', async () => {
    const c = {
      membershipId: M_A.toUpperCase(),
      authorizedOrganizationId: A.toUpperCase(),
    };
    const r = reach([BU_A.toUpperCase()], false, c);
    const out = await read(1, 2, r, c);
    expect(out.items.map((x) => x.id)).toEqual([id(5), id(4)]);
  });
  it('retorno real imutável, seis campos e texto original preservado', async () => {
    const out = await read();
    expect(Object.isFrozen(out)).toBe(true);
    expect(Object.isFrozen(out.items)).toBe(true);
    expect(out.items.every(Object.isFrozen)).toBe(true);
    expect(Object.keys(out.items[0] ?? {}).sort()).toEqual([
      'businessUnitId',
      'createdAt',
      'id',
      'name',
      'organizationId',
      'updatedAt',
    ]);
    expect(out.items[0]?.name).toBe(' Nome\u00a0');
  });
  it('página muito alta permanece exata e retorna vazio sem teto adicional', async () => {
    expect(await read(Number.MAX_SAFE_INTEGER, 100)).toEqual({
      items: [],
      hasNextPage: false,
    });
  });
  it('mesmo handle e conexão; depois do commit não há contexto residual', async () => {
    await transaction(async (tx) => {
      const before = (await tx.execute(sql`select pg_backend_pid() pid`))
        .rows[0]?.pid;
      const out = await list(tx, context, reach(), { page: 1, pageSize: 2 });
      const after = (await tx.execute(sql`select pg_backend_pid() pid`)).rows[0]
        ?.pid;
      expect(out.items.map((x) => x.id)).toEqual([id(5), id(4)]);
      expect(after).toBe(before);
    });
    expect(
      (
        await fixture.runtime.query(
          "select nullif(current_setting('lgpd.organization_id',true),'') tenant",
        )
      ).rows[0]?.tenant,
    ).toBeNull();
    const c = { membershipId: M_B, authorizedOrganizationId: B };
    expect(
      (await read(1, 20, reach([BU_B], false, c), c)).items.map((x) => x.id),
    ).toEqual([id(8)]);
  });
});
