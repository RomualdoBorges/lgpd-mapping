import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import 'reflect-metadata';
import { Module } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { databaseConfiguration } from '../../src/config/environment.js';
import { withTenant } from '../../src/persistence/tenant-transaction.js';
import { applyMigrations } from '../../src/persistence/migrate.js';
import {
  createSession,
  findExternalIdentityByIssuerAndSubject,
  findSessionByTokenDigest,
  revokeSession,
} from '../../src/persistence/auth-repositories.js';
import {
  createTestDatabase,
  A,
  B,
  U,
  BU_A,
  BU_B,
  M_A,
  M_B,
  ROLE,
  GRANT_A,
} from './database.js';

let fixture: Awaited<ReturnType<typeof createTestDatabase>>;
const tenantTables = [
  'organizations',
  'business_units',
  'memberships',
  'role_assignments',
  'role_assignment_business_units',
];
const pgError = (code: string) => ({
  cause: expect.objectContaining({ code }),
});
const tenant = <T>(
  id: string,
  operation: Parameters<typeof withTenant<T>>[2],
) => withTenant(fixture.database, id, operation);

beforeAll(async () => {
  fixture = await createTestDatabase();
});
beforeEach(async () => {
  await fixture.reset();
});
afterAll(async () => {
  if (fixture) await fixture.close();
});

