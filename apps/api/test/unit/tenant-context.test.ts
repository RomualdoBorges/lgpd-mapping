import { randomUUID } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import type { AuthenticatedIdentity } from '../../src/auth/authenticated-identity.js';
import { parseOrganizationContextHeader } from '../../src/tenant/organization-context-header.js';
import { TenantContextService } from '../../src/tenant/tenant-context.service.js';

describe('X-Organization-Id', () => {
  const organizationId = randomUUID();

  it('distingue header ausente', () => {
    expect(parseOrganizationContextHeader(undefined)).toEqual({
      status: 'missing',
    });
  });

  it.each([
    'não-é-uuid',
    '',
    ` ${organizationId}`,
    `${organizationId} `,
    `${organizationId},${randomUUID()}`,
    [organizationId, randomUUID()],
  ])('recusa representação que não seja exatamente um UUID: %j', (value) => {
    expect(parseOrganizationContextHeader(value)).toEqual({
      status: 'invalid',
    });
  });

  it('aceita exatamente um UUID válido como contexto solicitado', () => {
    expect(parseOrganizationContextHeader(organizationId)).toEqual({
      status: 'valid',
      requestedOrganizationId: organizationId,
    });
  });
});

describe('TenantContextService', () => {
  const identity: AuthenticatedIdentity = Object.freeze({
    sessionId: randomUUID(),
    authenticatedUserId: randomUUID(),
  });

  it('cria contexto mínimo e readonly somente do resultado autorizado', async () => {
    const requestedOrganizationId = randomUUID();
    const authorizedOrganizationId = randomUUID();
    const membershipId = randomUUID();
    const resolveMembership = vi.fn().mockResolvedValue({
      membershipId,
      organizationId: authorizedOrganizationId,
    });
    const service = new TenantContextService({ resolveMembership });

    const result = await service.authorize(identity, requestedOrganizationId);

    expect(resolveMembership).toHaveBeenCalledExactlyOnceWith(
      identity.authenticatedUserId,
      requestedOrganizationId,
    );
    expect(result).toEqual({ membershipId, authorizedOrganizationId });
    expect(Object.keys(result ?? {}).sort()).toEqual([
      'authorizedOrganizationId',
      'membershipId',
    ]);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('não cria contexto quando resolve_membership não autoriza', async () => {
    const resolveMembership = vi.fn().mockResolvedValue(null);
    const service = new TenantContextService({ resolveMembership });
    await expect(service.authorize(identity, randomUUID())).resolves.toBeNull();
  });
});
