import { defineWorkspace } from 'vitest/config';

/**
 * Vitest workspace configuration for monorepo testing
 * Coordinates tests across all packages with shared coverage
 *
 * Based on thalamus-orchestrator testing patterns
 */
export default defineWorkspace([
  // CLI package - unit and integration tests
  {
    test: {
      name: 'cli',
      root: './packages/cli',
      globals: true,
      include: ['src/**/*.test.ts'],
      exclude: ['node_modules', 'dist'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        reportsDirectory: './coverage',
        include: ['src/**/*.ts'],
        exclude: [
          'src/**/*.test.ts',
          'src/**/*.d.ts',
          'src/templates/**',
          'src/content/**',
        ],
      },
    },
  },
  // Dashboard package - component and integration tests
  {
    test: {
      name: 'dashboard',
      root: './packages/dashboard',
      globals: true,
      environment: 'jsdom',
      include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
      exclude: ['node_modules', '.next', 'dist'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        reportsDirectory: './coverage',
        include: ['src/**/*.ts', 'src/**/*.tsx'],
        exclude: [
          'src/**/*.test.ts',
          'src/**/*.test.tsx',
          'src/**/*.d.ts',
        ],
      },
    },
  },
  // E2E tests - using Node environment for API testing
  {
    test: {
      name: 'e2e-api',
      root: '.',
      globals: true,
      environment: 'node',
      include: ['e2e/**/*.test.ts'],
      exclude: ['node_modules', 'e2e/**/*.spec.ts'], // Exclude Playwright tests
      testTimeout: 60000,
      hookTimeout: 60000,
    },
  },
]);
