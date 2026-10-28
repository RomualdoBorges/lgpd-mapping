import { BadRequestException } from '@nestjs/common';
import type { ProcessingActivityListPagination } from '../persistence/processing-activity-list-repository.js';
import { invalidActivityPaginationResponse } from './processing-activity-http-contracts.js';

function invalid(): never {
  throw new BadRequestException(invalidActivityPaginationResponse);
}

function decode(value: string): string {
  try {
    return decodeURIComponent(value.replaceAll('+', ' '));
  } catch (error: unknown) {
    if (error instanceof URIError) invalid();
    throw error;
  }
}

// Inspect every original occurrence, independent of Express parser limits or transformations.
export function parseProcessingActivityListQuery(
  rawQuery: unknown,
): ProcessingActivityListPagination {
  if (typeof rawQuery !== 'string') invalid();
  const values = new Map<string, number>();
  if (rawQuery !== '') {
    for (const pair of rawQuery.split('&')) {
      const separator = pair.indexOf('=');
      const key = decode(separator < 0 ? pair : pair.slice(0, separator));
      const value = decode(separator < 0 ? '' : pair.slice(separator + 1));
      if ((key !== 'page' && key !== 'pageSize') || values.has(key)) invalid();
      if (!/^[1-9][0-9]*$/.test(value)) invalid();
      const number = Number(value);
      if (!Number.isSafeInteger(number) || (key === 'pageSize' && number > 100))
        invalid();
      values.set(key, number);
    }
  }
  return Object.freeze({
    page: values.get('page') ?? 1,
    pageSize: values.get('pageSize') ?? 20,
  });
}
