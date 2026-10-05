const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type OrganizationContextHeader =
  | { status: 'missing' }
  | { status: 'invalid' }
  | { status: 'valid'; requestedOrganizationId: string };

export function parseOrganizationContextHeader(
  value: string | string[] | undefined,
): OrganizationContextHeader {
  if (value === undefined) return { status: 'missing' };
  if (Array.isArray(value) || value.includes(',') || !UUID_PATTERN.test(value))
    return { status: 'invalid' };
  return { status: 'valid', requestedOrganizationId: value };
}
