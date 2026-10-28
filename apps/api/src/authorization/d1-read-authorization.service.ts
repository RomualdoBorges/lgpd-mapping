import type { AuthorizedTenantContext } from '../tenant/authorized-tenant-context.js';
import type { MembershipGrantsService } from './membership-grants.service.js';
import {
  createD1ReadPolicyInput,
  createD1ReadReach,
  D1ReadContractError,
  type D1ReadPermission,
  type D1ReadReach,
} from './d1-read-contracts.js';
import { evaluateD1ReadReach } from './d1-read-policy.js';

export class D1ReadAuthorizationService {
  constructor(
    private readonly grants: Pick<MembershipGrantsService, 'resolve'>,
  ) {}

  // The caller must obtain the context from S3.4; structural validation is not authentication.
  async resolveReach(
    context: AuthorizedTenantContext,
    permission: D1ReadPermission,
  ): Promise<D1ReadReach> {
    if (
      typeof context !== 'object' ||
      context === null ||
      Array.isArray(context)
    )
      throw new D1ReadContractError();

    // Reuse identity/operation validation only; this empty reach is never returned.
    const validated = createD1ReadReach({
      permission,
      membershipId: context.membershipId,
      authorizedOrganizationId: context.authorizedOrganizationId,
      scope: 'BUSINESS_UNIT',
      businessUnitIds: [],
    });
    const localContext: AuthorizedTenantContext = Object.freeze({
      membershipId: validated.membershipId,
      authorizedOrganizationId: validated.authorizedOrganizationId,
    });
    const resolvedMembershipGrants = await this.grants.resolve(localContext);
    return evaluateD1ReadReach(
      createD1ReadPolicyInput({
        permission: validated.permission,
        authorizedTenantContext: localContext,
        resolvedMembershipGrants,
      }),
    );
  }
}
