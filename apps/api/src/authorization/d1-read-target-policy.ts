import {
  createD1ReadReach,
  createD1ReadTarget,
  type D1ReadReach,
  type D1ReadTarget,
} from './d1-read-contracts.js';

// Callers remain responsible for the provenance of the reach and descriptor.
export function canReadD1Target(
  reach: D1ReadReach,
  target: D1ReadTarget,
): boolean {
  const validatedReach = createD1ReadReach(reach);
  const validatedTarget = createD1ReadTarget(target);
  const compatibleKind =
    (validatedReach.permission === 'processing_activity:read' &&
      validatedTarget.resourceKind === 'ProcessingActivity') ||
    (validatedReach.permission === 'ropa:read' &&
      validatedTarget.resourceKind === 'ROPA');

  if (
    !compatibleKind ||
    validatedTarget.organizationId !== validatedReach.authorizedOrganizationId
  )
    return false;

  if (validatedReach.scope === 'ORGANIZATION') return true;

  return (
    validatedTarget.businessUnitId !== null &&
    validatedReach.businessUnitIds.includes(validatedTarget.businessUnitId)
  );
}
