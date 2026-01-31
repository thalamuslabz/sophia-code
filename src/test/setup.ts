import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with testing-library matchers
expect.extend(matchers);

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Mock fetch API for tests
global.fetch = vi.fn();

// Mock the environment variables
vi.stubGlobal('import.meta', {
  env: {
    VITE_API_BASE_URL: 'http://localhost:3000/api',
    VITE_API_KEY: 'test-api-key',
    VITE_AI_PROVIDER: 'opencode',
  },
});

// Create a helper to mock fetch responses
export const mockFetch = (status: number, responseBody: any) => {
  (global.fetch as any).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(responseBody),
  });
};