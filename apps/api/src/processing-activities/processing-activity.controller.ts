import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { SessionAuthenticationGuard } from '../auth/session-authentication.guard.js';
import { TenantContextGuard } from '../tenant/tenant-context.guard.js';
import { CurrentTenantContext } from '../tenant/current-tenant-context.decorator.js';
import type { AuthorizedTenantContext } from '../tenant/authorized-tenant-context.js';
import { ProcessingActivityReadService } from './processing-activity-read.service.js';
import { ProcessingActivityIdPipe } from './processing-activity-id.pipe.js';
import { ProcessingActivityHttpFilter } from './processing-activity-http.filter.js';
import {
  processingActivityNotFoundResponse,
  type ProcessingActivityReadResponse,
} from './processing-activity-http-contracts.js';

@Controller('api/v1/processing-activities')
@UseGuards(SessionAuthenticationGuard, TenantContextGuard)
@UseFilters(ProcessingActivityHttpFilter)
export class ProcessingActivityController {
  constructor(
    @Inject(ProcessingActivityReadService)
    private readonly activities: Pick<
      ProcessingActivityReadService,
      'findById'
    >,
  ) {}

  @Get(':id')
  async findById(
    @CurrentTenantContext() context: AuthorizedTenantContext,
    @Param('id', ProcessingActivityIdPipe) id: string,
  ): Promise<ProcessingActivityReadResponse> {
    const activity = await this.activities.findById(context, id);
    if (activity === null)
      throw new NotFoundException(processingActivityNotFoundResponse);
    return {
      data: {
        id: activity.id,
        organizationId: activity.organizationId,
        businessUnitId: activity.businessUnitId,
        name: activity.name,
        createdAt: activity.createdAt,
        updatedAt: activity.updatedAt,
      },
    };
  }
}
