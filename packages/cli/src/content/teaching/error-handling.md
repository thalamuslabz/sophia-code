# Error Handling

## The Enterprise Approach
Errors are not failures — they are information. Good error handling makes
debugging fast and prevents data corruption.

## Key Principles
1. **Fail fast**: Don't try to recover from unrecoverable errors
2. **Include context**: What were you trying to do? What data was involved?
3. **Never swallow exceptions**: Empty catch blocks hide bugs
4. **Use specific error types**: Not just Error — use TypeError, ValidationError, etc.

## Code Example

**Wrong:**
```typescript
try {
  const user = await getUser(id);
  return user;
} catch (e) {
  // Empty catch — the worst pattern
}
```

**Right:**
```typescript
try {
  const user = await getUser(id);
  if (!user) {
    throw new NotFoundError(`User ${id} not found`);
  }
  return user;
} catch (error) {
  if (error instanceof NotFoundError) throw error;
  throw new DatabaseError(`Failed to fetch user ${id}`, { cause: error });
}
```

## Related Policies
- QA-004: No swallowed exceptions
