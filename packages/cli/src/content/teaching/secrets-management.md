# Secrets Management

## What Are Secrets?
API keys, database passwords, tokens, certificates — anything that grants
access to a system or service.

## Why It Matters
Exposed secrets are the #1 cause of security breaches in open source.
Services like GitHub, GitGuardian, and Stripe actively scan public repos
and will revoke or exploit found keys.

## The Enterprise Pattern
1. **Environment Variables**: Store secrets in env vars, never in code
2. **Secrets Manager**: For production, use a dedicated service (Vault, AWS Secrets Manager, etc.)
3. **.env Files**: Use for local dev, NEVER commit to git
4. **.env.example**: Commit a template with placeholder values

## Code Example

**Wrong:**
```javascript
const stripe = require('stripe')('sk_live_abc123def456');
```

**Right:**
```javascript
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY environment variable is required');
}
```

## Related Policies
- SEC-001: No hardcoded secrets
- SEC-002: No .env files committed
