import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

const root = fileURLToPath(new URL('../', import.meta.url));
process.loadEnvFile(resolve(root, '.env'));
const withoutDatabase = process.argv.includes('--without-db');
const children = new Set();
function start(command, args, options = {}) {
  const child = spawn(command, args, {
    cwd: root,
    env: process.env,
    ...options,
  });
  children.add(child);
  let output = '';
  child.stdout.on('data', (chunk) => {
    output += chunk;
  });
  child.stderr.on('data', (chunk) => {
    output += chunk;
  });
  const completed = once(child, 'close').then(([code]) => {
    children.delete(child);
    return code;
  });
  return { child, completed, output: () => output };
}
async function failure(env, expected) {
  const run = start(process.execPath, ['apps/api/dist/main.js'], { env });
  const timer = setTimeout(() => run.child.kill('SIGKILL'), 12000);
  try {
    assert.equal(
      await run.completed,
      1,
      'API precisa terminar com exit code 1',
    );
    assert.ok(
      run.output().includes(expected),
      'Mensagem segura esperada ausente',
    );
    assert.ok(
      !run.output().includes('slice1-secret-sentinel'),
      'Secret exposto',
    );
  } finally {
    clearTimeout(timer);
  }
}
async function waitHttp(url, run) {
  for (let attempt = 0; attempt < 100; attempt++) {
    assert.equal(
      run.child.exitCode,
      null,
      'Processo encerrou antes do smoke check',
    );
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
      if (response.ok) return response;
    } catch {
      /* Processo pode ainda estar inicializando. */
    }
    await delay(100);
  }
  throw new Error('Timeout aguardando aplicação local');
}
try {
  const missing = {
    ...process.env,
    DB_RUNTIME_PASSWORD: 'slice1-secret-sentinel',
  };
  delete missing.DB_HOST;
  await failure(missing, 'DB_HOST: configuração obrigatória ausente.');
  await failure(
    {
      ...process.env,
      DB_PORT: 'invalid',
      DB_RUNTIME_PASSWORD: 'slice1-secret-sentinel',
    },
    'DB_PORT: informe uma porta',
  );
  if (!withoutDatabase) {
    await failure(
      { ...process.env, DB_RUNTIME_PASSWORD: 'slice1-secret-sentinel' },
      'Falha ao iniciar API.',
    );
    const api = start(process.execPath, ['apps/api/dist/main.js'], {
      env: { ...process.env, API_HOST: '127.0.0.1', API_PORT: '43117' },
    });
    const health = await waitHttp('http://127.0.0.1:43117/health', api);
    assert.deepEqual(await health.json(), { status: 'ok' });
    const forbidden = await fetch(
      'http://127.0.0.1:43117/processing-activities',
    );
    assert.equal(forbidden.status, 404);
  }
  const web = start(
    process.execPath,
    [
      resolve(root, 'apps/web/node_modules/vite/bin/vite.js'),
      '--host',
      '127.0.0.1',
      '--port',
      '43118',
      '--strictPort',
    ],
    { cwd: resolve(root, 'apps/web') },
  );
  const html = await waitHttp('http://127.0.0.1:43118', web);
  assert.ok((await html.text()).includes('id="root"'));
  const source = await fetch('http://127.0.0.1:43118/src/main.tsx');
  assert.equal(source.status, 200);
  assert.ok((await source.text()).includes('Ambiente local iniciado'));
  console.info(
    withoutDatabase
      ? 'Smoke local OK: frontend e configuração inválida sem secrets. PostgreSQL e inicialização saudável da API não verificados.'
      : 'Smoke OK: API, frontend, PostgreSQL na inicialização, rota de negócio ausente e configuração inválida sem secrets.',
  );
} catch {
  console.error(
    'Smoke falhou. Verifique build, configuração e PostgreSQL local.',
  );
  process.exitCode = 1;
} finally {
  await Promise.all(
    [...children].map(async (child) => {
      const closed = once(child, 'close');
      child.kill('SIGTERM');
      const timer = setTimeout(() => child.kill('SIGKILL'), 3000);
      await closed;
      clearTimeout(timer);
    }),
  );
}
