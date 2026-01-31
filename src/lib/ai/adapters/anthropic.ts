import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider } from '../types';
import { env } from '../../../config/env';

export class AnthropicAdapter implements AIProvider {
  id = 'anthropic';
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: env.VITE_ANTHROPIC_API_KEY || 'dummy_key', // Validation happens in env.ts, this prevents crash if missing
      dangerouslyAllowBrowser: true // Required because we are calling from frontend for this demo
    });
  }

  async generateText(prompt: string, _context?: any): Promise<string> {
    const msg = await this.client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    // Handle the content block safely
    const content = msg.content[0];
    if (content.type === 'text') {
      return content.text;
    }
    return '';
  }

  async *streamText(prompt: string): AsyncGenerator<string> {
    // If no key is provided, fallback to simulation to prevent crash during demo
    if (!env.VITE_ANTHROPIC_API_KEY || env.VITE_ANTHROPIC_API_KEY.includes('dummy')) {
       yield "[Anthropic Adapter]: No API Key provided. \n";
       yield "Falling back to simulation mode... \n";
       yield "Analyzing request... Done.";
       return;
    }

    const stream = await this.client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
      stream: true,
    });

    for await (const chunk of stream) {
      if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        yield chunk.delta.text;
      }
    }
  }
}
