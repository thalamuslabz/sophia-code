# Sophia Code - AI Agent Guide

> **AI agents should read this file before working on this project.**

This document provides essential context for AI coding agents working on Sophia Code. It complements the human-oriented README with agent-specific guidance.

---

## Project Overview

**Sophia Code** is a CLI-first governance system for AI-assisted software development. It provides guardrails, accountability, and structured workflows for teams using AI coding tools.

### Core Philosophy

- **Governance First**: The system exists to govern, not just execute
- **Artifacts Over Chat**: Structured, versioned artifacts—not ephemeral conversations
- **Immutability Over Revisionism**: Once approved, intent is locked
- **Human Authority**: AI proposes, humans decide

### Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: Cognexa (System of Thought)                       │
│  - Defines artifact lifecycle                               │
│  - Manages Intents → Gates → Contracts → Execution          │
└──────────────────────────┬──────────────────────────────────┘
                           │ governs
┌──────────────────────────▼──────────────────────────────────┐
│  Layer 2: Sophia (Governance Authority)                     │
│  - Enforces gates and verifies intent                       │
│  - Escalates to humans when needed                          │
└──────────────────────────┬──────────────────────────────────┘
                           │ authorizes
┌──────────────────────────▼──────────────────────────────────┐
│  Layer 3: Execution Engines (The Labor)                     │
│  - UI / CLI / Agents                                        │
│  - Runs only after governance approves                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Language | TypeScript | 5.6.x |
| Runtime | Node.js | 18+ |
| Package Manager | npm | 9+ |
| CLI Framework | Commander.js | 12.x |
| Dashboard | Next.js | 15.x |
| Dashboard UI | React | 19.x |
| Database | SQLite (better-sqlite3) | 11.x |
| Templates | Handlebars | 4.7.x |
| Validation | Zod | 3.23.x |
| Testing | Vitest | 2.1.x |

### Monorepo Structure

```
sophia.code/
├── packages/
│   ├── cli/              # CLI tool (@sophia-code/cli)
│   ├── shared/           # Shared types & constants (@sophia-code/shared)
│   └── dashboard/        # Next.js dashboard (@sophia-code/dashboard)
├── vscode-sophia-extension/  # VS Code extension
├── docs/                 # Documentation
├── package.json          # Root workspace config
└── tsconfig.base.json    # Shared TypeScript config
```

---

## Build and Development Commands

### Root Level Commands

```bash
# Install dependencies for all packages
npm ci

# Build all packages
npm run build

# Run all tests
npm test

# Run linting
npm run lint
```

### CLI Package Commands

```bash
cd packages/cli

# Build CLI
npm run build

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Development mode (watch builds)
npm run dev
```

### Dashboard Commands

```bash
cd packages/dashboard

# Start development server (port 9473)
npm run dev

# Build for production
npm run build

# Start production server
npm run start
```

---

## Code Organization

### CLI Package (`packages/cli/`)

```
src/
├── commands/           # CLI command implementations
│   ├── init.ts        # Initialize Sophia in a project
│   ├── status.ts      # Show project status
│   ├── sync.ts        # Sync agent configurations
│   ├── policy.ts      # Policy management
│   ├── memory.ts      # Memory/correction management
│   ├── session.ts     # Session management
│   ├── claim.ts       # File claiming system
│   ├── bulletin.ts    # Activity bulletin
│   ├── verify.ts      # Verification commands
│   ├── clean.ts       # Cleanup commands
│   ├── dashboard.ts   # Dashboard control
│   └── watch.ts       # File watcher
├── core/              # Core business logic
│   ├── adapter-engine.ts      # Agent config injection
│   ├── agent-detector.ts      # Detect AI agents
│   ├── bulletin.ts            # Bulletin system
│   ├── config.ts              # Config management
│   ├── content-manager.ts     # Content loading
│   ├── database.ts            # SQLite database
│   ├── health.ts              # Health scoring
│   ├── memory.ts              # Memory system
│   ├── policy-engine.ts       # Policy enforcement
│   ├── policy-loader.ts       # Policy loading
│   ├── project-detector.ts    # Tech stack detection
│   ├── session-manager.ts     # Session tracking
│   └── teaching-engine.ts     # Teaching system
├── templates/         # Handlebars templates for agents
│   ├── claude-code.hbs
│   ├── opencode.hbs
│   ├── cursor.hbs
│   └── copilot.hbs
├── content/           # Governance content
│   ├── adapters/      # Adapter configurations
│   ├── agents/        # Agent definitions (YAML)
│   ├── patterns/      # Pattern references
│   ├── policies/      # Policy definitions (YAML)
│   ├── teaching/      # Teaching content
│   └── workflows/     # Workflow definitions
├── __fixtures__/      # Test fixtures
└── __e2e__/          # E2E tests
```

