import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
import { NodePgSession, NodePgTransaction } from 'drizzle-orm/node-postgres';
import type { ExtractTablesWithRelations } from 'drizzle-orm';
import pg from 'pg';
import { MembershipGrantsService } from '../../src/authorization/membership-grants.service.js';
import { createResolvedMembershipGrants } from '../../src/authorization/resolved-membership-grants.js';
import { readMembershipGrants } from '../../src/persistence/membership-grants-repository.js';
import type { DatabaseService } from '../../src/persistence/database.service.js';
import type { TenantTransaction } from '../../src/persistence/tenant-transaction.js';
import type { AuthorizedTenantContext } from '../../src/tenant/authorized-tenant-context.js';
import type * as schema from '../../src/persistence/schema.js';

vi.mock('../../src/persistence/membership-grants-repository.js', () => ({
  readMembershipGrants: vi.fn(),
}));

// A real transaction object, never connected: only its identity crosses the mock.
const pool = new pg.Pool();
const dialect = new PgDialect();
const transaction: TenantTransaction = new NodePgTransaction<
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>(dialect, new NodePgSession(pool, dialect, undefined), undefined);
const read = vi.mocked(readMembershipGrants);
afterAll(async () => {
  await pool.end();
});
beforeEach(() => {
  vi.resetAllMocks();
});

function context() {
  return { membershipId: randomUUID(), authorizedOrganizationId: randomUUID() };
}

describe('MembershipGrantsService', () => {
  it('usa a mesma cópia congelada no boundary transacional e repository e devolve o resultado integral', async () => {
    const source = context();
    const expected = createResolvedMembershipGrants({
      ...source,
      grants: [
        {
          roleAssignmentId: randomUUID(),
          roleCode: 'MANAGER',
          scope: 'BUSINESS_UNIT',
          businessUnitIds: [],
        },
      ],
    });
    read.mockResolvedValue(expected);
    const observed: AuthorizedTenantContext[] = [];
    const database: Pick<DatabaseService, 'withAuthorizedTenant'> = {
      async withAuthorizedTenant(local, operation) {
        observed.push(local);
        expect(local).not.toBe(source);
        expect(Object.isFrozen(local)).toBe(true);
        expect(() =>
          Object.assign(local, { membershipId: randomUUID() }),
        ).toThrow(TypeError);
        source.membershipId = randomUUID();
        source.authorizedOrganizationId = randomUUID();
        return operation(transaction);
      },
    };
    const service = new MembershipGrantsService(database);
    expect(await service.resolve(source)).toBe(expected);
    expect(observed).toHaveLength(1);
    expect(read).toHaveBeenCalledExactlyOnceWith(transaction, observed[0]);
    expect(observed[0]).toEqual({
      membershipId: expected.membershipId,
      authorizedOrganizationId: expected.authorizedOrganizationId,
    });
  });

  it('ignora campos alternativos e não aceita transação como parâmetro da interface', async () => {
    const source = {
      ...context(),
      organizationId: randomUUID(),
      requestedOrganizationId: randomUUID(),
      alternateMembershipId: randomUUID(),
      transaction,
      permissions: ['implicit'],
    };
    const expected = createResolvedMembershipGrants({ ...source, grants: [] });
    read.mockResolvedValue(expected);
    const database: Pick<DatabaseService, 'withAuthorizedTenant'> = {
      async withAuthorizedTenant(local, operation) {
        expect(Object.keys(local).sort()).toEqual([
          'authorizedOrganizationId',
          'membershipId',
        ]);
        return operation(transaction);
      },
    };
    const service = new MembershipGrantsService(database);
    expect(service.resolve.length).toBe(1);
    expect(await service.resolve(source)).toBe(expected);
  });

  it('não mantém estado nem cache, inclusive entre chamadas para o mesmo contexto', async () => {
    const source = context();
    const first = createResolvedMembershipGrants({ ...source, grants: [] });
    const second = createResolvedMembershipGrants({
      ...source,
      grants: [
        {
          roleAssignmentId: randomUUID(),
          roleCode: 'MANAGER',
          scope: 'ORGANIZATION',
          businessUnitIds: [],
        },
      ],
    });
    read.mockResolvedValueOnce(first).mockResolvedValueOnce(second);
    let openings = 0;
    const database: Pick<DatabaseService, 'withAuthorizedTenant'> = {
      async withAuthorizedTenant(_local, operation) {
        openings += 1;
        return operation(transaction);
      },
    };
    const service = new MembershipGrantsService(database);
    const fields = Object.entries(service);
    expect(await service.resolve(source)).toBe(first);
    expect(await service.resolve(source)).toBe(second);
    expect(openings).toBe(2);
    expect(read).toHaveBeenCalledTimes(2);
    expect(read.mock.calls[0]?.[1]).not.toBe(read.mock.calls[1]?.[1]);
    expect(Object.entries(service)).toEqual(fields);
  });

  it('propaga a mesma falha do repository sem fallback vazio', async () => {
    const failure = new Error('falha simulada');
    read.mockRejectedValue(failure);
    const database: Pick<DatabaseService, 'withAuthorizedTenant'> = {
      async withAuthorizedTenant(_local, operation) {
        return operation(transaction);
      },
    };
    await expect(
      new MembershipGrantsService(database).resolve(context()),
    ).rejects.toBe(failure);
  });

  it('propaga falha de abertura/commit sem chamar repository ou retornar vazio', async () => {
    const failure = new Error('falha transacional');
    const database: Pick<DatabaseService, 'withAuthorizedTenant'> = {
      async withAuthorizedTenant() {
        throw failure;
      },
    };
    await expect(
      new MembershipGrantsService(database).resolve(context()),
    ).rejects.toBe(failure);
    expect(read).not.toHaveBeenCalled();
  });
});
