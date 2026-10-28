import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { databaseConfiguration } from '../../src/config/environment.js';
import { verifyConcurrentMigrations } from './migration-concurrency.js';
import * as schema from '../../src/persistence/schema.js';
import { assertExclusiveTestDatabase } from '../database-safety.js';

export const A = randomUUID();
export const B = randomUUID();
export const U = randomUUID();
export const BU_A = randomUUID();
export const BU_B = randomUUID();
export const M_A = randomUUID();
export const M_B = randomUUID();
export const ROLE = randomUUID();
export const GRANT_A = randomUUID();
export const GRANT_B = randomUUID();

type PreviousMigrationPreparation = (context: {
  migration: pg.Pool;
  runtime: pg.Pool;
  runtimeRole: string;
}) => Promise<void>;

export async function createTestDatabase(
  preparePreviousMigrations?: PreviousMigrationPreparation,
  previousMigrationCount = 3,
) {
  const envPath = fileURLToPath(new URL('../../../../.env', import.meta.url));
  if (existsSync(envPath)) process.loadEnvFile(envPath);
  const runtimeConfig = databaseConfiguration(process.env, 'RUNTIME');
  const migrationConfig = databaseConfiguration(process.env, 'MIGRATION');
  if (
    !['127.0.0.1', '::1'].includes(runtimeConfig.host) ||
    runtimeConfig.user === migrationConfig.user ||
    !process.env.DB_ADMIN_PASSWORD
  )
    throw new Error(
      'Testes requerem PostgreSQL local LGPD e credenciais distintas.',
    );
  // No CREATE DATABASE privilege is granted to the application runtime/migrator.
  const admin = new pg.Pool({
    ...runtimeConfig,
    statement_timeout: 10000,
    database: 'postgres',
    user: 'lgpd_admin',
    password: process.env.DB_ADMIN_PASSWORD,
  });
  const name = `lgpd_test_${randomUUID().replaceAll('-', '')}`;
  const marker = `lgpd-test-execution:${name}`;
  const runtime = new pg.Pool({ ...runtimeConfig, database: name, max: 1 });
  const migration = new pg.Pool({ ...migrationConfig, database: name });
  const preparation = new pg.Pool({
    ...runtimeConfig,
    database: name,
    user: 'lgpd_admin',
    password: process.env.DB_ADMIN_PASSWORD,
  });
  let created = false;
  async function verifyExclusive() {
    const result = await admin.query<{ name: string; marker: string | null }>(
      "select datname as name, shobj_description(oid, 'pg_database') as marker from pg_database where datname = $1",
      [name],
    );
    const row = result.rows[0];
    assertExclusiveTestDatabase(row?.name ?? '', name, row?.marker ?? null);
  }
  async function close() {
    try {
      const closed = await Promise.allSettled([
        runtime.end(),
        migration.end(),
        preparation.end(),
      ]);
      const errors = closed
        .filter((result) => result.status === 'rejected')
        .map((result) => result.reason);
      if (errors.length)
        throw new AggregateError(
          errors,
          'Pools não encerrados; banco exclusivo preservado.',
        );
      if (created) {
        await verifyExclusive();
        await admin.query(`DROP DATABASE "${name}"`);
      }
    } finally {
      await admin.end();
    }
  }
  try {
    const version = await admin.query<{ version: string }>(
      "select current_setting('server_version_num') as version",
    );
    if (version.rows[0]?.version !== '170011')
      throw new Error('Testes requerem PostgreSQL 17.11 oficial LGPD.');
    assertExclusiveTestDatabase(name, name, marker);
    await admin.query(`DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='lgpd_auth_persistence') THEN
        CREATE ROLE lgpd_auth_persistence NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname='lgpd_membership_bootstrap') THEN
        CREATE ROLE lgpd_membership_bootstrap NOLOGIN NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOINHERIT;
      END IF;
    END $$`);
    for (const [roleName, message] of [
      [
        'lgpd_auth_persistence',
        'Role administrativa de autenticação inválida.',
      ],
      [
        'lgpd_membership_bootstrap',
        'Role de bootstrap de Membership inválida.',
      ],
    ]) {
      const role = await admin.query(
        'select rolcanlogin,rolsuper,rolbypassrls,rolcreatedb,rolcreaterole,rolinherit from pg_roles where rolname=$1',
        [roleName],
      );
      if (
        role.rows.length !== 1 ||
        Object.values(role.rows[0]).some((value) => value !== false)
      )
        throw new Error(message);
    }
    await admin.query(`CREATE DATABASE "${name}" OWNER "lgpd_admin"`);
    created = true;
    // CREATE DATABASE cannot share a transaction with its marker. If marking fails,
    // cleanup must refuse DROP and preserve the residual database.
    await admin.query(`COMMENT ON DATABASE "${name}" IS '${marker}'`);
    await admin.query(`REVOKE ALL ON DATABASE "${name}" FROM PUBLIC`);
    await admin.query(
      `GRANT CONNECT ON DATABASE "${name}" TO "${runtimeConfig.user}", "${migrationConfig.user}"`,
    );
    await admin.query(
      `GRANT CREATE ON DATABASE "${name}" TO "${migrationConfig.user}"`,
    );
    await preparation.query('REVOKE ALL ON SCHEMA public FROM PUBLIC');
    await preparation.query(
      `GRANT USAGE, CREATE ON SCHEMA public TO "${migrationConfig.user}"`,
    );
    await preparation.query(
      `GRANT USAGE ON SCHEMA public TO "${runtimeConfig.user}"`,
    );
    if (preparePreviousMigrations)
      await preparePreviousMigrations({
        migration,
        runtime,
        runtimeRole: runtimeConfig.user,
      });
    const migrationCheckCoordinator = await admin.connect();
    let concurrency;
    try {
      await migrationCheckCoordinator.query(
        "select pg_advisory_lock(hashtext('lgpd:test-migration-concurrency-check'))",
      );
      concurrency = await verifyConcurrentMigrations(
        preparation,
        migration,
        name,
        preparePreviousMigrations ? previousMigrationCount : 0,
      );
      await migrationCheckCoordinator.query(
        "select pg_advisory_unlock(hashtext('lgpd:test-migration-concurrency-check'))",
      );
    } finally {
      // Closing the test-only session also releases the coordination lock on error.
      migrationCheckCoordinator.release(true);
    }
    const authProvisioning = readFileSync(
      fileURLToPath(
        new URL(
          '../../../../infra/postgres/provision-auth-persistence.sql',
          import.meta.url,
        ),
      ),
      'utf8',
    );
    const membershipProvisioning = readFileSync(
      fileURLToPath(
        new URL(
          '../../../../infra/postgres/provision-membership-bootstrap.sql',
          import.meta.url,
        ),
      ),
      'utf8',
    );
    const provisioner = await preparation.connect();
    try {
      await provisioner.query(
        "select set_config('lgpd.auth_runtime_role',$1,false), set_config('lgpd.auth_migration_role',$2,false)",
        [runtimeConfig.user, migrationConfig.user],
      );
      await provisioner.query(authProvisioning);
      await provisioner.query(
        "select set_config('lgpd.membership_runtime_role',$1,false), set_config('lgpd.membership_migration_role',$2,false)",
        [runtimeConfig.user, migrationConfig.user],
      );
      await provisioner.query(membershipProvisioning);
      await provisioner.query(membershipProvisioning);
    } finally {
      provisioner.release();
    }
    return {
      name,
      concurrency,
      runtime,
      migration,
      preparation,
      database: drizzle(runtime, { schema }),
      runtimeRole: runtimeConfig.user,
      migrationRole: migrationConfig.user,
      async reset() {
        await verifyExclusive();
        const actual = await migration.query<{ name: string }>(
          'select current_database() as name',
        );
        assertExclusiveTestDatabase(actual.rows[0]?.name ?? '', name, marker);
        await migration.query(
          'TRUNCATE processing_activities, sessions, external_identities, role_assignment_business_units, role_assignments, memberships, business_units, organizations, users, roles',
        );
        await migration.query(
          'insert into users (id,name,email) values ($1,$2,$3)',
          [U, 'Pessoa fictícia', 'ficticio@example.invalid'],
        );
        await migration.query('insert into roles (id,code) values ($1,$2)', [
          ROLE,
          'MANAGER',
        ]);
        const client = await runtime.connect();
        try {
          for (const [org, bu, membership, grant] of [
            [A, BU_A, M_A, GRANT_A],
            [B, BU_B, M_B, GRANT_B],
          ]) {
            await client.query('BEGIN');
            await client.query(
              "select set_config('lgpd.organization_id',$1,true)",
              [org],
            );
            await client.query(
              'insert into organizations (id,name) values ($1,$2)',
              [org, 'Organização fictícia'],
            );
            await client.query(
              'insert into business_units (id,organization_id,name) values ($1,$2,$3)',
              [bu, org, 'Área fictícia'],
            );
            await client.query(
              'insert into memberships (id,organization_id,user_id,active) values ($1,$2,$3,true)',
              [membership, org, U],
            );
            await client.query(
              "insert into role_assignments (id,organization_id,membership_id,role_id,scope) values ($1,$2,$3,$4,'BUSINESS_UNIT')",
              [grant, org, membership, ROLE],
            );
            await client.query(
              'insert into role_assignment_business_units (organization_id,role_assignment_id,business_unit_id) values ($1,$2,$3)',
              [org, grant, bu],
            );
            await client.query('COMMIT');
          }
        } catch (error) {
          await client.query('ROLLBACK');
          throw error;
        } finally {
          client.release();
        }
      },
      close,
    };
  } catch (error) {
    await close();
    throw error;
  }
}
