import { createHash, randomUUID } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { loadEnvironment } from '../../src/config/environment.js';
import {
  expiredSessionCookie,
  extractSessionCookie,
  sessionCookieProfile,
} from '../../src/auth/session-cookie.js';
import { SessionAuthenticationService } from '../../src/auth/session-authentication.service.js';
import type { DatabaseService } from '../../src/persistence/database.service.js';

const future = new Date('2099-01-01T00:00:00.000Z');
const now = new Date('2030-01-01T00:00:00.000Z');

function serviceWith(
  resolved: Awaited<ReturnType<DatabaseService['resolveSessionByTokenDigest']>>,
) {
  const resolveSessionByTokenDigest = vi.fn().mockResolvedValue(resolved);
  return {
    service: new SessionAuthenticationService({
      resolveSessionByTokenDigest,
    }),
    resolveSessionByTokenDigest,
  };
}

describe('Cookie de Session', () => {
  it('seleciona os dois perfis fixos da DEC-059', () => {
    expect(sessionCookieProfile('development')).toEqual({
      name: 'lgpd_session',
      httpOnly: true,
      sameSite: 'Lax',
      path: '/',
      secure: false,
    });
    expect(sessionCookieProfile('test')).toEqual(
      sessionCookieProfile('development'),
    );
    expect(sessionCookieProfile('production')).toEqual({
      name: '__Host-lgpd_session',
      httpOnly: true,
      sameSite: 'Lax',
      path: '/',
      secure: true,
    });
  });

  it('extrai somente o cookie esperado e preserva o segredo recebido', () => {
    expect(
      extractSessionCookie(
        'outro=ignorado; lgpd_session=segredo.%2F-opaco; terceiro=valor',
        sessionCookieProfile('development'),
      ),
    ).toEqual({ status: 'valid', sessionSecret: 'segredo.%2F-opaco' });
  });

  it.each([undefined, 'outro=valor'])(
    'classifica cookie esperado ausente: %s',
    (header) => {
      expect(
        extractSessionCookie(header, sessionCookieProfile('development')),
      ).toEqual({ status: 'missing' });
    },
  );

  it.each([
    'lgpd_session',
    'lgpd_session=',
    'lgpd_session=um; lgpd_session=dois',
    ['lgpd_session=um', 'lgpd_session=dois'],
    'lgpd_session=valor com espaco',
  ])('recusa cookie esperado estruturalmente inválido', (header) => {
    expect(
      extractSessionCookie(header, sessionCookieProfile('development')),
    ).toEqual({ status: 'invalid' });
  });

  it('expira cookie HTTP sem Domain e sem Secure', () => {
    const value = expiredSessionCookie(sessionCookieProfile('development'));
    expect(value).toContain('lgpd_session=');
    expect(value).toContain('Path=/');
    expect(value).toContain('Max-Age=0');
    expect(value).toContain('HttpOnly');
    expect(value).toContain('SameSite=Lax');
    expect(value).not.toContain('Secure');
    expect(value).not.toContain('Domain');
  });

  it('expira cookie __Host de produção com Secure e sem Domain', () => {
    const value = expiredSessionCookie(sessionCookieProfile('production'));
    expect(value).toContain('__Host-lgpd_session=');
    expect(value).toContain('Secure');
    expect(value).not.toContain('Domain');
  });
});

describe('Configuração do ambiente de autenticação', () => {
  it('recusa NODE_ENV desconhecido sem fallback de perfil', () => {
    expect(() =>
      loadEnvironment({
        API_HOST: '127.0.0.1',
        API_PORT: '3000',
        DB_HOST: '127.0.0.1',
        DB_PORT: '5432',
        DB_NAME: 'lgpd_test_configuration',
        DB_RUNTIME_USER: 'lgpd_runtime',
        DB_RUNTIME_PASSWORD: 'fictitious-runtime-password',
        NODE_ENV: 'staging',
      }),
    ).toThrow('NODE_ENV: use development, test ou production.');
  });
});

describe('Autenticação da Session', () => {
  it('calcula SHA-256 hexadecimal do segredo exatamente recebido', async () => {
    const sessionId = randomUUID();
    const userId = randomUUID();
    const { service, resolveSessionByTokenDigest } = serviceWith({
      sessionId,
      userId,
      expiresAt: future,
      revokedAt: null,
    });
    const result = await service.authenticate('segredo.%2F-opaco', now);
    expect(resolveSessionByTokenDigest).toHaveBeenCalledExactlyOnceWith(
      createHash('sha256').update('segredo.%2F-opaco').digest('hex'),
    );
    expect(result).toEqual({
      authenticated: true,
      identity: { sessionId, authenticatedUserId: userId },
    });
    if (result.authenticated)
      expect(Object.isFrozen(result.identity)).toBe(true);
  });

  it('distingue internamente Session inexistente', async () => {
    const { service } = serviceWith(null);
    await expect(service.authenticate('inexistente', now)).resolves.toEqual({
      authenticated: false,
      reason: 'SESSION_NOT_FOUND',
    });
  });

  it('distingue internamente Session revogada', async () => {
    const { service } = serviceWith({
      sessionId: randomUUID(),
      userId: randomUUID(),
      expiresAt: future,
      revokedAt: new Date('2029-01-01T00:00:00.000Z'),
    });
    await expect(service.authenticate('revogada', now)).resolves.toEqual({
      authenticated: false,
      reason: 'SESSION_REVOKED',
    });
  });

  it.each([
    new Date('2029-12-31T23:59:59.999Z'),
    new Date('2030-01-01T00:00:00.000Z'),
  ])(
    'considera Session expirada quando expiresAt <= now',
    async (expiresAt) => {
      const { service } = serviceWith({
        sessionId: randomUUID(),
        userId: randomUUID(),
        expiresAt,
        revokedAt: null,
      });
      await expect(service.authenticate('expirada', now)).resolves.toEqual({
        authenticated: false,
        reason: 'SESSION_EXPIRED',
      });
    },
  );
});
