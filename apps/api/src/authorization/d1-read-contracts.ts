import type { AuthorizedTenantContext } from '../tenant/authorized-tenant-context.js';
import {
  createResolvedMembershipGrants,
  type ResolvedMembershipGrants,
} from './resolved-membership-grants.js';

export type D1ReadPermission = 'processing_activity:read' | 'ropa:read';

export type D1ReadPolicyInput = Readonly<{
  permission: D1ReadPermission;
  authorizedTenantContext: AuthorizedTenantContext;
  resolvedMembershipGrants: ResolvedMembershipGrants;
}>;

type ReachIdentity = Readonly<{
  permission: D1ReadPermission;
  membershipId: string;
  authorizedOrganizationId: string;
}>;

export type D1ReadReach = ReachIdentity &
  (
    | Readonly<{ scope: 'ORGANIZATION'; businessUnitIds: readonly [] }>
    | Readonly<{
        scope: 'BUSINESS_UNIT';
        businessUnitIds: readonly string[];
      }>
  );

export type D1ReadTarget = Readonly<{
  resourceKind: 'ProcessingActivity' | 'ROPA';
  organizationId: string;
  businessUnitId: string | null;
}>;

export class D1ReadContractError extends TypeError {
  constructor() {
    super('Contrato de leitura D1 inválido.');
    this.name = 'D1ReadContractError';
  }
}

function invalid(): never {
  throw new D1ReadContractError();
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function record(value: unknown): Record<string, unknown> {
  if (!isRecord(value)) invalid();
  return value;
}

function uuid(value: unknown): string {
  if (
    typeof value !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    )
  )
    invalid();
  return value;
}

function permission(value: unknown): D1ReadPermission {
  if (value !== 'processing_activity:read' && value !== 'ropa:read') invalid();
  return value;
}

function copyGrants(value: unknown): ResolvedMembershipGrants {
  try {
    // Snapshot external properties before delegating to the unchanged S3.5 validator.
    const source = record(value);
    const membershipId = source.membershipId;
    const authorizedOrganizationId = source.authorizedOrganizationId;
    const sourceGrants = source.grants;
    if (!Array.isArray(sourceGrants)) invalid();
    const grants = [];
    for (const value of sourceGrants) {
      const grant = record(value);
      const roleAssignmentId = grant.roleAssignmentId;
      const roleCode = grant.roleCode;
      const scope = grant.scope;
      const businessUnitIds = grant.businessUnitIds;
      if (!Array.isArray(businessUnitIds)) invalid();
      grants.push({
        roleAssignmentId,
        roleCode,
        scope,
        businessUnitIds: [...businessUnitIds],
      });
    }
    return createResolvedMembershipGrants({
      membershipId,
      authorizedOrganizationId,
      grants,
    });
  } catch (error: unknown) {
    if (error instanceof TypeError) invalid();
    throw error;
  }
}

// Construction validates consistency, not the provenance or authority of a context.
export function createD1ReadPolicyInput(value: unknown): D1ReadPolicyInput {
  const source = record(value);
  const operation = permission(source.permission);
  const context = record(source.authorizedTenantContext);
  const authorizedTenantContext = Object.freeze({
    membershipId: uuid(context.membershipId),
    authorizedOrganizationId: uuid(context.authorizedOrganizationId),
  });
  const resolvedMembershipGrants = copyGrants(source.resolvedMembershipGrants);
  if (
    authorizedTenantContext.membershipId !==
      resolvedMembershipGrants.membershipId ||
    authorizedTenantContext.authorizedOrganizationId !==
      resolvedMembershipGrants.authorizedOrganizationId
  )
    invalid();

  // Compare representations as sets without merging or changing the input grants.
  const assignments = new Map<string, string>();
  for (const grant of resolvedMembershipGrants.grants) {
    const signature = JSON.stringify([
      grant.roleCode,
      grant.scope,
      [...new Set(grant.businessUnitIds)].sort(),
    ]);
    const previous = assignments.get(grant.roleAssignmentId);
    if (previous !== undefined && previous !== signature) invalid();
    assignments.set(grant.roleAssignmentId, signature);
  }
  return Object.freeze({
    permission: operation,
    authorizedTenantContext,
    resolvedMembershipGrants,
  });
}

// This validates a supplied reach; it does not derive or authorize it from roles.
export function createD1ReadReach(value: unknown): D1ReadReach {
  const source = record(value);
  const identity = {
    permission: permission(source.permission),
    membershipId: uuid(source.membershipId),
    authorizedOrganizationId: uuid(source.authorizedOrganizationId),
  };
  const scope = source.scope;
  const businessUnitIds = source.businessUnitIds;
  if (scope !== 'ORGANIZATION' && scope !== 'BUSINESS_UNIT') invalid();
  if (!Array.isArray(businessUnitIds)) invalid();
  const areas: string[] = [];
  for (const area of businessUnitIds) areas.push(uuid(area));
  if (scope === 'ORGANIZATION') {
    if (areas.length !== 0) invalid();
    return Object.freeze({
      ...identity,
      scope: 'ORGANIZATION',
      businessUnitIds: Object.freeze([] as const),
    });
  }
  return Object.freeze({
    ...identity,
    scope: 'BUSINESS_UNIT',
    businessUnitIds: Object.freeze([...new Set(areas)]),
  });
}

// A well-formed descriptor does not prove existence, ownership or resource access.
export function createD1ReadTarget(value: unknown): D1ReadTarget {
  const source = record(value);
  const resourceKind = source.resourceKind;
  const organizationId = source.organizationId;
  const businessUnitId = source.businessUnitId;
  if (resourceKind !== 'ProcessingActivity' && resourceKind !== 'ROPA')
    invalid();
  return Object.freeze({
    resourceKind,
    organizationId: uuid(organizationId),
    businessUnitId: businessUnitId === null ? null : uuid(businessUnitId),
  });
}
