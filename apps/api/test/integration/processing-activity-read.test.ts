import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';
import pg from 'pg';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';
import {
  createTestDatabase,
  A,
  B,
  BU_A,
  BU_B,
  M_A,
  M_B,
  ROLE,
  GRANT_A,
} from './database.js';
import { loadEnvironment } from '../../src/config/environment.js';
import { DatabaseService } from '../../src/persistence/database.service.js';
import type { AuthorizedTenantContext } from '../../src/tenant/authorized-tenant-context.js';
import type { TenantTransaction } from '../../src/persistence/tenant-transaction.js';
import * as activeRepository from '../../src/persistence/active-membership-repository.js';
import * as grantsRepository from '../../src/persistence/membership-grants-repository.js';
import * as activityRepository from '../../src/persistence/processing-activity-repository.js';
import { ProcessingActivityReadService } from '../../src/processing-activities/processing-activity-read.service.js';

let fixture: Awaited<ReturnType<typeof createTestDatabase>>;
let database: DatabaseService;
let service: ProcessingActivityReadService;
const UNIT_2 = randomUUID(),
  ACT_A = randomUUID(),
  ACT_A2 = randomUUID(),
  ACT_B = randomUUID();
const ctxA = { membershipId: M_A, authorizedOrganizationId: A },
  ctxB = { membershipId: M_B, authorizedOrganizationId: B };
const realActive = activeRepository.isMembershipActive,
  realGrants = grantsRepository.readMembershipGrants,
  realFind = activityRepository.findVisibleProcessingActivityById;
