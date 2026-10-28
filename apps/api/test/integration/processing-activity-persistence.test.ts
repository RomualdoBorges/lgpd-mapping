import { randomUUID, createHash } from 'node:crypto';
import {
  mkdtemp,
  mkdir,
  readFile,
  copyFile,
  writeFile,
  rm,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { sql } from 'drizzle-orm';
import { PgDialect, getTableConfig } from 'drizzle-orm/pg-core';
import { processingActivities } from '../../src/persistence/schema.js';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createTestDatabase, A, B, BU_A, BU_B } from './database.js';
import { withTenant } from '../../src/persistence/tenant-transaction.js';
import { applyMigrations } from '../../src/persistence/migrate.js';

let fixture: Awaited<ReturnType<typeof createTestDatabase>>;
const PA_A = randomUUID();
const PA_B = randomUUID();
const columns =
  'id,organization_id,business_unit_id,name,created_at,updated_at';
const folder = fileURLToPath(
  new URL('../../drizzle/migrations', import.meta.url),
);
const names = [
  '0000_identity_tenant',
  '0001_tenant_rls',
  '0002_auth_persistence',
  '0003_role_read_privilege',
  '0004_processing_activities',
];
const times = [
  '1789754035408',
  '1789754043586',
  '1790249267053',
  '1792761082815',
  '1793187232060',
];

// Explicit fixed set shared by the requirement, not inferred from the database locale.
const whitespaceCodePoints = [
  0x0009, 0x000a, 0x000b, 0x000c, 0x000d, 0x0020, 0x0085, 0x00a0, 0x1680,
  0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008,
  0x2009, 0x200a, 0x2028, 0x2029, 0x202f, 0x205f, 0x3000,
];
const whitespaceCases = whitespaceCodePoints.map((codePoint) => ({
  label: `U+${codePoint.toString(16).toUpperCase().padStart(4, '0')}`,
  character: String.fromCodePoint(codePoint),
}));

async function history() {
  return Promise.all(
    names.map(async (name, i) => ({
      hash: createHash('sha256')
        .update(await readFile(join(folder, `${name}.sql`)))
        .digest('hex'),
      created_at: times[i],
    })),
  );
}
async function insert(
  values: {
    id?: string | null;
    organization?: string | null;
    unit?: string | null;
    name?: string | null;
  } = {},
) {
  return fixture.preparation.query(
    'insert into public.processing_activities(id,organization_id,business_unit_id,name) values($1,$2,$3,$4) returning *',
    [
      values.id === undefined ? randomUUID() : values.id,
      values.organization === undefined ? A : values.organization,
      values.unit === undefined ? BU_A : values.unit,
      values.name === undefined ? 'Atividade fictícia' : values.name,
    ],
  );
}
const read = (org: string) =>
  withTenant(fixture.database, org, (tx) =>
    tx.execute(sql`select id from public.processing_activities order by id`),
  );

beforeAll(async () => {
  fixture = await createTestDatabase();
});
beforeEach(async () => {
  await fixture.reset();
  // Preparation uses a separate credential; the runtime never receives write access.
  await insert({ id: PA_A });
  await insert({ id: PA_B, organization: B, unit: BU_B });
});
afterAll(async () => {
  if (fixture) await fixture.close();
});

