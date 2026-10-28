import type { AuthorizedTenantContext } from '../tenant/authorized-tenant-context.js';
import type { DatabaseService } from '../persistence/database.service.js';
import { isMembershipActive } from '../persistence/active-membership-repository.js';
import { readMembershipGrants } from '../persistence/membership-grants-repository.js';
import {
  listVisibleProcessingActivities,
  ProcessingActivityListPaginationError,
  type ProcessingActivityListPagination,
  type ProcessingActivityListPage,
} from '../persistence/processing-activity-list-repository.js';
import {
  createD1ReadPolicyInput,
  createD1ReadReach,
  D1ReadContractError,
} from '../authorization/d1-read-contracts.js';
import { evaluateD1ReadReach } from '../authorization/d1-read-policy.js';

export class ProcessingActivityListService {
  constructor(
    private readonly database: Pick<
      DatabaseService,
      'withAuthorizedTenantReadSnapshot'
    >,
  ) {}

  // Context provenance remains S3.4's responsibility; no external reach or grants are accepted.
  async list(
    context: AuthorizedTenantContext,
    pagination: ProcessingActivityListPagination,
  ): Promise<ProcessingActivityListPage> {
    if (
      typeof context !== 'object' ||
      context === null ||
      Array.isArray(context)
    )
      throw new D1ReadContractError();
    const identity = createD1ReadReach({
      permission: 'processing_activity:read',
      membershipId: context.membershipId,
      authorizedOrganizationId: context.authorizedOrganizationId,
      scope: 'BUSINESS_UNIT',
      businessUnitIds: [],
    });
    const localContext: AuthorizedTenantContext = Object.freeze({
      membershipId: identity.membershipId.toLowerCase(),
      authorizedOrganizationId: identity.authorizedOrganizationId.toLowerCase(),
    });
    if (
      typeof pagination !== 'object' ||
      pagination === null ||
      Array.isArray(pagination)
    )
      throw new ProcessingActivityListPaginationError();
    const page = pagination.page;
    const pageSize = pagination.pageSize;
    if (
      typeof page !== 'number' ||
      !Number.isSafeInteger(page) ||
      page < 1 ||
      typeof pageSize !== 'number' ||
      !Number.isSafeInteger(pageSize) ||
      pageSize < 1 ||
      pageSize > 100
    )
      throw new ProcessingActivityListPaginationError();
    const localPagination = Object.freeze({ page, pageSize });
    return this.database.withAuthorizedTenantReadSnapshot(
      localContext,
      async (transaction) => {
        if (!(await isMembershipActive(transaction, localContext)))
          return Object.freeze({
            items: Object.freeze([]),
            hasNextPage: false,
          });
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
        return listVisibleProcessingActivities(
          transaction,
          localContext,
          reach,
          localPagination,
        );
      },
    );
  }
}
