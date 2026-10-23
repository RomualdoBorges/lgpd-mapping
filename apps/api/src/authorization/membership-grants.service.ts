import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../persistence/database.service.js';
import { readMembershipGrants } from '../persistence/membership-grants-repository.js';
import type { AuthorizedTenantContext } from '../tenant/authorized-tenant-context.js';
import type { ResolvedMembershipGrants } from './resolved-membership-grants.js';

@Injectable()
export class MembershipGrantsService {
  constructor(
    @Inject(DatabaseService)
    private readonly database: Pick<DatabaseService, 'withAuthorizedTenant'>,
  ) {}

  // Context provenance belongs to S3.4; this composition makes no access decision.
  async resolve(
    context: AuthorizedTenantContext,
  ): Promise<ResolvedMembershipGrants> {
    const localContext: AuthorizedTenantContext = Object.freeze({
      membershipId: context.membershipId,
      authorizedOrganizationId: context.authorizedOrganizationId,
    });
    return this.database.withAuthorizedTenant(localContext, (transaction) =>
      readMembershipGrants(transaction, localContext),
    );
  }
}
