import {
  BadRequestException,
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { RequestWithAuthenticatedIdentity } from '../auth/authenticated-identity.js';
import { authenticationRequiredResponse } from '../auth/authentication-failure.js';
import type { RequestWithAuthorizedTenantContext } from './authorized-tenant-context.js';
import { parseOrganizationContextHeader } from './organization-context-header.js';
import {
  invalidOrganizationContextResponse,
  organizationAccessDeniedResponse,
  organizationContextRequiredResponse,
} from './tenant-context-errors.js';
import { TenantContextService } from './tenant-context.service.js';

type TenantHttpRequest = RequestWithAuthenticatedIdentity &
  RequestWithAuthorizedTenantContext & {
    headers: { 'x-organization-id'?: string | string[] };
  };

@Injectable()
export class TenantContextGuard implements CanActivate {
  constructor(private readonly tenantContext: TenantContextService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<TenantHttpRequest>();
    if (!request.authenticatedIdentity)
      throw new UnauthorizedException(authenticationRequiredResponse);

    const header = parseOrganizationContextHeader(
      request.headers['x-organization-id'],
    );
    if (header.status === 'missing')
      throw new BadRequestException(organizationContextRequiredResponse);
    if (header.status === 'invalid')
      throw new BadRequestException(invalidOrganizationContextResponse);

    const authorized = await this.tenantContext.authorize(
      request.authenticatedIdentity,
      header.requestedOrganizationId,
    );
    if (!authorized)
      throw new ForbiddenException(organizationAccessDeniedResponse);

    request.authorizedTenantContext = authorized;
    return true;
  }
}
