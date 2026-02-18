# Contributing to Thalamus AI

Thank you for your interest in contributing! This document will help you get started.

## Development Setup

### Prerequisites

- Node.js 20+
- npm 9+
- Docker Desktop (for full stack testing)
- Git

### Initial Setup

```bash
# Clone the repository
git clone https://github.com/thalamus-ai/thalamus-ai.git
cd thalamus-ai

# Install all dependencies and build
npm run setup:dev

# Or step by step:
npm ci                    # Root dependencies
npm run build:shared      # Build shared package first
npm run build:all         # Build all packages
```

### Project Structure

```
thalamus-ai/
├── packages/
│   ├── cli/              # Sophia CLI (@sophia-code/cli)
│   ├── shared/           # Shared types/constants (@sophia-code/shared)
│   ├── dashboard/        # Next.js dashboard (@sophia-code/dashboard)
│   └── orchestrator/     # Build orchestrator (@thalamus/orchestrator)
├── apps/
│   ├── openwebui-functions/   # Open WebUI custom functions
│   └── n8n-workflows/         # n8n workflow templates
├── docs/                 # Documentation
├── templates/            # Project templates
├── docker-compose.yml    # Full stack orchestration
└── install.sh           # One-command installer
```

## Development Workflow

### Running Locally

```bash
# Start infrastructure (Open WebUI, n8n, etc.)
docker compose up -d

# Run CLI in dev mode
cd packages/cli
npm run dev

# Run dashboard in dev mode
cd packages/dashboard
npm run dev

# Run orchestrator
cd packages/orchestrator
npm run dev
```

### Testing

```bash
# Run all tests
npm test

# Run tests for specific package
cd packages/cli && npm test

# Run E2E tests
npm run test:e2e

# Run with coverage
npm run test:coverage
```

### Code Style

We use:
- **TypeScript** — Strict mode enabled
- **ESLint** — For linting
- **Prettier** — For formatting

```bash
# Check code style
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Format code
npm run format
```

## Making Changes

### Branch Naming

- `feature/description` — New features
- `fix/description` — Bug fixes
- `docs/description` — Documentation updates
- `refactor/description` — Code refactoring

### Commit Messages

Follow conventional commits:

```
feat(cli): add new verify command
fix(dashboard): resolve session display bug
docs: update vibe coder guide
refactor(orchestrator): simplify intent registry
```

### Pull Request Process

1. **Fork** the repository
2. **Create a branch** for your changes
3. **Make your changes** with tests
4. **Run the test suite** — all tests must pass
5. **Update documentation** if needed
6. **Submit a pull request** with clear description

### PR Checklist

- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] Code follows style guidelines
- [ ] All tests pass
- [ ] Changes are backward compatible (or marked as breaking)

## Architecture Decisions

### Adding a New CLI Command

1. Create file in `packages/cli/src/commands/<command>.ts`
2. Export a `Command` object from Commander
3. Register in `packages/cli/src/index.ts`
4. Add tests in `<command>.test.ts`
5. Update documentation

Example:

```typescript
// packages/cli/src/commands/my-feature.ts
import { Command } from "commander";

export const myFeatureCommand = new Command("my-feature")
  .description("Description of what it does")
  .option("-f, --flag", "Description of flag")
  .action(async (options) => {
    // Implementation
  });
```

### Adding a New Policy

1. Create YAML file in `packages/cli/src/content/policies/`
2. Follow existing policy schema
3. Run `sophia policy validate` to check
4. Add teaching content for different experience levels

### Modifying Database Schema

1. Update schema in `packages/cli/src/core/database.ts`
2. Add migration logic if needed
3. Update types in `packages/shared/src/types.ts`
4. Update Zod schemas in `packages/shared/src/schemas.ts`

## Testing Guidelines

### Unit Tests

- Co-locate with source files (`*.test.ts`)
- Mock external dependencies
- Test edge cases
- Aim for >80% coverage

### E2E Tests

Located in `__e2e__/tests/`. These test complete workflows:

```bash
# Run E2E tests
npm run test:e2e

# Run specific test
npx vitest run --config __e2e__/vitest.config.ts tests/my-test.spec.ts
```

### Writing Good Tests

```typescript
// Example test pattern
import { describe, it, expect, vi } from "vitest";
import { myFunction } from "./my-module.js";

describe("myFunction", () => {
  it("should handle valid input", () => {
    const result = myFunction({ valid: true });
    expect(result.success).toBe(true);
  });

  it("should handle errors gracefully", () => {
    const result = myFunction({ valid: false });
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

## Documentation

### Code Documentation

- Use JSDoc for public APIs
- Include examples where helpful
- Document error cases

```typescript
/**
 * Validates a project configuration
 * @param config - The configuration object to validate
 * @returns Validated config or throws ValidationError
 * @example
 * const valid = validateConfig({ project: { name: "my-app" } });
 */
export function validateConfig(config: unknown): SophiaConfig {
  // Implementation
}
```

### User Documentation

- Keep vibe coder guide friendly and practical
- Include copy-paste examples
- Update CLI reference when commands change

## Release Process

1. Update version in `package.json` files
2. Update `CHANGELOG.md`
3. Create git tag: `git tag -a v1.0.0 -m "Release v1.0.0"`
4. Push tag: `git push origin v1.0.0`
5. GitHub Actions will build and publish

## Getting Help

- **Discord**: [Join our community](https://discord.gg/thalamus)
- **GitHub Issues**: For bugs and feature requests
- **Discussions**: For questions and ideas

## Code of Conduct

Be respectful, inclusive, and constructive. We're building this together.

---

Thank you for contributing! 🎉
