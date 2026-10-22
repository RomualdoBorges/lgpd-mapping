import { sql } from 'drizzle-orm';
import type { Database } from './tenant-transaction.js';

export type ResolvedExternalIdentity = { userId: string };
export type PersistedSession = {
  sessionId: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
};
export type ResolvedSession = {
  sessionId: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
};
const asDate = (value: Date | string): Date =>
  value instanceof Date ? value : new Date(value);

export type NewSession = {
  userId: string;
  tokenDigest: string;
  expiresAt: Date;
};

export async function findExternalIdentityByIssuerAndSubject(
  database: Database,
  issuer: string,
  subject: string,
): Promise<ResolvedExternalIdentity | null> {
  const result = await database.execute<{ user_id: string }>(
    sql`select user_id from auth_private.resolve_external_identity(${issuer}, ${subject})`,
  );
  const row = result.rows[0];
  return row ? { userId: row.user_id } : null;
}

export async function createSession(
  database: Database,
  session: NewSession,
): Promise<PersistedSession> {
  const result = await database.execute<{
    session_id: string;
    created_at: Date | string;
    expires_at: Date | string;
    revoked_at: Date | string | null;
  }>(sql`select session_id, created_at, expires_at, revoked_at
        from auth_private.create_session(${session.userId}, ${session.tokenDigest}, ${session.expiresAt})`);
  const row = result.rows[0];
  if (!row) throw new Error('Session não foi persistida.');
  return {
    sessionId: row.session_id,
    createdAt: asDate(row.created_at),
    expiresAt: asDate(row.expires_at),
    revokedAt: row.revoked_at === null ? null : asDate(row.revoked_at),
  };
}

export async function findSessionByTokenDigest(
  database: Database,
  tokenDigest: string,
): Promise<ResolvedSession | null> {
  const result = await database.execute<{
    session_id: string;
    user_id: string;
    expires_at: Date | string;
    revoked_at: Date | string | null;
  }>(sql`select session_id, user_id, expires_at, revoked_at
        from auth_private.resolve_session(${tokenDigest})`);
  const row = result.rows[0];
  return row
    ? {
        sessionId: row.session_id,
        userId: row.user_id,
        expiresAt: asDate(row.expires_at),
        revokedAt: row.revoked_at === null ? null : asDate(row.revoked_at),
      }
    : null;
}

export async function revokeSession(
  database: Database,
  sessionId: string,
  revokedAt: Date,
): Promise<boolean> {
  const result = await database.execute<{ revoked: boolean }>(
    sql`select auth_private.revoke_session(${sessionId}, ${revokedAt}) as revoked`,
  );
  return result.rows[0]?.revoked ?? false;
}
