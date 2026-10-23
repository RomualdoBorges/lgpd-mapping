import { randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/node-postgres';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { readMembershipGrants } from '../../src/persistence/membership-grants-repository.js';
import * as schema from '../../src/persistence/schema.js';
import { withTenant } from '../../src/persistence/tenant-transaction.js';
import {
  createTestDatabase,
  A,
  B,
  U,
  M_A,
  M_B,
  BU_A,
  BU_B,
  ROLE,
  GRANT_A,
  GRANT_B,
} from './database.js';

let fixture: Awaited<ReturnType<typeof createTestDatabase>>;
const contextA = Object.freeze({
  membershipId: M_A,
  authorizedOrganizationId: A,
});
const contextB = Object.freeze({
  membershipId: M_B,
  authorizedOrganizationId: B,
});
const pgError = (code: string) => ({
  cause: expect.objectContaining({ code }),
});

beforeAll(async () => {
  fixture = await createTestDatabase();
});
beforeEach(async () => {
  await fixture.reset();
});
afterAll(async () => {
  if (fixture) await fixture.close();
});

function readA() {
  return withTenant(fixture.database, A, (tx) =>
    readMembershipGrants(tx, contextA),
  );
}

describe('S3.5.3 — leitura de grants em PostgreSQL real', () => {
  it('isola Organizations e retorna apenas dados estruturais', async () => {
    expect(await readA()).toEqual({
      ...contextA,
      grants: [
        {
          roleAssignmentId: GRANT_A,
          roleCode: 'MANAGER',
          scope: 'BUSINESS_UNIT',
          businessUnitIds: [BU_A],
        },
      ],
    });
    expect(
      await withTenant(fixture.database, B, (tx) =>
        readMembershipGrants(tx, contextB),
      ),
    ).toEqual({
      ...contextB,
      grants: [
        {
          roleAssignmentId: GRANT_B,
          roleCode: 'MANAGER',
          scope: 'BUSINESS_UNIT',
          businessUnitIds: [BU_B],
        },
      ],
    });
  });

  it('filtra Memberships distintos no mesmo tenant', async () => {
    const user = randomUUID();
    const membership = randomUUID();
    const assignment = randomUUID();
    await fixture.migration.query(
      "insert into users(id,name,email) values($1,'Outra pessoa fictícia','another@example.invalid')",
      [user],
    );
    await withTenant(fixture.database, A, async (tx) => {
      await tx.execute(
        sql`insert into memberships(id,organization_id,user_id,active) values(${membership},${A},${user},true)`,
      );
      await tx.execute(
        sql`insert into role_assignments(id,organization_id,membership_id,role_id,scope) values(${assignment},${A},${membership},${ROLE},'ORGANIZATION')`,
      );
    });
    expect(
      (await readA()).grants.map((grant) => grant.roleAssignmentId),
    ).toEqual([GRANT_A]);
    expect(
      (
        await withTenant(fixture.database, A, (tx) =>
          readMembershipGrants(tx, {
            ...contextA,
            membershipId: membership,
          }),
        )
      ).grants,
    ).toEqual([
      {
        roleAssignmentId: assignment,
        roleCode: 'MANAGER',
        scope: 'ORGANIZATION',
        businessUnitIds: [],
      },
    ]);
  });

  it('preserva múltiplos assignments com Role repetido, sem produto cartesiano', async () => {
    const secondArea = randomUUID();
    const thirdArea = randomUUID();
    const secondGrant = randomUUID();
    const organizationGrant = randomUUID();
    await withTenant(fixture.database, A, async (tx) => {
      await tx.execute(
        sql`insert into business_units(id,organization_id,name) values(${secondArea},${A},'Segunda área'),(${thirdArea},${A},'Terceira área')`,
      );
      await tx.execute(
        sql`insert into role_assignments(id,organization_id,membership_id,role_id,scope) values(${secondGrant},${A},${M_A},${ROLE},'BUSINESS_UNIT'),(${organizationGrant},${A},${M_A},${ROLE},'ORGANIZATION')`,
      );
      await tx.execute(
        sql`insert into role_assignment_business_units(organization_id,role_assignment_id,business_unit_id) values(${A},${secondGrant},${secondArea}),(${A},${GRANT_A},${thirdArea})`,
      );
    });
    const result = await readA();
    expect(result.grants).toHaveLength(3);
    expect(
      result.grants.find((grant) => grant.roleAssignmentId === GRANT_A)
        ?.businessUnitIds,
    ).toEqual([BU_A, thirdArea].sort());
    expect(
      result.grants.find((grant) => grant.roleAssignmentId === secondGrant)
        ?.businessUnitIds,
    ).toEqual([secondArea]);
    expect(
      result.grants.find(
        (grant) => grant.roleAssignmentId === organizationGrant,
      ),
    ).toEqual({
      roleAssignmentId: organizationGrant,
      roleCode: 'MANAGER',
      scope: 'ORGANIZATION',
      businessUnitIds: [],
    });
  });

  it('preserva BUSINESS_UNIT sem áreas', async () => {
    await withTenant(fixture.database, A, (tx) =>
      tx.execute(
        sql`delete from role_assignment_business_units where organization_id=${A} and role_assignment_id=${GRANT_A}`,
      ),
    );
    expect((await readA()).grants).toEqual([
      {
        roleAssignmentId: GRANT_A,
        roleCode: 'MANAGER',
        scope: 'BUSINESS_UNIT',
        businessUnitIds: [],
      },
    ]);
  });

  it('Membership sem grants e Membership inexistente não geram autorização implícita', async () => {
    await withTenant(fixture.database, A, async (tx) => {
      await tx.execute(
        sql`delete from role_assignment_business_units where organization_id=${A} and role_assignment_id=${GRANT_A}`,
      );
      await tx.execute(
        sql`delete from role_assignments where organization_id=${A} and id=${GRANT_A}`,
      );
    });
    expect(await readA()).toEqual({ ...contextA, grants: [] });
    const absent = { ...contextA, membershipId: randomUUID() };
    expect(
      await withTenant(fixture.database, A, (tx) =>
        readMembershipGrants(tx, absent),
      ),
    ).toEqual({ ...absent, grants: [] });
  });

  it('tenant divergente ou ausente não expõe grants nem comprova autorização', async () => {
    expect(
      await withTenant(fixture.database, A, (tx) =>
        readMembershipGrants(tx, contextB),
      ),
    ).toEqual({ ...contextB, grants: [] });
    expect(
      await withTenant(fixture.database, B, (tx) =>
        readMembershipGrants(tx, contextA),
      ),
    ).toEqual({ ...contextA, grants: [] });
    expect(
      await fixture.database.transaction((tx) =>
        readMembershipGrants(tx, contextA),
      ),
    ).toEqual({ ...contextA, grants: [] });
    const mismatched = { ...contextA, membershipId: M_B };
    expect(
      await withTenant(fixture.database, A, (tx) =>
        readMembershipGrants(tx, mismatched),
      ),
    ).toEqual({ ...mismatched, grants: [] });
  });

  it('consulta estado atual após inclusão, alteração e remoção confirmadas', async () => {
    const assignment = randomUUID();
    const anotherRole = randomUUID();
    await fixture.migration.query(
      "insert into roles(id,code) values($1,'DPO')",
      [anotherRole],
    );
    expect((await readA()).grants).toHaveLength(1);
    await withTenant(fixture.database, A, (tx) =>
      tx.execute(
        sql`insert into role_assignments(id,organization_id,membership_id,role_id,scope) values(${assignment},${A},${M_A},${ROLE},'BUSINESS_UNIT')`,
      ),
    );
    expect((await readA()).grants).toHaveLength(2);
    await withTenant(fixture.database, A, async (tx) => {
      await tx.execute(
        sql`update role_assignments set role_id=${anotherRole},scope='ORGANIZATION' where organization_id=${A} and id=${assignment}`,
      );
      await tx.execute(
        sql`delete from role_assignment_business_units where organization_id=${A} and role_assignment_id=${GRANT_A}`,
      );
    });
    const changed = await readA();
    expect(
      changed.grants.find((grant) => grant.roleAssignmentId === assignment),
    ).toEqual({
      roleAssignmentId: assignment,
      roleCode: 'DPO',
      scope: 'ORGANIZATION',
      businessUnitIds: [],
    });
    expect(
      changed.grants.find((grant) => grant.roleAssignmentId === GRANT_A)
        ?.businessUnitIds,
    ).toEqual([]);
    await withTenant(fixture.database, A, (tx) =>
      tx.execute(
        sql`insert into role_assignment_business_units(organization_id,role_assignment_id,business_unit_id) values(${A},${GRANT_A},${BU_A})`,
      ),
    );
    expect(
      (await readA()).grants.find((grant) => grant.roleAssignmentId === GRANT_A)
        ?.businessUnitIds,
    ).toEqual([BU_A]);
    await withTenant(fixture.database, A, (tx) =>
      tx.execute(
        sql`delete from role_assignments where organization_id=${A} and id=${assignment}`,
      ),
    );
    expect(
      (await readA()).grants.map((grant) => grant.roleAssignmentId),
    ).toEqual([GRANT_A]);
  });

  it('não reinterpreta Membership inativa como decisão funcional', async () => {
    await withTenant(fixture.database, A, (tx) =>
      tx.execute(
        sql`update memberships set active=false where organization_id=${A} and id=${M_A}`,
      ),
    );
    // Only S3.4 may establish an authorized tenant; this repository is a structural reader.
    expect((await readA()).grants).toHaveLength(1);
    expect(
      (
        await fixture.runtime.query(
          'select * from auth_private.resolve_membership($1,$2)',
          [U, A],
        )
      ).rows,
    ).toEqual([]);
  });

  it('executa uma única consulta parametrizada e usa somente id/code de Role', async () => {
    const queries: Array<{ query: string; params: unknown[] }> = [];
    const database = drizzle(fixture.runtime, {
      schema,
      logger: {
        logQuery(query: string, params: unknown[]) {
          queries.push({ query, params });
        },
      },
    });
    await withTenant(database, A, async (tx) => {
      queries.length = 0;
      await readMembershipGrants(tx, contextA);
      expect(queries).toHaveLength(1);
      expect(queries[0]?.params).toEqual([A, M_A]);
      expect(queries[0]?.query).toContain('left join "roles"');
      expect(queries[0]?.query).not.toMatch(
        /"roles"\."(?:created_at|updated_at)"/,
      );
      expect(queries[0]?.query).not.toContain('select *');
    });
  });

  it('propaga falha real de persistência sem retornar sucesso vazio', async () => {
    await withTenant(fixture.database, A, async (tx) => {
      await expect(tx.execute(sql`select 1/0`)).rejects.toMatchObject(
        pgError('22012'),
      );
      await expect(readMembershipGrants(tx, contextA)).rejects.toMatchObject(
        pgError('25P02'),
      );
    });
    expect((await readA()).grants).toHaveLength(1);
  });

  it('falha integralmente para Role estruturalmente inválido sem alterar constraints', async () => {
    const invalidRole = randomUUID();
    const invalidAssignment = randomUUID();
    await fixture.migration.query(
      "insert into roles(id,code) values($1,'  ')",
      [invalidRole],
    );
    await withTenant(fixture.database, A, (tx) =>
      tx.execute(
        sql`insert into role_assignments(id,organization_id,membership_id,role_id,scope) values(${invalidAssignment},${A},${M_A},${invalidRole},'BUSINESS_UNIT')`,
      ),
    );
    await expect(readA()).rejects.toThrow(TypeError);
  });

  it('mantém constraints cross-tenant, scope e unicidade das associações', async () => {
    await expect(
      withTenant(fixture.database, A, (tx) =>
        tx.execute(
          sql`insert into role_assignment_business_units(organization_id,role_assignment_id,business_unit_id) values(${A},${GRANT_A},${BU_B})`,
        ),
      ),
    ).rejects.toMatchObject(pgError('23503'));
    await expect(
      withTenant(fixture.database, A, (tx) =>
        tx.execute(
          sql`insert into role_assignments(organization_id,membership_id,role_id,scope) values(${A},${M_B},${ROLE},'ORGANIZATION')`,
        ),
      ),
    ).rejects.toMatchObject(pgError('23503'));
    const organizationGrant = randomUUID();
    await withTenant(fixture.database, A, (tx) =>
      tx.execute(
        sql`insert into role_assignments(id,organization_id,membership_id,role_id,scope) values(${organizationGrant},${A},${M_A},${ROLE},'ORGANIZATION')`,
      ),
    );
    await expect(
      withTenant(fixture.database, A, (tx) =>
        tx.execute(
          sql`insert into role_assignment_business_units(organization_id,role_assignment_id,business_unit_id) values(${A},${organizationGrant},${BU_A})`,
        ),
      ),
    ).rejects.toMatchObject(pgError('23503'));
    await expect(
      withTenant(fixture.database, A, (tx) =>
        tx.execute(
          sql`insert into role_assignment_business_units(organization_id,role_assignment_id,business_unit_id) values(${A},${GRANT_A},${BU_A})`,
        ),
      ),
    ).rejects.toMatchObject(pgError('23505'));
    expect((await readA()).grants).toHaveLength(2);
  });

  it('retorna resultado profundamente imutável e sem dados funcionais', async () => {
    const result = await readA();
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.grants)).toBe(true);
    for (const grant of result.grants) {
      expect(Object.isFrozen(grant)).toBe(true);
      expect(Object.isFrozen(grant.businessUnitIds)).toBe(true);
      expect(Object.keys(grant).sort()).toEqual([
        'businessUnitIds',
        'roleAssignmentId',
        'roleCode',
        'scope',
      ]);
      expect(() => Object.assign(grant, { roleCode: 'CHANGED' })).toThrow(
        TypeError,
      );
    }
  });
});
