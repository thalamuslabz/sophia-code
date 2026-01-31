import type { AIProvider } from '../types';
import { env } from '../../../config/env';

export class KimiAdapter implements AIProvider {
  id = 'kimi';
  private apiKey: string;
  private apiEndpoint: string;

  constructor() {
    this.apiKey = env.VITE_KIMI_API_KEY || 'dummy_key';
    this.apiEndpoint = env.VITE_KIMI_API_ENDPOINT || 'https://api.kimi.ai/v1/chat/completions';
  }

  async generateText(prompt: string, _context?: any): Promise<string> {
    // If no key is provided, fallback to simulation to prevent crash during demo
    if (!this.apiKey || this.apiKey.includes('dummy')) {
      return `[Kimi Code Simulator]: Processed request: "${prompt}". \nAnalysis complete. Ready for implementation.`;
    }

    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'kimi-code-v2',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1024,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        throw new Error(`Kimi API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      console.error('Kimi API error:', error);
      return `[Kimi API Error]: ${(error as Error).message}`;
    }
  }

  async *streamText(prompt: string): AsyncGenerator<string> {
    // If no key is provided, fallback to simulation to prevent crash during demo
    if (!this.apiKey || this.apiKey.includes('dummy')) {
      yield "[Kimi Code Adapter]: No API Key provided. \n";
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
          model: 'kimi-code-v2',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 1024,
          temperature: 0.7,
          stream: true
        })
      });

      if (!response.ok) {
        throw new Error(`Kimi API error: ${response.status}`);
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
      console.error('Kimi Streaming API error:', error);
      yield `[Kimi API Error]: ${(error as Error).message}`;
    }
  }
}