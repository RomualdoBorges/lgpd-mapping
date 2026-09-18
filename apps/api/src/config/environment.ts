import { isIP } from 'node:net';

export class ConfigurationError extends Error {}

function required(env: NodeJS.ProcessEnv, name: string): string {
  const value = env[name];
  if (!value || value.trim().length === 0)
    throw new ConfigurationError(`${name}: configuração obrigatória ausente.`);
  return value;
}
function port(env: NodeJS.ProcessEnv, name: string): number {
  const value = required(env, name);
  if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 65535)
    throw new ConfigurationError(`${name}: informe uma porta entre 1 e 65535.`);
  return Number(value);
}
function identifier(env: NodeJS.ProcessEnv, name: string): string {
  const value = required(env, name);
  if (!/^[a-z][a-z0-9_]{0,62}$/.test(value))
    throw new ConfigurationError(`${name}: identificador inválido.`);
  return value;
}
export function databaseConfiguration(
  env: NodeJS.ProcessEnv,
  kind: 'RUNTIME' | 'MIGRATION',
) {
  const host = required(env, 'DB_HOST');
  if (!isIP(host) && !/^[a-zA-Z0-9.-]+$/.test(host))
    throw new ConfigurationError('DB_HOST: hostname inválido.');
  return {
    host,
    port: port(env, 'DB_PORT'),
    database: identifier(env, 'DB_NAME'),
    user: identifier(env, `DB_${kind}_USER`),
    password: required(env, `DB_${kind}_PASSWORD`),
    connectionTimeoutMillis: 3000,
    statement_timeout: 3000,
    max: 5,
  };
}
export function loadEnvironment(env: NodeJS.ProcessEnv) {
  const host = required(env, 'API_HOST');
  if (!isIP(host))
    throw new ConfigurationError('API_HOST: informe um endereço IP válido.');
  return {
    host,
    port: port(env, 'API_PORT'),
    database: databaseConfiguration(env, 'RUNTIME'),
  };
}
export type Environment = ReturnType<typeof loadEnvironment>;
export const ENVIRONMENT = Symbol('ENVIRONMENT');
