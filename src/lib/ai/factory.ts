import { env } from '../../config/env';
import type { AIProvider } from './types';
import { OpenCodeAdapter } from './adapters/opencode';
import { AnthropicAdapter } from './adapters/anthropic';
import { DeepseekAdapter } from './adapters/deepseek';
import { KimiAdapter } from './adapters/kimi';

export class AIProviderFactory {
  private static instance: AIProvider;

  static getProvider(): AIProvider {
    if (!this.instance) {
      const providerType = env.VITE_AI_PROVIDER;

      switch (providerType) {
        case 'opencode':
          this.instance = new OpenCodeAdapter();
          break;
        case 'anthropic':
          this.instance = new AnthropicAdapter();
          break;
        case 'deepseek':
          this.instance = new DeepseekAdapter();
          break;
        case 'kimi':
          this.instance = new KimiAdapter();
          break;
        default:
          console.warn(`Provider ${providerType} not implemented, falling back to OpenCode`);
          this.instance = new OpenCodeAdapter();
      }
    }
    return this.instance;
  }
}
