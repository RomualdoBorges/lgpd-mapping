import { sql } from 'drizzle-orm';
import type { Database } from './tenant-transaction.js';

export type ResolvedMembership = {
  membershipId: string;
  organizationId: string;
};

export async function resolveMembership(
  database: Database,
  authenticatedUserId: string,
  requestedOrganizationId: string,
): Promise<ResolvedMembership | null> {
  const result = await database.execute<{
    membership_id: string;
    organization_id: string;
  }>(sql`select membership_id, organization_id
        from auth_private.resolve_membership(
          ${authenticatedUserId},
          ${requestedOrganizationId}
        )`);
  const row = result.rows[0];
  return row
    ? {
        membershipId: row.membership_id,
        organizationId: row.organization_id,
      }
    : null;
}
