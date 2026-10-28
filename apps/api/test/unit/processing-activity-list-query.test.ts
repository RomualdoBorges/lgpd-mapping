import 'reflect-metadata';
import { BadRequestException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { parseProcessingActivityListQuery } from '../../src/processing-activities/processing-activity-list-query.js';
import { ProcessingActivityController } from '../../src/processing-activities/processing-activity.controller.js';

const invalidQueries = [
  'page=0',
  'pageSize=0',
  'page=-1',
  'pageSize=-1',
  'page=1.5',
  'pageSize=2.5',
  'page=1e2',
  'page=0x10',
  'page=+1',
  'page=%2B1',
  'page=%201',
  'page=1%20',
  'page=',
  'page',
  'pageSize=',
  'page=NaN',
  'page=Infinity',
  'page=01',
  'page=9007199254740992',
  'pageSize=101',
  'pageSize=9007199254740992',
  'page=1&page=1',
  'pageSize=1&pageSize=2',
  'page=1&%70age=2',
  'page[]=1',
  'page[0]=1',
  'page[x]=1',
  'page=%7B%7D',
  'page=1,2',
  'organizationId=x',
  'grants=x',
  'reach=x',
  'permission=x',
  'sort=asc',
  '__proto__=x',
  'constructor=x',
  'page=%',
  'page=%1',
  'page=%GG',
  'page=%C0%AF',
  'page=%ED%A0%80',
  '%GG=1',
  '%2570age=1',
  'page=%2531',
  'page=1=2',
  'page=1&&pageSize=2',
];

describe('L.3A — query original', () => {
  it.each([
    ['', { page: 1, pageSize: 20 }],
    ['page=2', { page: 2, pageSize: 20 }],
    ['pageSize=100', { page: 1, pageSize: 100 }],
    [
      'page=9007199254740991&pageSize=1',
      { page: Number.MAX_SAFE_INTEGER, pageSize: 1 },
    ],
    ['%70age=%32&pageSize=%31%30%30', { page: 2, pageSize: 100 }],
  ] as const)('aceita %s', (query, expected) => {
    const result = parseProcessingActivityListQuery(query);
    expect(result).toEqual(expected);
    expect(Object.isFrozen(result)).toBe(true);
    expect(() => Object.assign(result, { page: 0 })).toThrow(TypeError);
  });
  it.each(invalidQueries)('rejeita %s sem defaults silenciosos', (query) => {
    let error: unknown;
    try {
      parseProcessingActivityListQuery(query);
    } catch (caught) {
      error = caught;
    }
    expect(error).toBeInstanceOf(BadRequestException);
    if (!(error instanceof BadRequestException)) throw Error('Erro ausente');
    expect(error.getStatus()).toBe(400);
    expect(error.getResponse()).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Falha na validação da requisição',
        details: [{ field: 'query', code: 'INVALID_PAGINATION' }],
      },
    });
  });
  it.each([null, undefined, [], {}, 1].map((value) => ({ value })))(
    'rejeita entrada runtime $value',
    ({ value }) => {
      expect(() => parseProcessingActivityListQuery(value)).toThrow(
        BadRequestException,
      );
    },
  );
  it('defaults não compartilham objeto mutável entre chamadas', () => {
    expect(parseProcessingActivityListQuery('')).not.toBe(
      parseProcessingActivityListQuery(''),
    );
  });
});

describe('L.3A — adaptação HTTP', () => {
  const context = {
    membershipId: '00000000-0000-0000-0000-000000000001',
    authorizedOrganizationId: '00000000-0000-0000-0000-000000000002',
  };
  it('envia contexto interno e cópia congelada; publica somente campos aprovados', async () => {
    const item = {
      id: context.membershipId,
      organizationId: context.authorizedOrganizationId,
      businessUnitId: context.membershipId,
      name: 'Atividade',
      createdAt: '2026-10-28T00:00:00.000Z',
      updatedAt: '2026-10-28T00:00:00.000Z',
    };
    const list = vi.fn().mockResolvedValue({
      items: [{ ...item, status: 'private', grants: [] }],
      hasNextPage: true,
      total: 123,
    });
    const controller = new ProcessingActivityController(
      { findById: vi.fn() },
      { list },
    );
    expect(
      await controller.list(context, {
        originalUrl: '/api/v1/processing-activities?page=2&pageSize=1',
      }),
    ).toEqual({
      data: [item],
      pagination: { page: 2, pageSize: 1, hasNextPage: true },
    });
    expect(list).toHaveBeenCalledExactlyOnceWith(context, {
      page: 2,
      pageSize: 1,
    });
    expect(list.mock.calls[0]?.[0]).toBe(context);
    expect(Object.isFrozen(list.mock.calls[0]?.[1])).toBe(true);
  });
  it('query inválida impede chamada da L.2', async () => {
    const list = vi.fn();
    const controller = new ProcessingActivityController(
      { findById: vi.fn() },
      { list },
    );
    await expect(
      controller.list(context, {
        originalUrl: '/api/v1/processing-activities?page=0',
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(list).not.toHaveBeenCalled();
  });
  it('falha técnica não produz envelope vazio', async () => {
    const error = new Error('persistência');
    const list = vi.fn().mockRejectedValue(error);
    await expect(
      new ProcessingActivityController({ findById: vi.fn() }, { list }).list(
        context,
        { originalUrl: '/api/v1/processing-activities' },
      ),
    ).rejects.toBe(error);
  });
});
