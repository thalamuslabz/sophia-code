import { env } from '../../config/env';
import type { AIProvider } from './types';
import { OpenCodeAdapter } from './adapters/opencode';
import { AnthropicAdapter } from './adapters/anthropic';

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
        default:
          console.warn(`Provider ${providerType} not implemented, falling back to OpenCode`);
          this.instance = new OpenCodeAdapter();
      }
    }
    return this.instance;
  }
}
