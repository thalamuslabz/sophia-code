import type { AIProvider } from '../types';
import { env } from '../../../config/env';

export class DeepseekAdapter implements AIProvider {
  id = 'deepseek';
  private apiKey: string;
  private apiEndpoint: string;

  constructor() {
    this.apiKey = env.VITE_DEEPSEEK_API_KEY || 'dummy_key';
    this.apiEndpoint = env.VITE_DEEPSEEK_API_ENDPOINT || 'https://api.deepseek.com/v1/chat/completions';
  }

  async generateText(prompt: string, _context?: any): Promise<string> {
    // If no key is provided, fallback to simulation to prevent crash during demo
    if (!this.apiKey || this.apiKey.includes('dummy')) {
      return `[Deepseek Simulator]: Processed request: "${prompt}". \nAnalysis complete. Ready for implementation.`;
    }

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-coder-v2',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1024,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`Deepseek API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Deepseek API error:', error);
      return `[Deepseek API Error]: ${(error as Error).message}`;
    }
  }

  async *streamText(prompt: string): AsyncGenerator<string> {
    // If no key is provided, fallback to simulation to prevent crash during demo
    if (!this.apiKey || this.apiKey.includes('dummy')) {
      yield "[Deepseek Adapter]: No API Key provided. \n";
      yield "Falling back to simulation mode... \n";
      yield "Analyzing request... Done.";
      return;
    }

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'deepseek-coder-v2',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1024,
          temperature: 0.7,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`Deepseek API error: ${response.status}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process buffer to find complete events
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const data = line.slice(5).trim();
            if (data === '[DONE]') break;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch (e) {
              // Ignore parse errors for incomplete JSON
            }
          }
        }
      }
    } catch (error) {
      console.error('Deepseek Streaming API error:', error);
      yield `[Deepseek API Error]: ${(error as Error).message}`;
    }
  }
}