import {
  createD1ReadPolicyInput,
  createD1ReadReach,
  type D1ReadPolicyInput,
  type D1ReadReach,
} from './d1-read-contracts.js';

export function evaluateD1ReadReach(input: D1ReadPolicyInput): D1ReadReach {
  // Validate every assignment before an organization-wide grant can prevail.
  const validated = createD1ReadPolicyInput(input);
  const areas = new Set<string>();
  let organizationReach = false;

  for (const grant of validated.resolvedMembershipGrants.grants) {
    if (grant.roleCode === 'DPO' && grant.scope === 'ORGANIZATION') {
      organizationReach = true;
    } else if (
      grant.scope === 'BUSINESS_UNIT' &&
      (grant.roleCode === 'MANAGER' ||
        (grant.roleCode === 'COLLABORATOR' &&
          validated.permission === 'processing_activity:read'))
    ) {
      for (const area of grant.businessUnitIds) areas.add(area);
    }
  }

  return createD1ReadReach({
    permission: validated.permission,
    membershipId: validated.authorizedTenantContext.membershipId,
    authorizedOrganizationId:
      validated.authorizedTenantContext.authorizedOrganizationId,
    scope: organizationReach ? 'ORGANIZATION' : 'BUSINESS_UNIT',
    businessUnitIds: organizationReach ? [] : [...areas],
  });
}
