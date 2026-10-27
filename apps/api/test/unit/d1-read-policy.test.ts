import { describe, expect, it } from 'vitest';
import {
  createD1ReadPolicyInput,
  D1ReadContractError,
  type D1ReadPermission,
  type D1ReadPolicyInput,
} from '../../src/authorization/d1-read-contracts.js';
import { evaluateD1ReadReach } from '../../src/authorization/d1-read-policy.js';

const M = '00000000-0000-4000-8000-000000000001';
const O = '00000000-0000-4000-8000-000000000002';
const A = '00000000-0000-4000-8000-000000000003';
const B = '00000000-0000-4000-8000-000000000004';
const G = '00000000-0000-4000-8000-000000000005';
const H = '00000000-0000-4000-8000-000000000006';
const permissions: D1ReadPermission[] = [
  'processing_activity:read',
  'ropa:read',
];

function grant(
  roleCode = 'MANAGER',
  scope = 'BUSINESS_UNIT',
  businessUnitIds = [A],
  roleAssignmentId = G,
) {
  return { roleAssignmentId, roleCode, scope, businessUnitIds };
}
function input(
  permission: D1ReadPermission = 'processing_activity:read',
  grants = [grant()],
  membershipId = M,
  authorizedOrganizationId = O,
) {
  return {
    permission,
    authorizedTenantContext: { membershipId, authorizedOrganizationId },
    resolvedMembershipGrants: {
      membershipId,
      authorizedOrganizationId,
      grants,
    },
  };
}
function evaluate(source: ReturnType<typeof input>) {
  return evaluateD1ReadReach(createD1ReadPolicyInput(source));
}
// Deliberately cross the static boundary to exercise runtime validation.
function malformed(value: unknown): D1ReadPolicyInput {
  return value as D1ReadPolicyInput;
}

