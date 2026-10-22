import pg from 'pg';
import {
  databaseConfiguration,
  ConfigurationError,
} from './config/environment.js';
import { applyMigrations } from './persistence/migrate.js';

try {
  const runtime = databaseConfiguration(process.env, 'RUNTIME');
  const migration = databaseConfiguration(process.env, 'MIGRATION');
  if (runtime.user === migration.user)
    throw new Error('Credenciais devem ser distintas.');
  const pool = new pg.Pool(migration);
  try {
    await applyMigrations(pool, runtime.user);
    console.info('Migrations estruturais aplicadas.');
  } finally {
    await pool.end();
  }
} catch (error: unknown) {
  console.error(
    error instanceof ConfigurationError
      ? error.message
      : 'Aplicação das migrations falhou.',
  );
  process.exitCode = 1;
}
