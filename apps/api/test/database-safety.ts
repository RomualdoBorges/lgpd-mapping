// Destructive operations require both the exact execution name and its database marker.
export function assertExclusiveTestDatabase(
  actualName: string,
  expectedName: string,
  marker: string | null,
): void {
  if (
    !/^lgpd_test_[0-9a-f]{32}$/.test(expectedName) ||
    actualName !== expectedName ||
    marker !== `lgpd-test-execution:${expectedName}`
  )
    throw new Error(
      'Operação destrutiva recusada: banco não exclusivo desta execução.',
    );
}
