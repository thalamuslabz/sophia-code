# E2E Test Quickstart Guide

## Run Tests in 3 Steps

### 1. Start Services
```bash
# Terminal 1 - Docker services
cd /Users/sesloan/sophia-code
docker compose up -d

# Terminal 2 - Dashboard
cd /Users/sesloan/sophia-code/packages/dashboard
npm run dev

# Terminal 3 - Orchestrator
cd /Users/sesloan/sophia-code/packages/orchestrator
PORT=7654 npm start
```

### 2. Run Tests
```bash
# Terminal 4 - Run all tests
cd /Users/sesloan/sophia-code/e2e-tests
npx playwright test

# Or with UI
npx playwright test --ui
```

### 3. View Results
- Console output shows pass/fail status
- HTML report: `npx playwright show-report`
- Screenshots saved on failure

## Test Files Overview

| File | Coverage | Tests |
|------|----------|-------|
| `health-checks.spec.ts` | Service availability | 14 tests |
| `dashboard.spec.ts` | UI navigation | 15 tests |
| `vibe-coding-workflow.spec.ts` | End-to-end workflow | 13 tests |

**Total: 42 tests**

## Common Commands

```bash
# Run specific test file
npx playwright test tests/vibe-coding-workflow.spec.ts

# Run with headed browser (see it run)
npx playwright test --headed

# Debug mode
npx playwright test --debug

# Run only health checks
npx playwright test tests/health-checks.spec.ts

# Run with specific project (browser)
npx playwright test --project=chromium
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `ECONNREFUSED` | Start all services first |
| `browserType.launch` | Run `npx playwright install` |
| Tests timeout | Increase timeout in `playwright.config.ts` |
| Port conflicts | Check `lsof -i :9473` etc. |

## Need Help?

See full documentation:
- [README.md](./README.md) - Complete test documentation
- [TEST_PLAN.md](./TEST_PLAN.md) - Detailed test plan with checklist
