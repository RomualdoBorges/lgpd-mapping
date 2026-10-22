export type AuthorizedTenantContext = Readonly<{
  membershipId: string;
  authorizedOrganizationId: string;
}>;

export type RequestWithAuthorizedTenantContext = {
  authorizedTenantContext?: AuthorizedTenantContext;
};
