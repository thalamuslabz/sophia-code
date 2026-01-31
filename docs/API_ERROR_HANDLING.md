# API Error Handling and Retry Mechanism

This document explains the error handling and retry mechanism implemented in the Sophia Code API client.

## Overview

The API client includes robust error handling and automatic retries for transient failures, providing a more resilient and user-friendly experience.

## Key Features

1. **Typed Error Handling**: Custom `ApiError` class with detailed error information
2. **Automatic Retries**: Configurable retry mechanism for transient failures
3. **Exponential Backoff**: Increasing delays between retries with jitter
4. **Error Classification**: Methods to determine the type of error (network, server, client, etc.)
5. **User-Friendly Messages**: Human-readable error messages for different error types
6. **Comprehensive Logging**: Detailed logging of API requests, responses, and errors

## Error Handling

### ApiError Class

The `ApiError` class extends the standard JavaScript `Error` class and includes additional properties:

- `status`: HTTP status code
- `statusText`: HTTP status text
- `data`: Response data from the server
- `originalError`: Original error that caused this error

```typescript
// Example of creating an ApiError
const error = new ApiError(
  'Resource not found',
  404,
  'Not Found',
  { detail: 'The requested artifact does not exist' },
  originalError
);
```

### Error Classification

The `ApiError` class provides methods to classify errors:

```typescript
// Check error type
error.isNetworkError();    // Network-related error (offline, timeout)
error.isServerError();     // Server error (5xx)
error.isClientError();     // Client error (4xx)
error.isValidationError(); // Validation error (400)
error.isAuthError();       // Authentication error (401)
error.isNotFoundError();   // Not found error (404)
error.isRetriable();       // Whether the error can be retried
```

### User-Friendly Messages

The `ApiError` class provides user-friendly error messages:

```typescript
// Get user-friendly message
const message = error.getUserFriendlyMessage();
// e.g. "Network error. Please check your internet connection and try again."
```

## Retry Mechanism

### Default Retry Configuration

```typescript
const DEFAULT_RETRY_CONFIG = {
  maxRetries: 3,           // Maximum number of retry attempts
  initialDelay: 300,       // Initial delay in milliseconds
  maxDelay: 5000,          // Maximum delay in milliseconds
  backoffFactor: 2,        // Exponential backoff factor
  retryableStatusCodes: [  // HTTP status codes to retry
    408, 429, 500, 502, 503, 504
  ],
};
```

### Custom Retry Configuration

You can customize the retry behavior for each API request:

```typescript
// Disable retries
client.get('/endpoint', { retry: false });

// Enable retries with default configuration
client.get('/endpoint', { retry: true });

// Custom retry configuration
client.get('/endpoint', {
  retry: {
    maxRetries: 5,
    initialDelay: 500,
    maxDelay: 10000,
    backoffFactor: 1.5,
    retryableStatusCodes: [408, 500, 502, 503, 504],
  },
});
```

### Retry Logic

The retry mechanism follows these rules:

1. Only retry if `retry` option is enabled
2. Only retry up to `maxRetries` times
3. Only retry for retryable errors:
   - Network errors
   - Server errors (5xx)
   - Rate limiting (429)
   - Timeout errors
   - Configured status codes
4. Use exponential backoff with jitter for retry delays

## Logging

The API client uses a structured logger to record API activity:

```typescript
// Example log entries
logger.info('Fetching artifacts');
logger.debug('Fetched artifacts', { count: artifacts.length });
logger.error('Error fetching artifacts', {
  status: error.status,
  message: error.message,
});
```

### Log Levels

The logger supports multiple log levels:

- `DEBUG`: Detailed debugging information
- `INFO`: General information about API operations
- `WARN`: Warnings that don't prevent operation
- `ERROR`: Errors that prevent successful operation

### Environment-Based Logging

The logger adjusts its behavior based on the environment:

- **Development**: All log levels, console output
- **Production**: Error logs only, no sensitive data
- **Test**: Minimal logging to keep test output clean

## Usage Examples

### Basic Error Handling

```typescript
try {
  const artifacts = await artifactApi.getAllArtifacts();
  // Success case
} catch (error) {
  if (error instanceof ApiError) {
    // Handle specific error types
    if (error.isNetworkError()) {
      // Handle network error
    } else if (error.isServerError()) {
      // Handle server error
    } else {
      // Handle other API errors
    }
  } else {
    // Handle unexpected errors
  }
}
```

### Custom Request Options

```typescript
// GET request with timeout and custom retry
const result = await client.get('/long-running-operation', {
  timeout: 30000,  // 30 seconds
  retry: {
    maxRetries: 5,
    retryableStatusCodes: [408, 500, 502, 503, 504],
  },
});

// POST request with reduced retry for mutations
const newItem = await client.post('/items', data, {
  retry: {
    maxRetries: 2,
    retryableStatusCodes: [408, 500, 502, 503, 504],
  },
});
```

## Implementation Details

### Request Flow

1. Request is initiated
2. If the request fails with a retryable error:
   a. Calculate backoff delay with jitter
   b. Wait for the delay
   c. Retry the request (up to maxRetries times)
3. If all retries fail, throw the last error
4. If the request succeeds, return the response

### Error Creation

```typescript
try {
  // API request
} catch (error) {
  // Log error with context
  this.logError('Error message', error);

  // Enhance error for the caller
  throw this.enhanceError(error, 'User-friendly message');
}
```

## Best Practices

1. **Use Appropriate Retry Settings**: More aggressive for reads, less for writes
2. **Handle Errors Gracefully**: Show user-friendly messages
3. **Log Errors with Context**: Include relevant details for debugging
4. **Consider Idempotency**: Ensure mutations can be safely retried
5. **Set Reasonable Timeouts**: Prevent long-running requests from blocking the UI