import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { createResolvedMembershipGrants } from '../../src/authorization/resolved-membership-grants.js';

function grant(scope = 'BUSINESS_UNIT', businessUnitIds: string[] = []) {
  return {
    roleAssignmentId: randomUUID(),
    roleCode: 'MANAGER',
    scope,
    businessUnitIds,
  };
}

function input(grants = [grant()]) {
  return {
    membershipId: randomUUID(),
    authorizedOrganizationId: randomUUID(),
    grants,
  };
}

describe('ResolvedMembershipGrants — contrato estrutural', () => {
  it('preserva o contexto e grants independentes com Role repetido e scopes distintos', () => {
    const areaA = randomUUID();
    const areaB = randomUUID();
    const source = input([
      grant('BUSINESS_UNIT', [areaA]),
      grant('BUSINESS_UNIT', [areaB]),
      grant('ORGANIZATION'),
    ]);
    const result = createResolvedMembershipGrants(source);

    expect(result).toEqual(source);
    expect(result.grants).toHaveLength(3);
    expect(result.grants.map((item) => item.businessUnitIds)).toEqual([
      [areaA],
      [areaB],
      [],
    ]);
  });

  it('preserva todas e somente as áreas explicitamente fornecidas', () => {
    const areas = [randomUUID(), randomUUID()];
    expect(
      createResolvedMembershipGrants(input([grant('BUSINESS_UNIT', areas)]))
        .grants[0]?.businessUnitIds,
    ).toEqual(areas);
  });

  it.each(['ORGANIZATION', 'BUSINESS_UNIT'])(
    '%s aceita áreas vazias',
    (scope) => {
      expect(
        createResolvedMembershipGrants(input([grant(scope)])).grants,
      ).toEqual([expect.objectContaining({ scope, businessUnitIds: [] })]);
    },
  );

  it('sem concessões mantém coleção vazia sem papel padrão', () => {
    const source = input([]);
    expect(createResolvedMembershipGrants(source)).toEqual(source);
  });

  it('rejeita ORGANIZATION com áreas', () => {
    expect(() =>
      createResolvedMembershipGrants(
        input([grant('ORGANIZATION', [randomUUID()])]),
      ),
    ).toThrow(TypeError);
  });

  it.each(['OWN', 'PLATFORM', 'organization', '', 'UNKNOWN'])(
    'rejeita scope não aprovado: %j',
    (scope) => {
      expect(() =>
        createResolvedMembershipGrants(input([grant(scope)])),
      ).toThrow(TypeError);
    },
  );

  it.each([null, undefined, false, 1, 'value', [], {}])(
    'rejeita envelope inválido: %j',
    (value) => {
      expect(() => createResolvedMembershipGrants(value)).toThrow(TypeError);
    },
  );

  it.each([
    { membershipId: undefined },
    { membershipId: 'invalid' },
    { authorizedOrganizationId: null },
    { authorizedOrganizationId: 'invalid' },
    { grants: undefined },
    { grants: null },
    { grants: {} },
    { grants: [null] },
    { grants: new Array(1) },
  ])('rejeita estrutura incompleta ou inválida: %j', (patch) => {
    expect(() =>
      createResolvedMembershipGrants({ ...input(), ...patch }),
    ).toThrow(TypeError);
  });

  it.each([
    { roleAssignmentId: 'invalid' },
    { roleAssignmentId: undefined },
    { roleCode: undefined },
    { roleCode: 1 },
    { roleCode: '' },
    { roleCode: '  ' },
    { scope: null },
    { businessUnitIds: undefined },
    { businessUnitIds: 'invalid' },
    { businessUnitIds: [null] },
    { businessUnitIds: ['invalid'] },
    { businessUnitIds: new Array(1) },
  ])('rejeita grant estruturalmente inválido: %j', (patch) => {
    expect(() =>
      createResolvedMembershipGrants({
        ...input(),
        grants: [{ ...grant(), ...patch }],
      }),
    ).toThrow(TypeError);
  });

  it('falha integralmente quando um grant posterior é inválido, sem expor entradas no erro', () => {
    const source = input([grant(), grant('UNKNOWN')]);
    expect(() => createResolvedMembershipGrants(source)).toThrow(
      new TypeError('Contrato estrutural de concessões inválido.'),
    );
    expect(Object.isFrozen(source.grants[0])).toBe(false);
  });

  it('copia defensivamente sem congelar ou compartilhar as entradas', () => {
    const area = randomUUID();
    const originalGrant = grant('BUSINESS_UNIT', [area]);
    const source = input([originalGrant]);
    const result = createResolvedMembershipGrants(source);
    expect(result).not.toBe(source);
    expect(result.grants).not.toBe(source.grants);
    expect(result.grants[0]).not.toBe(originalGrant);
    expect(result.grants[0]?.businessUnitIds).not.toBe(
      originalGrant.businessUnitIds,
    );

    source.membershipId = randomUUID();
    originalGrant.roleCode = 'ALTERED';
    originalGrant.businessUnitIds.push(randomUUID());
    source.grants.length = 0;
    expect(result.membershipId).not.toBe(source.membershipId);
    expect(result.grants).toHaveLength(1);
    expect(result.grants[0]).toMatchObject({
      roleCode: 'MANAGER',
      businessUnitIds: [area],
    });
  });

  it('congela envelope, grants, cada grant e cada array de áreas', () => {
    const result = createResolvedMembershipGrants(
      input([grant('BUSINESS_UNIT', [randomUUID()]), grant('ORGANIZATION')]),
    );
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.grants)).toBe(true);
    expect(() => Object.assign(result, { membershipId: randomUUID() })).toThrow(
      TypeError,
    );
    expect(() => Array.prototype.push.call(result.grants, grant())).toThrow(
      TypeError,
    );
    for (const item of result.grants) {
      expect(Object.isFrozen(item)).toBe(true);
      expect(Object.isFrozen(item.businessUnitIds)).toBe(true);
      expect(() => Object.assign(item, { scope: 'ORGANIZATION' })).toThrow(
        TypeError,
      );
      expect(() =>
        Array.prototype.push.call(item.businessUnitIds, randomUUID()),
      ).toThrow(TypeError);
    }
    expect(
      Object.isFrozen(createResolvedMembershipGrants(input([])).grants),
    ).toBe(true);
  });

  it('não define catálogo de roles nem incorpora autorização funcional', () => {
    const source = input([{ ...grant(), roleCode: 'STRUCTURAL_TEST_CODE' }]);
    const result = createResolvedMembershipGrants({
      ...source,
      permissions: ['implicit'],
      grants: [
        { ...source.grants[0], permissions: ['implicit'], allowed: true },
      ],
    });
    expect(Object.keys(result).sort()).toEqual([
      'authorizedOrganizationId',
      'grants',
      'membershipId',
    ]);
    expect(Object.keys(result.grants[0] ?? {}).sort()).toEqual([
      'businessUnitIds',
      'roleAssignmentId',
      'roleCode',
      'scope',
    ]);
    expect(result.grants[0]?.roleCode).toBe('STRUCTURAL_TEST_CODE');
  });
});
