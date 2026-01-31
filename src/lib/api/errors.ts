/**
 * Custom API error classes for better error handling
 */

/**
 * Base API error class
 */
export class ApiError extends Error {
  status: number;
  statusText: string;
  data: any;
  originalError?: Error;

  constructor(message: string, status: number, statusText: string, data?: any, originalError?: Error) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.data = data;
    this.originalError = originalError;

    // Maintains proper stack trace for where error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Checks if the error is a network error (offline, timeout, etc.)
   */
  isNetworkError(): boolean {
    return this.status === 0 || this.originalError instanceof TypeError;
  }

  /**
   * Checks if the error is a server error (5xx)
   */
  isServerError(): boolean {
    return this.status >= 500 && this.status < 600;
  }

  /**
   * Checks if the error is a client error (4xx)
   */
  isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  /**
   * Checks if the error is a validation error (400)
   */
  isValidationError(): boolean {
    return this.status === 400;
  }

  /**
   * Checks if the error is an authentication error (401)
   */
  isAuthenticationError(): boolean {
    return this.status === 401;
  }

  /**
   * Checks if the error is an authorization error (403)
   */
  isAuthorizationError(): boolean {
    return this.status === 403;
  }

  /**
   * Checks if the error is a not found error (404)
   */
  isNotFoundError(): boolean {
    return this.status === 404;
  }

  /**
   * Checks if the error is a conflict error (409)
   */
  isConflictError(): boolean {
    return this.status === 409;
  }

  /**
   * Checks if the error is a rate limit error (429)
   */
  isRateLimitError(): boolean {
    return this.status === 429;
  }

  /**
   * Checks if the error is a timeout error
   */
  isTimeoutError(): boolean {
    return this.originalError instanceof TypeError &&
           this.originalError.message.includes('timeout');
  }

  /**
   * Checks if the error is retriable (network errors, server errors, rate limit errors)
   */
  isRetriable(): boolean {
    return (
      this.isNetworkError() ||
      this.isServerError() ||
      this.isRateLimitError() ||
      this.isTimeoutError()
    );
  }

  /**
   * Gets a user-friendly error message
   */
  getUserFriendlyMessage(): string {
    if (this.isNetworkError()) {
      return 'Network error. Please check your internet connection and try again.';
    }

    if (this.isAuthenticationError()) {
      return 'Authentication failed. Please check your API key or login again.';
    }

    if (this.isAuthorizationError()) {
      return 'You do not have permission to perform this action.';
    }

    if (this.isNotFoundError()) {
      return 'The requested resource was not found.';
    }

    if (this.isValidationError()) {
      return 'There was an error with your request. Please check your input and try again.';
    }

    if (this.isRateLimitError()) {
      return 'Rate limit exceeded. Please try again later.';
    }

    if (this.isServerError()) {
      return 'Server error. Please try again later.';
    }

    return this.message || 'An unexpected error occurred.';
  }
}

/**
 * Error factory to create the appropriate error instance
 */
export const createApiError = async (response: Response, originalError?: Error): Promise<ApiError> => {
  let errorData: any = null;
  let message = `API Error: ${response.status} ${response.statusText}`;

  try {
    errorData = await response.json();
    if (errorData?.message) {
      message = errorData.message;
    }
  } catch (e) {
    // If we can't parse the error as JSON, use the default message
  }

  return new ApiError(
    message,
    response.status,
    response.statusText,
    errorData,
    originalError
  );
};