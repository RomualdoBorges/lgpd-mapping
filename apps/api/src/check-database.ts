import pg from 'pg';
import {
  databaseConfiguration,
  ConfigurationError,
} from './config/environment.js';

async function check(): Promise<void> {
  const runtime = new pg.Pool(databaseConfiguration(process.env, 'RUNTIME'));
  const migration = new pg.Pool(
    databaseConfiguration(process.env, 'MIGRATION'),
  );
  try {
    if (process.env.DB_RUNTIME_USER === process.env.DB_MIGRATION_USER)
      throw new Error('Roles must differ');
    const query = `select current_user as username, rolsuper, rolbypassrls, rolcreaterole,
      has_schema_privilege(current_user, 'public', 'CREATE') as can_create
      from pg_roles where rolname = current_user`;
    const a = (await runtime.query(query)).rows[0];
    const b = (await migration.query(query)).rows[0];
    if (
      !a ||
      !b ||
      a.rolsuper ||
      a.rolbypassrls ||
      a.rolcreaterole ||
      a.can_create ||
      b.rolsuper ||
      b.rolbypassrls ||
      !b.can_create
    )
      throw new Error('Invalid privileges');
    console.info(
      'PostgreSQL real: conexões runtime/migration distintas e privilégios locais verificados.',
    );
  } finally {
    await Promise.all([runtime.end(), migration.end()]);
  }
}
try {
  await check();
} catch (error: unknown) {
  console.error(
    error instanceof ConfigurationError
      ? error.message
      : 'Verificação PostgreSQL falhou. Confira conexão e privilégios locais.',
  );
  process.exitCode = 1;
}