function signal() {
  let release: () => void = () => {
    throw Error('Sinal ausente.');
  };
  const promise = new Promise<void>((done) => {
    release = done;
  });
  return { promise, release };
}
async function write(operation: (client: pg.PoolClient) => Promise<void>) {
  const client = await fixture.preparation.connect();
  try {
    await client.query('BEGIN');
    const pid = (await client.query('select pg_backend_pid() as pid')).rows[0]
      .pid;
    await operation(client);
    await client.query('COMMIT');
    return pid;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
async function revoke(client: pg.PoolClient) {
  await client.query(
    'delete from role_assignment_business_units where organization_id=$1 and role_assignment_id=$2',
    [A, GRANT_A],
  );
  await client.query(
    'delete from role_assignments where organization_id=$1 and id=$2',
    [A, GRANT_A],
  );
}
// Synchronize after real SQL reads; no production hooks or elapsed-time synchronization.
async function concurrentAfter(
  stage: 'membership' | 'grants',
  writer: (client: pg.PoolClient) => Promise<void>,
  activityId = ACT_A,
) {
  const reached = signal(),
    resume = signal();
  let readerPid: unknown;
  async function barrier(tx: TenantTransaction) {
    readerPid = (await tx.execute(sql`select pg_backend_pid() as pid`)).rows[0]
      ?.pid;
    reached.release();
    await resume.promise;
  }
  const spy =
    stage === 'membership'
      ? vi
          .spyOn(activeRepository, 'isMembershipActive')
          .mockImplementation(async (tx, context) => {
            const result = await realActive(tx, context);
            await barrier(tx);
            return result;
          })
      : vi
          .spyOn(grantsRepository, 'readMembershipGrants')
          .mockImplementation(async (tx, context) => {
            const result = await realGrants(tx, context);
            await barrier(tx);
            return result;
          });
  const pending = service.findById(ctxA, activityId);
  void pending.catch(() => undefined);
  try {
    await Promise.race([
      reached.promise,
      pending.then(() => {
        throw Error('Operação terminou antes da barreira.');
      }),
    ]);
    const writerPid = await write(writer);
    expect(writerPid).not.toBe(readerPid);
    resume.release();
    return await pending;
  } finally {
    resume.release();
    spy.mockRestore();
    await Promise.allSettled([pending]);
  }
}
beforeAll(async () => {
  fixture = await createTestDatabase();
  const environment = loadEnvironment({
    ...process.env,
    DB_NAME: fixture.name,
  });
  database = new DatabaseService({
    ...environment,
    database: { ...environment.database, max: 1 },
  });
  service = new ProcessingActivityReadService(database);
});
beforeEach(async () => {
  await fixture.reset();
  await fixture.preparation.query(
    'insert into business_units(id,organization_id,name) values($1,$2,$3)',
    [UNIT_2, A, 'Área adicional'],
  );
  for (const [id, org, unit] of [
    [ACT_A, A, BU_A],
    [ACT_A2, A, UNIT_2],
    [ACT_B, B, BU_B],
  ])
    await fixture.preparation.query(
      'insert into processing_activities(id,organization_id,business_unit_id,name) values($1,$2,$3,$4)',
      [id, org, unit, 'Atividade fictícia'],
    );
});
afterEach(() => {
  vi.restoreAllMocks();
});
afterAll(async () => {
  if (database) await database.onModuleDestroy();
  if (fixture) await fixture.close();
});

describe('P.3 — composição real de leitura autorizada', () => {
  it.each(['COLLABORATOR', 'MANAGER'])(
    '%s/BU lê apenas área explícita',
    async (role) => {
      await fixture.preparation.query('update roles set code=$1 where id=$2', [
        role,
        ROLE,
      ]);
      expect((await service.findById(ctxA, ACT_A))?.id).toBe(ACT_A);
      expect(await service.findById(ctxA, ACT_A2)).toBeNull();
      expect(await service.findById(ctxA, ACT_B)).toBeNull();
      expect(await service.findById(ctxA, randomUUID())).toBeNull();
    },
  );
  it('DPO/ORGANIZATION lê áreas da própria Organization e nunca outro tenant', async () => {
    await write(async (client) => {
      await client.query(
        'delete from role_assignment_business_units where role_assignment_id=$1',
        [GRANT_A],
      );
      await client.query(
        "update role_assignments set scope='ORGANIZATION' where id=$1",
        [GRANT_A],
      );
      await client.query("update roles set code='DPO' where id=$1", [ROLE]);
    });
    expect((await service.findById(ctxA, ACT_A))?.id).toBe(ACT_A);
    expect((await service.findById(ctxA, ACT_A2))?.id).toBe(ACT_A2);
    expect(await service.findById(ctxA, ACT_B)).toBeNull();
  });
  it('une grants aplicáveis sem promover combinações incompatíveis', async () => {
    const role = randomUUID(),
      assignment = randomUUID();
    await write(async (client) => {
      await client.query(
        "insert into roles(id,code) values($1,'COLLABORATOR')",
        [role],
      );
      await client.query(
        "insert into role_assignments(id,organization_id,membership_id,role_id,scope) values($1,$2,$3,$4,'BUSINESS_UNIT')",
        [assignment, A, M_A, role],
      );
      await client.query(
        'insert into role_assignment_business_units(organization_id,role_assignment_id,business_unit_id) values($1,$2,$3)',
        [A, assignment, UNIT_2],
      );
    });
    expect((await service.findById(ctxA, ACT_A))?.id).toBe(ACT_A);
    expect((await service.findById(ctxA, ACT_A2))?.id).toBe(ACT_A2);
    expect(await service.findById(ctxA, ACT_B)).toBeNull();
  });
  it.each([
    'sem grants',
    'BU vazio',
    'DPO/BU',
    'MANAGER/ORGANIZATION',
  ] as const)('%s não concede leitura', async (mode) => {
    await write(async (client) => {
      if (mode === 'sem grants') await revoke(client);
      else if (mode === 'BU vazio' || mode === 'MANAGER/ORGANIZATION')
        await client.query(
          'delete from role_assignment_business_units where role_assignment_id=$1',
          [GRANT_A],
        );
      if (mode === 'DPO/BU')
        await client.query("update roles set code='DPO' where id=$1", [ROLE]);
      if (mode === 'MANAGER/ORGANIZATION')
        await client.query(
          "update role_assignments set scope='ORGANIZATION' where id=$1",
          [GRANT_A],
        );
    });
    expect(await service.findById(ctxA, ACT_A)).toBeNull();
  });
  it.each(['ausente', 'inativa'] as const)(
    'Membership %s não inicia grants ou leitura de Activity',
    async (mode) => {
      if (mode === 'inativa')
        await fixture.preparation.query(
          'update memberships set active=false where organization_id=$1 and id=$2',
          [A, M_A],
        );
      const grants = vi.spyOn(grantsRepository, 'readMembershipGrants'),
        activity = vi.spyOn(
          activityRepository,
          'findVisibleProcessingActivityById',
        );
      expect(
        await service.findById(
          mode === 'ausente' ? { ...ctxA, membershipId: randomUUID() } : ctxA,
          ACT_A,
        ),
      ).toBeNull();
      expect(grants).not.toHaveBeenCalled();
      expect(activity).not.toHaveBeenCalled();
    },
  );
  it('aplica ambos os filtros na consulta de Membership, inclusive no mesmo tenant', async () => {
    const otherUser = randomUUID(),
      otherMembership = randomUUID();
    await fixture.preparation.query(
      'insert into users(id,name,email) values($1,$2,$3)',
      [otherUser, 'Pessoa fictícia', 'p3@example.invalid'],
    );
    await fixture.preparation.query(
      'insert into memberships(id,organization_id,user_id,active) values($1,$2,$3,true)',
      [otherMembership, A, otherUser],
    );
    expect(
      await service.findById({ ...ctxA, membershipId: otherMembership }, ACT_A),
    ).toBeNull();
    expect(
      await service.findById({ ...ctxB, membershipId: M_A }, ACT_B),
    ).toBeNull();
    expect((await service.findById(ctxA, ACT_A))?.id).toBe(ACT_A);
  });
  it('uma transação READ ONLY, mesmo handle/contexto e tenant configurado antes das leituras', async () => {
    const handles: TenantTransaction[] = [],
      contexts: AuthorizedTenantContext[] = [],
      states: unknown[] = [];
    async function record(
      tx: TenantTransaction,
      context: AuthorizedTenantContext,
    ) {
      handles.push(tx);
      contexts.push(context);
      states.push(
        (
          await tx.execute(
            sql`select pg_backend_pid() as pid,current_setting('lgpd.organization_id') as tenant,current_setting('transaction_isolation') as isolation,current_setting('transaction_read_only') as readonly`,
          )
        ).rows[0],
      );
    }
    vi.spyOn(activeRepository, 'isMembershipActive').mockImplementation(
      async (tx, c) => {
        await record(tx, c);
        return realActive(tx, c);
      },
    );
    vi.spyOn(grantsRepository, 'readMembershipGrants').mockImplementation(
      async (tx, c) => {
        await record(tx, c);
        return realGrants(tx, c);
      },
    );
    vi.spyOn(
      activityRepository,
      'findVisibleProcessingActivityById',
    ).mockImplementation(async (tx, c, r, id) => {
      await record(tx, c);
      expect(r.permission).toBe('processing_activity:read');
      return realFind(tx, c, r, id);
    });
    expect((await service.findById(ctxA, ACT_A))?.id).toBe(ACT_A);
    expect(handles).toHaveLength(3);
    expect(new Set(handles).size).toBe(1);
    expect(new Set(contexts).size).toBe(1);
    expect(Object.isFrozen(contexts[0])).toBe(true);
    for (const value of states)
      expect(value).toEqual({
        ...(states[0] as object),
        tenant: A,
        isolation: 'repeatable read',
        readonly: 'on',
      });
  });
  it('READ ONLY rejeita escrita que o runtime normalmente possui em Organizations', async () => {
    await expect(
      database.withAuthorizedTenantReadSnapshot(ctxA, (tx) =>
        tx.execute(
          sql`update organizations set name='Não persistir' where id=${A}`,
        ),
      ),
    ).rejects.toMatchObject({
      cause: expect.objectContaining({ code: '25006' }),
    });
    expect((await service.findById(ctxA, ACT_A))?.id).toBe(ACT_A);
  });
  it('falha SQL real de grants propaga e impede consulta de Activity', async () => {
    vi.spyOn(grantsRepository, 'readMembershipGrants').mockImplementation(
      async (tx, c) => {
        await tx.execute(sql`select 1/0`);
        return realGrants(tx, c);
      },
    );
    const activity = vi.spyOn(
      activityRepository,
      'findVisibleProcessingActivityById',
    );
    await expect(service.findById(ctxA, ACT_A)).rejects.toMatchObject({
      cause: expect.objectContaining({ code: '22012' }),
    });
    expect(activity).not.toHaveBeenCalled();
  });
  it.each(['sucesso', 'rollback'] as const)(
    'limpa tenant LOCAL e reutiliza conexão física após %s',
    async (mode) => {
      let captured: pg.Client | undefined;
      vi.spyOn(activeRepository, 'isMembershipActive').mockImplementation(
        async (tx, c) => {
          // Test-only inspection of Drizzle's borrowed client, without exposing production pool internals.
          const session: unknown = Reflect.get(tx, 'session');
          if (typeof session !== 'object' || session === null)
            throw Error('Session Drizzle ausente.');
          const client: unknown = Reflect.get(session, 'client');
          if (!(client instanceof pg.Client))
            throw Error('Client PostgreSQL ausente.');
          captured = client;
          return realActive(tx, c);
        },
      );
      expect((await service.findById(ctxA, ACT_A))?.id).toBe(ACT_A);
      if (!captured) throw Error('Client não observado.');
      const client = captured;
      // No operations run concurrently in this test. Observe the same idle client after release.
      const initial = (
        await client.query(
          "select pg_backend_pid() as pid,nullif(current_setting('lgpd.organization_id',true),'') as tenant",
        )
      ).rows[0];
      expect(initial.tenant).toBeNull();
      if (mode === 'rollback') {
        vi.spyOn(grantsRepository, 'readMembershipGrants').mockImplementation(
          async (tx, c) => {
            await tx.execute(sql`select 1/0`);
            return realGrants(tx, c);
          },
        );
        await expect(service.findById(ctxA, ACT_A)).rejects.toMatchObject({
          cause: expect.objectContaining({ code: '22012' }),
        });
        vi.mocked(grantsRepository.readMembershipGrants).mockRestore();
      } else expect((await service.findById(ctxA, ACT_A))?.id).toBe(ACT_A);
      expect(captured).toBe(client);
      expect(
        (
          await client.query(
            "select pg_backend_pid() as pid,nullif(current_setting('lgpd.organization_id',true),'') as tenant",
          )
        ).rows[0],
      ).toEqual(initial);
      expect(
        (await client.query('select id from processing_activities')).rows,
      ).toEqual([]);
      expect((await service.findById(ctxB, ACT_B))?.id).toBe(ACT_B);
      expect(captured).toBe(client);
      expect(
        (
          await client.query(
            "select pg_backend_pid() as pid,nullif(current_setting('lgpd.organization_id',true),'') as tenant",
          )
        ).rows[0],
      ).toEqual(initial);
    },
  );
  it('revogação após grants mantém snapshot anterior e aparece na próxima operação', async () => {
    expect((await concurrentAfter('grants', revoke))?.id).toBe(ACT_A);
    expect(await service.findById(ctxA, ACT_A)).toBeNull();
  });
  it('movimentação da área após grants não altera a Activity observada no snapshot', async () => {
    const previous = await concurrentAfter('grants', async (client) => {
      await client.query(
        'update processing_activities set business_unit_id=$1 where id=$2',
        [UNIT_2, ACT_A],
      );
    });
    expect(previous?.businessUnitId).toBe(BU_A);
    expect(await service.findById(ctxA, ACT_A)).toBeNull();
  });
  it('não combina grant antigo com Activity movida para a área revogada', async () => {
    expect(
      await concurrentAfter(
        'grants',
        async (client) => {
          await revoke(client);
          await client.query(
            'update processing_activities set business_unit_id=$1 where id=$2',
            [BU_A, ACT_A2],
          );
        },
        ACT_A2,
      ),
    ).toBeNull();
    expect(await service.findById(ctxA, ACT_A2)).toBeNull();
  });
  it('desativação durante a operação preserva snapshot e é observada na próxima', async () => {
    const previous = await concurrentAfter('membership', async (client) => {
      await client.query(
        'update memberships set active=false where organization_id=$1 and id=$2',
        [A, M_A],
      );
    });
    expect(previous?.id).toBe(ACT_A);
    const grants = vi.spyOn(grantsRepository, 'readMembershipGrants');
    expect(await service.findById(ctxA, ACT_A)).toBeNull();
    expect(grants).not.toHaveBeenCalled();
  });
  it('alteração em outro tenant não interfere na operação em andamento', async () => {
    expect(
      (
        await concurrentAfter('grants', async (client) => {
          await client.query(
            "update processing_activities set name='Outro tenant' where id=$1",
            [ACT_B],
          );
        })
      )?.id,
    ).toBe(ACT_A);
    expect((await service.findById(ctxB, ACT_B))?.name).toBe('Outro tenant');
  });
});
