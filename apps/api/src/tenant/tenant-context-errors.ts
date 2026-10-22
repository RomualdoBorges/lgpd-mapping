export const organizationContextRequiredResponse = {
  error: {
    code: 'ORGANIZATION_CONTEXT_REQUIRED',
    message: 'A organização da requisição é obrigatória.',
  },
} as const;

export const invalidOrganizationContextResponse = {
  error: {
    code: 'INVALID_ORGANIZATION_CONTEXT',
    message: 'Contexto de organização inválido.',
  },
} as const;

export const organizationAccessDeniedResponse = {
  error: {
    code: 'ORGANIZATION_ACCESS_DENIED',
    message: 'Acesso à organização não autorizado.',
  },
} as const;
