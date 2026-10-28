import { and, eq } from 'drizzle-orm';
import type { AuthorizedTenantContext } from '../tenant/authorized-tenant-context.js';
import {
  createD1ReadReach,
  D1ReadContractError,
} from '../authorization/d1-read-contracts.js';
import type { TenantTransaction } from './tenant-transaction.js';
import { memberships } from './schema.js';

export class ActiveMembershipPersistenceError extends Error {
  constructor() {
    super('Resultado persistido de Membership inconsistente.');
    this.name = 'ActiveMembershipPersistenceError';
  }
}

// Checks snapshot state only; the authenticated ownership of the context belongs to S3.4.
export async function isMembershipActive(
  transaction: TenantTransaction,
  context: AuthorizedTenantContext,
): Promise<boolean> {
  if (typeof context !== 'object' || context === null || Array.isArray(context))
    throw new D1ReadContractError();
  const identity = createD1ReadReach({
    permission: 'processing_activity:read',
    membershipId: context.membershipId,
    authorizedOrganizationId: context.authorizedOrganizationId,
    scope: 'BUSINESS_UNIT',
    businessUnitIds: [],
  });
  const rows = await transaction
    .select({
      membershipId: memberships.id,
      organizationId: memberships.organizationId,
      active: memberships.active,
    })
    .from(memberships)
    .where(
      and(
        eq(memberships.id, identity.membershipId),
        eq(memberships.organizationId, identity.authorizedOrganizationId),
        eq(memberships.active, true),
      ),
    )
    .limit(1);
  if (rows.length === 0) return false;
  const row = rows[0];
  if (
    rows.length !== 1 ||
    !row ||
    row.membershipId !== identity.membershipId ||
    row.organizationId !== identity.authorizedOrganizationId ||
    row.active !== true
  )
    throw new ActiveMembershipPersistenceError();
  return true;
}
