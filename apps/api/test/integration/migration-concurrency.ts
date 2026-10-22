import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { setTimeout as poll } from 'node:timers/promises';
import pg from 'pg';

// Gates and observations exist only in the exclusive test database, not in the runner.
export async function verifyConcurrentMigrations(
  preparation: pg.Pool,
  migration: pg.Pool,
  name: string,
) {
  const gate = await preparation.connect();
  const children: ReturnType<typeof spawn>[] = [];
  const completions: Promise<{ code: number | null; output: string }>[] = [];
  const labels = [1, 2].map((n) => `${name}_${n}`);
  let transaction = false;
  async function until<T>(
    read: () => Promise<T>,
    ready: (value: T) => boolean,
  ) {
    const deadline = Date.now() + 10000;
    while (true) {
      const value = await read();
      if (ready(value)) return value;
      if (Date.now() >= deadline)
        throw new Error(
          'Estado concorrente esperado não observado no PostgreSQL.',
        );
      // Polling is bounded; SQL lock state, never elapsed sleep, proves synchronization.
      await poll(10);
    }
  }
  async function executors() {
    return (
      await preparation.query<{
        pid: number;
        datname: string;
        application_name: string;
        advisory_granted: boolean;
        advisory_waiting: boolean;
        bootstrap_waiting: boolean;
      }>(
        `select a.pid,a.datname,a.application_name,
          exists(select 1 from pg_locks l where l.pid=a.pid and l.locktype='advisory' and l.granted) as advisory_granted,
          exists(select 1 from pg_locks l where l.pid=a.pid and l.locktype='advisory' and not l.granted) as advisory_waiting,
          exists(select 1 from pg_locks l where l.pid=a.pid and l.relation='pg_catalog.pg_class'::regclass and not l.granted) as bootstrap_waiting
        from pg_stat_activity a where a.datname=$1 and a.application_name=any($2)`,
        [name, labels],
      )
    ).rows;
  }
  try {
    await gate.query(
      "select pg_advisory_lock(hashtext('lgpd:structural-migrations'))",
    );
    await gate.query('BEGIN');
    transaction = true;
    // CREATE TABLE for the official journal must wait on this catalog lock.
    await gate.query('LOCK TABLE pg_catalog.pg_class IN SHARE MODE');
    for (const label of labels) {
      const child = spawn(
        process.execPath,
        ['--import', 'tsx', 'src/migrate-database.ts'],
        {
          cwd: fileURLToPath(new URL('../../', import.meta.url)),
          env: { ...process.env, DB_NAME: name, PGAPPNAME: label },
          stdio: ['ignore', 'pipe', 'pipe'],
        },
      );
      children.push(child);
      const completion = new Promise<{ code: number | null; output: string }>(
        (resolve, reject) => {
          let output = '';
          child.stdout?.on('data', (chunk: Buffer) => {
            output += chunk.toString();
          });
          child.stderr?.on('data', (chunk: Buffer) => {
            output += chunk.toString();
          });
          child.once('error', reject);
          child.once('close', (code) => resolve({ code, output }));
        },
      );
      // Avoid unhandled rejection while observing server state; awaited again below.
      void completion.catch(() => undefined);
      completions.push(completion);
    }
    const waiting = await until(
      executors,
      (rows) => rows.length === 2 && rows.every((row) => row.advisory_waiting),
    );
    if (
      new Set(waiting.map((row) => row.pid)).size !== 2 ||
      children[0]?.pid === children[1]?.pid
    )
      throw new Error(
        'Executores precisam ser processos e sessões independentes.',
      );
    await gate.query(
      "select pg_advisory_unlock(hashtext('lgpd:structural-migrations'))",
    );
    let protectedRows;
    try {
      protectedRows = await until(
        executors,
        (rows) =>
          rows.length === 2 &&
          rows.filter((row) => row.advisory_granted && row.bootstrap_waiting)
            .length === 1 &&
          rows.filter((row) => row.advisory_waiting).length === 1,
      );
    } catch (error) {
      const results = await Promise.all(completions);
      throw new Error(
        `Estado concorrente não observado: ${results.map((result) => result.output).join(' | ')}`,
        { cause: error },
      );
    }
    const empty = await gate.query(
      "select to_regclass('public.__drizzle_migrations') as journal,to_regclass('public.organizations') as organization",
    );
    if (empty.rows[0]?.journal !== null || empty.rows[0]?.organization !== null)
      throw new Error('Bootstrap deve disputar banco vazio.');
    await gate.query('COMMIT');
    transaction = false;
    for (const result of await Promise.all(completions)) {
      if (
        result.code !== 0 ||
        !result.output.includes('Migrations estruturais aplicadas.')
      )
        throw new Error(
          `Executor real de migration não terminou com sucesso: ${result.output}`,
        );
    }
    const expectedTimes = [1789754035408, 1789754043586, 1790249267053].map(
      String,
    );
    // Assert the exact versioned migrations, without selecting or applying SQL ourselves.
    const entries = await migration.query<{ created_at: string }>(
      'select created_at from public.__drizzle_migrations order by created_at',
    );
    if (
      entries.rows.length !== 3 ||
      JSON.stringify(entries.rows.map((row) => row.created_at)) !==
        JSON.stringify(expectedTimes)
    )
      throw new Error(
        'Journal deve registrar exatamente as três migrations versionadas.',
      );
    return {
      processIds: children.map((child) => child.pid),
      waitingExecutors: waiting.length,
      protectedExecutors: protectedRows.filter((row) => row.advisory_granted)
        .length,
      journalEntries: entries.rows.length,
    };
  } finally {
    // Stop children before pool teardown on an observation/assertion failure.
    for (const child of children)
      if (child.exitCode === null && child.signalCode === null) child.kill();
    await Promise.allSettled(completions);
    try {
      if (transaction) await gate.query('ROLLBACK');
    } finally {
      gate.release(true);
    }
  }
}
