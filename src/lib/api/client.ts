import { ApiError, createApiError } from './errors';
import { logger } from '../utils/logger';

// Default retry configuration
const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,
  initialDelay: 300, // ms
  maxDelay: 5000, // ms
  backoffFactor: 2,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
};

// Request options type
export interface RequestOptions {
  method: string;
  headers: HeadersInit;
  body?: string;
  timeout?: number;
  retry?: boolean | {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    retryableStatusCodes?: number[];
    retryableErrors?: string[];
  };
}

/**
 * Enhanced API client with retry mechanism and better error handling
 */
export class ApiClient {
  private baseUrl: string;
  private apiKey: string;
  private defaultTimeout: number;

  constructor(baseUrl: string, apiKey: string, defaultTimeout = 10000) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.defaultTimeout = defaultTimeout;
  }

  /**
   * Get default headers for API requests
   */
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    return headers;
  }

  /**
   * Make a GET request to the API
   */
  async get<T>(path: string, options: Partial<RequestOptions> = {}): Promise<T> {
    return this.request<T>(path, {
      method: 'GET',
      headers: this.getHeaders(),
      ...options,
    });
  }

  /**
   * Make a POST request to the API
   */
  async post<T>(path: string, data: any, options: Partial<RequestOptions> = {}): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
      ...options,
    });
  }

  /**
   * Make a PUT request to the API
   */
  async put<T>(path: string, data: any, options: Partial<RequestOptions> = {}): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
      ...options,
    });
  }

  /**
   * Make a DELETE request to the API
   */
  async delete(path: string, options: Partial<RequestOptions> = {}): Promise<void> {
    await this.request(path, {
      method: 'DELETE',
      headers: this.getHeaders(),
      ...options,
    });
  }

  /**
   * Make a request to the API with retry mechanism
   */
  private async request<T>(path: string, options: RequestOptions): Promise<T> {
    // Get retry configuration
    const retryConfig = this.getRetryConfig(options.retry);
    let attempt = 0;
    let lastError: ApiError | Error | undefined;

    while (attempt <= retryConfig.maxRetries) {
      try {
        // Add timeout to fetch request
        const controller = new AbortController();
        const { signal } = controller;
        const timeout = options.timeout || this.defaultTimeout;

        // Set timeout to abort fetch request
        const timeoutId = setTimeout(() => {
          controller.abort();
        }, timeout);

        try {
          const response = await fetch(`${this.baseUrl}${path}`, {
            ...options,
            signal,
          });

          // Clear timeout
          clearTimeout(timeoutId);

          // Handle successful response
          if (response.ok) {
            // Handle no content responses (e.g., DELETE)
            if (response.status === 204) {
              return undefined as any;
            }
            return await response.json();
          }

          // Handle error response
          const apiError = await createApiError(response);

          // Check if we should retry
          if (this.shouldRetry(apiError, attempt, retryConfig)) {
            lastError = apiError;
            await this.delay(this.getBackoffTime(attempt, retryConfig));
            attempt++;
            continue;
          }

          throw apiError;
        } catch (error) {
          // Clear timeout
          clearTimeout(timeoutId);

          // Handle fetch errors (network errors, aborted requests)
          if (error instanceof TypeError || error instanceof DOMException) {
            const apiError = new ApiError(
              error.message,
              0,
              'Network Error',
              null,
              error
            );

            // Check if we should retry
            if (this.shouldRetry(apiError, attempt, retryConfig)) {
              lastError = apiError;
              await this.delay(this.getBackoffTime(attempt, retryConfig));
              attempt++;
              continue;
            }
          }

          throw error;
        }
      } catch (error) {
        lastError = error as Error;

        // If it's not the last attempt, log and continue
        if (attempt < retryConfig.maxRetries) {
          logger.warn(
            `API request failed (attempt ${attempt + 1}/${retryConfig.maxRetries + 1}): ${error}`,
            { path, method: options.method, error }
          );
          attempt++;
        } else {
          // On the last attempt, throw the error
          logger.error(
            `API request failed after ${retryConfig.maxRetries + 1} attempts: ${error}`,
            { path, method: options.method, error }
          );
          throw error;
        }
      }
    }

    // We should never get here, but just in case
    throw lastError || new Error('Request failed after all retry attempts');
  }

  /**
   * Determine if we should retry the request
   */
  private shouldRetry(
    error: ApiError,
    attempt: number,
    retryConfig: typeof DEFAULT_RETRY_CONFIG
  ): boolean {
    // Don't retry if we've hit the max retries
    if (attempt >= retryConfig.maxRetries) {
      return false;
    }

    // Retry if it's a retriable error
    return (
      error.isRetriable() ||
      retryConfig.retryableStatusCodes.includes(error.status)
    );
  }

  /**
   * Get the backoff time for a retry
   */
  private getBackoffTime(
    attempt: number,
    retryConfig: typeof DEFAULT_RETRY_CONFIG
  ): number {
    // Exponential backoff with jitter
    const exponentialDelay =
      retryConfig.initialDelay * Math.pow(retryConfig.backoffFactor, attempt);
    const maxDelay = Math.min(exponentialDelay, retryConfig.maxDelay);

    // Add jitter (±10%)
    const jitter = maxDelay * 0.1 * (Math.random() * 2 - 1);
    return maxDelay + jitter;
  }

  /**
   * Delay for a specified time
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get retry configuration from options
   */
  private getRetryConfig(
    retry: RequestOptions['retry']
  ): typeof DEFAULT_RETRY_CONFIG {
    // If retry is false or undefined, return no retries
    if (retry === false) {
      return { ...DEFAULT_RETRY_CONFIG, maxRetries: 0 };
    }

    // If retry is true, return default retry config
    if (retry === true || retry === undefined) {
      return DEFAULT_RETRY_CONFIG;
    }

    // If retry is an object, merge with default retry config
    return { ...DEFAULT_RETRY_CONFIG, ...retry };
  }
}