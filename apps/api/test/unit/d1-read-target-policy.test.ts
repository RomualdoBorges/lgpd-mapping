import { describe, expect, it } from 'vitest';
import {
  createD1ReadReach,
  createD1ReadTarget,
  D1ReadContractError,
  type D1ReadReach,
  type D1ReadTarget,
} from '../../src/authorization/d1-read-contracts.js';
import { canReadD1Target } from '../../src/authorization/d1-read-target-policy.js';

const M = '00000000-0000-4000-8000-000000000001';
const O = '00000000-0000-4000-8000-000000000002';
const A = '00000000-0000-4000-8000-000000000003';
const B = '00000000-0000-4000-8000-000000000004';
const OTHER = '00000000-0000-4000-8000-000000000005';
function reach(scope = 'BUSINESS_UNIT', businessUnitIds = [A]) {
  return {
    permission: 'processing_activity:read',
    membershipId: M,
    authorizedOrganizationId: O,
    scope,
    businessUnitIds,
  };
}
function target(businessUnitId: string | null = A) {
  return {
    resourceKind: 'ProcessingActivity',
    organizationId: O,
    businessUnitId,
  };
}
// These assertions deliberately exercise JavaScript inputs outside the TS contract.
function check(r: unknown, t: unknown): boolean {
  return canReadD1Target(r as D1ReadReach, t as D1ReadTarget);
}
const operations = [
  {
    permission: 'processing_activity:read',
    resourceKind: 'ProcessingActivity',
    otherKind: 'ROPA',
  },
  {
    permission: 'ropa:read',
    resourceKind: 'ROPA',
    otherKind: 'ProcessingActivity',
  },
];

