# API Security

## Core Principles
1. **Authentication**: Verify who is making the request
2. **Authorization**: Verify they have permission
3. **Input validation**: Verify the data is safe
4. **Rate limiting**: Prevent abuse
5. **Logging**: Record all access attempts

## Common Mistakes
- Trusting client-side authentication
- Missing authorization checks on endpoints
- Returning sensitive data in error messages
- Not rate-limiting authentication endpoints
- Using GET for state-changing operations

## OWASP Top 10 for APIs
1. Broken Object Level Authorization
2. Broken Authentication
3. Broken Object Property Level Authorization
4. Unrestricted Resource Consumption
5. Broken Function Level Authorization

## Related Policies
- SEC-003: No secrets in git history
- SEC-004: Input validation recommended
