import { ProcessingActivityListService } from './processing-activities/processing-activity-list.service.js';
import { Module } from '@nestjs/common';
import { ProcessingActivityController } from './processing-activities/processing-activity.controller.js';
import { ProcessingActivityReadService } from './processing-activities/processing-activity-read.service.js';
import { ENVIRONMENT, loadEnvironment } from './config/environment.js';
import { HealthController } from './health.controller.js';
import { DatabaseService } from './persistence/database.service.js';
import { SessionAuthenticationGuard } from './auth/session-authentication.guard.js';
import { SessionAuthenticationService } from './auth/session-authentication.service.js';
import { TenantContextGuard } from './tenant/tenant-context.guard.js';
import { TenantContextService } from './tenant/tenant-context.service.js';
import { MembershipGrantsService } from './authorization/membership-grants.service.js';

@Module({
  controllers: [HealthController, ProcessingActivityController],
  providers: [
    { provide: ENVIRONMENT, useFactory: () => loadEnvironment(process.env) },
    DatabaseService,
    SessionAuthenticationService,
    SessionAuthenticationGuard,
    TenantContextService,
    TenantContextGuard,
    MembershipGrantsService,
    {
      provide: ProcessingActivityListService,
      inject: [DatabaseService],
      useFactory: (database: DatabaseService) =>
        new ProcessingActivityListService(database),
    },
    {
      provide: ProcessingActivityReadService,
      inject: [DatabaseService],
      useFactory: (database: DatabaseService) =>
        new ProcessingActivityReadService(database),
    },
  ],
})
export class AppModule {}
