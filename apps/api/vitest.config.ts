import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'node',
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          include: ['test/unit/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'integration',
          environment: 'node',
          include: ['test/integration/**/*.test.ts'],
          fileParallelism: false,
          maxWorkers: 1,
          testTimeout: 15000,
          hookTimeout: 30000,
        },
      },
    ],
  },
});
