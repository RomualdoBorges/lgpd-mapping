import type { AuthorizedTenantContext } from '../tenant/authorized-tenant-context.js';
import type { DatabaseService } from '../persistence/database.service.js';
import { isMembershipActive } from '../persistence/active-membership-repository.js';
import { readMembershipGrants } from '../persistence/membership-grants-repository.js';
import {
  findVisibleProcessingActivityById,
  type ProcessingActivitySummary,
} from '../persistence/processing-activity-repository.js';
import {
  createD1ReadPolicyInput,
  createD1ReadReach,
  D1ReadContractError,
} from '../authorization/d1-read-contracts.js';
import { evaluateD1ReadReach } from '../authorization/d1-read-policy.js';

export class ProcessingActivityReadService {
  constructor(
    private readonly database: Pick<
      DatabaseService,
      'withAuthorizedTenantReadSnapshot'
    >,
  ) {}

  // Context provenance remains S3.4's responsibility; no external reach or grants are accepted.
  async findById(
    context: AuthorizedTenantContext,
    activityId: string,
  ): Promise<ProcessingActivitySummary | null> {
    if (
      typeof activityId !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        activityId,
      ) ||
      typeof context !== 'object' ||
      context === null ||
      Array.isArray(context)
    )
      throw new D1ReadContractError();
    const id = activityId.toLowerCase();
    const identity = createD1ReadReach({
      permission: 'processing_activity:read',
      membershipId: context.membershipId,
      authorizedOrganizationId: context.authorizedOrganizationId,
      scope: 'BUSINESS_UNIT',
      businessUnitIds: [],
    });
    const localContext: AuthorizedTenantContext = Object.freeze({
      membershipId: identity.membershipId,
      authorizedOrganizationId: identity.authorizedOrganizationId,
    });
    return this.database.withAuthorizedTenantReadSnapshot(
      localContext,
      async (transaction) => {
        if (!(await isMembershipActive(transaction, localContext))) return null;
        const resolvedMembershipGrants = await readMembershipGrants(
          transaction,
          localContext,
        );
        const reach = evaluateD1ReadReach(
          createD1ReadPolicyInput({
            permission: 'processing_activity:read',
            authorizedTenantContext: localContext,
            resolvedMembershipGrants,
          }),
        );
        return findVisibleProcessingActivityById(
          transaction,
          localContext,
          reach,
          id,
        );
      },
    );
  }
}
