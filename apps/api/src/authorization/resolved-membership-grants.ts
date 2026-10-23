export type StructuralGrant = Readonly<{
  roleAssignmentId: string;
  roleCode: string;
  scope: 'ORGANIZATION' | 'BUSINESS_UNIT';
  businessUnitIds: readonly string[];
}>;

export type ResolvedMembershipGrants = Readonly<{
  membershipId: string;
  authorizedOrganizationId: string;
  grants: readonly StructuralGrant[];
}>;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function invalidContract(): never {
  throw new TypeError('Contrato estrutural de concessões inválido.');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function uuid(value: unknown): string {
  if (typeof value !== 'string' || !UUID_PATTERN.test(value)) invalidContract();
  return value;
}

function copyGrant(value: unknown): StructuralGrant {
  if (!isRecord(value)) invalidContract();
  const roleAssignmentId = uuid(value.roleAssignmentId);
  const roleCode = value.roleCode;
  const scope = value.scope;
  if (typeof roleCode !== 'string' || roleCode.trim().length === 0)
    invalidContract();
  if (scope !== 'ORGANIZATION' && scope !== 'BUSINESS_UNIT') invalidContract();
  if (!isArray(value.businessUnitIds)) invalidContract();

  const businessUnitIds: string[] = [];
  for (const businessUnitId of value.businessUnitIds)
    businessUnitIds.push(uuid(businessUnitId));
  if (scope === 'ORGANIZATION' && businessUnitIds.length !== 0)
    invalidContract();

  return Object.freeze({
    roleAssignmentId,
    roleCode,
    scope,
    businessUnitIds: Object.freeze(businessUnitIds),
  });
}

// Structural validation does not authenticate the context or authorize an action.
export function createResolvedMembershipGrants(
  value: unknown,
): ResolvedMembershipGrants {
  if (!isRecord(value)) invalidContract();
  const membershipId = uuid(value.membershipId);
  const authorizedOrganizationId = uuid(value.authorizedOrganizationId);
  if (!isArray(value.grants)) invalidContract();

  const grants: StructuralGrant[] = [];
  for (const grant of value.grants) grants.push(copyGrant(grant));

  return Object.freeze({
    membershipId,
    authorizedOrganizationId,
    grants: Object.freeze(grants),
  });
}
