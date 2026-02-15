# API Integration Patterns

## When to Use
When consuming external APIs or building API clients.

## Implementation
```
1. Create a typed API client (not raw fetch calls)
2. Centralize base URL and auth headers
3. Add retry with exponential backoff
4. Handle errors with specific error types
5. Add request/response logging
```

## Key Principles
- Always set timeouts on HTTP requests
- Retry on 5xx and network errors, not on 4xx
- Use exponential backoff: 1s, 2s, 4s, 8s (max 3-5 retries)
- Parse and validate response data with schemas
- Never log sensitive headers (Authorization, cookies)

## Error Handling
```typescript
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body: unknown
  ) {
    super(message);
  }
}
```

## Common Mistakes
- No timeout on requests (hanging forever)
- Retrying on 400/401/403 (wastes resources)
- Swallowing errors silently
- Hardcoding API URLs (use environment config)
- Not handling rate limits (429 status)
