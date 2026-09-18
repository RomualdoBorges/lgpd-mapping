import { describe, expect, it, vi } from 'vitest';
import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from '../../src/persistence/schema.js';
import {
  validateTenantId,
  withTenant,
} from '../../src/persistence/tenant-transaction.js';
import { assertExclusiveTestDatabase } from '../database-safety.js';

describe('Boundary e proteção de operações destrutivas', () => {
  it.each(['', 'tenant-a', "x'; DROP TABLE users;--"])(
    'recusa contexto inválido antes da transação: %s',
    async (id) => {
      const pool = new pg.Pool();
      const db = drizzle(pool, { schema });
      const transaction = vi.spyOn(db, 'transaction');
      const operation = vi.fn();
      await expect(withTenant(db, id, operation)).rejects.toThrow(
        'tenant inválido',
      );
      expect(transaction).not.toHaveBeenCalled();
      expect(operation).not.toHaveBeenCalled();
      await pool.end();
    },
  );
  it('aceita UUID sem atribuir autorização', () => {
    expect(() =>
      validateTenantId('00000000-0000-0000-0000-000000000001'),
    ).not.toThrow();
  });
  const testName = 'lgpd_test_' + 'a'.repeat(32);
  const refused: [string, string, string | null][] = [
    ['lgpd_local', 'lgpd_local', null],
    ['production', testName, `lgpd-test-execution:${testName}`],
    [testName, testName, null],
    [testName, testName, 'outro marcador'],
    [
      'lgpd_test_arbitrario',
      'lgpd_test_arbitrario',
      'lgpd-test-execution:lgpd_test_arbitrario',
    ],
  ];
  it.each(refused)(
    'impede limpeza fora do banco exclusivo: %s',
    (actual, expected, marker) => {
      expect(() =>
        assertExclusiveTestDatabase(actual, expected, marker),
      ).toThrow('recusada');
    },
  );
  it('aceita apenas o banco marcado da própria execução', () => {
    expect(() =>
      assertExclusiveTestDatabase(
        testName,
        testName,
        `lgpd-test-execution:${testName}`,
      ),
    ).not.toThrow();
  });
});
