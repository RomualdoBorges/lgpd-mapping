import { BadRequestException, type PipeTransform } from '@nestjs/common';
import { invalidActivityIdResponse } from './processing-activity-http-contracts.js';

export class ProcessingActivityIdPipe implements PipeTransform<
  unknown,
  string
> {
  transform(value: unknown): string {
    // Match P.3's structural UUID contract without adding version/variant restrictions.
    if (
      typeof value !== 'string' ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        value,
      )
    )
      throw new BadRequestException(invalidActivityIdResponse);
    return value;
  }
}
