import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeepseekAdapter } from './deepseek';

// Mock fetch
global.fetch = vi.fn();

describe('DeepseekAdapter', () => {
  let adapter: DeepseekAdapter;

  beforeEach(() => {
    // Reset all mocks
    vi.resetAllMocks();
    adapter = new DeepseekAdapter();
  });

  it('should initialize with the correct ID', () => {
    expect(adapter.id).toBe('deepseek');
  });

  it('should return a simulated response when no API key is provided', async () => {
    const response = await adapter.generateText('Test prompt');
    expect(response).toContain('Deepseek Simulator');
    expect(response).toContain('Test prompt');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should make API call when generating text with a valid API key', async () => {
    // Set private field for testing
    (adapter as any).apiKey = 'test-api-key';

    // Mock successful response
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ message: { content: 'Generated response' } }]
      })
    });

    const response = await adapter.generateText('Test prompt');

    // Verify API call
    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-api-key'
        }),
        body: expect.stringContaining('Test prompt')
      })
    );

    expect(response).toBe('Generated response');
  });

  it('should handle errors when generating text', async () => {
    // Set private field for testing
    (adapter as any).apiKey = 'test-api-key';

    // Mock error response
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 401
    });

    const response = await adapter.generateText('Test prompt');

    expect(response).toContain('Deepseek API Error');
    expect(response).toContain('401');
  });

  it('should implement streamText method returning an AsyncGenerator', async () => {
    // Set private field for testing
    (adapter as any).apiKey = 'dummy_key';

    const generator = adapter.streamText('Test prompt');

    // Verify it returns an async generator
    expect(generator).toBeDefined();
    expect(typeof generator[Symbol.asyncIterator]).toBe('function');

    // Collect the yielded values
    const results = [];
    for await (const chunk of generator) {
      results.push(chunk);
    }

    expect(results.length).toBeGreaterThan(0);
    expect(results.some(r => r.includes('No API Key'))).toBeTruthy();
  });
});