export type AuthenticatedIdentity = Readonly<{
  sessionId: string;
  authenticatedUserId: string;
}>;

export type RequestWithAuthenticatedIdentity = {
  authenticatedIdentity?: AuthenticatedIdentity;
};
