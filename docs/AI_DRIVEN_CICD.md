# AI-Driven CI/CD & Version Enforcement

Sophia.code includes an automated CI/CD pipeline that leverages AI agents (GitHub Copilot, Google Jules) for bug fixes, feature development, and version management.

---

## Table of Contents

- [Version Enforcement System](#version-enforcement-system)
- [Auto-Update Mechanism](#auto-update-mechanism)
- [AI-Driven CI/CD Pipeline](#ai-driven-cicd-pipeline)
- [Using AI Agents](#using-ai-agents)
- [Configuration](#configuration)

---

## Version Enforcement System

Sophia automatically checks for updates and enforces version policies to ensure all users benefit from security patches and bug fixes.

### How It Works

1. **Remote Version Check**: On each command execution (except `update`, `init`, `--version`), Sophia fetches the version policy from:
   ```
   https://raw.githubusercontent.com/TheMethodArq/sophia-community/main/.sophia/version-policy.json
   ```

2. **Three-Tier Enforcement**:
   | Tier | Versions Behind | Action |
   |------|----------------|--------|
   | ✅ Current | 0 | No action |
   | ⚠️ Warning | 1 | Display update notice |
   | 🔒 Lockdown | 2+ | Block execution until updated |

3. **Critical Security Updates**: If a version has known security vulnerabilities, the CLI will display a critical warning regardless of the version threshold.

### Bypassing Version Check

For development or offline use:
```bash
SOPHIA_SKIP_VERSION_CHECK=1 sophia status
```

---

## Auto-Update Mechanism

### Manual Update
```bash
# Check for updates without installing
sophia update --check

# Install latest version
sophia update

# Force reinstall
sophia update --force
```

### Automatic Package Manager Detection
Sophia detects your package manager automatically:
- npm
- pnpm
- yarn
- bun

### Behind the Scenes
```bash
# Detected package manager commands
npm install -g @sophia-code/cli@latest    # npm
pnpm add -g @sophia-code/cli@latest       # pnpm
yarn global add @sophia-code/cli@latest   # yarn
bun add -g @sophia-code/cli@latest        # bun
```

---

## AI-Driven CI/CD Pipeline

### GitHub Actions Workflows

| Workflow | File | Purpose |
|----------|------|---------|
| **AI-Driven CI/CD** | `.github/workflows/ai-driven-cicd.yml` | Main pipeline with AI agent integration |
| **AI Agent Collaboration** | `.github/workflows/ai-agent-collaboration.yml` | Interactive agent task execution |
| **Version Check** | `.github/workflows/version-check.yml` | Validate version policy changes |

### Pipeline Stages

```
┌─────────────────────────────────────────────────────────────┐
│                     TRIGGER (Push/PR/Issue)                 │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌───────────────┐    ┌───────────────┐
│  Test Matrix  │    │   E2E Tests   │    │ AI Triage     │
│  (Unit/Int)   │    │  (Playwright) │    │ (Labeling)    │
└───────────────┘    └───────────────┘    └───────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
                    ┌───────────────────┐
                    │  AI Fix/Feature   │
                    │  (Copilot/Jules)  │
                    └───────────────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │  Security Scan    │
                    │  (Audit/Secrets)  │
                    └───────────────────┘
                              │
                              ▼
                    ┌───────────────────┐
                    │  Auto-Release     │
                    │  + Tag Creation   │
                    └───────────────────┘
```

---

## Using AI Agents

### GitHub Copilot Integration

#### Trigger via Issue Labels
1. Create an issue describing the bug or feature
2. Add the `ai-fix` label
3. The pipeline automatically:
   - Creates a fix branch
   - Generates code using Copilot
   - Runs tests
   - Creates a pull request

#### Trigger via Comments
```markdown
@copilot suggest better error handling here
@copilot explain this function
@copilot fix the authentication bug
@copilot generate tests for the API
```

#### Available Commands
| Command | Description |
|---------|-------------|
| `/copilot suggest` | Get code suggestions |
| `/copilot explain` | Explain code behavior |
| `/copilot fix` | Propose bug fixes |
| `/copilot tests` | Generate test cases |

### Google Jules Integration

#### Status
🔮 **Coming Soon** - Jules API not yet publicly available

#### Trigger via Labels/Comments
```markdown
@jules implement user authentication
@jules refactor the database layer
```

#### What Jules Will Do
1. Analyze the entire codebase structure
2. Understand task requirements
3. Plan implementation steps
4. Generate production-ready code
5. Create tests and documentation

#### Sign Up
Register for Jules access at: [labs.google.com/jules](https://labs.google.com/jules)

---

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SOPHIA_SKIP_VERSION_CHECK` | Disable version enforcement | `false` |
| `SOPHIA_PROJECT_ROOT` | Override project root detection | Current directory |
| `NO_COLOR` | Disable colored output | `false` |

### GitHub Secrets Required

| Secret | Purpose | Required For |
|--------|---------|--------------|
| `GITHUB_TOKEN` | Auto-create PRs, releases | Always (auto-provided) |
| `COPILOT_API_TOKEN` | Copilot API access | AI-generated fixes |
| `JULES_API_KEY` | Google Jules integration | Jules tasks (future) |

### Version Policy Configuration

Edit `.sophia/version-policy.json`:

```json
{
  "latestVersion": "1.0.0",
  "minimumVersion": "0.9.0",
  "warningThreshold": 1,
  "lockdownThreshold": 2,
  "enforcementEnabled": true,
  "criticalVersions": ["0.8.0", "0.7.5"],
  "updateMessage": "Security fixes in latest release",
  "changelogUrl": "https://github.com/TheMethodArq/sophia-community/releases"
}
```

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| `latestVersion` | string | Current published version |
| `minimumVersion` | string | Oldest allowed version (versions below are blocked) |
| `warningThreshold` | number | Versions behind before warning |
| `lockdownThreshold` | number | Versions behind before lockdown |
| `enforcementEnabled` | boolean | Whether to enforce version policy |
| `criticalVersions` | string[] | Versions with known security issues |
| `updateMessage` | string | Custom message shown during update prompt |
| `changelogUrl` | string | URL to release notes/changelog |

---

## Best Practices

### For Community Users

1. **Keep Updated**: Run `sophia update` regularly
2. **Don't Skip Checks**: Avoid `SOPHIA_SKIP_VERSION_CHECK` in production
3. **Review AI Changes**: Always review AI-generated PRs before merging
4. **Report Issues**: Tag issues with appropriate labels for AI processing

### For Maintainers

1. **Version Policy Updates**:
   - Update `minimumVersion` when breaking changes are introduced
   - Add versions to `criticalVersions` for security patches

2. **AI Agent Management**:
   - Configure `COPILOT_API_TOKEN` for enhanced Copilot features
   - Monitor AI-generated PRs for quality

3. **CI/CD Monitoring**:
   - Review the [Actions tab](https://github.com/TheMethodArq/sophia-community/actions) regularly
   - Adjust thresholds based on community feedback

---

## Troubleshooting

### Version Check Fails
```bash
# Check network connectivity
curl -I https://raw.githubusercontent.com/TheMethodArq/sophia-community/main/.sophia/version-policy.json

# Skip temporarily for offline work
SOPHIA_SKIP_VERSION_CHECK=1 sophia <command>
```

### Auto-Update Fails
```bash
# Manual update with specific package manager
npm install -g @sophia-code/cli@latest
# or
pnpm add -g @sophia-code/cli@latest
```

### AI Agent Not Responding
- Ensure labels are correctly applied (`ai-fix`, `jules`)
- Check that required secrets are configured
- Review Actions logs for error details

---

## Related Documentation

- [Testing Framework](./TESTING.md) - How to run and write tests
- [Architecture](./ARCHITECTURE.md) - System design and components
- [Contributing](./CONTRIBUTING.md) - Guidelines for contributors
