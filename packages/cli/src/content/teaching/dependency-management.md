# Dependency Management

## Why It Matters
Every dependency is code you didn't write and don't fully control.
Dependencies can introduce security vulnerabilities, increase bundle size,
and create maintenance burden.

## Best Practices
1. **Audit before adding**: Check downloads, maintenance status, and bundle size
2. **Pin versions**: Use exact versions in production
3. **Regular updates**: Run npm audit and update regularly
4. **Minimize dependencies**: Use built-in APIs when possible
5. **Check for duplicates**: Don't add what you already have

## Before Adding a Dependency
Ask yourself:
- Can I implement this in < 50 lines?
- Does an existing dependency already do this?
- Is this library actively maintained?
- What's the bundle size impact?

## Related Policies
- COST-001: Large dependency warning
- COST-002: Duplicate dependency detection
