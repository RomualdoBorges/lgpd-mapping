import { sql } from 'drizzle-orm';
import type { AuthorizedTenantContext } from '../tenant/authorized-tenant-context.js';
import {
  createD1ReadReach,
  createD1ReadTarget,
  D1ReadContractError,
  type D1ReadReach,
} from '../authorization/d1-read-contracts.js';
import { canReadD1Target } from '../authorization/d1-read-target-policy.js';
import type { TenantTransaction } from './tenant-transaction.js';

export type ProcessingActivitySummary = Readonly<{
  id: string;
  organizationId: string;
  businessUnitId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}>;

export class ProcessingActivityTransactionError extends Error {
  constructor() {
    super('Contexto transacional de leitura de atividade inválido.');
    this.name = 'ProcessingActivityTransactionError';
  }
}
export class ProcessingActivityPersistenceError extends Error {
  constructor() {
    super('Resultado persistido de atividade inconsistente.');
    this.name = 'ProcessingActivityPersistenceError';
  }
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const WHITESPACE =
  '\u0009\u000a\u000b\u000c\u000d\u0020\u0085\u00a0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u2028\u2029\u202f\u205f\u3000';
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID.test(value);
}
function rows(value: unknown): unknown[] {
  if (!isRecord(value)) throw new ProcessingActivityPersistenceError();
  const result = value.rows;
  if (!Array.isArray(result)) throw new ProcessingActivityPersistenceError();
  return result;
}
function timestamp(value: unknown): string {
  if (value instanceof Date) {
    const time = Date.prototype.getTime.call(value);
    if (!Number.isFinite(time)) throw new ProcessingActivityPersistenceError();
    return new Date(time).toISOString();
  }
  // SQL formats UTC with all six PostgreSQL fractional digits: no microseconds lost to Date.
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{6}Z$/.test(value)
  )
    throw new ProcessingActivityPersistenceError();
  const milliseconds = `${value.slice(0, 23)}Z`;
  const date = new Date(milliseconds);
  if (!Number.isFinite(date.getTime()) || date.toISOString() !== milliseconds)
    throw new ProcessingActivityPersistenceError();
  return value.replace(/(\.\d{3})000Z$/, '$1Z');
}

// Context/reach provenance and the shared grants snapshot remain the caller's responsibility (P.3).
export async function findVisibleProcessingActivityById(
  transaction: TenantTransaction,
  context: AuthorizedTenantContext,
  reach: D1ReadReach,
  activityId: string,
): Promise<ProcessingActivitySummary | null> {
  if (!isUuid(activityId) || !isRecord(context))
    throw new D1ReadContractError();
  const requestedId = activityId.toLowerCase();
  const identity = createD1ReadReach({
    permission: 'processing_activity:read',
    membershipId: context.membershipId,
    authorizedOrganizationId: context.authorizedOrganizationId,
    scope: 'BUSINESS_UNIT',
    businessUnitIds: [],
  });
  const localReach = createD1ReadReach(reach);
  if (
    localReach.permission !== 'processing_activity:read' ||
    localReach.membershipId !== identity.membershipId ||
    localReach.authorizedOrganizationId !== identity.authorizedOrganizationId
  )
    throw new D1ReadContractError();

  const state = rows(
    await transaction.execute(sql`
    select nullif(pg_catalog.current_setting('lgpd.organization_id', true), '') as "organizationId",
      pg_catalog.current_setting('transaction_isolation') as "isolationLevel"
  `),
  );
  const current = state[0];
  if (
    state.length !== 1 ||
    !isRecord(current) ||
    current.organizationId !== identity.authorizedOrganizationId ||
    current.isolationLevel !== 'repeatable read'
  )
    throw new ProcessingActivityTransactionError();

  if (
    localReach.scope === 'BUSINESS_UNIT' &&
    localReach.businessUnitIds.length === 0
  )
    return null;
  const areaFilter =
    localReach.scope === 'ORGANIZATION'
      ? sql``
      : sql`and business_unit_id in (${sql.join(
          localReach.businessUnitIds.map((id) => sql`${id}`),
          sql`, `,
        )})`;
  const result = rows(
    await transaction.execute(sql`
    select id, organization_id as "organizationId", business_unit_id as "businessUnitId",
      name,
      to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as "createdAt",
      to_char(updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as "updatedAt"
    from public.processing_activities
    where id = ${requestedId} and organization_id = ${identity.authorizedOrganizationId}
    ${areaFilter}
    limit 1
  `),
  );
  if (result.length === 0) return null;
  const row = result[0];
  if (result.length !== 1 || !isRecord(row))
    throw new ProcessingActivityPersistenceError();
  const id = row.id;
  const organizationId = row.organizationId;
  const businessUnitId = row.businessUnitId;
  const name = row.name;
  const createdAt = timestamp(row.createdAt);
  const updatedAt = timestamp(row.updatedAt);
  if (
    !isUuid(id) ||
    id.toLowerCase() !== requestedId ||
    !isUuid(organizationId) ||
    !isUuid(businessUnitId) ||
    typeof name !== 'string' ||
    ![...name].some((character) => !WHITESPACE.includes(character))
  )
    throw new ProcessingActivityPersistenceError();
  const target = createD1ReadTarget({
    resourceKind: 'ProcessingActivity',
    organizationId,
    businessUnitId,
  });
  if (!canReadD1Target(localReach, target))
    throw new ProcessingActivityPersistenceError();
  return Object.freeze({
    id,
    organizationId,
    businessUnitId,
    name,
    createdAt,
    updatedAt,
  });
}