describe('verificação pura de alvo D1', () => {
  for (const { permission, resourceKind, otherKind } of operations) {
    it(`${permission} exige tipo exato para ambos os scopes`, () => {
      for (const r of [reach(), reach('ORGANIZATION', [])]) {
        expect(check({ ...r, permission }, { ...target(), resourceKind })).toBe(
          true,
        );
        expect(
          check({ ...r, permission }, { ...target(), resourceKind: otherKind }),
        ).toBe(false);
      }
    });
    it(`${permission} nega outro tenant mesmo com o mesmo UUID de área`, () => {
      for (const r of [reach(), reach('ORGANIZATION', [])]) {
        expect(
          check(
            { ...r, permission },
            { ...target(), resourceKind, organizationId: OTHER },
          ),
        ).toBe(false);
      }
    });
    it(`${permission} ORGANIZATION não precisa enumerar áreas`, () => {
      for (const businessUnitId of [A, B, null]) {
        expect(
          check(
            { ...reach('ORGANIZATION', []), permission },
            { ...target(businessUnitId), resourceKind },
          ),
        ).toBe(true);
      }
    });
    it(`${permission} BUSINESS_UNIT exige área explícita e nunca promove conjunto vazio`, () => {
      const r = { ...reach(), permission };
      expect(check(r, { ...target(A), resourceKind })).toBe(true);
      expect(check(r, { ...target(B), resourceKind })).toBe(false);
      expect(check(r, { ...target(null), resourceKind })).toBe(false);
      for (const businessUnitId of [A, B, null]) {
        expect(
          check(
            { ...reach('BUSINESS_UNIT', []), permission },
            { ...target(businessUnitId), resourceKind },
          ),
        ).toBe(false);
      }
    });
  }

  const invalidReaches = [
    null,
    undefined,
    [],
    {},
    { ...reach(), permission: 'ropa:export' },
    { ...reach(), membershipId: 'invalid' },
    { ...reach(), authorizedOrganizationId: 'invalid' },
    reach('UNKNOWN'),
    reach('ORGANIZATION', [A]),
    { ...reach(), businessUnitIds: null },
    reach('BUSINESS_UNIT', ['invalid']),
  ];
  const invalidTargets = [
    null,
    undefined,
    [],
    {},
    { ...target(), resourceKind: 'Supplier' },
    { ...target(), organizationId: 'invalid' },
    { ...target(), businessUnitId: undefined },
    { ...target(), businessUnitId: 'invalid' },
  ];
  it.each(invalidReaches)(
    'rejeita alcance estruturalmente inválido: %j',
    (r) => {
      expect(() => check(r, target())).toThrow(D1ReadContractError);
    },
  );
  it.each(invalidTargets)('rejeita alvo estruturalmente inválido: %j', (t) => {
    expect(() => check(reach(), t)).toThrow(D1ReadContractError);
  });
  it('rejeita ambos inválidos simultaneamente', () => {
    expect(() => check(null, null)).toThrow(D1ReadContractError);
  });
  it.each(invalidTargets)(
    'valida alvo mesmo com alcance vazio ou incompatível: %j',
    (t) => {
      for (const r of [
        reach('BUSINESS_UNIT', []),
        { ...reach(), permission: 'ropa:read' },
      ]) {
        expect(() => check(r, t)).toThrow(D1ReadContractError);
      }
    },
  );
  it('valida alcance mesmo quando o alvo está fora do tenant e do tipo', () => {
    expect(() =>
      check(reach('UNKNOWN'), {
        ...target(),
        organizationId: OTHER,
        resourceKind: 'ROPA',
      }),
    ).toThrow(D1ReadContractError);
  });

  it('captura getters variáveis uma única vez sem reavaliar os argumentos', () => {
    const reads = {
      permission: 0,
      organization: 0,
      scope: 0,
      areas: 0,
      kind: 0,
      targetOrganization: 0,
      area: 0,
    };
    const r = {
      ...reach(),
      get permission() {
        return ++reads.permission === 1
          ? 'processing_activity:read'
          : 'ropa:read';
      },
      get authorizedOrganizationId() {
        return ++reads.organization === 1 ? O : OTHER;
      },
      get scope() {
        return ++reads.scope === 1 ? 'BUSINESS_UNIT' : 'ORGANIZATION';
      },
      get businessUnitIds() {
        return ++reads.areas === 1 ? [A] : '';
      },
    };
    const t = {
      ...target(),
      get resourceKind() {
        return ++reads.kind === 1 ? 'ProcessingActivity' : 'Supplier';
      },
      get organizationId() {
        return ++reads.targetOrganization === 1 ? O : OTHER;
      },
      get businessUnitId() {
        return ++reads.area === 1 ? A : B;
      },
    };
    expect(check(r, t)).toBe(true);
    expect(Object.values(reads)).toEqual([1, 1, 1, 1, 1, 1, 1]);
  });

  it('usa cópias defensivas mesmo se a captura do alvo modificar o alcance original', () => {
    const r = reach();
    const t = {
      ...target(B),
      get resourceKind() {
        r.businessUnitIds.push(B);
        r.scope = 'ORGANIZATION';
        return 'ProcessingActivity';
      },
    };
    expect(check(r, t)).toBe(false);
    expect(r.businessUnitIds).toEqual([A, B]);
  });

  it('não modifica ou congela as entradas e aceita cópias já imutáveis', () => {
    const r = reach();
    const t = target();
    const snapshot = JSON.stringify({ r, t });
    expect(check(r, t)).toBe(true);
    expect(JSON.stringify({ r, t })).toBe(snapshot);
    expect(Object.isFrozen(r)).toBe(false);
    expect(Object.isFrozen(r.businessUnitIds)).toBe(false);
    expect(Object.isFrozen(t)).toBe(false);
    expect(canReadD1Target(createD1ReadReach(r), createD1ReadTarget(t))).toBe(
      true,
    );
  });

  it('não retém alcance, tenant ou operação entre chamadas', () => {
    const first = createD1ReadReach(reach('ORGANIZATION', []));
    const descriptor = createD1ReadTarget(target());
    expect(canReadD1Target(first, descriptor)).toBe(true);
    expect(check(reach('BUSINESS_UNIT', []), target())).toBe(false);
    expect(
      check(
        { ...reach('ORGANIZATION', []), authorizedOrganizationId: OTHER },
        target(),
      ),
    ).toBe(false);
    expect(check({ ...reach(), permission: 'ropa:read' }, target())).toBe(
      false,
    );
    expect(check(reach(), target(B))).toBe(false);
    expect(canReadD1Target(first, descriptor)).toBe(true);
    expect(first.authorizedOrganizationId).toBe(O);
    expect(first.businessUnitIds).toEqual([]);
  });

  it('não expande hierarquia nem utiliza roles, grants ou UUID conhecido como autoridade', () => {
    const r = {
      ...reach(),
      roleCode: 'DPO',
      grants: [{ scope: 'ORGANIZATION' }],
      childBusinessUnitIds: [B],
    };
    const t = { ...target(B), id: OTHER, parentBusinessUnitId: A };
    expect(check(r, t)).toBe(false);
  });

  it('propaga erros de captura sem conversão para false', () => {
    const failure = new Error('falha simulada');
    const t = {
      ...target(),
      get resourceKind() {
        throw failure;
      },
    };
    expect(() => check(reach('BUSINESS_UNIT', []), t)).toThrow(failure);
  });
});
