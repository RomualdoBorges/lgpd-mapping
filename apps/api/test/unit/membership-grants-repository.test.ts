import { randomUUID } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { mapMembershipGrantRows } from '../../src/persistence/membership-grants-repository.js';

const context = Object.freeze({
  membershipId: randomUUID(),
  authorizedOrganizationId: randomUUID(),
});
const roleId = randomUUID();

function row() {
  const businessUnitId = randomUUID();
  return {
    roleAssignmentId: randomUUID(),
    organizationId: context.authorizedOrganizationId,
    membershipId: context.membershipId,
    roleId,
    resolvedRoleId: roleId,
    roleCode: 'MANAGER',
    scope: 'BUSINESS_UNIT',
    resolvedMembershipId: context.membershipId,
    businessUnitId,
    associationScope: 'BUSINESS_UNIT',
    resolvedBusinessUnitId: businessUnitId,
  };
}

describe('mapper de linhas de concessões', () => {
  it('agrupa por assignment, inclusive com Role repetido e linhas intercaladas', () => {
    const first = row();
    const second = row();
    const extraArea = row();
    const result = mapMembershipGrantRows(
      [
        first,
        second,
        {
          ...first,
          businessUnitId: extraArea.businessUnitId,
          resolvedBusinessUnitId: extraArea.businessUnitId,
        },
      ],
      context,
    );
    expect(result.grants).toEqual([
      {
        roleAssignmentId: first.roleAssignmentId,
        roleCode: 'MANAGER',
        scope: 'BUSINESS_UNIT',
        businessUnitIds: [first.businessUnitId, extraArea.businessUnitId],
      },
      {
        roleAssignmentId: second.roleAssignmentId,
        roleCode: 'MANAGER',
        scope: 'BUSINESS_UNIT',
        businessUnitIds: [second.businessUnitId],
      },
    ]);
  });

  it.each(['ORGANIZATION', 'BUSINESS_UNIT'])(
    'preserva %s sem associações',
    (scope) => {
      const source = {
        ...row(),
        scope,
        businessUnitId: null,
        associationScope: null,
        resolvedBusinessUnitId: null,
      };
      expect(mapMembershipGrantRows([source], context).grants).toEqual([
        {
          roleAssignmentId: source.roleAssignmentId,
          roleCode: source.roleCode,
          scope,
          businessUnitIds: [],
        },
      ]);
    },
  );

  it('sem linhas não infere autenticação ou autorização', () => {
    expect(mapMembershipGrantRows([], context)).toEqual({
      ...context,
      grants: [],
    });
  });

  it.each([
    { organizationId: randomUUID() },
    { membershipId: randomUUID() },
    { resolvedMembershipId: null },
    { resolvedMembershipId: randomUUID() },
    { roleAssignmentId: 'invalid' },
    { roleId: 'invalid', resolvedRoleId: 'invalid' },
    { resolvedRoleId: null },
    { resolvedRoleId: randomUUID() },
    { roleCode: '' },
    { roleCode: '  ' },
    { roleCode: null },
    { scope: 'OWN' },
    { scope: 'UNKNOWN' },
    { businessUnitId: 'invalid', resolvedBusinessUnitId: 'invalid' },
    { resolvedBusinessUnitId: null },
    { resolvedBusinessUnitId: randomUUID() },
    { associationScope: 'ORGANIZATION' },
    { scope: 'ORGANIZATION' },
    { businessUnitId: null },
    { businessUnitId: null, associationScope: null },
  ])('rejeita integralmente referência/estrutura inválida: %j', (patch) => {
    expect(() =>
      mapMembershipGrantRows([row(), { ...row(), ...patch }], context),
    ).toThrow(TypeError);
  });

  it.each([null, undefined, {}, [null], [undefined], new Array(1)])(
    'rejeita linhas inválidas em runtime: %j',
    (rows) => {
      expect(() => mapMembershipGrantRows(rows, context)).toThrow(TypeError);
    },
  );

  it.each([
    { roleId: randomUUID(), resolvedRoleId: randomUUID() },
    { roleCode: 'OTHER_CODE' },
    {
      scope: 'ORGANIZATION',
      businessUnitId: null,
      associationScope: null,
      resolvedBusinessUnitId: null,
    },
    {
      businessUnitId: null,
      associationScope: null,
      resolvedBusinessUnitId: null,
    },
  ])('rejeita divergência entre linhas do mesmo assignment: %j', (patch) => {
    const source = row();
    expect(() =>
      mapMembershipGrantRows([source, { ...source, ...patch }], context),
    ).toThrow(TypeError);
  });

  it('rejeita Role divergente mesmo se cada referência isolada for válida', () => {
    const source = row();
    const anotherRole = randomUUID();
    expect(() =>
      mapMembershipGrantRows(
        [
          source,
          {
            ...source,
            roleId: anotherRole,
            resolvedRoleId: anotherRole,
          },
        ],
        context,
      ),
    ).toThrow(TypeError);
  });

  it('valida o contexto mesmo quando não há linhas', () => {
    expect(() =>
      mapMembershipGrantRows([], { ...context, membershipId: 'invalid' }),
    ).toThrow(TypeError);
    expect(() =>
      mapMembershipGrantRows([], {
        ...context,
        authorizedOrganizationId: 'invalid',
      }),
    ).toThrow(TypeError);
  });

  it('retorna cópias imutáveis sem campos ou permissions internos', () => {
    const source = row();
    const area = source.businessUnitId;
    const rows = [source];
    const result = mapMembershipGrantRows(rows, context);
    source.businessUnitId = randomUUID();
    source.roleCode = 'CHANGED';
    rows.length = 0;
    expect(Object.keys(result).sort()).toEqual([
      'authorizedOrganizationId',
      'grants',
      'membershipId',
    ]);
    expect(result.grants).toEqual([
      {
        roleAssignmentId: source.roleAssignmentId,
        roleCode: 'MANAGER',
        scope: 'BUSINESS_UNIT',
        businessUnitIds: [area],
      },
    ]);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.grants)).toBe(true);
    for (const grant of result.grants) {
      expect(Object.isFrozen(grant)).toBe(true);
      expect(Object.isFrozen(grant.businessUnitIds)).toBe(true);
      expect(() => Object.assign(grant, { scope: 'ORGANIZATION' })).toThrow(
        TypeError,
      );
      expect(() =>
        Array.prototype.push.call(grant.businessUnitIds, randomUUID()),
      ).toThrow(TypeError);
    }
  });
});
