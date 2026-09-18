import { sql } from 'drizzle-orm';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import * as schema from './schema.js';

export type Database = NodePgDatabase<typeof schema>;
export type TenantTransaction = Parameters<
  Parameters<Database['transaction']>[0]
>[0];
export function validateTenantId(organizationId: string): void {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      organizationId,
    )
  )
    throw new Error('Contexto de tenant inválido.');
}
// Infrastructure boundary, not authorization. Callers must supply an authorized context.
export async function withTenant<T>(
  database: Database,
  organizationId: string,
  operation: (transaction: TenantTransaction) => Promise<T>,
): Promise<T> {
  validateTenantId(organizationId);
  return database.transaction(async (transaction) => {
    await transaction.execute(
      sql`select set_config('lgpd.organization_id', ${organizationId}, true)`,
    );
    return operation(transaction);
  });
}
