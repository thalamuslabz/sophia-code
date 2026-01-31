import { describe, it, expect, vi } from 'vitest';
import { ApiError, createApiError } from './errors';

describe('ApiError', () => {
  it('should construct an error with all properties', () => {
    const message = 'Test error message';
    const status = 400;
    const statusText = 'Bad Request';
    const data = { field: 'test', message: 'Invalid field' };
    const originalError = new Error('Original error');

    const error = new ApiError(message, status, statusText, data, originalError);

    expect(error.message).toBe(message);
    expect(error.status).toBe(status);
    expect(error.statusText).toBe(statusText);
    expect(error.data).toBe(data);
    expect(error.originalError).toBe(originalError);
    expect(error.name).toBe('ApiError');
  });

  it('should identify network errors', () => {
    const networkError = new ApiError(
      'Network error',
      0,
      'Failed to fetch',
      null,
      new TypeError('Failed to fetch')
    );

    expect(networkError.isNetworkError()).toBe(true);
    expect(networkError.isServerError()).toBe(false);
    expect(networkError.isClientError()).toBe(false);
  });

  it('should identify server errors', () => {
    const serverError = new ApiError('Server error', 500, 'Internal Server Error');

    expect(serverError.isNetworkError()).toBe(false);
    expect(serverError.isServerError()).toBe(true);
    expect(serverError.isClientError()).toBe(false);
  });

  it('should identify client errors', () => {
    const clientError = new ApiError('Client error', 400, 'Bad Request');

    expect(clientError.isNetworkError()).toBe(false);
    expect(clientError.isServerError()).toBe(false);
    expect(clientError.isClientError()).toBe(true);
  });

  it('should identify specific error types', () => {
    const validationError = new ApiError('Validation error', 400, 'Bad Request');
    expect(validationError.isValidationError()).toBe(true);

    const authError = new ApiError('Authentication error', 401, 'Unauthorized');
    expect(authError.isAuthenticationError()).toBe(true);

    const forbiddenError = new ApiError('Authorization error', 403, 'Forbidden');
    expect(forbiddenError.isAuthorizationError()).toBe(true);

    const notFoundError = new ApiError('Not found', 404, 'Not Found');
    expect(notFoundError.isNotFoundError()).toBe(true);

    const conflictError = new ApiError('Conflict', 409, 'Conflict');
    expect(conflictError.isConflictError()).toBe(true);

    const rateLimitError = new ApiError('Rate limit exceeded', 429, 'Too Many Requests');
    expect(rateLimitError.isRateLimitError()).toBe(true);
  });

  it('should identify retriable errors', () => {
    // Network error
    const networkError = new ApiError(
      'Network error',
      0,
      'Failed to fetch',
      null,
      new TypeError('Failed to fetch')
    );
    expect(networkError.isRetriable()).toBe(true);

    // Timeout error
    const timeoutError = new ApiError(
      'Timeout error',
      0,
      'Timeout',
      null,
      new TypeError('The operation was aborted due to a timeout')
    );
    expect(timeoutError.isRetriable()).toBe(true);

    // Server error
    const serverError = new ApiError('Server error', 500, 'Internal Server Error');
    expect(serverError.isRetriable()).toBe(true);

    // Rate limit error
    const rateLimitError = new ApiError('Rate limit exceeded', 429, 'Too Many Requests');
    expect(rateLimitError.isRetriable()).toBe(true);

    // Non-retriable errors
    const clientError = new ApiError('Client error', 400, 'Bad Request');
    expect(clientError.isRetriable()).toBe(false);

    const notFoundError = new ApiError('Not found', 404, 'Not Found');
    expect(notFoundError.isRetriable()).toBe(false);
  });

  it('should provide user-friendly messages', () => {
    // Network error
    const networkError = new ApiError(
      'Network error',
      0,
      'Failed to fetch',
      null,
      new TypeError('Failed to fetch')
    );
    expect(networkError.getUserFriendlyMessage()).toContain('Network error');

    // Authentication error
    const authError = new ApiError('Authentication error', 401, 'Unauthorized');
    expect(authError.getUserFriendlyMessage()).toContain('Authentication failed');

    // Authorization error
    const forbiddenError = new ApiError('Authorization error', 403, 'Forbidden');
    expect(forbiddenError.getUserFriendlyMessage()).toContain('not have permission');

    // Not found error
    const notFoundError = new ApiError('Not found', 404, 'Not Found');
    expect(notFoundError.getUserFriendlyMessage()).toContain('not found');

    // Validation error
    const validationError = new ApiError('Validation error', 400, 'Bad Request');
    expect(validationError.getUserFriendlyMessage()).toContain('check your input');

    // Rate limit error
    const rateLimitError = new ApiError('Rate limit exceeded', 429, 'Too Many Requests');
    expect(rateLimitError.getUserFriendlyMessage()).toContain('Rate limit exceeded');

    // Server error
    const serverError = new ApiError('Server error', 500, 'Internal Server Error');
    expect(serverError.getUserFriendlyMessage()).toContain('Server error');

    // Generic error
    const genericError = new ApiError('Some error', 418, "I'm a teapot");
    expect(genericError.getUserFriendlyMessage()).toBe('Some error');
  });
});

describe('createApiError', () => {
  it('should create an ApiError from a Response object', async () => {
    const response = {
      status: 404,
      statusText: 'Not Found',
      json: vi.fn().mockResolvedValue({ message: 'Resource not found' }),
    } as unknown as Response;

    const error = await createApiError(response);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(404);
    expect(error.statusText).toBe('Not Found');
    expect(error.message).toBe('Resource not found');
  });

  it('should handle non-JSON responses', async () => {
    const response = {
      status: 500,
      statusText: 'Internal Server Error',
      json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
    } as unknown as Response;

    const error = await createApiError(response);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(500);
    expect(error.message).toContain('API Error: 500 Internal Server Error');
  });

  it('should include original error if provided', async () => {
    const response = {
      status: 400,
      statusText: 'Bad Request',
      json: vi.fn().mockResolvedValue({ message: 'Validation error' }),
    } as unknown as Response;

    const originalError = new Error('Original error');
    const error = await createApiError(response, originalError);

    expect(error.originalError).toBe(originalError);
  });
});