import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type {
  AuthenticatedIdentity,
  RequestWithAuthenticatedIdentity,
} from './authenticated-identity.js';

export const CurrentIdentity = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedIdentity => {
    const request = context
      .switchToHttp()
      .getRequest<RequestWithAuthenticatedIdentity>();
    if (!request.authenticatedIdentity)
      throw new Error('AuthenticatedIdentity ausente no boundary protegido.');
    return request.authenticatedIdentity;
  },
);
