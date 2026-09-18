import { Module } from '@nestjs/common';
import { ENVIRONMENT, loadEnvironment } from './config/environment.js';
import { HealthController } from './health.controller.js';
import { DatabaseService } from './persistence/database.service.js';

@Module({
  controllers: [HealthController],
  providers: [
    { provide: ENVIRONMENT, useFactory: () => loadEnvironment(process.env) },
    DatabaseService,
  ],
})
export class AppModule {}
