import { and, eq } from 'drizzle-orm';
import {
  createResolvedMembershipGrants,
  type ResolvedMembershipGrants,
} from '../authorization/resolved-membership-grants.js';
import type { AuthorizedTenantContext } from '../tenant/authorized-tenant-context.js';
import {
  businessUnits,
  memberships,
  roleAssignmentBusinessUnits,
  roleAssignments,
  roles,
} from './schema.js';
import type { TenantTransaction } from './tenant-transaction.js';

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function invalidRows(): never {
  throw new TypeError('Referências estruturais de concessões inválidas.');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isArray(value: unknown): value is readonly unknown[] {
  return Array.isArray(value);
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_PATTERN.test(value);
}

type AssignmentRows = {
  roleAssignmentId: string;
  roleId: string;
  roleCode: unknown;
  scope: unknown;
  businessUnitIds: string[];
  withoutAssociation: boolean;
};

// Pure mapping also validates references that the final contract does not retain.
export function mapMembershipGrantRows(
  rows: unknown,
  context: AuthorizedTenantContext,
): ResolvedMembershipGrants {
  const validated = createResolvedMembershipGrants({ ...context, grants: [] });
  if (!isArray(rows)) invalidRows();
  const assignments = new Map<string, AssignmentRows>();

  for (const row of rows) {
    if (!isRecord(row)) invalidRows();
    if (
      row.organizationId !== validated.authorizedOrganizationId ||
      row.membershipId !== validated.membershipId ||
      row.resolvedMembershipId !== validated.membershipId ||
      !isUuid(row.roleAssignmentId) ||
      !isUuid(row.roleId) ||
      row.resolvedRoleId !== row.roleId
    )
      invalidRows();

    const withoutAssociation = row.businessUnitId === null;
    if (withoutAssociation) {
      if (row.associationScope !== null || row.resolvedBusinessUnitId !== null)
        invalidRows();
    } else if (
      !isUuid(row.businessUnitId) ||
      row.resolvedBusinessUnitId !== row.businessUnitId ||
      row.associationScope !== 'BUSINESS_UNIT' ||
      row.scope !== 'BUSINESS_UNIT'
    )
      invalidRows();

    const previous = assignments.get(row.roleAssignmentId);
    if (
      previous &&
      (previous.roleId !== row.roleId ||
        previous.roleCode !== row.roleCode ||
        previous.scope !== row.scope ||
        previous.withoutAssociation !== withoutAssociation)
    )
      invalidRows();

    const assignment: AssignmentRows = previous ?? {
      roleAssignmentId: row.roleAssignmentId,
      roleId: row.roleId,
      roleCode: row.roleCode,
      scope: row.scope,
      businessUnitIds: [],
      withoutAssociation,
    };
    if (isUuid(row.businessUnitId))
      assignment.businessUnitIds.push(row.businessUnitId);
    assignments.set(row.roleAssignmentId, assignment);
  }

  return createResolvedMembershipGrants({
    membershipId: validated.membershipId,
    authorizedOrganizationId: validated.authorizedOrganizationId,
    grants: [...assignments.values()],
  });
}

// Caller supplies an already authorized context and a transaction for that tenant.
// TenantTransaction does not prove their correspondence. Empty results never
// authenticate Membership or authorize an operation, including under mismatched RLS.
export async function readMembershipGrants(
  transaction: TenantTransaction,
  context: AuthorizedTenantContext,
): Promise<ResolvedMembershipGrants> {
  const validated = createResolvedMembershipGrants({ ...context, grants: [] });
  const rows = await transaction
    .select({
      roleAssignmentId: roleAssignments.id,
      organizationId: roleAssignments.organizationId,
      membershipId: roleAssignments.membershipId,
      roleId: roleAssignments.roleId,
      scope: roleAssignments.scope,
      resolvedMembershipId: memberships.id,
      resolvedRoleId: roles.id,
      roleCode: roles.code,
      businessUnitId: roleAssignmentBusinessUnits.businessUnitId,
      associationScope: roleAssignmentBusinessUnits.scope,
      resolvedBusinessUnitId: businessUnits.id,
    })
    .from(roleAssignments)
    .leftJoin(
      memberships,
      and(
        eq(memberships.organizationId, roleAssignments.organizationId),
        eq(memberships.id, roleAssignments.membershipId),
      ),
    )
    .leftJoin(roles, eq(roles.id, roleAssignments.roleId))
    .leftJoin(
      roleAssignmentBusinessUnits,
      and(
        eq(
          roleAssignmentBusinessUnits.organizationId,
          roleAssignments.organizationId,
        ),
        eq(roleAssignmentBusinessUnits.roleAssignmentId, roleAssignments.id),
      ),
    )
    .leftJoin(
      businessUnits,
      and(
        eq(
          businessUnits.organizationId,
          roleAssignmentBusinessUnits.organizationId,
        ),
        eq(businessUnits.id, roleAssignmentBusinessUnits.businessUnitId),
      ),
    )
    .where(
      and(
        eq(roleAssignments.organizationId, validated.authorizedOrganizationId),
        eq(roleAssignments.membershipId, validated.membershipId),
      ),
    )
    .orderBy(roleAssignments.id, roleAssignmentBusinessUnits.businessUnitId);

  return mapMembershipGrantRows(rows, validated);
}
