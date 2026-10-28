import 'reflect-metadata';
import {
  BadRequestException,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host.js';
import { describe, expect, it, vi } from 'vitest';
import { ProcessingActivityController } from '../../src/processing-activities/processing-activity.controller.js';
import { ProcessingActivityIdPipe } from '../../src/processing-activities/processing-activity-id.pipe.js';
import { ProcessingActivityHttpFilter } from '../../src/processing-activities/processing-activity-http.filter.js';
import {
  invalidActivityIdResponse,
  processingActivityNotFoundResponse,
  activityInternalErrorResponse,
} from '../../src/processing-activities/processing-activity-http-contracts.js';

const ID = 'abcdef00-0000-0000-0000-000000000001';
const context = Object.freeze({
  membershipId: ID,
  authorizedOrganizationId: '00000000-0000-0000-0000-000000000002',
});
const summary = Object.freeze({
  id: ID,
  organizationId: context.authorizedOrganizationId,
  businessUnitId: ID,
  name: 'Atividade',
  createdAt: '2026-10-28T12:00:00.123456Z',
  updatedAt: '2026-10-28T12:01:00.654321Z',
});

describe('P.4 — controller', () => {
  it('chama P.3 uma vez com contexto e UUID, preservando timestamps e omitindo extras', async () => {
    const findById = vi.fn().mockResolvedValue({
      ...summary,
      grants: ['private'],
      status: 'private',
    });
    const result = await new ProcessingActivityController({
      findById,
    }).findById(context, ID);
    expect(findById).toHaveBeenCalledExactlyOnceWith(context, ID);
    expect(findById.mock.calls[0]?.[0]).toBe(context);
    expect(result).toEqual({ data: summary });
    expect(Object.keys(result)).toEqual(['data']);
    expect(Object.keys(result.data).sort()).toEqual([
      'businessUnitId',
      'createdAt',
      'id',
      'name',
      'organizationId',
      'updatedAt',
    ]);
  });
  it('null produz 404 uniforme', async () => {
    const controller = new ProcessingActivityController({
      findById: vi.fn().mockResolvedValue(null),
    });
    const error = await controller
      .findById(context, ID)
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(NotFoundException);
    if (!(error instanceof NotFoundException)) throw Error('Exceção ausente');
    expect(error.getResponse()).toEqual(processingActivityNotFoundResponse);
  });
  it('propaga erro técnico sem convertê-lo em 404', async () => {
    const error = new Error('falha SQL privada');
    const controller = new ProcessingActivityController({
      findById: vi.fn().mockRejectedValue(error),
    });
    await expect(controller.findById(context, ID)).rejects.toBe(error);
  });
});

describe('P.4 — UUID', () => {
  it.each([
    ID,
    ID.toUpperCase(),
    '00000000-0000-0000-0000-000000000000',
    'ffffffff-ffff-ffff-ffff-ffffffffffff',
  ])('preserva UUID estrutural %s', (id) => {
    expect(new ProcessingActivityIdPipe().transform(id)).toBe(id);
  });
  it.each(
    [null, undefined, {}, [], 123, '', 'invalid', ID + ' ', ' OR true --'].map(
      (value) => ({ value }),
    ),
  )('rejeita $value com erro público', ({ value }) => {
    let error: unknown;
    try {
      new ProcessingActivityIdPipe().transform(value);
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(BadRequestException);
    if (!(error instanceof BadRequestException)) throw Error('Exceção ausente');
    expect(error.getStatus()).toBe(400);
    expect(error.getResponse()).toEqual(invalidActivityIdResponse);
  });
});

describe('P.4 — filtro local', () => {
  it.each([400, 401, 403, 404])(
    'preserva HttpException conhecida %s',
    (status) => {
      const body = {
        error: { code: 'PUBLIC_CODE', message: 'Mensagem pública.' },
      };
      const response = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      new ProcessingActivityHttpFilter().catch(
        new HttpException(body, status),
        new ExecutionContextHost([{}, response]),
      );
      expect(response.status).toHaveBeenCalledExactlyOnceWith(status);
      expect(response.json).toHaveBeenCalledExactlyOnceWith(body);
    },
  );
  it.each([
    new Error('SQL password=segredo'),
    new HttpException('stack e SQL privados', 500),
    null,
  ])('sanitiza erro inesperado %#', (error) => {
    const response = { status: vi.fn().mockReturnThis(), json: vi.fn() };
    new ProcessingActivityHttpFilter().catch(
      error,
      new ExecutionContextHost([{}, response]),
    );
    expect(response.status).toHaveBeenCalledExactlyOnceWith(500);
    expect(response.json).toHaveBeenCalledExactlyOnceWith(
      activityInternalErrorResponse,
    );
  });
});
