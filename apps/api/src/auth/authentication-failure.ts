export type AuthenticationFailureReason =
  | 'COOKIE_MISSING'
  | 'COOKIE_INVALID'
  | 'SESSION_NOT_FOUND'
  | 'SESSION_EXPIRED'
  | 'SESSION_REVOKED';

export const authenticationRequiredResponse = {
  error: {
    code: 'AUTHENTICATION_REQUIRED',
    message: 'Autenticação necessária.',
  },
} as const;
