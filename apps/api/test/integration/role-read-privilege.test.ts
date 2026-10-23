import { createHash, randomUUID } from 'node:crypto';
import {
  mkdtemp,
  mkdir,
  readFile,
  writeFile,
  copyFile,
  rm,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { applyMigrations } from '../../src/persistence/migrate.js';
import { createTestDatabase, ROLE } from './database.js';

const migrationFolder = fileURLToPath(
  new URL('../../drizzle/migrations', import.meta.url),
);
const migrationNames = [
  '0000_identity_tenant',
  '0001_tenant_rls',
  '0002_auth_persistence',
  '0003_role_read_privilege',
];
const migrationTimes = [
  '1789754035408',
  '1789754043586',
  '1790249267053',
  '1792761082815',
];
let fixture: Awaited<ReturnType<typeof createTestDatabase>>;

async function expectedHistory() {
  return Promise.all(
    migrationNames.map(async (name, index) => ({
      hash: createHash('sha256')
        .update(await readFile(join(migrationFolder, `${name}.sql`)))
        .digest('hex'),
      created_at: migrationTimes[index],
    })),
  );
}

beforeAll(async () => {
  fixture = await createTestDatabase();
});
beforeEach(async () => {
  await fixture.reset();
});
afterAll(async () => {
  if (fixture) await fixture.close();
});

describe('S3.5.2 — privilégio mínimo de Role', () => {
  it.each(['id', 'code', 'id, code'])(
    'runtime pode selecionar %s',
    async (columns) => {
      const result = await fixture.runtime.query(
        `select ${columns} from public.roles`,
      );
      expect(result.rows).toHaveLength(1);
      if (columns.includes('id')) expect(result.rows[0]?.id).toBe(ROLE);
      if (columns.includes('code'))
        expect(result.rows[0]?.code).toBe('MANAGER');
    },
  );

  it.each(['created_at', 'updated_at', 'id, created_at', '*'])(
    'runtime não pode selecionar %s',
    async (columns) => {
      await expect(
        fixture.runtime.query(`select ${columns} from public.roles`),
      ).rejects.toMatchObject({ code: '42501' });
    },
  );

  it.each([
    ["insert into public.roles (id,code) values ($1,'NEW_TEST_ROLE')", true],
    ["update public.roles set code='CHANGED_TEST_ROLE' where id=$1", true],
    ['delete from public.roles where id=$1', true],
    ['truncate public.roles', false],
  ] as const)(
    'nega escrita com SQLSTATE de privilégio: %s',
    async (query, parameter) => {
      // A fresh UUID avoids a PK conflict; updates/deletes target an existing row.
      const value = query.startsWith('insert') ? randomUUID() : ROLE;
      await expect(
        fixture.runtime.query(query, parameter ? [value] : []),
      ).rejects.toMatchObject({ code: '42501' });
      expect(
        (await fixture.migration.query('select id,code from public.roles'))
          .rows,
      ).toEqual([{ id: ROLE, code: 'MANAGER' }]);
    },
  );

  it('concede somente privilégios efetivos por coluna, sem grant option, PUBLIC ou herança excessiva', async () => {
    const columns = await fixture.runtime.query(`select attname,
      has_column_privilege(current_user,'public.roles',attname,'SELECT') as readable,
      has_column_privilege(current_user,'public.roles',attname,'SELECT WITH GRANT OPTION') as grantable,
      has_column_privilege(current_user,'public.roles',attname,'INSERT') as insertable,
      has_column_privilege(current_user,'public.roles',attname,'UPDATE') as updatable
      from pg_attribute where attrelid='public.roles'::regclass and attnum>0 and not attisdropped
      order by attname`);
    expect(columns.rows).toEqual([
      {
        attname: 'code',
        readable: true,
        grantable: false,
        insertable: false,
        updatable: false,
      },
      {
        attname: 'created_at',
        readable: false,
        grantable: false,
        insertable: false,
        updatable: false,
      },
      {
        attname: 'id',
        readable: true,
        grantable: false,
        insertable: false,
        updatable: false,
      },
      {
        attname: 'updated_at',
        readable: false,
        grantable: false,
        insertable: false,
        updatable: false,
      },
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
            "select has_table_privilege(current_user,'public.roles',$1) as allowed",
            [privilege],
          )
        ).rows[0]?.allowed,
      ).toBe(false);
    }
    const publicAcl = await fixture.migration
      .query(`select privilege_type from (
      select acl.grantee, acl.privilege_type from pg_class c,
        lateral aclexplode(coalesce(c.relacl,acldefault('r',c.relowner))) acl
        where c.oid='public.roles'::regclass
      union all
      select acl.grantee, acl.privilege_type from pg_attribute a,
        lateral aclexplode(a.attacl) acl where a.attrelid='public.roles'::regclass
      ) privileges where grantee=0`);
    expect(publicAcl.rows).toEqual([]);
    // Check both directions: inherited sources and roles that could inherit runtime.
    const memberships = await fixture.runtime
      .query(`select rolname from pg_roles
      where rolname <> current_user and (
        pg_has_role(current_user,oid,'MEMBER') or pg_has_role(oid,current_user,'MEMBER'))
      and not rolsuper`);
    expect(memberships.rows).toEqual([]);
  });

  it('não possui ownership, atributos administrativos ou capacidade de assumir roles privilegiadas', async () => {
    expect(
      (
        await fixture.runtime
          .query(`select rolsuper,rolbypassrls,rolcreatedb,rolcreaterole,rolinherit,
      has_database_privilege(current_user,current_database(),'CREATE') as db_create,
      has_schema_privilege(current_user,'public','CREATE') as schema_create
      from pg_roles where rolname=current_user`)
      ).rows[0],
    ).toEqual({
      rolsuper: false,
      rolbypassrls: false,
      rolcreatedb: false,
      rolcreaterole: false,
      rolinherit: false,
      db_create: false,
      schema_create: false,
    });
    const owner = (
      await fixture.migration.query<{ owner: string }>(
        "select pg_get_userbyid(relowner) as owner from pg_class where oid='public.roles'::regclass",
      )
    ).rows[0]?.owner;
    expect(owner).toBe(fixture.migrationRole);
    const privileged = await fixture.runtime.query<{
      rolname: string;
      can_set: boolean;
    }>(
      `select rolname,pg_has_role(current_user,oid,'SET') as can_set from pg_roles
       where rolsuper or rolbypassrls or rolcreaterole or rolcreatedb
         or rolname=any($1)`,
      [
        [
          fixture.migrationRole,
          'lgpd_auth_persistence',
          'lgpd_membership_bootstrap',
        ],
      ],
    );
    expect(privileged.rows.length).toBeGreaterThan(0);
    for (const role of privileged.rows) {
      expect(role.can_set).toBe(false);
      const quoted = '"' + role.rolname.replaceAll('"', '""') + '"';
      await expect(
        fixture.runtime.query(`set role ${quoted}`),
      ).rejects.toMatchObject({ code: '42501' });
    }
  });

  it('runtime não consegue repassar leitura ao bootstrap', async () => {
    const client = await fixture.runtime.connect();
    try {
      await client.query('BEGIN');
      // PostgreSQL may warn rather than throw for a GRANT without grant option.
      await client.query(
        'grant select (id,code) on public.roles to lgpd_membership_bootstrap',
      );
      expect(
        (
          await client.query(`select
        has_column_privilege('lgpd_membership_bootstrap','public.roles','id','SELECT') as id,
        has_column_privilege('lgpd_membership_bootstrap','public.roles','code','SELECT') as code`)
        ).rows[0],
      ).toEqual({ id: false, code: false });
    } finally {
      await client.query('ROLLBACK');
      client.release();
    }
  });

  it('banco vazio recebe quatro migrations com ordem, timestamps e hashes exatos, sem duplicação', async () => {
    const history = await fixture.migration.query(
      'select id,hash,created_at from public.__drizzle_migrations order by created_at',
    );
    expect(
      history.rows.map(({ hash, created_at }) => ({ hash, created_at })),
    ).toEqual(await expectedHistory());
    expect(fixture.concurrency.waitingExecutors).toBe(2);
    expect(fixture.concurrency.protectedExecutors).toBe(1);
    await applyMigrations(fixture.migration, fixture.runtimeRole);
    expect(
      (
        await fixture.migration.query(
          'select id,hash,created_at from public.__drizzle_migrations order by created_at',
        )
      ).rows,
    ).toEqual(history.rows);
  });

  it('usa role configurável e falha fechado para setting/roles inadequados sem alterar o journal', async () => {
    const sql = await readFile(
      join(migrationFolder, '0003_role_read_privilege.sql'),
      'utf8',
    );
    const alternate = `lgpd_test_role_${randomUUID().replaceAll('-', '')}`;
    const quoted = '"' + alternate + '"';
    await fixture.preparation.query(
      `create role ${quoted} login nosuperuser nobypassrls nocreatedb nocreaterole noinherit`,
    );
    try {
      const client = await fixture.migration.connect();
      try {
        for (const runtimeRole of [
          '',
          `missing_${randomUUID().replaceAll('-', '')}`,
          fixture.migrationRole,
          'lgpd_membership_bootstrap',
        ]) {
          await client.query('BEGIN');
          try {
            await client.query(
              "select set_config('lgpd.migration_runtime_role',$1,true)",
              [runtimeRole],
            );
            await expect(client.query(sql)).rejects.toMatchObject({
              code: 'P0001',
            });
          } finally {
            await client.query('ROLLBACK');
          }
        }
        await client.query('BEGIN');
        try {
          await client.query(
            "select set_config('lgpd.migration_runtime_role',$1,true)",
            [alternate],
          );
          await client.query(sql);
          expect(
            (
              await client.query(
                `select
            has_column_privilege($1,'public.roles','id','SELECT') as id,
            has_column_privilege($1,'public.roles','code','SELECT') as code,
            has_column_privilege($1,'public.roles','created_at','SELECT') as created,
            has_table_privilege($1,'public.roles','SELECT') as whole_table`,
                [alternate],
              )
            ).rows[0],
          ).toEqual({
            id: true,
            code: true,
            created: false,
            whole_table: false,
          });
        } finally {
          await client.query('ROLLBACK');
        }
      } finally {
        client.release();
      }
    } finally {
      await fixture.preparation.query(`drop role ${quoted}`);
    }
    expect(
      (
        await fixture.migration.query(
          'select hash,created_at from public.__drizzle_migrations order by created_at',
        )
      ).rows,
    ).toEqual(await expectedHistory());
  });

  it('atualiza histórico real 0000–0002 pelo runner concorrente sem mudar hashes anteriores ou RLS', async () => {
    const folder = await mkdtemp(join(tmpdir(), 'lgpd-migrations-'));
    let upgraded: Awaited<ReturnType<typeof createTestDatabase>> | undefined;
    let previous: unknown[] = [];
    const savedRole = randomUUID();
    try {
      await mkdir(join(folder, 'meta'));
      const journal: unknown = JSON.parse(
        await readFile(join(migrationFolder, 'meta/_journal.json'), 'utf8'),
      );
      if (
        typeof journal !== 'object' ||
        journal === null ||
        !('entries' in journal) ||
        !Array.isArray(journal.entries)
      )
        throw new Error('Journal oficial inválido.');
      expect(journal.entries).toEqual(
        migrationNames.map((tag, idx) => ({
          idx,
          version: '7',
          when: Number(migrationTimes[idx]),
          tag,
          breakpoints: true,
        })),
      );
      const previousJournal = {
        ...journal,
        entries: journal.entries.slice(0, 3),
      };
      await writeFile(
        join(folder, 'meta/_journal.json'),
        JSON.stringify(previousJournal),
      );
      for (const name of migrationNames.slice(0, 3))
        await copyFile(
          join(migrationFolder, `${name}.sql`),
          join(folder, `${name}.sql`),
        );
      upgraded = await createTestDatabase(
        async ({ migration, runtime, runtimeRole }) => {
          const client = await migration.connect();
          try {
            await client.query(
              "select set_config('lgpd.migration_runtime_role',$1,false)",
              [runtimeRole],
            );
            await migrate(drizzle(client), {
              migrationsFolder: folder,
              migrationsSchema: 'public',
              migrationsTable: '__drizzle_migrations',
            });
          } finally {
            client.release(true);
          }
          const previousRows = (
            await migration.query(
              'select id,hash,created_at from public.__drizzle_migrations order by created_at',
            )
          ).rows;
          previous = previousRows;
          expect(
            previousRows.map(({ hash, created_at }) => ({ hash, created_at })),
          ).toEqual((await expectedHistory()).slice(0, 3));
          expect(
            (
              await runtime.query(
                "select has_column_privilege(current_user,'public.roles','id','SELECT') as allowed",
              )
            ).rows[0]?.allowed,
          ).toBe(false);
          await migration.query(
            "insert into roles(id,code) values($1,'UPGRADE_TEST')",
            [savedRole],
          );
          await expect(
            applyMigrations(
              migration,
              `missing_${randomUUID().replaceAll('-', '')}`,
            ),
          ).rejects.toThrow();
          // The official migrator without the runner setting must also fail closed.
          const withoutSetting = await migration.connect();
          try {
            await withoutSetting.query('RESET lgpd.migration_runtime_role');
            await expect(
              migrate(drizzle(withoutSetting), {
                migrationsFolder: migrationFolder,
                migrationsSchema: 'public',
                migrationsTable: '__drizzle_migrations',
              }),
            ).rejects.toThrow();
          } finally {
            withoutSetting.release(true);
          }
          expect(
            (
              await migration.query(
                'select id,hash,created_at from public.__drizzle_migrations order by created_at',
              )
            ).rows,
          ).toEqual(previous);
        },
      );
      const history = (
        await upgraded.migration.query(
          'select id,hash,created_at from public.__drizzle_migrations order by created_at',
        )
      ).rows;
      expect(history.slice(0, 3)).toEqual(previous);
      expect(
        history.map(({ hash, created_at }) => ({ hash, created_at })),
      ).toEqual(await expectedHistory());
      expect(
        (await upgraded.runtime.query('select id,code from roles')).rows,
      ).toEqual([{ id: savedRole, code: 'UPGRADE_TEST' }]);
      expect(upgraded.concurrency.policiesPreserved).toBe(true);
      expect(upgraded.concurrency.waitingExecutors).toBe(2);
      expect(upgraded.concurrency.protectedExecutors).toBe(1);
    } finally {
      if (upgraded) await upgraded.close();
      await rm(folder, { recursive: true, force: true });
    }
  });
});
