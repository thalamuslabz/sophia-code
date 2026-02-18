/**
 * Global test setup for E2E tests
 */

import { beforeAll, afterAll } from 'vitest';
import * as path from 'path';
import { existsSync, mkdirSync, rmSync } from 'fs';

const E2E_DIR = path.join(process.env.HOME || '/tmp', '.thalamus-e2e');

beforeAll(() => {
  // Ensure E2E directory exists
  if (!existsSync(E2E_DIR)) {
    mkdirSync(E2E_DIR, { recursive: true });
  }
  
  console.log('E2E Test Environment Ready');
  console.log(`Working directory: ${E2E_DIR}`);
});

afterAll(() => {
  // Cleanup old test runs (keep last 5)
  try {
    const dirs = require('fs').readdirSync(E2E_DIR)
      .filter((d: string) => d.startsWith('e2e-'))
      .map((d: string) => ({
        name: d,
        path: path.join(E2E_DIR, d),
        stat: require('fs').statSync(path.join(E2E_DIR, d))
      }))
      .sort((a: any, b: any) => b.stat.mtime - a.stat.mtime);
    
    // Remove all but the 5 most recent
    dirs.slice(5).forEach((dir: any) => {
      rmSync(dir.path, { recursive: true, force: true });
    });
  } catch {
    // Ignore cleanup errors
  }
});