describe('P.1 — persistência mínima de ProcessingActivity', () => {
  it('possui exatamente seis colunas, tipos, nulabilidade e defaults aprovados', async () => {
    const rows = (
      await fixture.migration.query(
        `select column_name,data_type,is_nullable,column_default,character_maximum_length from information_schema.columns where table_schema='public' and table_name='processing_activities' order by ordinal_position`,
      )
    ).rows;
    expect(rows).toEqual([
      {
        column_name: 'id',
        data_type: 'uuid',
        is_nullable: 'NO',
        column_default: 'gen_random_uuid()',
        character_maximum_length: null,
      },
      {
        column_name: 'organization_id',
        data_type: 'uuid',
        is_nullable: 'NO',
        column_default: null,
        character_maximum_length: null,
      },
      {
        column_name: 'business_unit_id',
        data_type: 'uuid',
        is_nullable: 'NO',
        column_default: null,
        character_maximum_length: null,
      },
      {
        column_name: 'name',
        data_type: 'text',
        is_nullable: 'NO',
        column_default: null,
        character_maximum_length: null,
      },
      {
        column_name: 'created_at',
        data_type: 'timestamp with time zone',
        is_nullable: 'NO',
        column_default: 'now()',
        character_maximum_length: null,
      },
      {
        column_name: 'updated_at',
        data_type: 'timestamp with time zone',
        is_nullable: 'NO',
        column_default: 'now()',
        character_maximum_length: null,
      },
    ]);
    const row = (
      await fixture.preparation.query(
        'insert into processing_activities(organization_id,business_unit_id,name) values($1,$2,$3) returning *',
        [A, BU_A, 'Defaults'],
      )
    ).rows[0];
    expect(row.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(row.created_at).toBeInstanceOf(Date);
    expect(row.updated_at).toEqual(row.created_at);
  });

  it('possui somente PK, duas FKs, CHECK e índice Organization/área, sem unique adicional ou triggers', async () => {
    const constraints = (
      await fixture.migration.query(
        `select conname,contype,pg_get_constraintdef(oid) as definition from pg_constraint where conrelid='public.processing_activities'::regclass order by conname`,
      )
    ).rows;
    expect(constraints.map((c) => [c.conname, c.contype])).toEqual([
      ['processing_activities_business_unit_tenant_fk', 'f'],
      ['processing_activities_name_not_blank', 'c'],
      ['processing_activities_organization_id_organizations_id_fk', 'f'],
      ['processing_activities_pkey', 'p'],
    ]);
    expect(constraints[0].definition).toContain(
      'FOREIGN KEY (organization_id, business_unit_id) REFERENCES business_units(organization_id, id)',
    );
    const indexes = (
      await fixture.migration.query(
        `select indexname,indexdef from pg_indexes where schemaname='public' and tablename='processing_activities' order by indexname`,
      )
    ).rows;
    expect(indexes.map((i) => i.indexname)).toEqual([
      'processing_activities_business_unit_idx',
      'processing_activities_pkey',
    ]);
    expect(indexes[0].indexdef).toContain(
      'USING btree (organization_id, business_unit_id)',
    );
    expect(
      (
        await fixture.migration.query(
          `select tgname from pg_trigger where tgrelid='public.processing_activities'::regclass and not tgisinternal`,
        )
      ).rows,
    ).toEqual([]);
  });

  it.each([
    { organization: randomUUID() },
    { unit: randomUUID() },
    { organization: A, unit: BU_B },
  ])('rejeita referência inexistente ou cross-tenant: %j', async (values) => {
    await expect(insert(values)).rejects.toMatchObject({ code: '23503' });
  });
  it.each(['', ' ', '   ', '\t', '\n', ' \t\r\n '])(
    'rejeita nome sem conteúdo: %j',
    async (name) => {
      await expect(insert({ name })).rejects.toMatchObject({ code: '23514' });
    },
  );
  it.each(whitespaceCases)(
    'rejeita nome composto somente por $label',
    async ({ character }) => {
      await expect(insert({ name: character.repeat(3) })).rejects.toMatchObject(
        { code: '23514' },
      );
    },
  );
  it.each(whitespaceCases)(
    'preserva nome significativo acompanhado de $label',
    async ({ character }) => {
      const name = `${character}Atividade fictícia${character}`;
      expect((await insert({ name })).rows[0].name).toBe(name);
    },
  );
  it('rejeita mistura dos 25 espaços e preserva a mesma mistura com conteúdo', async () => {
    const spaces = whitespaceCases.map(({ character }) => character).join('');
    await expect(insert({ name: spaces })).rejects.toMatchObject({
      code: '23514',
    });
    const name = `${spaces}Atividade${[...spaces].reverse().join('')}`;
    expect((await insert({ name })).rows[0].name).toBe(name);
  });
  it('a regra fixa não classifica caracteres fora do conjunto como whitespace', async () => {
    // Format characters and former whitespace are outside this explicitly approved set.
    for (const name of ['\u180e', '\u200b', '\ufeff', 'Á', '中']) {
      expect((await insert({ name })).rows[0].name).toBe(name);
    }
  });
  it('schema e migration usam exatamente o mesmo conjunto explícito de whitespace', async () => {
    const checks = getTableConfig(processingActivities).checks;
    const constraint = checks.find(
      ({ name }) => name === 'processing_activities_name_not_blank',
    );
    if (!constraint) throw new Error('CHECK do schema ausente.');
    const schemaExpression = new PgDialect().sqlToQuery(constraint.value);
    expect(schemaExpression.params).toEqual([]);
    const migration = await readFile(
      join(folder, '0004_processing_activities.sql'),
      'utf8',
    );
    expect(migration).toContain(`CHECK (${schemaExpression.sql})`);
    expect(schemaExpression.sql).not.toContain('[:space:]');
    const literals = [...schemaExpression.sql.matchAll(/\\([0-9A-F]{4})/g)].map(
      (match) => Number.parseInt(match[1] ?? '', 16),
    );
    expect(literals).toEqual(whitespaceCodePoints);
    const snapshot = JSON.parse(
      await readFile(join(folder, 'meta/0004_snapshot.json'), 'utf8'),
    );
    expect(
      snapshot.tables['public.processing_activities'].checkConstraints
        .processing_activities_name_not_blank.value,
    ).toBe(schemaExpression.sql);
  });
  it('aceita nome válido sem normalização, duplicatas e texto longo sem limite adicional', async () => {
    const name = '  Atividade fictícia\t\n';
    expect((await insert({ name })).rows[0].name).toBe(name);
    expect((await insert({ name })).rows[0].name).toBe(name);
    const long = 'A'.repeat(10000);
    expect((await insert({ name: long })).rows[0].name).toBe(long);
  });
  it.each([
    'id',
    'organization_id',
    'business_unit_id',
    'name',
    'created_at',
    'updated_at',
  ])('rejeita null em %s', async (column) => {
    // Identifiers are restricted to this fixed test table, values remain bound.
    const values: Record<string, unknown> = {
      id: randomUUID(),
      organization_id: A,
      business_unit_id: BU_A,
      name: 'Obrigatórios',
      created_at: new Date('2026-01-01T00:00:00Z'),
      updated_at: new Date('2026-01-01T00:00:00Z'),
    };
    values[column] = null;
    await expect(
      fixture.preparation.query(
        `insert into processing_activities(${columns}) values($1,$2,$3,$4,$5,$6)`,
        Object.values(values),
      ),
    ).rejects.toMatchObject({ code: '23502' });
  });

  it('isola A/B mesmo sem filtro na consulta e não lê sem contexto', async () => {
    expect(
      (await fixture.runtime.query('select id from processing_activities'))
        .rows,
    ).toEqual([]);
    expect((await read(A)).rows).toEqual([{ id: PA_A }]);
    expect((await read(B)).rows).toEqual([{ id: PA_B }]);
    expect(
      (
        await fixture.runtime.query(
          'select id from processing_activities where id=$1',
          [PA_B],
        )
      ).rows,
    ).toEqual([]);
  });
  it('habilita FORCE RLS e somente uma policy SELECT para runtime', async () => {
    expect(
      (
        await fixture.migration.query(
          `select relrowsecurity,relforcerowsecurity,pg_get_userbyid(relowner) as owner from pg_class where oid='public.processing_activities'::regclass`,
        )
      ).rows[0],
    ).toEqual({
      relrowsecurity: true,
      relforcerowsecurity: true,
      owner: fixture.migrationRole,
    });
    const policies = (
      await fixture.migration.query(
        `select policyname,cmd,roles::text,qual,with_check from pg_policies where schemaname='public' and tablename='processing_activities'`,
      )
    ).rows;
    expect(policies).toHaveLength(1);
    expect(policies[0]).toMatchObject({
      policyname: 'tenant_isolation',
      cmd: 'SELECT',
      roles: `{${fixture.runtimeRole}}`,
      with_check: null,
    });
    expect(policies[0].qual).toContain(
      "current_setting('lgpd.organization_id'::text, true)",
    );
  });
  it('runtime lê todas as seis colunas aprovadas no tenant', async () => {
    await withTenant(fixture.database, A, async (tx) => {
      const rows = (
        await tx.execute(
          sql`select id,organization_id,business_unit_id,name,created_at,updated_at from processing_activities`,
        )
      ).rows;
      expect(rows).toHaveLength(1);
      expect(Object.keys(rows[0] ?? {}).sort()).toEqual(
        columns.split(',').sort(),
      );
      expect(rows[0]).toMatchObject({
        id: PA_A,
        organization_id: A,
        business_unit_id: BU_A,
      });
    });
    for (const column of columns.split(',')) {
      expect(
        (
          await fixture.runtime.query(
            `select has_column_privilege(current_user,'public.processing_activities',$1,'SELECT') as allowed`,
            [column],
          )
        ).rows[0].allowed,
      ).toBe(true);
    }
  });
  it.each([
    [
      'INSERT',
      'insert into processing_activities(id,organization_id,business_unit_id,name) values($1,$2,$3,$4)',
      () => [randomUUID(), A, BU_A, 'Válido'],
    ],
    [
      'UPDATE',
      'update processing_activities set name=$1 where id=$2',
      () => ['Válido', PA_A],
    ],
    ['DELETE', 'delete from processing_activities where id=$1', () => [PA_A]],
    ['TRUNCATE', 'truncate processing_activities', () => []],
  ] as const)(
    'nega %s por privilégio, não por constraint',
    async (_operation, statement, parameters) => {
      const before = (
        await fixture.preparation.query(
          `select ${columns} from processing_activities order by id`,
        )
      ).rows;
      const client = await fixture.runtime.connect();
      try {
        await client.query('BEGIN');
        await client.query(
          "select set_config('lgpd.organization_id',$1,true)",
          [A],
        );
        await expect(
          client.query(statement, parameters()),
        ).rejects.toMatchObject({ code: '42501' });
      } finally {
        await client.query('ROLLBACK');
        client.release();
      }
      expect(
        (
          await fixture.preparation.query(
            `select ${columns} from processing_activities order by id`,
          )
        ).rows,
      ).toEqual(before);
    },
  );
  it('runtime não tem privilégios extras diretos, PUBLIC, herdados ou administrativos', async () => {
    const row = (
      await fixture.runtime.query(
        `select rolsuper,rolbypassrls,rolcreatedb,rolcreaterole,rolinherit, (select pg_get_userbyid(relowner)=current_user from pg_class where oid='public.processing_activities'::regclass) as owner from pg_roles where rolname=current_user`,
      )
    ).rows[0];
    expect(Object.values(row)).toEqual([
      false,
      false,
      false,
      false,
      false,
      false,
    ]);
    for (const privilege of [
      'SELECT',
      'INSERT',
      'UPDATE',
      'DELETE',
      'TRUNCATE',
      'REFERENCES',
      'TRIGGER',
    ]) {
      expect(
        (
          await fixture.runtime.query(
            `select has_table_privilege(current_user,'public.processing_activities',$1) as allowed`,
            [privilege],
          )
        ).rows[0].allowed,
      ).toBe(false);
    }
    const permissions = (
      await fixture.runtime.query(
        `select attname,has_column_privilege(current_user,attrelid,attnum,'SELECT WITH GRANT OPTION') as grantable,has_column_privilege(current_user,attrelid,attnum,'INSERT') as insertable,has_column_privilege(current_user,attrelid,attnum,'UPDATE') as updatable,has_column_privilege(current_user,attrelid,attnum,'REFERENCES') as referenceable from pg_attribute where attrelid='public.processing_activities'::regclass and attnum>0 and not attisdropped`,
      )
    ).rows;
    expect(permissions).toHaveLength(6);
    for (const { attname, ...privileges } of permissions) {
      expect(columns.split(',')).toContain(attname);
      expect(Object.values(privileges)).toEqual([false, false, false, false]);
    }
    expect(
      (
        await fixture.migration.query(
          `select acl.grantee from pg_class c cross join lateral aclexplode(c.relacl) acl where c.oid='public.processing_activities'::regclass and acl.grantee=0 union all select acl.grantee from pg_attribute a cross join lateral aclexplode(a.attacl) acl where a.attrelid='public.processing_activities'::regclass and acl.grantee=0`,
        )
      ).rows,
    ).toEqual([]);
    expect(
      (
        await fixture.runtime.query(
          `select rolname from pg_roles where rolname<>current_user and (pg_has_role(current_user,oid,'MEMBER') or pg_has_role(current_user,oid,'SET')) and not rolsuper`,
        )
      ).rows,
    ).toEqual([]);
    const roles = (
      await fixture.runtime.query(
        `select rolname from pg_roles where rolname<>current_user and (rolsuper or rolbypassrls or rolcreaterole or rolcreatedb)`,
      )
    ).rows;
    for (const { rolname } of roles)
      expect(
        (
          await fixture.runtime.query(
            `select pg_has_role(current_user,$1,'SET') as allowed`,
            [rolname],
          )
        ).rows[0].allowed,
      ).toBe(false);
  });

  it.each(['commit', 'rollback', 'exception'])(
    'pool não conserva tenant após %s na mesma conexão física',
    async (mode) => {
      const before = (
        await fixture.runtime.query('select pg_backend_pid() as pid')
      ).rows[0].pid;
      const operation = withTenant(fixture.database, A, async (tx) => {
        expect(
          (await tx.execute(sql`select id from processing_activities`)).rows,
        ).toEqual([{ id: PA_A }]);
        if (mode === 'rollback') await tx.execute(sql`select 1/0`);
        if (mode === 'exception') throw new Error('falha simulada');
      });
      if (mode === 'commit') await operation;
      else await expect(operation).rejects.toThrow();
      const after = (
        await fixture.runtime.query(
          "select pg_backend_pid() as pid,nullif(current_setting('lgpd.organization_id',true),'') as tenant",
        )
      ).rows[0];
      expect(after).toEqual({ pid: before, tenant: null });
      expect(
        (await fixture.runtime.query('select id from processing_activities'))
          .rows,
      ).toEqual([]);
      expect((await read(B)).rows).toEqual([{ id: PA_B }]);
    },
  );

  it('instala cinco migrations e reaplica sem duplicar journal, tabela, índice ou policy', async () => {
    expect(fixture.concurrency.journalEntries).toBe(5);
    expect(fixture.concurrency.waitingExecutors).toBe(2);
    expect(fixture.concurrency.protectedExecutors).toBe(1);
    const before = (
      await fixture.migration.query(
        'select id,hash,created_at from __drizzle_migrations order by created_at',
      )
    ).rows;
    expect(
      before.map(({ hash, created_at }) => ({ hash, created_at })),
    ).toEqual(await history());
    await applyMigrations(fixture.migration, fixture.runtimeRole);
    expect(
      (
        await fixture.migration.query(
          'select id,hash,created_at from __drizzle_migrations order by created_at',
        )
      ).rows,
    ).toEqual(before);
    expect(
      (
        await fixture.migration.query(
          `select policyname from pg_policies where tablename='processing_activities' and schemaname='public'`,
        )
      ).rows,
    ).toHaveLength(1);
    expect(
      (
        await fixture.migration.query(
          `select indexname from pg_indexes where tablename='processing_activities' and schemaname='public'`,
        )
      ).rows,
    ).toHaveLength(2);
  });

  it('atualiza banco real 0000–0003 pelo runner concorrente preservando histórico e policies anteriores', async () => {
    const temporary = await mkdtemp(join(tmpdir(), 'lgpd-p1-migrations-'));
    let upgraded: Awaited<ReturnType<typeof createTestDatabase>> | undefined;
    let previous: unknown[] = [];
    try {
      await mkdir(join(temporary, 'meta'));
      const journal = JSON.parse(
        await readFile(join(folder, 'meta/_journal.json'), 'utf8'),
      );
      expect(
        journal.entries.map((entry: { tag: string; when: number }) => [
          entry.tag,
          String(entry.when),
        ]),
      ).toEqual(names.map((name, i) => [name, times[i]]));
      await writeFile(
        join(temporary, 'meta/_journal.json'),
        JSON.stringify({ ...journal, entries: journal.entries.slice(0, 4) }),
      );
      for (const name of names.slice(0, 4))
        await copyFile(
          join(folder, `${name}.sql`),
          join(temporary, `${name}.sql`),
        );
      upgraded = await createTestDatabase(
        async ({ migration, runtimeRole }) => {
          const client = await migration.connect();
          try {
            await client.query(
              "select set_config('lgpd.migration_runtime_role',$1,false)",
              [runtimeRole],
            );
            await migrate(drizzle(client), {
              migrationsFolder: temporary,
              migrationsSchema: 'public',
              migrationsTable: '__drizzle_migrations',
            });
          } finally {
            client.release(true);
          }
          previous = (
            await migration.query(
              'select id,hash,created_at from __drizzle_migrations order by created_at',
            )
          ).rows;
          expect(previous).toHaveLength(4);
          expect(
            (
              await migration.query(
                "select to_regclass('public.processing_activities') as activity",
              )
            ).rows[0].activity,
          ).toBeNull();
          await expect(
            applyMigrations(
              migration,
              `missing_${randomUUID().replaceAll('-', '')}`,
            ),
          ).rejects.toThrow();
          expect(
            (
              await migration.query(
                'select id,hash,created_at from __drizzle_migrations order by created_at',
              )
            ).rows,
          ).toEqual(previous);
          expect(
            (
              await migration.query(
                "select to_regclass('public.processing_activities') as activity",
              )
            ).rows[0].activity,
          ).toBeNull();
        },
        4,
      );
      const after = (
        await upgraded.migration.query(
          'select id,hash,created_at from __drizzle_migrations order by created_at',
        )
      ).rows;
      expect(after.slice(0, 4)).toEqual(previous);
      expect(
        after.map(({ hash, created_at }) => ({ hash, created_at })),
      ).toEqual(await history());
      expect(upgraded.concurrency.policiesPreserved).toBe(true);
      expect(upgraded.concurrency.waitingExecutors).toBe(2);
      expect(upgraded.concurrency.protectedExecutors).toBe(1);
      expect(
        (
          await upgraded.runtime.query(
            `select has_column_privilege(current_user,'public.processing_activities','name','SELECT') as readable,has_column_privilege(current_user,'public.processing_activities','name','UPDATE') as writable`,
          )
        ).rows[0],
      ).toEqual({ readable: true, writable: false });
    } finally {
      if (upgraded) await upgraded.close();
      await rm(temporary, { recursive: true, force: true });
    }
  });
});
