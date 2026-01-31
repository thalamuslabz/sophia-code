import { describe, it, expect, vi } from 'vitest';
import { AIProviderFactory } from './factory';
import { OpenCodeAdapter } from './adapters/opencode';

// Mock the config
vi.mock('../../config/env', () => ({
  env: {
    VITE_AI_PROVIDER: 'opencode',
    VITE_OPENCODE_API_KEY: 'test-key',
  }
}));

describe('AI Core System', () => {
  describe('Factory', () => {
    it('should return the OpenCode adapter when configured', () => {
      const provider = AIProviderFactory.getProvider();
      expect(provider).toBeInstanceOf(OpenCodeAdapter);
    });

    it('should maintain singleton instance', () => {
      const provider1 = AIProviderFactory.getProvider();
      const provider2 = AIProviderFactory.getProvider();
      expect(provider1).toBe(provider2);
    });
  });

  describe('OpenCode Adapter', () => {
    it('should have the correct provider ID', () => {
      const adapter = new OpenCodeAdapter();
      expect(adapter.id).toBe('opencode');
    });

    it('should return simulated text response', async () => {
      const adapter = new OpenCodeAdapter();
      const response = await adapter.generateText('Hello');
      expect(response).toContain('OpenCode');
    });
  });
});
