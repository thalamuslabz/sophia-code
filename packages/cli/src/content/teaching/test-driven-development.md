# Test-Driven Development

## Why TDD?
Tests are documentation that never goes stale. They catch bugs before
users do and make refactoring safe.

## The Cycle
1. **Red**: Write a failing test
2. **Green**: Write the minimum code to pass
3. **Refactor**: Clean up without breaking tests

## What to Test
- Happy paths (expected behavior)
- Error cases (what happens when things go wrong)
- Edge cases (empty inputs, large data, boundary values)
- Integration points (API calls, database queries)

## What NOT to Test
- Implementation details (private methods, internal state)
- Third-party libraries (they have their own tests)
- Trivial code (getters, setters, simple constructors)

## Related Policies
- TEST-001: New endpoints need tests
- TEST-002: No skipped tests committed
