import { describe, expect, it, vi } from 'vitest';
import { D1ReadAuthorizationService } from '../../src/authorization/d1-read-authorization.service.js';
import {
  D1ReadContractError,
  type D1ReadPermission,
} from '../../src/authorization/d1-read-contracts.js';
import {
  createResolvedMembershipGrants,
  type ResolvedMembershipGrants,
} from '../../src/authorization/resolved-membership-grants.js';
import type { AuthorizedTenantContext } from '../../src/tenant/authorized-tenant-context.js';

const M = '00000000-0000-4000-8000-000000000001';
const O = '00000000-0000-4000-8000-000000000002';
const A = '00000000-0000-4000-8000-000000000003';
const B = '00000000-0000-4000-8000-000000000004';
const OTHER = '00000000-0000-4000-8000-000000000005';
const G = '00000000-0000-4000-8000-000000000006';
const context = () => ({ membershipId: M, authorizedOrganizationId: O });
function envelope(
  c = context(),
  roleCode = 'MANAGER',
  scope = 'BUSINESS_UNIT',
  businessUnitIds = [A],
) {
  return createResolvedMembershipGrants({
    ...c,
    grants: [{ roleAssignmentId: G, roleCode, scope, businessUnitIds }],
  });
}
function resolver() {
  return vi.fn<
    (context: AuthorizedTenantContext) => Promise<ResolvedMembershipGrants>
  >();
}

