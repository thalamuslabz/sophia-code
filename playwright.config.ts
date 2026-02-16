import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for E2E testing
 * Tests the full workflow: Dashboard UI -> API -> CLI Integration
 *
 * Based on thalamus-orchestrator testing patterns
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:9473',
    trace: 'on',
    screenshot: 'on',
    video: 'on',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    // Start the dashboard (which includes API routes)
    command: 'cd packages/dashboard && npm run dev',
    url: 'http://localhost:9473/api/health',
    reuseExistingServer: !process.env.CI,
    timeout: 60000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      SOPHIA_PROJECT_ROOT: process.cwd(),
    },
  },
});
