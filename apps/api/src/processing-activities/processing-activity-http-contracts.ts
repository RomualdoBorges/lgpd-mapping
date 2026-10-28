export type ProcessingActivityReadResponse = Readonly<{
  data: Readonly<{
    id: string;
    organizationId: string;
    businessUnitId: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  }>;
}>;

export const processingActivityNotFoundResponse = {
  error: {
    code: 'PROCESSING_ACTIVITY_NOT_FOUND',
    message: 'Atividade de tratamento não encontrada.',
  },
} as const;

export const invalidActivityIdResponse = {
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Falha na validação da requisição',
    details: [{ field: 'id', code: 'INVALID_UUID' }],
  },
} as const;

export const activityInternalErrorResponse = {
  error: {
    code: 'INTERNAL_ERROR',
    message: 'Ocorreu um erro inesperado.',
  },
} as const;

export type ProcessingActivityListResponse = Readonly<{
  data: readonly ProcessingActivityReadResponse['data'][];
  pagination: Readonly<{
    page: number;
    pageSize: number;
    hasNextPage: boolean;
  }>;
}>;

export const invalidActivityPaginationResponse = {
  error: {
    code: 'VALIDATION_ERROR',
    message: 'Falha na validação da requisição',
    details: [{ field: 'query', code: 'INVALID_PAGINATION' }],
  },
} as const;