### Shared Package (`packages/shared/`)

```
src/
├── constants.ts       # System constants, signatures
├── schemas.ts         # Zod validation schemas
├── types.ts           # TypeScript type definitions
└── index.ts           # Public exports
```

Key types: `SophiaConfig`, `Policy`, `Session`, `Claim`, `HealthReport`, `TeachingMoment`

### Dashboard Package (`packages/dashboard/`)

```
src/
├── app/               # Next.js app router
│   ├── api/          # API routes
│   ├── bulletin/     # Bulletin page
│   ├── claims/       # Claims management
│   ├── health/       # Health dashboard
│   ├── memory/       # Memory management
│   ├── policies/     # Policy viewer
│   ├── sessions/     # Session monitor
│   ├── settings/     # Settings page
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx      # Main dashboard
├── components/        # React components
│   └── sidebar.tsx
└── lib/
    └── db.ts         # Database connection
```

---

## Configuration Files

### Sophia Configuration (`.sophia/config.yaml`)

Generated by `sophia init`. Contains:

```yaml
sophia:
  version: "1.0.0"
  initialized: "2024-01-15T10:00:00Z"
project:
  name: "my-project"
  tech_stack:
    language: "typescript"
    framework: "next.js"
    package_manager: "npm"
agents:
  detected:
    - name: "claude-code"
      config_file: "CLAUDE.md"
      status: "active"
user:
  experience_level: "intermediate"
  governance_level: "enterprise"
session:
  auto_detect: true
  stale_timeout_minutes: 30
  claim_mode: "warn"
policies:
  enabled: ["security", "quality", "testing"]
  strictness: "strict"
```

### TypeScript Configuration

- **Base**: `tsconfig.base.json` - Shared compiler options
- **Per Package**: Each package extends base config
- **Strict Mode**: Enabled with `noUncheckedIndexedAccess`, `noImplicitOverride`
- **Module**: Node16 resolution

---

## Testing Strategy

### Test Framework: Vitest

Tests are co-located with source files:

```
src/core/
├── adapter-engine.ts
├── adapter-engine.test.ts    # ← Co-located test
├── policy-engine.ts
├── policy-engine.test.ts
└── ...
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific package tests
cd packages/cli && npm test

# Run with coverage
npm test -- --coverage

# Run in watch mode
cd packages/cli && npm run test:watch
```

### Test Patterns

- Unit tests for core business logic in `src/core/`
- Mock external dependencies (database, file system)
- Test files use `.test.ts` suffix
- Fixtures in `__fixtures__/` directories

---

## Code Style Guidelines

### TypeScript Conventions

1. **Strict Types**: No `any` without justification
2. **Explicit Returns**: Function return types declared
3. **Type-only Imports**: Use `import type { ... }` where appropriate
4. **Const Assertions**: Prefer `as const` for literal types

### Naming Conventions

- **Files**: kebab-case for files (e.g., `policy-engine.ts`)
- **Components**: PascalCase for React components
- **Functions**: camelCase
- **Constants**: UPPER_SNAKE_CASE for true constants
- **Types/Interfaces**: PascalCase

### Code Organization

1. **Single Responsibility**: One export per file preferred
2. **Co-location**: Tests next to source, styles next to components
3. ** barrel Exports**: Use `index.ts` for clean public APIs

### Error Handling

```typescript
// Prefer explicit error types
interface Result<T, E = Error> {
  success: true;
  data: T;
} | {
  success: false;
  error: E;
}

// Use Zod for runtime validation
const configSchema = z.object({
  version: z.string(),
  project: z.object({
    name: z.string(),
  }),
});
```

---

## Key Implementation Details

### Agent Detection

Sophia detects AI agents by looking for their configuration files:

| Agent | Config Files |
|-------|--------------|
| Claude Code | `CLAUDE.md` |
| OpenCode | `AGENTS.md` |
| Cursor | `.cursorrules`, `.cursor/rules/sophia.md` |
| GitHub Copilot | `.github/copilot-instructions.md` |

### Policy System

Policies are YAML files with rules:

```yaml
id: "security"
name: "Security Policy"
version: "1.0.0"
rules:
  - id: "no-hardcoded-secrets"
    name: "No Hardcoded Secrets"
    severity: "red"  # Blocks commit
    description: "Secrets must not be hardcoded"
    detection:
      type: "pattern"
      patterns: ["password\\s*=\\s*[\"'][^\"']+[\"']"]
    auto_fixable: false
```