describe('PostgreSQL real: isolamento, integridade e ciclo de conexão', () => {
  it('bootstrap vazio serializa dois processos Node independentes no runner real', () => {
    expect(fixture.concurrency.processIds[0]).not.toBe(
      fixture.concurrency.processIds[1],
    );
    expect(fixture.concurrency.waitingExecutors).toBe(2);
    expect(fixture.concurrency.protectedExecutors).toBe(1);
    expect(fixture.concurrency.journalEntries).toBe(3);
  });
  it('falha após adquirir lock encerra sessão e permite outro migrator', async () => {
    const applicationName = `lgpd_failed_migration_${randomUUID()}`;
    const pool = new pg.Pool({
      application_name: applicationName,
      ...databaseConfiguration(process.env, 'MIGRATION'),
      database: fixture.name,
      options: '-c default_transaction_read_only=on',
    });
    try {
      await expect(
        applyMigrations(pool, fixture.runtimeRole),
      ).rejects.toMatchObject(pgError('25006'));
      expect(pool.totalCount).toBe(0);
      await applyMigrations(fixture.migration, fixture.runtimeRole);
      expect(
        (
          await fixture.migration.query(
            'select pid from pg_stat_activity where application_name=$1',
            [applicationName],
          )
        ).rows,
      ).toHaveLength(0);
      const client = await fixture.migration.connect();
      try {
        expect(
          (
            await client.query(
              "select pg_try_advisory_lock(hashtext('lgpd:structural-migrations')) as acquired",
            )
          ).rows[0]?.acquired,
        ).toBe(true);
      } finally {
        client.release(true);
      }
    } finally {
      await pool.end();
    }
  });
  it('01 — tenant A não lê registros de B em nenhuma tabela tenant-bound', async () => {
    for (const table of tenantTables) {
      const key = table === 'organizations' ? 'id' : 'organization_id';
      const result = await tenant(A, (tx) =>
        tx.execute(
          sql`select * from ${sql.identifier(table)} where ${sql.identifier(key)} = ${B}`,
        ),
      );
      expect(result.rows).toHaveLength(0);
    }
  });
  it('02 — tenant A atualiza BusinessUnit própria e não atualiza BusinessUnit de B', async () => {
    const ownId = randomUUID();
    await tenant(A, (tx) =>
      tx.execute(
        sql`insert into business_units (id,organization_id,name) values (${ownId},${A},'controle update')`,
      ),
    );
    const positive = await tenant(A, (tx) =>
      tx.execute(
        sql`update business_units set name='atualizado em A' where id=${ownId} returning id,name`,
      ),
    );
    expect(positive.rows).toEqual([{ id: ownId, name: 'atualizado em A' }]);
    expect(
      (
        await tenant(A, (tx) =>
          tx.execute(sql`select name from business_units where id=${ownId}`),
        )
      ).rows,
    ).toEqual([{ name: 'atualizado em A' }]);
    const result = await tenant(A, (tx) =>
      tx.execute(
        sql`update business_units set name = 'alterado' where id = ${BU_B} returning id`,
      ),
    );
    expect(result.rows).toHaveLength(0);
    const actual = await tenant(B, (tx) =>
      tx.execute<{ name: string }>(
        sql`select name from business_units where id = ${BU_B}`,
      ),
    );
    expect(actual.rows[0]?.name).toBe('Área fictícia');
  });
  it('03 — tenant A exclui BusinessUnit própria e não exclui BusinessUnit de B', async () => {
    const ownId = randomUUID();
    await tenant(A, (tx) =>
      tx.execute(
        sql`insert into business_units (id,organization_id,name) values (${ownId},${A},'controle delete')`,
      ),
    );
    expect(
      (
        await tenant(A, (tx) =>
          tx.execute(
            sql`delete from business_units where id=${ownId} returning id`,
          ),
        )
      ).rows,
    ).toEqual([{ id: ownId }]);
    expect(
      (
        await tenant(A, (tx) =>
          tx.execute(sql`select id from business_units where id=${ownId}`),
        )
      ).rows,
    ).toHaveLength(0);
    const result = await tenant(A, (tx) =>
      tx.execute(
        sql`delete from business_units where id = ${BU_B} returning id`,
      ),
    );
    expect(result.rows).toHaveLength(0);
    expect(
      (
        await tenant(B, (tx) =>
          tx.execute(sql`select id from business_units where id = ${BU_B}`),
        )
      ).rows,
    ).toHaveLength(1);
  });
  it('04 — PostgreSQL rejeita RoleAssignment ligado a Membership de outro tenant', async () => {
    await expect(
      tenant(A, (tx) =>
        tx.execute(
          sql`insert into role_assignments (organization_id,membership_id,role_id,scope) values (${A},${M_B},${ROLE},'ORGANIZATION')`,
        ),
      ),
    ).rejects.toMatchObject(pgError('23503'));
  });
  it('05 — consultas sem filtro explícito permanecem restritas pelo RLS', async () => {
    for (const table of tenantTables) {
      const key = table === 'organizations' ? 'id' : 'organization_id';
      const result = await tenant(A, (tx) =>
        tx.execute<Record<string, string>>(
          sql`select * from ${sql.identifier(table)}`,
        ),
      );
      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows.every((row) => row[key] === A)).toBe(true);
    }
  });
  it('06 — contexto ausente não permite leitura nem escrita tenant-bound', async () => {
    for (const table of tenantTables)
      expect(
        (await fixture.runtime.query(`select * from ${table}`)).rows,
      ).toHaveLength(0);
    await expect(
      fixture.runtime.query(
        'insert into business_units (organization_id,name) values ($1,$2)',
        [A, 'negado'],
      ),
    ).rejects.toMatchObject({ code: '42501' });
  });
  it('07 — conexão física do pool é reutilizada sem vazar tenant anterior', async () => {
    const first = await tenant(A, (tx) =>
      tx.execute<{ pid: number }>(sql`select pg_backend_pid() as pid`),
    );
    const second = await tenant(B, (tx) =>
      tx.execute<{ pid: number; organization_id: string }>(
        sql`select pg_backend_pid() as pid, organization_id from business_units`,
      ),
    );
    expect(second.rows[0]?.pid).toBe(first.rows[0]?.pid);
    expect(second.rows.map((row) => row.organization_id)).toEqual([B]);
    const noContext = await fixture.runtime.query<{
      pid: number;
      context: string | null;
    }>(
      "select pg_backend_pid() as pid, nullif(current_setting('lgpd.organization_id',true),'') as context",
    );
    expect(noContext.rows[0]?.pid).toBe(first.rows[0]?.pid);
    expect(noContext.rows[0]?.context).toBeNull();
    expect(
      (await fixture.runtime.query('select * from business_units')).rows,
    ).toHaveLength(0);
  });
  it('08 — commit e rollback reais preservam atomicidade sem contexto residual', async () => {
    const committedId = randomUUID();
    const rolledBackId = randomUUID();
    const committed = await tenant(A, async (tx) => {
      await tx.execute(
        sql`insert into business_units (id,organization_id,name) values (${committedId},${A},'commit')`,
      );
      return tx.execute<{ pid: number }>(sql`select pg_backend_pid() as pid`);
    });
    const afterCommit = await fixture.runtime.query<{
      pid: number;
      context: string | null;
    }>(
      "select pg_backend_pid() as pid, nullif(current_setting('lgpd.organization_id',true),'') as context",
    );
    expect(afterCommit.rows[0]).toEqual({
      pid: committed.rows[0]?.pid,
      context: null,
    });
    let rollbackPid: number | undefined;
    await expect(
      tenant(A, async (tx) => {
        rollbackPid = (
          await tx.execute<{ pid: number }>(sql`select pg_backend_pid() as pid`)
        ).rows[0]?.pid;
        await tx.execute(
          sql`insert into business_units (id,organization_id,name) values (${rolledBackId},${A},'rollback')`,
        );
        throw new Error('rollback intencional');
      }),
    ).rejects.toThrow('rollback intencional');
    const afterRollback = await fixture.runtime.query<{
      pid: number;
      context: string | null;
    }>(
      "select pg_backend_pid() as pid, nullif(current_setting('lgpd.organization_id',true),'') as context",
    );
    expect(afterRollback.rows[0]).toEqual({ pid: rollbackPid, context: null });
    expect(rollbackPid).toBe(committed.rows[0]?.pid);
    const actual = await tenant(A, (tx) =>
      tx.execute<{ id: string }>(
        sql`select id from business_units where id in (${committedId},${rolledBackId})`,
      ),
    );
    expect(actual.rows).toEqual([{ id: committedId }]);
    expect(
      (await fixture.runtime.query('select * from business_units')).rows,
    ).toHaveLength(0);
  });
  it('09 — runtime restrito não possui propriedade ou capacidade de bypass/alteração', async () => {
    const role = await fixture.runtime.query(
      'select rolsuper,rolbypassrls,rolcreaterole,rolcreatedb from pg_roles where rolname=current_user',
    );
    expect(role.rows[0]).toEqual({
      rolsuper: false,
      rolbypassrls: false,
      rolcreaterole: false,
      rolcreatedb: false,
    });
    const policies = await fixture.runtime.query(
      "select c.relname,c.relrowsecurity,c.relforcerowsecurity,pg_get_userbyid(c.relowner) as owner from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname=any($1)",
      [tenantTables],
    );
    expect(policies.rows).toHaveLength(5);
    for (const row of policies.rows) {
      expect(row.relrowsecurity).toBe(true);
      expect(row.relforcerowsecurity).toBe(true);
      expect(row.owner).not.toBe(fixture.runtimeRole);
      const privilege = await fixture.runtime.query(
        "select pg_has_role(current_user,$1,'SET') as can_assume",
        [row.owner],
      );
      expect(privilege.rows[0]?.can_assume).toBe(false);
    }
    await expect(
      fixture.runtime.query(
        'alter table business_units disable row level security',
      ),
    ).rejects.toMatchObject({ code: '42501' });
    await expect(
      fixture.runtime.query('alter role ' + fixture.runtimeRole + ' bypassrls'),
    ).rejects.toMatchObject({ code: '42501' });
    await expect(
      fixture.runtime.query('drop policy tenant_isolation on business_units'),
    ).rejects.toMatchObject({ code: '42501' });
    await expect(
      tenant(A, async (tx) => {
        await tx.execute(sql`set local row_security = off`);
        await tx.execute(sql`select * from business_units`);
      }),
    ).rejects.toMatchObject(pgError('42501'));
    await expect(
      fixture.runtime.query('truncate business_units cascade'),
    ).rejects.toMatchObject({ code: '42501' });
  });
  it('10 — FK composta rejeita associação cross-tenant por SQL direto, sem validação da aplicação', async () => {
    await expect(
      tenant(A, (tx) =>
        tx.execute(
          sql`insert into role_assignment_business_units (organization_id,role_assignment_id,business_unit_id) values (${A},${GRANT_A},${BU_B})`,
        ),
      ),
    ).rejects.toMatchObject(pgError('23503'));
  });
  it('migrations reais aplicam em banco vazio e reaplicação não duplica schema', async () => {
    const privilege = await fixture.migration.query(
      "select has_database_privilege(current_user,current_database(),'CREATE') as can_create_schema",
    );
    expect(privilege.rows[0]?.can_create_schema).toBe(true);
    await applyMigrations(fixture.migration, fixture.runtimeRole);
    const tables = await fixture.migration.query(
      "select table_name from information_schema.tables where table_schema='public' and table_type='BASE TABLE'",
    );
    expect(tables.rows.map((row) => row.table_name).sort()).toEqual(
      [
        ...tenantTables,
        'users',
        'roles',
        'external_identities',
        'sessions',
        '__drizzle_migrations',
      ].sort(),
    );
    expect(
      (
        await fixture.migration.query(
          'select * from public.__drizzle_migrations',
        )
      ).rows,
    ).toHaveLength(3);
  });
  it('User global possui dois Memberships independentes e não recebe organization_id/RLS', async () => {
    const user = await fixture.migration.query(
      'select id from users where id=$1',
      [U],
    );
    expect(user.rows).toEqual([{ id: U }]);
    const columns = await fixture.migration.query(
      "select column_name from information_schema.columns where table_name='users' and table_schema='public'",
    );
    expect(columns.rows.map((row) => row.column_name)).not.toContain(
      'organization_id',
    );
    expect(
      (
        await fixture.migration.query(
          "select relrowsecurity from pg_class where oid='public.users'::regclass",
        )
      ).rows[0].relrowsecurity,
    ).toBe(false);
    await expect(
      fixture.runtime.query('select * from users'),
    ).rejects.toMatchObject({ code: '42501' });
    await tenant(A, (tx) =>
      tx.execute(sql`update memberships set active=false where id=${M_A}`),
    );
    expect(
      (
        await tenant(B, (tx) =>
          tx.execute(
            sql`select * from memberships where id=${M_B} and active=true`,
          ),
        )
      ).rows,
    ).toHaveLength(1);
    await expect(
      tenant(A, (tx) =>
        tx.execute(
          sql`insert into memberships (organization_id,user_id,active) values (${A},${U},true)`,
        ),
      ),
    ).rejects.toMatchObject(pgError('23505'));
  });
  it('BusinessUnit exige uma Organization válida e contexto não permite transferência', async () => {
    const column = await fixture.migration.query(
      "select is_nullable from information_schema.columns where table_schema='public' and table_name='business_units' and column_name='organization_id'",
    );
    expect(column.rows[0]?.is_nullable).toBe('NO');
    // RLS WITH CHECK rejects NULL before NOT NULL validation on runtime writes.
    await expect(
      tenant(A, (tx) =>
        tx.execute(
          sql`insert into business_units (organization_id,name) values (null,'inválido')`,
        ),
      ),
    ).rejects.toMatchObject(pgError('42501'));
    await expect(
      tenant(A, (tx) =>
        tx.execute(
          sql`update business_units set organization_id=${B} where id=${BU_A}`,
        ),
      ),
    ).rejects.toMatchObject(pgError('42501'));
  });
  it('RoleAssignments preservam scopes individuais e múltiplas áreas explícitas', async () => {
    const secondArea = randomUUID();
    const orgGrant = randomUUID();
    await tenant(A, async (tx) => {
      await tx.execute(
        sql`insert into business_units (id,organization_id,name) values (${secondArea},${A},'Outra área')`,
      );
      await tx.execute(
        sql`insert into role_assignment_business_units (organization_id,role_assignment_id,business_unit_id) values (${A},${GRANT_A},${secondArea})`,
      );
      await tx.execute(
        sql`insert into role_assignments (id,organization_id,membership_id,role_id,scope) values (${orgGrant},${A},${M_A},${ROLE},'ORGANIZATION')`,
      );
    });
    const assignments = await tenant(A, (tx) =>
      tx.execute(
        sql`select * from role_assignments where membership_id=${M_A}`,
      ),
    );
    expect(assignments.rows).toHaveLength(2);
    expect(
      (
        await tenant(A, (tx) =>
          tx.execute(
            sql`select * from role_assignment_business_units where role_assignment_id=${GRANT_A}`,
          ),
        )
      ).rows,
    ).toHaveLength(2);
    await expect(
      tenant(A, (tx) =>
        tx.execute(
          sql`insert into role_assignment_business_units (organization_id,role_assignment_id,business_unit_id) values (${A},${orgGrant},${BU_A})`,
        ),
      ),
    ).rejects.toMatchObject(pgError('23503'));
    for (const scope of ['OWN', 'PLATFORM'])
      await expect(
        tenant(A, (tx) =>
          tx.execute(
            sql`insert into role_assignments (organization_id,membership_id,role_id,scope) values (${A},${M_A},${ROLE},${scope})`,
          ),
        ),
      ).rejects.toMatchObject(pgError('23514'));
  });
  it('NestJS resolve DI e executa boundary compilado com metadata TypeScript real', async () => {
    // tsc preserves decorator metadata; Vitest need not emulate the Nest transformer.
    const { DatabaseService } = await import(
      new URL('../../dist/persistence/database.service.js', import.meta.url)
        .href
    );
    const { ENVIRONMENT } = await import(
      new URL('../../dist/config/environment.js', import.meta.url).href
    );
    const config = await import('../../src/config/environment.js');
    class PersistenceTestModule {}
    Module({
      providers: [
        DatabaseService,
        {
          provide: ENVIRONMENT,
          useValue: {
            host: '127.0.0.1',
            port: 3000,
            database: {
              ...config.databaseConfiguration(process.env, 'RUNTIME'),
              database: fixture.name,
            },
          },
        },
      ],
    })(PersistenceTestModule);
    const app = await NestFactory.createApplicationContext(
      PersistenceTestModule,
      { logger: false },
    );
    try {
      const service = app.get(DatabaseService);
      const result = await service.withTenant(
        A,
        async (tx: Parameters<Parameters<typeof withTenant>[2]>[0]) =>
          tx.execute(sql`select id from business_units`),
      );
      expect(result.rows).toHaveLength(1);
    } finally {
      await app.close();
    }
  });

  it('journal oficial em public registra cada migration uma vez após bootstrap concorrente', async () => {
    const entries = await fixture.migration.query<{
      id: number;
      hash: string;
      created_at: string;
    }>(
      'select id,hash,created_at from public.__drizzle_migrations order by created_at',
    );
    expect(entries.rows).toHaveLength(3);
    expect(new Set(entries.rows.map((row) => row.created_at)).size).toBe(3);
    for (const row of entries.rows) expect(row.hash).toMatch(/^[0-9a-f]{64}$/);
    const table = await fixture.migration.query(
      "select to_regclass('public.__drizzle_migrations') as journal, to_regclass('drizzle.__drizzle_migrations') as other_journal",
    );
    expect(table.rows[0]).toEqual({
      journal: '__drizzle_migrations',
      other_journal: null,
    });
    const columns = await fixture.migration.query(
      "select is_nullable from information_schema.columns where table_schema='public' and table_name='__drizzle_migrations' and column_name='created_at'",
    );
    expect(columns.rows[0]?.is_nullable).toBe('YES');
    await Promise.all([
      applyMigrations(fixture.migration, fixture.runtimeRole),
      applyMigrations(fixture.migration, fixture.runtimeRole),
    ]);
    expect(
      (
        await fixture.migration.query(
          'select id,hash,created_at from public.__drizzle_migrations order by created_at',
        )
      ).rows,
    ).toEqual(entries.rows);
    await expect(
      fixture.runtime.query('select * from public.__drizzle_migrations'),
    ).rejects.toMatchObject({ code: '42501' });
  });
  it('privilégios de migration/runtime permanecem separados e runtime não cria schema/objetos', async () => {
    const query =
      "select rolsuper,rolbypassrls,rolcreatedb,rolcreaterole,has_database_privilege(current_user,current_database(),'CREATE') as db_create,has_schema_privilege(current_user,'public','CREATE') as schema_create from pg_roles where rolname=current_user";
    expect((await fixture.migration.query(query)).rows[0]).toEqual({
      rolsuper: false,
      rolbypassrls: false,
      rolcreatedb: false,
      rolcreaterole: false,
      db_create: true,
      schema_create: true,
    });
    expect((await fixture.runtime.query(query)).rows[0]).toEqual({
      rolsuper: false,
      rolbypassrls: false,
      rolcreatedb: false,
      rolcreaterole: false,
      db_create: false,
      schema_create: false,
    });
    await expect(
      fixture.runtime.query('create schema runtime_forbidden'),
    ).rejects.toMatchObject({ code: '42501' });
    await expect(
      fixture.runtime.query('create table public.runtime_forbidden (id uuid)'),
    ).rejects.toMatchObject({ code: '42501' });
    const client = await fixture.migration.connect();
    try {
      const result = await client.query<{ acquired: boolean }>(
        "select pg_try_advisory_lock(hashtext('lgpd:structural-migrations')) as acquired",
      );
      expect(result.rows[0]?.acquired).toBe(true);
    } finally {
      client.release(true);
    }
  });
});

