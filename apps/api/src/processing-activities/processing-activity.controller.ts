import {
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Req,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { SessionAuthenticationGuard } from '../auth/session-authentication.guard.js';
import { TenantContextGuard } from '../tenant/tenant-context.guard.js';
import { CurrentTenantContext } from '../tenant/current-tenant-context.decorator.js';
import type { AuthorizedTenantContext } from '../tenant/authorized-tenant-context.js';
import { ProcessingActivityListService } from './processing-activity-list.service.js';
import { parseProcessingActivityListQuery } from './processing-activity-list-query.js';
import { ProcessingActivityReadService } from './processing-activity-read.service.js';
import { ProcessingActivityIdPipe } from './processing-activity-id.pipe.js';
import { ProcessingActivityHttpFilter } from './processing-activity-http.filter.js';
import {
  processingActivityNotFoundResponse,
  type ProcessingActivityReadResponse,
  type ProcessingActivityListResponse,
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
    @Inject(ProcessingActivityListService)
    private readonly lists: Pick<ProcessingActivityListService, 'list'>,
  ) {}

  @Get()
  async list(
    @CurrentTenantContext() context: AuthorizedTenantContext,
    @Req() request: { originalUrl: string },
  ): Promise<ProcessingActivityListResponse> {
    const separator = request.originalUrl.indexOf('?');
    const pagination = parseProcessingActivityListQuery(
      separator < 0 ? '' : request.originalUrl.slice(separator + 1),
    );
    const page = await this.lists.list(context, pagination);
    return {
      data: page.items.map((activity) => ({
        id: activity.id,
        organizationId: activity.organizationId,
        businessUnitId: activity.businessUnitId,
        name: activity.name,
        createdAt: activity.createdAt,
        updatedAt: activity.updatedAt,
      })),
      pagination: { ...pagination, hasNextPage: page.hasNextPage },
    };
  }

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
