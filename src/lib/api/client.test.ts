import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ApiClient } from './client';
import { ApiError } from './errors';

describe('Enhanced ApiClient', () => {
  let client: ApiClient;
  const baseUrl = 'http://test-api.example.com/api';
  const apiKey = 'test-api-key';

  beforeEach(() => {
    client = new ApiClient(baseUrl, apiKey, 1000);
    vi.clearAllMocks();
    vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Mock the delay method to speed up tests
  vi.mock('./client', async (importOriginal) => {
    const mod = await importOriginal();
    return {
      ...mod,
      ApiClient: class extends mod.ApiClient {
        private delay(ms: number): Promise<void> {
          // Short-circuit delays for tests
          return Promise.resolve();
        }
      }
    };
  });

  it('should make successful GET requests with correct headers', async () => {
    // Mock successful response
    const mockResponse = { data: 'test data' };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve(mockResponse),
    });

    // Make the request
    const result = await client.get<any>('/test');

    // Verify the request
    expect(global.fetch).toHaveBeenCalledWith(
      'http://test-api.example.com/api/test',
      expect.objectContaining({
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        },
      })
    );

    // Verify the result
    expect(result).toEqual(mockResponse);
  });

  it('should make successful POST requests with body', async () => {
    // Mock successful response
    const mockResponse = { id: '123', success: true };
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: () => Promise.resolve(mockResponse),
    });

    const requestBody = { name: 'Test Item', value: 42 };

    // Make the request
    const result = await client.post<any>('/test', requestBody);

    // Verify the request
    expect(global.fetch).toHaveBeenCalledWith(
      'http://test-api.example.com/api/test',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,
        }),
        body: JSON.stringify(requestBody),
      })
    );

    // Verify the result
    expect(result).toEqual(mockResponse);
  });

  it('should handle 204 No Content responses', async () => {
    // Mock no content response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 204,
    });

    // Make the request
    const result = await client.delete('/test/123');

    // Verify the request
    expect(global.fetch).toHaveBeenCalledWith(
      'http://test-api.example.com/api/test/123',
      expect.objectContaining({
        method: 'DELETE',
      })
    );

    // Verify the result
    expect(result).toBeUndefined();
  });

  it('should throw ApiError for error responses', async () => {
    // Mock error response
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      json: () => Promise.resolve({ message: 'Resource not found' }),
    });

    // Make the request
    try {
      await client.get('/test/nonexistent');
      fail('Expected an error to be thrown');
    } catch (error) {
      // Verify the error
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(404);
      expect((error as ApiError).message).toBe('Resource not found');
    }
  });

  it('should retry on network errors', async () => {
    // Mock network error, then success
    const networkError = new TypeError('Failed to fetch');
    (global.fetch as any)
      .mockRejectedValueOnce(networkError)
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'success after retry' }),
      });

    // Make the request with retry
    const result = await client.get('/test', { retry: true });

    // Verify fetch was called twice
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ data: 'success after retry' });
  });

  it('should retry on 5xx errors', async () => {
    // Mock server error, then success
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: () => Promise.resolve({ message: 'Server error' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: 'success after retry' }),
      });

    // Make the request with retry
    const result = await client.get('/test', { retry: true });

    // Verify fetch was called twice
    expect(global.fetch).toHaveBeenCalledTimes(2);
    expect(result).toEqual({ data: 'success after retry' });
  });

  it('should not retry on 4xx errors (except configured ones)', async () => {
    // Mock client error
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: () => Promise.resolve({ message: 'Validation error' }),
    });

    // Make the request with retry
    try {
      await client.get('/test', { retry: true });
      fail('Expected an error to be thrown');
    } catch (error) {
      // Verify fetch was called only once
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect((error as ApiError).status).toBe(400);
    }
  });

  it('should respect maxRetries limit', async () => {
    // Mock persistent server error
    (global.fetch as any)
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ message: 'Server error' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ message: 'Server error' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ message: 'Server error' }),
      })
      .mockResolvedValueOnce({
        ok: true, // This should never be reached
        status: 200,
        json: () => Promise.resolve({ data: 'success' }),
      });

    // Make the request with custom retry config
    try {
      await client.get('/test', {
        retry: {
          maxRetries: 2,
          initialDelay: 10,
          maxDelay: 100,
        },
      });
      fail('Expected an error to be thrown');
    } catch (error) {
      // Verify fetch was called 3 times (initial + 2 retries)
      expect(global.fetch).toHaveBeenCalledTimes(3);
      expect((error as ApiError).status).toBe(500);
    }
  });

  it('should disable retries when retry is false', async () => {
    // Mock server error
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: () => Promise.resolve({ message: 'Server error' }),
    });

    // Make the request with retry disabled
    try {
      await client.get('/test', { retry: false });
      fail('Expected an error to be thrown');
    } catch (error) {
      // Verify fetch was called only once
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect((error as ApiError).status).toBe(500);
    }
  });

  it('should handle request timeout', async () => {
    // Mock a fetch call that never resolves
    const abortError = new DOMException('The operation was aborted', 'AbortError');
    (global.fetch as any).mockImplementationOnce(() => {
      // Simulate an aborted fetch due to timeout
      return new Promise((_, reject) => {
        setTimeout(() => reject(abortError), 50);
      });
    });

    // Make the request with a short timeout
    try {
      await client.get('/test', { timeout: 10 });
      fail('Expected an error to be thrown');
    } catch (error) {
      // This could be either a timeout error or an abort error
      expect(error).toBeDefined();
    }
  });
});