Severity levels: `green` (info), `yellow` (warning), `red` (blocking)

### Database Schema

SQLite database (`.sophia/sophia.db`) with tables:
- `sessions` - Active AI sessions
- `claims` - File ownership claims
- `bulletin` - Activity log
- `corrections` - Recorded mistakes
- `patterns` - Reusable patterns
- `decisions` - Decision log
- `encounters` - Rule encounter tracking

### Session Management

Sessions represent AI agent work periods:

```typescript
interface Session {
  id: string;           // UUID
  agent: string;        // Agent name
  pid?: number;         // Process ID
  intent?: string;      // What the agent is doing
  status: "active" | "idle" | "ended";
  started_at: string;
  last_activity_at: string;
}
```

### File Claiming System

Prevents AI agents from conflicting on the same files:

- **Soft Claim**: Warning if another agent touches the file
- **Hard Claim**: Blocks other agents from modifying

---

## Security Considerations

1. **No Hardcoded Secrets**: Always use environment variables
2. **Database Path**: Stored in `.sophia/` (gitignored)
3. **Agent Config Injection**: Templates use markers to prevent manual edits
4. **Policy Enforcement**: Rules can block commits with `red` severity

### Security Markers in Templates

```markdown
<!-- SOPHIA:BEGIN - Auto-managed by sophia.code -->
... injected content ...
<!-- SOPHIA:END -->
```

Never manually edit content between these markers.

---

## Common Tasks

### Adding a New CLI Command

1. Create file in `packages/cli/src/commands/my-command.ts`
2. Export a `Command` object from Commander
3. Register in `packages/cli/src/index.ts`
4. Add tests in `my-command.test.ts`

### Adding a New Policy

1. Create YAML file in `packages/cli/src/content/policies/`
2. Follow existing policy schema
3. Run `sophia policy validate` to check
4. Test with `sophia policy check`

### Adding a New Agent Template

1. Create `.hbs` file in `packages/cli/src/templates/`
2. Use Handlebars syntax with available context
3. Update `AGENT_SIGNATURES` in `packages/shared/src/constants.ts`
4. Update adapter engine if needed

### Modifying Database Schema

1. Update schema in `packages/cli/src/core/database.ts`
2. Add migration logic if needed
3. Update types in `packages/shared/src/types.ts`
4. Update Zod schemas in `packages/shared/src/schemas.ts`

---

## Troubleshooting

### Build Issues

```bash
# Clean build artifacts
rm -rf packages/*/dist
rm -rf node_modules/.cache

# Rebuild everything
npm ci
npm run build
```

### Database Issues

```bash
# Reset database (loses all data)
rm .sophia/sophia.db
sophia init
```

### Test Failures

```bash
# Run specific test file
cd packages/cli && npx vitest run src/core/policy-engine.test.ts

# Run with debugging
cd packages/cli && npx vitest run --reporter=verbose
```

---

## External Dependencies

### Key Runtime Dependencies

- `better-sqlite3`: Fast SQLite driver
- `commander`: CLI framework
- `chalk`: Terminal colors
- `inquirer`: Interactive prompts
- `handlebars`: Template engine
- `zod`: Schema validation
- `chokidar`: File watching
- `yaml`: YAML parsing

### Dashboard Dependencies

- `next`: React framework
- `react`/`react-dom`: UI library
- `better-sqlite3`: Database (server-side)

---

## Documentation References

| Document | Purpose |
|----------|---------|
| `README.md` | Project overview and quick start |
| `docs/ARCHITECTURE.md` | System architecture (Cognexa layers) |
| `docs/MEET_SOPHIA.md` | Persona and mission |
| `docs/TESTING_STRATEGY.md` | Testing approach |
| `docs/UNIT_TESTING.md` | Unit testing guide |
| `docs/STATE_MANAGEMENT.md` | Redux store documentation |
| `docs/PRODUCTION_READINESS.md` | Deployment checklist |
| `docs/API_INTEGRATION.md` | Frontend-backend integration |
| `docs/DEPLOYMENT.md` | Build and deploy processes |

---

## Contact & Contribution

- **Steward**: Thalamus
- **License**: MIT
- **Version**: 1.0.0

> **Remember**: This system is about correctness, not speed. When in doubt, escalate to humans.

---

*This document is versioned with the codebase. Last updated: 2026-02-11*
