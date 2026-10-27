import { describe, expect, it } from 'vitest';
import {
  createD1ReadPolicyInput,
  createD1ReadReach,
  createD1ReadTarget,
  D1ReadContractError,
} from '../../src/authorization/d1-read-contracts.js';

const M = '00000000-0000-4000-8000-000000000001';
const O = '00000000-0000-4000-8000-000000000002';
const A = '00000000-0000-4000-8000-000000000003';
const B = '00000000-0000-4000-8000-000000000004';
const G = '00000000-0000-4000-8000-000000000005';
const G2 = '00000000-0000-4000-8000-000000000006';

function grant(scope = 'BUSINESS_UNIT', businessUnitIds = [A]) {
  return { roleAssignmentId: G, roleCode: 'MANAGER', scope, businessUnitIds };
}
function input(grants = [grant()]) {
  return {
    permission: 'processing_activity:read',
    authorizedTenantContext: { membershipId: M, authorizedOrganizationId: O },
    resolvedMembershipGrants: {
      membershipId: M,
      authorizedOrganizationId: O,
      grants,
    },
  };
}
function reach(scope = 'BUSINESS_UNIT', businessUnitIds = [A]) {
  return {
    permission: 'ropa:read',
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

describe('contratos internos de leitura D1', () => {
  it.each(['processing_activity:read', 'ropa:read'])(
    'aceita a permission exata %s sem decidir acesso',
    (permission) => {
      expect(
        createD1ReadPolicyInput({ ...input(), permission }).permission,
      ).toBe(permission);
      expect(createD1ReadReach({ ...reach(), permission }).permission).toBe(
        permission,
      );
    },
  );

  it.each([
    '',
    'ropa:export',
    'processing_activity:update',
    'ROPA:READ',
    ' ropa:read',
    null,
    undefined,
    1,
  ])('rejeita permission desconhecida em runtime: %j', (permission) => {
    expect(() => createD1ReadPolicyInput({ ...input(), permission })).toThrow(
      D1ReadContractError,
    );
    expect(() => createD1ReadReach({ ...reach(), permission })).toThrow(
      D1ReadContractError,
    );
  });

  it.each(['membershipId', 'authorizedOrganizationId'])(
    'rejeita divergência de %s entre contexto e envelope',
    (field) => {
      const source = input();
      Object.assign(source.resolvedMembershipGrants, { [field]: B });
      expect(() => createD1ReadPolicyInput(source)).toThrow(
        D1ReadContractError,
      );
    },
  );

  it.each([null, undefined, [], 'input', 1, {}])(
    'rejeita envelope malformado: %j',
    (value) => {
      for (const create of [
        createD1ReadPolicyInput,
        createD1ReadReach,
        createD1ReadTarget,
      ])
        expect(() => create(value)).toThrow(D1ReadContractError);
    },
  );

  it.each([
    null,
    [],
    {},
    { membershipId: M },
    { membershipId: 'invalid', authorizedOrganizationId: O },
    { membershipId: M, authorizedOrganizationId: 'invalid' },
  ])('rejeita contexto inválido: %j', (authorizedTenantContext) => {
    expect(() =>
      createD1ReadPolicyInput({ ...input(), authorizedTenantContext }),
    ).toThrow(D1ReadContractError);
  });

  it.each([
    { ...input().resolvedMembershipGrants, membershipId: 'invalid' },
    {
      ...input().resolvedMembershipGrants,
      authorizedOrganizationId: 'invalid',
    },
    { ...input().resolvedMembershipGrants, grants: undefined },
    { ...input().resolvedMembershipGrants, grants: {} },
    { ...input().resolvedMembershipGrants, grants: [null] },
    {
      ...input().resolvedMembershipGrants,
      grants: [grant(), { ...grant(), roleAssignmentId: 'invalid' }],
    },
    {
      ...input().resolvedMembershipGrants,
      grants: [grant(), { ...grant(), roleCode: '  ' }],
    },
    { ...input().resolvedMembershipGrants, grants: [grant(), grant('OWN')] },
    {
      ...input().resolvedMembershipGrants,
      grants: [grant(), grant('ORGANIZATION', [A])],
    },
    {
      ...input().resolvedMembershipGrants,
      grants: [grant(), grant('BUSINESS_UNIT', ['invalid'])],
    },
  ])(
    'rejeita grants estruturalmente inválidos integralmente: %j',
    (resolvedMembershipGrants) => {
      expect(() =>
        createD1ReadPolicyInput({ ...input(), resolvedMembershipGrants }),
      ).toThrow(D1ReadContractError);
    },
  );

  it('aceita grants ausentes e BU vazio sem inserir role ou alcance calculado', () => {
    expect(
      createD1ReadPolicyInput(input([])).resolvedMembershipGrants.grants,
    ).toEqual([]);
    const source = input([grant('BUSINESS_UNIT', [])]);
    expect(createD1ReadPolicyInput(source)).toEqual(source);
    expect(Object.keys(createD1ReadPolicyInput(source)).sort()).toEqual([
      'authorizedTenantContext',
      'permission',
      'resolvedMembershipGrants',
    ]);
  });

  it('preserva role desconhecido e combinações funcionalmente incompatíveis sem avaliar matriz', () => {
    const source = input([
      { ...grant(), roleCode: 'UNKNOWN_ROLE' },
      {
        ...grant('ORGANIZATION', []),
        roleAssignmentId: G2,
        roleCode: 'COLLABORATOR',
      },
    ]);
    source.permission = 'ropa:read';
    expect(createD1ReadPolicyInput(source)).toEqual(source);
  });

  it('mantém assignments distintos independentes, inclusive com o mesmo role', () => {
    const source = input([
      grant(),
      { ...grant('BUSINESS_UNIT', [B]), roleAssignmentId: G2 },
    ]);
    const result = createD1ReadPolicyInput(source);
    expect(result.resolvedMembershipGrants.grants).toEqual(
      source.resolvedMembershipGrants.grants,
    );
    expect(
      result.resolvedMembershipGrants.grants.map((g) => g.businessUnitIds),
    ).toEqual([[A], [B]]);
  });

  it('aceita representações equivalentes por conjunto sem fundir grants ou alterar arrays originais', () => {
    const source = input([
      grant('BUSINESS_UNIT', [A, B, A]),
      grant('BUSINESS_UNIT', [B, A]),
    ]);
    const result = createD1ReadPolicyInput(source);
    expect(result.resolvedMembershipGrants.grants).toHaveLength(2);
    expect(result.resolvedMembershipGrants.grants).toEqual(
      source.resolvedMembershipGrants.grants,
    );
  });

  it.each([
    { ...grant(), roleCode: 'DPO' },
    grant('ORGANIZATION', []),
    grant('BUSINESS_UNIT', [B]),
    grant('BUSINESS_UNIT', []),
  ])(
    'rejeita contradições do mesmo assignment sem resultado parcial: %j',
    (contradiction) => {
      expect(() =>
        createD1ReadPolicyInput(input([grant(), contradiction])),
      ).toThrow(D1ReadContractError);
    },
  );

  it('constrói ORGANIZATION e BUSINESS_UNIT vazio como alcances distintos sem ALLOW/DENY', () => {
    expect(createD1ReadReach(reach('ORGANIZATION', []))).toEqual(
      reach('ORGANIZATION', []),
    );
    expect(createD1ReadReach(reach('BUSINESS_UNIT', []))).toEqual(
      reach('BUSINESS_UNIT', []),
    );
    expect(Object.keys(createD1ReadReach(reach())).sort()).toEqual([
      'authorizedOrganizationId',
      'businessUnitIds',
      'membershipId',
      'permission',
      'scope',
    ]);
  });

  it('normaliza somente o conjunto de áreas do alcance fornecido, sem combinar assignments', () => {
    expect(
      createD1ReadReach(reach('BUSINESS_UNIT', [B, A, B])).businessUnitIds,
    ).toEqual([B, A]);
  });

  it.each([
    reach('ORGANIZATION', [A]),
    reach('UNKNOWN'),
    reach('PLATFORM'),
    { ...reach(), membershipId: 'invalid' },
    { ...reach(), authorizedOrganizationId: 'invalid' },
    { ...reach(), businessUnitIds: undefined },
    { ...reach(), businessUnitIds: 'invalid' },
    reach('BUSINESS_UNIT', ['invalid']),
    { ...reach(), businessUnitIds: new Array(1) },
  ])('rejeita alcance inválido: %j', (value) => {
    expect(() => createD1ReadReach(value)).toThrow(D1ReadContractError);
  });

  it.each(['ProcessingActivity', 'ROPA'])(
    'constrói descriptor %s com área ou null, sem comprovar recurso',
    (resourceKind) => {
      for (const businessUnitId of [A, null]) {
        const source = { ...target(businessUnitId), resourceKind };
        expect(createD1ReadTarget(source)).toEqual(source);
      }
      // Outro tenant também pode formar um descriptor: comparação de acesso é futura.
      expect(
        createD1ReadTarget({ ...target(), organizationId: B }).organizationId,
      ).toBe(B);
    },
  );

  it.each([
    { ...target(), resourceKind: 'Supplier' },
    { ...target(), resourceKind: undefined },
    { ...target(), organizationId: 'invalid' },
    { ...target(), organizationId: undefined },
    { ...target(), businessUnitId: undefined },
    { ...target(), businessUnitId: 'invalid' },
    { ...target(), businessUnitId: [] },
  ])('rejeita descriptor inválido: %j', (value) => {
    expect(() => createD1ReadTarget(value)).toThrow(D1ReadContractError);
  });

  it('copia defensivamente e congela todos os níveis da entrada construída', () => {
    const source = input();
    const result = createD1ReadPolicyInput(source);
    expect(result).not.toBe(source);
    expect(result.authorizedTenantContext).not.toBe(
      source.authorizedTenantContext,
    );
    expect(result.resolvedMembershipGrants).not.toBe(
      source.resolvedMembershipGrants,
    );
    expect(result.resolvedMembershipGrants.grants).not.toBe(
      source.resolvedMembershipGrants.grants,
    );
    const item = result.resolvedMembershipGrants.grants[0];
    if (!item) throw new Error('Grant de teste ausente.');
    expect(item).not.toBe(source.resolvedMembershipGrants.grants[0]);
    expect(item.businessUnitIds).not.toBe(
      source.resolvedMembershipGrants.grants[0]?.businessUnitIds,
    );
    const snapshot = JSON.stringify(result);
    source.authorizedTenantContext.membershipId = B;
    source.resolvedMembershipGrants.membershipId = B;
    source.resolvedMembershipGrants.grants[0]?.businessUnitIds.push(B);
    source.resolvedMembershipGrants.grants.push(grant());
    expect(JSON.stringify(result)).toBe(snapshot);
    for (const object of [
      result,
      result.authorizedTenantContext,
      result.resolvedMembershipGrants,
      result.resolvedMembershipGrants.grants,
      item,
      item.businessUnitIds,
    ])
      expect(Object.isFrozen(object)).toBe(true);
    expect(() => Object.assign(result, { permission: 'ropa:read' })).toThrow(
      TypeError,
    );
    expect(() =>
      Object.assign(result.authorizedTenantContext, { membershipId: B }),
    ).toThrow(TypeError);
    expect(() =>
      Object.assign(result.resolvedMembershipGrants, { membershipId: B }),
    ).toThrow(TypeError);
    expect(() =>
      Object.assign(result.resolvedMembershipGrants.grants, { 0: grant() }),
    ).toThrow(TypeError);
    expect(() => Object.assign(item, { roleCode: 'DPO' })).toThrow(TypeError);
    expect(() => Object.assign(item.businessUnitIds, { 0: B })).toThrow(
      TypeError,
    );
  });

  it('copia e congela alcance e descriptor independentemente das entradas mutáveis', () => {
    const source = reach();
    const result = createD1ReadReach(source);
    source.businessUnitIds.push(B);
    source.membershipId = B;
    expect(result.businessUnitIds).toEqual([A]);
    expect(result.membershipId).toBe(M);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.businessUnitIds)).toBe(true);
    expect(() => Object.assign(result.businessUnitIds, { 0: B })).toThrow(
      TypeError,
    );
    expect(() => Object.assign(result, { scope: 'ORGANIZATION' })).toThrow(
      TypeError,
    );
    const organization = createD1ReadReach(reach('ORGANIZATION', []));
    expect(Object.isFrozen(organization.businessUnitIds)).toBe(true);
    const resource = target();
    const copied = createD1ReadTarget(resource);
    resource.organizationId = B;
    expect(copied.organizationId).toBe(O);
    expect(copied).not.toBe(resource);
    expect(Object.isFrozen(copied)).toBe(true);
    expect(() => Object.assign(copied, { businessUnitId: null })).toThrow(
      TypeError,
    );
  });

  it('reproduz resourceKind variável sem retornar o discriminante não validado', () => {
    let reads = 0;
    const source = {
      ...target(null),
      get resourceKind() {
        return ++reads === 1 ? 'ProcessingActivity' : 'Supplier';
      },
    };
    const result = createD1ReadTarget(source);
    expect(result.resourceKind).toBe('ProcessingActivity');
    expect(reads).toBe(1);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('reproduz businessUnitIds variável sem iterar um valor diferente do validado', () => {
    let reads = 0;
    const source = {
      ...reach(),
      get businessUnitIds() {
        return ++reads === 1 ? [] : '';
      },
    };
    const result = createD1ReadReach(source);
    expect(result.businessUnitIds).toEqual([]);
    expect(result.scope).toBe('BUSINESS_UNIT');
    expect(reads).toBe(1);
    expect(Object.isFrozen(result.businessUnitIds)).toBe(true);
  });

  // Each field alternates between a valid value and an invalid one. Reading it
  // again must neither bypass rejection nor change the value used to construct.
  const getterCases = [
    ...['resourceKind', 'organizationId', 'businessUnitId'].map((field) => ({
      name: `target.${field}`,
      prepare: () => {
        const source = target();
        return { source, owner: source, field, create: createD1ReadTarget };
      },
    })),
    ...[
      'permission',
      'membershipId',
      'authorizedOrganizationId',
      'scope',
      'businessUnitIds',
    ].map((field) => ({
      name: `reach.${field}`,
      prepare: () => {
        const source = reach();
        return { source, owner: source, field, create: createD1ReadReach };
      },
    })),
    ...[
      'permission',
      'authorizedTenantContext',
      'resolvedMembershipGrants',
    ].map((field) => ({
      name: `input.${field}`,
      prepare: () => {
        const source = input();
        return {
          source,
          owner: source,
          field,
          create: createD1ReadPolicyInput,
        };
      },
    })),
    ...['membershipId', 'authorizedOrganizationId'].map((field) => ({
      name: `context.${field}`,
      prepare: () => {
        const source = input();
        return {
          source,
          owner: source.authorizedTenantContext,
          field,
          create: createD1ReadPolicyInput,
        };
      },
    })),
    ...['membershipId', 'authorizedOrganizationId', 'grants'].map((field) => ({
      name: `grants.${field}`,
      prepare: () => {
        const source = input();
        return {
          source,
          owner: source.resolvedMembershipGrants,
          field,
          create: createD1ReadPolicyInput,
        };
      },
    })),
    ...['roleAssignmentId', 'roleCode', 'scope', 'businessUnitIds'].map(
      (field) => ({
        name: `grant.${field}`,
        prepare: () => {
          const item = grant();
          const source = input([item]);
          return {
            source,
            owner: item,
            field,
            create: createD1ReadPolicyInput,
          };
        },
      }),
    ),
  ];

  it.each(getterCases)('captura uma única vez $name válido', ({ prepare }) => {
    const { source, owner, field, create } = prepare();
    const expected = create(source);
    const descriptor = Object.getOwnPropertyDescriptor(owner, field);
    if (!descriptor) throw new Error('Campo de teste ausente.');
    let reads = 0;
    const getter = () => (++reads === 1 ? descriptor.value : undefined);
    Object.defineProperty(owner, field, { get: getter, configurable: true });
    const result = create(source);
    expect(result).toEqual(expected);
    expect(reads).toBe(1);
    expect(Object.getOwnPropertyDescriptor(owner, field)?.get).toBe(getter);
    expect(Object.isFrozen(owner)).toBe(false);
  });

  it.each(getterCases)(
    'rejeita a primeira captura inválida de $name',
    ({ prepare }) => {
      const { source, owner, field, create } = prepare();
      const descriptor = Object.getOwnPropertyDescriptor(owner, field);
      if (!descriptor) throw new Error('Campo de teste ausente.');
      let reads = 0;
      const getter = () => (++reads === 1 ? undefined : descriptor.value);
      Object.defineProperty(owner, field, { get: getter, configurable: true });
      expect(() => create(source)).toThrow(D1ReadContractError);
      expect(reads).toBe(1);
      expect(Object.getOwnPropertyDescriptor(owner, field)?.get).toBe(getter);
    },
  );

  it('usa erro específico sem status HTTP, distinto de alcance vazio válido', () => {
    expect(
      createD1ReadReach(reach('BUSINESS_UNIT', [])).businessUnitIds,
    ).toEqual([]);
    try {
      createD1ReadPolicyInput(null);
      throw new Error('Falha de contrato esperada.');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(D1ReadContractError);
      expect(error).toBeInstanceOf(TypeError);
      expect(error).not.toHaveProperty('status');
      expect(error).not.toHaveProperty('statusCode');
    }
  });
});
