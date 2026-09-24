import { createHash } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../persistence/database.service.js';
import type { AuthenticatedIdentity } from './authenticated-identity.js';
import type { AuthenticationFailureReason } from './authentication-failure.js';

export type SessionAuthenticationResult =
  | { authenticated: true; identity: AuthenticatedIdentity }
  | {
      authenticated: false;
      reason: Exclude<
        AuthenticationFailureReason,
        'COOKIE_MISSING' | 'COOKIE_INVALID'
      >;
    };

@Injectable()
export class SessionAuthenticationService {
  constructor(
    @Inject(DatabaseService)
    private readonly sessions: Pick<
      DatabaseService,
      'resolveSessionByTokenDigest'
    >,
  ) {}

  async authenticate(
    sessionSecret: string,
    now: Date = new Date(),
  ): Promise<SessionAuthenticationResult> {
    const tokenDigest = createHash('sha256')
      .update(sessionSecret)
      .digest('hex');
    const session =
      await this.sessions.resolveSessionByTokenDigest(tokenDigest);
    if (!session) return { authenticated: false, reason: 'SESSION_NOT_FOUND' };
    if (session.revokedAt)
      return { authenticated: false, reason: 'SESSION_REVOKED' };
    if (session.expiresAt.getTime() <= now.getTime())
      return { authenticated: false, reason: 'SESSION_EXPIRED' };
    return {
      authenticated: true,
      identity: Object.freeze({
        sessionId: session.sessionId,
        authenticatedUserId: session.userId,
      }),
    };
  }
}