describe('composição interna de alcance D1', () => {
  it.each([
    {
      permission: 'processing_activity:read',
      role: 'COLLABORATOR',
      scope: 'BUSINESS_UNIT',
      areas: [A],
      expectedScope: 'BUSINESS_UNIT',
      expectedAreas: [A],
    },
    {
      permission: 'ropa:read',
      role: 'COLLABORATOR',
      scope: 'BUSINESS_UNIT',
      areas: [A],
      expectedScope: 'BUSINESS_UNIT',
      expectedAreas: [],
    },
    {
      permission: 'processing_activity:read',
      role: 'MANAGER',
      scope: 'BUSINESS_UNIT',
      areas: [A],
      expectedScope: 'BUSINESS_UNIT',
      expectedAreas: [A],
    },
    {
      permission: 'ropa:read',
      role: 'MANAGER',
      scope: 'BUSINESS_UNIT',
      areas: [A],
      expectedScope: 'BUSINESS_UNIT',
      expectedAreas: [A],
    },
    {
      permission: 'processing_activity:read',
      role: 'DPO',
      scope: 'ORGANIZATION',
      areas: [],
      expectedScope: 'ORGANIZATION',
      expectedAreas: [],
    },
    {
      permission: 'ropa:read',
      role: 'DPO',
      scope: 'ORGANIZATION',
      areas: [],
      expectedScope: 'ORGANIZATION',
      expectedAreas: [],
    },
    {
      permission: 'ropa:read',
      role: 'UNKNOWN',
      scope: 'BUSINESS_UNIT',
      areas: [A],
      expectedScope: 'BUSINESS_UNIT',
      expectedAreas: [],
    },
    {
      permission: 'ropa:read',
      role: 'MANAGER',
      scope: 'BUSINESS_UNIT',
      areas: [],
      expectedScope: 'BUSINESS_UNIT',
      expectedAreas: [],
    },
  ] satisfies Array<{
    permission: D1ReadPermission;
    role: string;
    scope: string;
    areas: string[];
    expectedScope: string;
    expectedAreas: string[];
  }>)(
    '$role/$scope para $permission retorna somente alcance calculado',
    async ({
      permission,
      role,
      scope,
      areas,
      expectedScope,
      expectedAreas,
    }) => {
      const source = context();
      const resolve = resolver().mockResolvedValue(
        envelope(source, role, scope, areas),
      );
      const result = await new D1ReadAuthorizationService({
        resolve,
      }).resolveReach(source, permission);
      expect(result).toEqual({
        permission,
        ...source,
        scope: expectedScope,
        businessUnitIds: expectedAreas,
      });
      expect(resolve).toHaveBeenCalledExactlyOnceWith(source);
      const local = resolve.mock.calls[0]?.[0];
      expect(local).not.toBe(source);
      expect(Object.isFrozen(local)).toBe(true);
      expect(Object.keys(local ?? {}).sort()).toEqual([
        'authorizedOrganizationId',
        'membershipId',
      ]);
      expect(Object.isFrozen(result)).toBe(true);
      expect(Object.isFrozen(result.businessUnitIds)).toBe(true);
    },
  );

  it('retorna vazio legítimo quando a resolução não encontra grants', async () => {
    const resolve = resolver().mockResolvedValue(
      createResolvedMembershipGrants({ ...context(), grants: [] }),
    );
    await expect(
      new D1ReadAuthorizationService({ resolve }).resolveReach(
        context(),
        'ropa:read',
      ),
    ).resolves.toEqual({
      permission: 'ropa:read',
      ...context(),
      scope: 'BUSINESS_UNIT',
      businessUnitIds: [],
    });
    expect(resolve).toHaveBeenCalledTimes(1);
  });

  it.each(['membershipId', 'authorizedOrganizationId'])(
    'rejeita grants divergentes em %s',
    async (field) => {
      const resolve = resolver().mockResolvedValue(
        createResolvedMembershipGrants({
          ...context(),
          [field]: OTHER,
          grants: [],
        }),
      );
      await expect(
        new D1ReadAuthorizationService({ resolve }).resolveReach(
          context(),
          'ropa:read',
        ),
      ).rejects.toBeInstanceOf(D1ReadContractError);
      expect(resolve).toHaveBeenCalledTimes(1);
    },
  );

  it.each([
    null,
    undefined,
    [],
    {},
    { membershipId: 'invalid', authorizedOrganizationId: O },
    { membershipId: M, authorizedOrganizationId: 'invalid' },
  ])('rejeita contexto inválido antes do resolver: %j', async (source) => {
    const resolve = resolver();
    await expect(
      new D1ReadAuthorizationService({ resolve }).resolveReach(
        source as AuthorizedTenantContext,
        'ropa:read',
      ),
    ).rejects.toBeInstanceOf(D1ReadContractError);
    expect(resolve).not.toHaveBeenCalled();
  });

  it.each(['ropa:export', '', null, undefined])(
    'rejeita permission inválida antes do resolver: %j',
    async (permission) => {
      const resolve = resolver();
      await expect(
        new D1ReadAuthorizationService({ resolve }).resolveReach(
          context(),
          permission as D1ReadPermission,
        ),
      ).rejects.toBeInstanceOf(D1ReadContractError);
      expect(resolve).not.toHaveBeenCalled();
    },
  );

  it('propaga a mesma falha sem devolver resultado parcial ou vazio', async () => {
    const failure = new Error('falha de persistência');
    const resolve = resolver().mockRejectedValue(failure);
    let returned: unknown;
    await expect(
      new D1ReadAuthorizationService({ resolve })
        .resolveReach(context(), 'ropa:read')
        .then((result) => {
          returned = result;
        }),
    ).rejects.toBe(failure);
    expect(returned).toBeUndefined();
    expect(resolve).toHaveBeenCalledTimes(1);
  });

  it('captura contexto e permission antes do await e ignora campos alternativos', async () => {
    const source = {
      ...context(),
      grants: [],
      scope: 'ORGANIZATION',
      organizationId: OTHER,
      transaction: {},
      reach: {},
    };
    const before = JSON.stringify(source);
    const operation = { value: 'ropa:read' };
    let operationReads = 0;
    const request = {
      get permission() {
        operationReads++;
        return operation.value;
      },
    };
    let complete: ((value: ResolvedMembershipGrants) => void) | undefined;
    const pending = new Promise<ResolvedMembershipGrants>((done) => {
      complete = done;
    });
    const resolve = resolver().mockImplementation((local) => {
      expect(local).toEqual(context());
      expect(local).not.toBe(source);
      expect(Object.isFrozen(local)).toBe(true);
      expect(() => Object.assign(local, { membershipId: OTHER })).toThrow(
        TypeError,
      );
      expect(JSON.stringify(source)).toBe(before);
      return pending;
    });
    const result = new D1ReadAuthorizationService({ resolve }).resolveReach(
      source,
      request.permission as D1ReadPermission,
    );
    expect(resolve).toHaveBeenCalledTimes(1);
    source.membershipId = OTHER;
    source.authorizedOrganizationId = OTHER;
    operation.value = 'processing_activity:read';
    if (!complete) throw new Error('Resolver pendente ausente.');
    complete(envelope(context(), 'COLLABORATOR'));
    await expect(result).resolves.toEqual({
      permission: 'ropa:read',
      ...context(),
      scope: 'BUSINESS_UNIT',
      businessUnitIds: [],
    });
    expect(operationReads).toBe(1);
    expect(source.membershipId).toBe(OTHER);
  });

  it('captura getters de identidade uma vez sem reler o contexto depois da resolução', async () => {
    let membershipReads = 0;
    let organizationReads = 0;
    const source = {
      get membershipId() {
        return ++membershipReads === 1 ? M : OTHER;
      },
      get authorizedOrganizationId() {
        return ++organizationReads === 1 ? O : OTHER;
      },
    };
    const resolve = resolver().mockResolvedValue(envelope());
    await expect(
      new D1ReadAuthorizationService({ resolve }).resolveReach(
        source,
        'ropa:read',
      ),
    ).resolves.toEqual({
      permission: 'ropa:read',
      ...context(),
      scope: 'BUSINESS_UNIT',
      businessUnitIds: [A],
    });
    expect(resolve).toHaveBeenCalledExactlyOnceWith(context());
    expect([membershipReads, organizationReads]).toEqual([1, 1]);
  });

  it('não modifica entradas nem reutiliza arrays mutáveis do resolver', async () => {
    const source = context();
    const raw = {
      ...context(),
      grants: [
        {
          roleAssignmentId: G,
          roleCode: 'MANAGER',
          scope: 'BUSINESS_UNIT' as const,
          businessUnitIds: [A],
        },
      ],
    };
    const snapshot = JSON.stringify({ source, raw });
    const resolve = resolver().mockResolvedValue(raw);
    const result = await new D1ReadAuthorizationService({
      resolve,
    }).resolveReach(source, 'ropa:read');
    expect(JSON.stringify({ source, raw })).toBe(snapshot);
    expect(Object.isFrozen(source)).toBe(false);
    expect(Object.isFrozen(raw.grants[0]?.businessUnitIds)).toBe(false);
    raw.grants[0]?.businessUnitIds.push(B);
    source.membershipId = OTHER;
    expect(result.businessUnitIds).toEqual([A]);
    expect(result.membershipId).toBe(M);
    expect(() => Object.assign(result.businessUnitIds, { 0: B })).toThrow(
      TypeError,
    );
  });

  it.each([
    {
      name: 'Memberships no mesmo tenant',
      second: { membershipId: OTHER, authorizedOrganizationId: O },
    },
    {
      name: 'Organizations distintas',
      second: { membershipId: OTHER, authorizedOrganizationId: OTHER },
    },
  ])('não compartilha alcance entre $name', async ({ second }) => {
    const resolve = resolver()
      .mockResolvedValueOnce(envelope())
      .mockResolvedValueOnce(envelope(second, 'MANAGER', 'BUSINESS_UNIT', [B]))
      .mockResolvedValueOnce(
        createResolvedMembershipGrants({ ...context(), grants: [] }),
      );
    const service = new D1ReadAuthorizationService({ resolve });
    const first = await service.resolveReach(context(), 'ropa:read');
    expect(first).toEqual({
      permission: 'ropa:read',
      ...context(),
      scope: 'BUSINESS_UNIT',
      businessUnitIds: [A],
    });
    expect(await service.resolveReach(second, 'ropa:read')).toEqual({
      permission: 'ropa:read',
      ...second,
      scope: 'BUSINESS_UNIT',
      businessUnitIds: [B],
    });
    expect(await service.resolveReach(context(), 'ropa:read')).toEqual({
      permission: 'ropa:read',
      ...context(),
      scope: 'BUSINESS_UNIT',
      businessUnitIds: [],
    });
    expect(first.businessUnitIds).toEqual([A]);
    expect(resolve).toHaveBeenCalledTimes(3);
    expect(resolve.mock.calls.map(([c]) => c)).toEqual([
      context(),
      second,
      context(),
    ]);
    expect(resolve.mock.calls[0]?.[0]).not.toBe(resolve.mock.calls[2]?.[0]);
  });
});
