import type { RuntimeMode } from '../config/environment.js';

export type SessionCookieProfile = Readonly<{
  name: 'lgpd_session' | '__Host-lgpd_session';
  httpOnly: true;
  sameSite: 'Lax';
  path: '/';
  secure: boolean;
}>;

const HTTP_PROFILE: SessionCookieProfile = Object.freeze({
  name: 'lgpd_session',
  httpOnly: true,
  sameSite: 'Lax',
  path: '/',
  secure: false,
});

const HTTPS_PROFILE: SessionCookieProfile = Object.freeze({
  name: '__Host-lgpd_session',
  httpOnly: true,
  sameSite: 'Lax',
  path: '/',
  secure: true,
});

export function sessionCookieProfile(mode: RuntimeMode): SessionCookieProfile {
  return mode === 'production' ? HTTPS_PROFILE : HTTP_PROFILE;
}

export type ExtractedSessionCookie =
  | { status: 'missing' }
  | { status: 'invalid' }
  | { status: 'valid'; sessionSecret: string };

export function extractSessionCookie(
  cookieHeader: string | string[] | undefined,
  profile: SessionCookieProfile,
): ExtractedSessionCookie {
  if (cookieHeader === undefined) return { status: 'missing' };
  if (Array.isArray(cookieHeader)) return { status: 'invalid' };

  const matches: string[] = [];
  for (const part of cookieHeader.split(';')) {
    const separator = part.indexOf('=');
    if (separator < 0) {
      if (part.trim() === profile.name) return { status: 'invalid' };
      continue;
    }
    const name = part.slice(0, separator).trim();
    if (name === profile.name) matches.push(part.slice(separator + 1));
  }
  if (matches.length === 0) return { status: 'missing' };
  const value = matches[0];
  if (
    matches.length !== 1 ||
    value === undefined ||
    value.length === 0 ||
    [...value].some((character) => {
      const codePoint = character.codePointAt(0) ?? 0;
      return codePoint <= 0x20 || codePoint === 0x7f || character === ';';
    })
  )
    return { status: 'invalid' };
  return { status: 'valid', sessionSecret: value };
}

export function expiredSessionCookie(profile: SessionCookieProfile): string {
  const attributes = [
    `${profile.name}=`,
    'Path=/',
    'Max-Age=0',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (profile.secure) attributes.push('Secure');
  return attributes.join('; ');
}