describe('política funcional de leitura D1', () => {
  for (const permission of permissions) {
    for (const role of [
      'COLLABORATOR',
      'MANAGER',
      'DPO',
      'UNKNOWN',
      'manager',
      ' DPO',
      'ADMIN',
      'PLATFORM_ADMIN',
    ]) {
      for (const scope of ['ORGANIZATION', 'BUSINESS_UNIT']) {
        it(`${permission}: ${role}/${scope} aplica somente a combinação exata`, () => {
          const organization = role === 'DPO' && scope === 'ORGANIZATION';
          const applicable =
            scope === 'BUSINESS_UNIT' &&
            (role === 'MANAGER' ||
              (role === 'COLLABORATOR' &&
                permission === 'processing_activity:read'));
          expect(
            evaluate(
              input(permission, [
                grant(role, scope, scope === 'ORGANIZATION' ? [] : [A]),
              ]),
            ),
          ).toEqual({
            permission,
            membershipId: M,
            authorizedOrganizationId: O,
            scope: organization ? 'ORGANIZATION' : 'BUSINESS_UNIT',
            businessUnitIds: applicable ? [A] : [],
          });
        });
      }
    }
  }

  it.each(permissions)(
    'une somente áreas aplicáveis com sobreposição: %s',
    (permission) => {
      const result = evaluate(
        input(permission, [
          grant('MANAGER', 'BUSINESS_UNIT', [A]),
          grant('MANAGER', 'BUSINESS_UNIT', [A, B], H),
        ]),
      );
      expect(new Set(result.businessUnitIds)).toEqual(new Set([A, B]));
      expect(result.businessUnitIds).toHaveLength(2);
    },
  );

  it.each(permissions)(
    'não empresta áreas do COLLABORATOR ao MANAGER: %s',
    (permission) => {
      const result = evaluate(
        input(permission, [
          grant('COLLABORATOR'),
          grant('MANAGER', 'BUSINESS_UNIT', [B], H),
        ]),
      );
      expect(result.businessUnitIds).toEqual(
        permission === 'ropa:read' ? [B] : [A, B],
      );
    },
  );

  it.each(permissions)(
    'DPO organizacional prevalece em ambas as ordens: %s',
    (permission) => {
      const grants = [grant(), grant('DPO', 'ORGANIZATION', [], H)];
      for (const list of [grants, [...grants].reverse()]) {
        const result = evaluate(input(permission, list));
        expect(result.scope).toBe('ORGANIZATION');
        expect(result.businessUnitIds).toEqual([]);
      }
    },
  );

  it.each(permissions)(
    'sem grants ou com BU vazio mantém alcance vazio: %s',
    (permission) => {
      for (const grants of [[], [grant('MANAGER', 'BUSINESS_UNIT', [])]]) {
        expect(evaluate(input(permission, grants))).toEqual({
          permission,
          membershipId: M,
          authorizedOrganizationId: O,
          scope: 'BUSINESS_UNIT',
          businessUnitIds: [],
        });
      }
      expect(
        evaluate(
          input(permission, [
            grant('MANAGER', 'BUSINESS_UNIT', []),
            grant('MANAGER', 'BUSINESS_UNIT', [B], H),
          ]),
        ).businessUnitIds,
      ).toEqual([B]);
    },
  );

  it('duplicatas equivalentes por conjunto não ampliam alcance nem fundem a entrada', () => {
    const source = input('ropa:read', [
      grant('MANAGER', 'BUSINESS_UNIT', [A, B, A]),
      grant('MANAGER', 'BUSINESS_UNIT', [B, A]),
    ]);
    const snapshot = JSON.stringify(source);
    expect(evaluate(source).businessUnitIds).toEqual([A, B]);
    expect(JSON.stringify(source)).toBe(snapshot);
    expect(source.resolvedMembershipGrants.grants).toHaveLength(2);
  });

  it.each([
    grant('DPO'),
    grant('MANAGER', 'ORGANIZATION', []),
    grant('MANAGER', 'BUSINESS_UNIT', [B]),
  ])('rejeita assignment contraditório integralmente: %j', (contradiction) => {
    expect(() =>
      evaluateD1ReadReach(
        malformed(input('ropa:read', [grant(), contradiction])),
      ),
    ).toThrow(D1ReadContractError);
  });

  it('DPO válido não encobre contradição posterior', () => {
    const source = input('ropa:read', [
      grant('DPO', 'ORGANIZATION', [], H),
      grant(),
      grant('MANAGER', 'BUSINESS_UNIT', [B]),
    ]);
    expect(() => evaluateD1ReadReach(malformed(source))).toThrow(
      D1ReadContractError,
    );
  });

  it.each(['membershipId', 'authorizedOrganizationId'])(
    'rejeita divergência de %s',
    (field) => {
      const source = input();
      Object.assign(source.resolvedMembershipGrants, { [field]: B });
      expect(() => evaluateD1ReadReach(malformed(source))).toThrow(
        D1ReadContractError,
      );
    },
  );

  it.each([
    null,
    undefined,
    [],
    {},
    { ...input(), permission: 'ropa:export' },
    { ...input(), authorizedTenantContext: null },
    {
      ...input(),
      resolvedMembershipGrants: {
        membershipId: M,
        authorizedOrganizationId: O,
        grants: null,
      },
    },
    input('ropa:read', [grant('MANAGER', 'UNKNOWN')]),
    input('ropa:read', [grant('MANAGER', 'ORGANIZATION', [A])]),
    input('ropa:read', [grant('MANAGER', 'BUSINESS_UNIT', ['invalid'])]),
    input('ropa:read', [grant('MANAGER', 'BUSINESS_UNIT', [A], 'invalid')]),
    input('ropa:read', [grant(' ')]),
  ])('rejeita entrada inválida sem produzir vazio: %j', (source) => {
    expect(() => evaluateD1ReadReach(malformed(source))).toThrow(
      D1ReadContractError,
    );
  });

  it('usa somente a captura validada de getters variáveis', () => {
    let operations = 0;
    let roles = 0;
    let scopes = 0;
    let areas = 0;
    const source = {
      ...input(),
      get permission() {
        return ++operations === 1 ? 'ropa:read' : 'processing_activity:read';
      },
      resolvedMembershipGrants: {
        ...input().resolvedMembershipGrants,
        grants: [
          {
            ...grant(),
            get roleCode() {
              return ++roles === 1 ? 'COLLABORATOR' : 'MANAGER';
            },
            get scope() {
              return ++scopes === 1 ? 'BUSINESS_UNIT' : 'ORGANIZATION';
            },
            get businessUnitIds() {
              return ++areas === 1 ? [A] : '';
            },
          },
        ],
      },
    };
    expect(evaluateD1ReadReach(malformed(source)).businessUnitIds).toEqual([]);
    expect([operations, roles, scopes, areas]).toEqual([1, 1, 1, 1]);
  });

  it('não converte exceções de entrada em ausência de acesso', () => {
    const failure = new Error('falha de captura');
    const source = {
      ...input(),
      get permission() {
        throw failure;
      },
    };
    expect(() => evaluateD1ReadReach(malformed(source))).toThrow(failure);
  });

  it('preserva entradas e produz resultado profundamente imutável e independente', () => {
    const source = input();
    const snapshot = JSON.stringify(source);
    const result = evaluateD1ReadReach(malformed(source));
    expect(JSON.stringify(source)).toBe(snapshot);
    expect(Object.isFrozen(source)).toBe(false);
    expect(
      Object.isFrozen(
        source.resolvedMembershipGrants.grants[0]?.businessUnitIds,
      ),
    ).toBe(false);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.businessUnitIds)).toBe(true);
    expect(() => Object.assign(result, { membershipId: B })).toThrow(TypeError);
    expect(() => Object.assign(result.businessUnitIds, { 0: B })).toThrow(
      TypeError,
    );
    source.resolvedMembershipGrants.grants[0]?.businessUnitIds.push(B);
    source.authorizedTenantContext.membershipId = B;
    expect(result.membershipId).toBe(M);
    expect(result.businessUnitIds).toEqual([A]);
    const frozenInput = createD1ReadPolicyInput(input());
    expect(() => evaluateD1ReadReach(frozenInput)).not.toThrow();
    const organization = evaluate(
      input('ropa:read', [grant('DPO', 'ORGANIZATION', [])]),
    );
    expect(Object.isFrozen(organization.businessUnitIds)).toBe(true);
  });

  it('não mantém alcance ou identidades entre chamadas sucessivas', () => {
    const first = evaluate(
      input('ropa:read', [grant('DPO', 'ORGANIZATION', [])]),
    );
    const second = evaluate(
      input(
        'processing_activity:read',
        [grant('MANAGER', 'BUSINESS_UNIT', [B])],
        H,
        A,
      ),
    );
    const third = evaluate(input('ropa:read', [], M, O));
    expect(first.scope).toBe('ORGANIZATION');
    expect(second).toEqual({
      permission: 'processing_activity:read',
      membershipId: H,
      authorizedOrganizationId: A,
      scope: 'BUSINESS_UNIT',
      businessUnitIds: [B],
    });
    expect(third).toEqual({
      permission: 'ropa:read',
      membershipId: M,
      authorizedOrganizationId: O,
      scope: 'BUSINESS_UNIT',
      businessUnitIds: [],
    });
  });

  it('não expande áreas por hierarquia nem aceita áreas extras como autoridade', () => {
    const source = {
      ...input(),
      childBusinessUnitIds: [B],
      organizationId: B,
      membershipId: H,
    };
    const result = evaluateD1ReadReach(malformed(source));
    expect(result.businessUnitIds).toEqual([A]);
    expect(result.authorizedOrganizationId).toBe(O);
    expect(result.membershipId).toBe(M);
  });
});
