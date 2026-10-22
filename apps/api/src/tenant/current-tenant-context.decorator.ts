import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type {
  AuthorizedTenantContext,
  RequestWithAuthorizedTenantContext,
} from './authorized-tenant-context.js';

export const CurrentTenantContext = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthorizedTenantContext => {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithAuthorizedTenantContext>();
    if (!request.authorizedTenantContext)
      throw new Error('AuthorizedTenantContext ausente no boundary protegido.');
    return request.authorizedTenantContext;
  },
);
