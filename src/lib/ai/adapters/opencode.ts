import type { AIProvider } from '../types';

export class OpenCodeAdapter implements AIProvider {
  id = 'opencode';

  async generateText(prompt: string, _context?: any): Promise<string> {
    // Simulation of network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return `[OpenCode Internal]: Processed request: "${prompt}". \nAnalysis complete. Ready for implementation.`;
  }

  async *streamText(prompt: string): AsyncGenerator<string> {
    const response = `[OpenCode Stream]: Processing "${prompt}"... Done.`;
    const chunks = response.split(' ');
    
    for (const chunk of chunks) {
      await new Promise(resolve => setTimeout(resolve, 100));
      yield chunk + ' ';
    }
  }
}
