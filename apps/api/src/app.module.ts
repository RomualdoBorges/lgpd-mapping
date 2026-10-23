import { Module } from '@nestjs/common';
import { ENVIRONMENT, loadEnvironment } from './config/environment.js';
import { HealthController } from './health.controller.js';
import { DatabaseService } from './persistence/database.service.js';
import { SessionAuthenticationGuard } from './auth/session-authentication.guard.js';
import { SessionAuthenticationService } from './auth/session-authentication.service.js';
import { TenantContextGuard } from './tenant/tenant-context.guard.js';
import { TenantContextService } from './tenant/tenant-context.service.js';
import { MembershipGrantsService } from './authorization/membership-grants.service.js';

@Module({
  controllers: [HealthController],
  providers: [
    { provide: ENVIRONMENT, useFactory: () => loadEnvironment(process.env) },
    DatabaseService,
    SessionAuthenticationService,
    SessionAuthenticationGuard,
    TenantContextService,
    TenantContextGuard,
    MembershipGrantsService,
  ],
})
export class AppModule {}
