import { Inject, Injectable } from '@nestjs/common';
import type { AuthenticatedIdentity } from '../auth/authenticated-identity.js';
import { DatabaseService } from '../persistence/database.service.js';
import type { AuthorizedTenantContext } from './authorized-tenant-context.js';

@Injectable()
export class TenantContextService {
  constructor(
    @Inject(DatabaseService)
    private readonly memberships: Pick<DatabaseService, 'resolveMembership'>,
  ) {}

  async authorize(
    identity: AuthenticatedIdentity,
    requestedOrganizationId: string,
  ): Promise<AuthorizedTenantContext | null> {
    const membership = await this.memberships.resolveMembership(
      identity.authenticatedUserId,
      requestedOrganizationId,
    );
    if (!membership) return null;
    return Object.freeze({
      membershipId: membership.membershipId,
      authorizedOrganizationId: membership.organizationId,
    });
  }
}
