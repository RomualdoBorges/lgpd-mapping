import {
  type CanActivate,
  type ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ENVIRONMENT, type Environment } from '../config/environment.js';
import type { RequestWithAuthenticatedIdentity } from './authenticated-identity.js';
import { authenticationRequiredResponse } from './authentication-failure.js';
import {
  expiredSessionCookie,
  extractSessionCookie,
  sessionCookieProfile,
} from './session-cookie.js';
import { SessionAuthenticationService } from './session-authentication.service.js';

type HttpRequest = RequestWithAuthenticatedIdentity & {
  headers: { cookie?: string | string[] };
};
type HttpResponse = { setHeader(name: string, value: string): void };

@Injectable()
export class SessionAuthenticationGuard implements CanActivate {
  constructor(
    @Inject(ENVIRONMENT) private readonly environment: Environment,
    private readonly authentication: SessionAuthenticationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const http = context.switchToHttp();
    const request = http.getRequest<HttpRequest>();
    const response = http.getResponse<HttpResponse>();
    const profile = sessionCookieProfile(this.environment.runtimeMode);
    const cookie = extractSessionCookie(request.headers.cookie, profile);

    if (cookie.status === 'missing') this.reject();
    if (cookie.status === 'invalid') {
      response.setHeader('Set-Cookie', expiredSessionCookie(profile));
      this.reject();
    }

    const result = await this.authentication.authenticate(cookie.sessionSecret);
    if (!result.authenticated) {
      response.setHeader('Set-Cookie', expiredSessionCookie(profile));
      this.reject();
    }
    request.authenticatedIdentity = result.identity;
    return true;
  }

  private reject(): never {
    throw new UnauthorizedException(authenticationRequiredResponse);
  }
}
