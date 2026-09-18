import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'drizzle-kit';
import { databaseConfiguration } from './src/config/environment.js';

const envPath = fileURLToPath(new URL('../../.env', import.meta.url));
if (existsSync(envPath)) process.loadEnvFile(envPath);
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/persistence/schema.ts',
  out: './drizzle/migrations',
  dbCredentials: databaseConfiguration(process.env, 'MIGRATION'),
});
