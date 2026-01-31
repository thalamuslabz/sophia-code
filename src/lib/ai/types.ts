export interface AIProvider {
  id: string;
  generateText(prompt: string, context?: any): Promise<string>;
  streamText(prompt: string): AsyncGenerator<string>;
}

export type AIProviderType = 'opencode' | 'anthropic' | 'deepseek' | 'kimi' | 'openai' | 'gemini';