describe('S3.1: persistência global de autenticação restrita', () => {
  it('cria estruturas globais com FKs, campos mínimos e sem contexto tenant', async () => {
    const columns = await fixture.migration.query<{
      table_name: string;
      column_name: string;
    }>(
      "select table_name,column_name from information_schema.columns where table_schema='public' and table_name=any($1) order by table_name,column_name",
      [['external_identities', 'sessions']],
    );
    const byTable = (table: string) =>
      columns.rows
        .filter((row) => row.table_name === table)
        .map((row) => row.column_name);
    expect(byTable('external_identities')).toEqual([
      'created_at',
      'id',
      'issuer',
      'subject',
      'updated_at',
      'user_id',
    ]);
    expect(byTable('sessions')).toEqual([
      'created_at',
      'expires_at',
      'id',
      'revoked_at',
      'token_digest',
      'user_id',
    ]);
    for (const forbidden of [
      'organization_id',
      'membership_id',
      'role_id',
      'scope',
      'permissions',
      'token',
      'email',
    ]) {
      expect(byTable('external_identities')).not.toContain(forbidden);
      expect(byTable('sessions')).not.toContain(forbidden);
    }
    const rls = await fixture.migration.query(
      "select relname,relrowsecurity from pg_class where oid=any(array['public.external_identities'::regclass,'public.sessions'::regclass]) order by relname",
    );
    expect(rls.rows).toEqual([
      { relname: 'external_identities', relrowsecurity: false },
      { relname: 'sessions', relrowsecurity: false },
    ]);
    const missingUser = randomUUID();
    await expect(
      fixture.migration.query(
        "insert into external_identities(user_id,issuer,subject) values($1,'https://issuer.invalid','missing')",
        [missingUser],
      ),
    ).rejects.toMatchObject({ code: '23503' });
  });

  it('preserva identidade por issuer+subject e resolve somente userId', async () => {
    const otherUser = randomUUID();
    await fixture.migration.query(
      "insert into users(id,name,email) values($1,'Outra pessoa fictícia','outra@example.invalid')",
      [otherUser],
    );
    await fixture.migration.query(
      `insert into external_identities(user_id,issuer,subject) values
       ($1,'https://issuer-a.invalid','subject-1'),
       ($1,'https://issuer-a.invalid','subject-2'),
       ($2,'https://issuer-b.invalid','subject-1')`,
      [U, otherUser],
    );
    expect(
      await findExternalIdentityByIssuerAndSubject(
        fixture.database,
        'https://issuer-a.invalid',
        'subject-1',
      ),
    ).toEqual({ userId: U });
    expect(
      await findExternalIdentityByIssuerAndSubject(
        fixture.database,
        'https://issuer.invalid',
        'absent',
      ),
    ).toBeNull();
    await expect(
      fixture.migration.query(
        "insert into external_identities(user_id,issuer,subject) values($1,'https://issuer-a.invalid','subject-1')",
        [otherUser],
      ),
    ).rejects.toMatchObject({ code: '23505' });
    expect(
      (
        await fixture.migration.query(
          'select user_id,issuer,subject from external_identities order by issuer,subject',
        )
      ).rows,
    ).toHaveLength(3);
  });

  it('cria, resolve e revoga Sessions sem expor digest', async () => {
    const expiresAt = new Date('2030-01-01T00:00:00.000Z');
    const first = await createSession(fixture.database, {
      userId: U,
      tokenDigest: 'digest-s3-1-first',
      expiresAt,
    });
    const second = await createSession(fixture.database, {
      userId: U,
      tokenDigest: 'digest-s3-1-second',
      expiresAt,
    });
    expect(first.sessionId).not.toBe(second.sessionId);
    expect(first).toMatchObject({ expiresAt, revokedAt: null });
    expect(Object.keys(first).sort()).toEqual(
      ['createdAt', 'expiresAt', 'revokedAt', 'sessionId'].sort(),
    );
    const resolved = await findSessionByTokenDigest(
      fixture.database,
      'digest-s3-1-first',
    );
    expect(resolved).toEqual({
      sessionId: first.sessionId,
      userId: U,
      expiresAt,
      revokedAt: null,
    });
    expect(Object.keys(resolved ?? {})).not.toContain('tokenDigest');
    const persisted = await fixture.migration.query(
      'select token_digest,revoked_at from sessions where id=$1',
      [first.sessionId],
    );
    expect(persisted.rows[0]).toEqual({
      token_digest: 'digest-s3-1-first',
      revoked_at: null,
    });
    const firstRevocation = new Date('2029-01-01T00:00:00.000Z');
    const laterRevocation = new Date('2029-02-01T00:00:00.000Z');
    expect(
      await revokeSession(fixture.database, first.sessionId, firstRevocation),
    ).toBe(true);
    expect(
      await revokeSession(fixture.database, first.sessionId, laterRevocation),
    ).toBe(true);
    expect(
      (
        await fixture.migration.query(
          'select revoked_at from sessions where id=$1',
          [first.sessionId],
        )
      ).rows[0]?.revoked_at,
    ).toEqual(firstRevocation);
    expect(
      await revokeSession(fixture.database, randomUUID(), laterRevocation),
    ).toBe(false);
    expect(
      (
        await fixture.migration.query('select id from sessions where id=$1', [
          first.sessionId,
        ])
      ).rows,
    ).toHaveLength(1);
    await expect(
      createSession(fixture.database, {
        userId: U,
        tokenDigest: 'digest-s3-1-first',
        expiresAt,
      }),
    ).rejects.toMatchObject(pgError('23505'));
    await expect(
      createSession(fixture.database, {
        userId: randomUUID(),
        tokenDigest: 'digest-missing-user',
        expiresAt,
      }),
    ).rejects.toMatchObject(pgError('23503'));
  });

  it('mantém runtime sem DML direto e expõe somente os quatro primitives', async () => {
    for (const table of ['external_identities', 'sessions']) {
      for (const privilege of ['SELECT', 'INSERT', 'UPDATE', 'DELETE']) {
        const result = await fixture.runtime.query<{ allowed: boolean }>(
          'select has_table_privilege(current_user,$1,$2) as allowed',
          [`public.${table}`, privilege],
        );
        expect(result.rows[0]?.allowed).toBe(false);
      }
    }
    expect(
      (
        await fixture.runtime.query(
          "select has_table_privilege(current_user,'public.users','SELECT') as allowed",
        )
      ).rows[0]?.allowed,
    ).toBe(false);
    await expect(
      fixture.runtime.query('select * from external_identities'),
    ).rejects.toMatchObject({ code: '42501' });
    await expect(
      fixture.runtime.query('select * from sessions'),
    ).rejects.toMatchObject({ code: '42501' });
    const functions = await fixture.migration.query<{
      name: string;
      owner: string;
      security_definer: boolean;
      config: string[];
      public_execute: boolean;
      runtime_execute: boolean;
    }>(
      `select p.proname as name,pg_get_userbyid(p.proowner) as owner,
        p.prosecdef as security_definer,p.proconfig as config,
        has_function_privilege('public',p.oid,'EXECUTE') as public_execute,
        has_function_privilege($1,p.oid,'EXECUTE') as runtime_execute
       from pg_proc p join pg_namespace n on n.oid=p.pronamespace
       where n.nspname='auth_private' order by p.proname`,
      [fixture.runtimeRole],
    );
    expect(functions.rows.map((row) => row.name)).toEqual([
      'create_session',
      'resolve_external_identity',
      'resolve_session',
      'revoke_session',
    ]);
    for (const fn of functions.rows) {
      expect(fn.owner).toBe('lgpd_auth_persistence');
      expect(fn.security_definer).toBe(true);
      expect(fn.public_execute).toBe(false);
      expect(fn.runtime_execute).toBe(true);
      expect(fn.config).toContain('search_path=pg_catalog, pg_temp');
    }
  });

  it('mantém role e schema privados sem memberships ou privilégios excedentes', async () => {
    const role = await fixture.migration.query(
      "select rolcanlogin,rolsuper,rolbypassrls,rolcreatedb,rolcreaterole,rolinherit from pg_roles where rolname='lgpd_auth_persistence'",
    );
    expect(role.rows[0]).toEqual({
      rolcanlogin: false,
      rolsuper: false,
      rolbypassrls: false,
      rolcreatedb: false,
      rolcreaterole: false,
      rolinherit: false,
    });
    for (const roleName of [fixture.runtimeRole, fixture.migrationRole]) {
      expect(
        (
          await fixture.migration.query(
            "select pg_has_role($1,'lgpd_auth_persistence','MEMBER') as member",
            [roleName],
          )
        ).rows[0]?.member,
      ).toBe(false);
    }
    const schema = await fixture.migration.query(
      `select pg_get_userbyid(nspowner) as owner,
        has_schema_privilege('public','auth_private','USAGE') as public_usage,
        has_schema_privilege('public','auth_private','CREATE') as public_create,
        has_schema_privilege($1,'auth_private','USAGE') as runtime_usage,
        has_schema_privilege($1,'auth_private','CREATE') as runtime_create
       from pg_namespace where nspname='auth_private'`,
      [fixture.runtimeRole],
    );
    expect(schema.rows[0]).toEqual({
      owner: 'lgpd_auth_persistence',
      public_usage: false,
      public_create: false,
      runtime_usage: true,
      runtime_create: false,
    });
    const privileges = await fixture.migration.query(
      `select
        has_table_privilege('lgpd_auth_persistence','public.external_identities','SELECT') as identity_select,
        has_table_privilege('lgpd_auth_persistence','public.external_identities','INSERT,UPDATE,DELETE') as identity_write,
        has_table_privilege('lgpd_auth_persistence','public.sessions','SELECT,INSERT,UPDATE') as session_required,
        has_table_privilege('lgpd_auth_persistence','public.sessions','DELETE') as session_delete,
        has_table_privilege('lgpd_auth_persistence','public.users','SELECT') as user_select`,
    );
    expect(privileges.rows[0]).toEqual({
      identity_select: true,
      identity_write: false,
      session_required: true,
      session_delete: false,
      user_select: false,
    });
    await fixture.runtime.query('set search_path = public, pg_temp');
    expect(
      await findExternalIdentityByIssuerAndSubject(
        fixture.database,
        'shadow.invalid',
        'absent',
      ),
    ).toBeNull();
  });
});
