# Settings Hierarchy Pattern

## When to Use
When your application needs multiple layers of configuration (defaults, environment, user overrides).

## Implementation
```
1. Define defaults in code (type-safe, always present)
2. Load environment config (.env, config files)
3. Apply user overrides (CLI flags, runtime settings)
4. Validate merged result with schema (Zod)
```

## Key Principles
- Later layers override earlier ones
- Every setting has a sensible default
- Validate the final merged config, not each layer
- Use TypeScript types derived from your schema

## Example (TypeScript + Zod)
```typescript
const defaults = { port: 3000, debug: false };
const envConfig = loadEnvConfig();
const merged = { ...defaults, ...envConfig, ...cliFlags };
const validated = ConfigSchema.parse(merged);
```

## Common Mistakes
- Scattering defaults across multiple files
- Not validating after merge (invalid combinations)
- Using `any` for config objects
