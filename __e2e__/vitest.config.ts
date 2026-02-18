import { defineConfig } from 'vitest/config';
import * as path from 'path';

export default defineConfig({
  test: {
    name: 'e2e',
    root: __dirname,
    globals: true,
    environment: 'node',
    testTimeout: 30000,
    hookTimeout: 10000,
    teardownTimeout: 5000,
    include: ['tests/**/*.spec.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      enabled: false
    },
    reporters: ['verbose'],
    setupFiles: ['./test-setup.ts']
  },
  resolve: {
    alias: {
      '@e2e': __dirname,
      '@helpers': path.join(__dirname, 'helpers')
    }
  }
});
