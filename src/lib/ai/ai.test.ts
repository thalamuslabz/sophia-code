import { describe, it, expect, vi } from 'vitest';
import { AIProviderFactory } from './factory';
import { OpenCodeAdapter } from './adapters/opencode';
import { AnthropicAdapter } from './adapters/anthropic';
import { DeepseekAdapter } from './adapters/deepseek';
import { KimiAdapter } from './adapters/kimi';

// Create a mock factory to change provider type during tests
let mockProviderType = 'opencode';

// Mock the config
vi.mock('../../config/env', () => ({
  get env() {
    return {
      VITE_AI_PROVIDER: mockProviderType,
      VITE_OPENCODE_API_KEY: 'test-key',
      VITE_ANTHROPIC_API_KEY: 'test-key',
      VITE_DEEPSEEK_API_KEY: 'test-key',
      VITE_KIMI_API_KEY: 'test-key',
    };
  }
}));

describe('AI Core System', () => {
  describe('Factory', () => {
    // Reset the singleton before each test
    beforeEach(() => {
      // @ts-ignore: Access private static field for testing
      AIProviderFactory.instance = undefined;
      mockProviderType = 'opencode';
    });

    it('should return the OpenCode adapter when configured', () => {
      mockProviderType = 'opencode';
      const provider = AIProviderFactory.getProvider();
      expect(provider).toBeInstanceOf(OpenCodeAdapter);
    });

    it('should return the Anthropic adapter when configured', () => {
      mockProviderType = 'anthropic';
      const provider = AIProviderFactory.getProvider();
      expect(provider).toBeInstanceOf(AnthropicAdapter);
    });

    it('should return the Deepseek adapter when configured', () => {
      mockProviderType = 'deepseek';
      const provider = AIProviderFactory.getProvider();
      expect(provider).toBeInstanceOf(DeepseekAdapter);
    });

    it('should return the Kimi adapter when configured', () => {
      mockProviderType = 'kimi';
      const provider = AIProviderFactory.getProvider();
      expect(provider).toBeInstanceOf(KimiAdapter);
    });

    it('should maintain singleton instance', () => {
      const provider1 = AIProviderFactory.getProvider();
      const provider2 = AIProviderFactory.getProvider();
      expect(provider1).toBe(provider2);
    });

    it('should return OpenCode adapter as fallback for unknown providers', () => {
      mockProviderType = 'unknown' as any;
      const provider = AIProviderFactory.getProvider();
      expect(provider).toBeInstanceOf(OpenCodeAdapter);
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
