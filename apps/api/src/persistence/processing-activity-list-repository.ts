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
import {
  ProcessingActivityPersistenceError,
  ProcessingActivityTransactionError,
  type ProcessingActivitySummary,
} from './processing-activity-repository.js';

export type ProcessingActivityListPagination = Readonly<{
  page: number;
  pageSize: number;
}>;
export type ProcessingActivityListPage = Readonly<{
  items: readonly ProcessingActivitySummary[];
  hasNextPage: boolean;
}>;
export class ProcessingActivityListPaginationError extends TypeError {
  constructor() {
    super('Paginação interna de Activity inválida.');
    this.name = 'ProcessingActivityListPaginationError';
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
function persistedUuid(value: unknown): string {
  if (!isUuid(value)) throw new ProcessingActivityPersistenceError();
  return value.toLowerCase();
}
function rows(value: unknown): unknown[] {
  if (!isRecord(value)) throw new ProcessingActivityPersistenceError();
  const result = value.rows;
  if (!Array.isArray(result)) throw new ProcessingActivityPersistenceError();
  return result;
}
function timestamp(value: unknown): string {
  // Preserve P.2's UTC serialization, including PostgreSQL microseconds.
  if (value instanceof Date) {
    const time = Date.prototype.getTime.call(value);
    if (!Number.isFinite(time)) throw new ProcessingActivityPersistenceError();
    return new Date(time).toISOString();
  }
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
function item(value: unknown, reach: D1ReadReach): ProcessingActivitySummary {
  if (!isRecord(value)) throw new ProcessingActivityPersistenceError();
  const id = persistedUuid(value.id);
  const organizationId = persistedUuid(value.organizationId);
  const businessUnitId = persistedUuid(value.businessUnitId);
  const name = value.name;
  const createdAt = timestamp(value.createdAt);
  const updatedAt = timestamp(value.updatedAt);
  if (
    typeof name !== 'string' ||
    ![...name].some((c) => !WHITESPACE.includes(c))
  )
    throw new ProcessingActivityPersistenceError();
  const target = createD1ReadTarget({
    resourceKind: 'ProcessingActivity',
    organizationId,
    businessUnitId,
  });
  if (!canReadD1Target(reach, target))
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
function page(
  items: ProcessingActivitySummary[],
  hasNextPage: boolean,
): ProcessingActivityListPage {
  return Object.freeze({ items: Object.freeze(items), hasNextPage });
}

// The caller must establish context/reach provenance and resolve grants in this same snapshot.
export async function listVisibleProcessingActivities(
  transaction: TenantTransaction,
  context: AuthorizedTenantContext,
  reach: D1ReadReach,
  pagination: ProcessingActivityListPagination,
): Promise<ProcessingActivityListPage> {
  if (!isRecord(context)) throw new D1ReadContractError();
  const identity = createD1ReadReach({
    permission: 'processing_activity:read',
    membershipId: context.membershipId,
    authorizedOrganizationId: context.authorizedOrganizationId,
    scope: 'BUSINESS_UNIT',
    businessUnitIds: [],
  });
  const sourceReach = createD1ReadReach(reach);
  // Canonicalize copies only: PostgreSQL UUIDs are case-insensitive identities.
  const localReach = createD1ReadReach({
    ...sourceReach,
    membershipId: sourceReach.membershipId.toLowerCase(),
    authorizedOrganizationId:
      sourceReach.authorizedOrganizationId.toLowerCase(),
    businessUnitIds: sourceReach.businessUnitIds.map((id) => id.toLowerCase()),
  });
  if (
    localReach.permission !== 'processing_activity:read' ||
    localReach.membershipId !== identity.membershipId.toLowerCase() ||
    localReach.authorizedOrganizationId !==
      identity.authorizedOrganizationId.toLowerCase()
  )
    throw new D1ReadContractError();
  if (!isRecord(pagination)) throw new ProcessingActivityListPaginationError();
  const requestedPage = pagination.page;
  const pageSize = pagination.pageSize;
  if (
    typeof requestedPage !== 'number' ||
    !Number.isSafeInteger(requestedPage) ||
    requestedPage < 1 ||
    typeof pageSize !== 'number' ||
    !Number.isSafeInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > 100
  )
    throw new ProcessingActivityListPaginationError();
  const offset = (BigInt(requestedPage) - 1n) * BigInt(pageSize);
  if (typeof transaction !== 'object' || transaction === null)
    throw new ProcessingActivityTransactionError();
  const executeMethod = transaction.execute;
  if (typeof executeMethod !== 'function')
    throw new ProcessingActivityTransactionError();
  const execute = executeMethod.bind(transaction);
  const state = rows(
    await execute(sql`
    select nullif(pg_catalog.current_setting('lgpd.organization_id', true), '') as "organizationId",
      pg_catalog.current_setting('transaction_isolation') as "isolationLevel",
      pg_catalog.current_setting('transaction_read_only') as "readOnly"
  `),
  );
  const current = state[0];
  if (state.length !== 1 || !isRecord(current))
    throw new ProcessingActivityTransactionError();
  const currentOrganization = current.organizationId;
  if (
    !isUuid(currentOrganization) ||
    currentOrganization.toLowerCase() !== localReach.authorizedOrganizationId ||
    current.isolationLevel !== 'repeatable read' ||
    current.readOnly !== 'on'
  )
    throw new ProcessingActivityTransactionError();
  if (
    localReach.scope === 'BUSINESS_UNIT' &&
    localReach.businessUnitIds.length === 0
  )
    return page([], false);
  const areaFilter =
    localReach.scope === 'ORGANIZATION'
      ? sql``
      : sql`and business_unit_id in (${sql.join(
          localReach.businessUnitIds.map((id) => sql`${id}`),
          sql`, `,
        )})`;
  const result = rows(
    await execute(sql`
    select id, organization_id as "organizationId", business_unit_id as "businessUnitId", name,
      to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as "createdAt",
      to_char(updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') as "updatedAt"
    from public.processing_activities
    where organization_id = ${localReach.authorizedOrganizationId}
    ${areaFilter}
    order by created_at desc, id desc
    limit ${pageSize + 1} offset ${offset.toString()}::bigint
  `),
  );
  if (result.length > pageSize + 1)
    throw new ProcessingActivityPersistenceError();
  // Validate the lookahead row too: malformed or invisible data must not become metadata.
  const items: ProcessingActivitySummary[] = [];
  for (let index = 0; index < result.length; index += 1) {
    items.push(item(result[index], localReach));
  }
  if (new Set(items.map((row) => row.id)).size !== items.length)
    throw new ProcessingActivityPersistenceError();
  return page(items.slice(0, pageSize), items.length > pageSize);
}
