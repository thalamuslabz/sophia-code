# Authentication Flow Patterns

## When to Use
When implementing user authentication in web applications.

## Token-Based Auth (JWT)
```
1. User submits credentials
2. Server validates and issues JWT
3. Client stores token (httpOnly cookie preferred)
4. Client sends token with each request
5. Server validates token on protected routes
```

## Key Principles
- Never store JWTs in localStorage (XSS vulnerable)
- Use httpOnly, secure, sameSite cookies
- Implement token refresh for long sessions
- Always validate tokens server-side
- Hash passwords with bcrypt/argon2 (never SHA/MD5)

## Session vs JWT
| Aspect | Sessions | JWT |
|--------|----------|-----|
| Storage | Server (DB/Redis) | Client |
| Revocation | Immediate | Requires blocklist |
| Scaling | Needs shared store | Stateless |
| Best for | Traditional apps | APIs, microservices |

## Common Mistakes
- Storing secrets in JWT payload (it's base64, not encrypted)
- Not implementing token refresh
- Using localStorage for sensitive tokens
- Missing CSRF protection with cookie-based auth
