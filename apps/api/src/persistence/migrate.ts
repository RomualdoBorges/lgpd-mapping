import { fileURLToPath } from 'node:url';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

export async function applyMigrations(
  pool: pg.Pool,
  runtimeRole: string,
): Promise<void> {
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(runtimeRole))
    throw new Error('Role runtime inválida.');
  const client = await pool.connect();
  try {
    // Session lock covers the official bootstrap, history read and migration transaction.
    await client.query(
      "select pg_advisory_lock(hashtext('lgpd:structural-migrations'))",
    );
    await client.query(
      "select set_config('lgpd.migration_runtime_role', $1, false)",
      [runtimeRole],
    );
    await migrate(drizzle(client), {
      migrationsFolder: fileURLToPath(
        new URL('../../drizzle/migrations', import.meta.url),
      ),
      migrationsSchema: 'public',
      migrationsTable: '__drizzle_migrations',
    });
  } finally {
    // Destroy this migration-only session: releases the lock even after errors.
    client.release(true);
  }
}
