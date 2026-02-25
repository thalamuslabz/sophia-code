# Thalamus AI E2E Test Suite

Complete end-to-end test suite for validating the Thalamus AI development environment.

## Overview

This test suite validates the full Thalamus AI stack including:
- **Sophia CLI** - Governance and session management
- **Dashboard** - Web UI for monitoring and control
- **Orchestrator** - Build management and intent registry
- **Open WebUI** - AI chat interface
- **n8n** - Workflow automation
- **Qdrant** - Vector search
- **Leantime** - Project management

## Test Coverage

### 1. Service Health Tests (`health-checks.spec.ts`)
- Verify all services are running and responding
- Check API endpoints return expected responses
- Validate health check endpoints

### 2. Sophia CLI Tests (`sophia-cli.spec.ts`)
- Configuration management
- Session lifecycle
- Policy enforcement
- Memory operations

### 3. Dashboard Tests (`dashboard.spec.ts`)
- Navigation and routing
- Session management UI
- Policy display
- Health score visualization

### 4. Orchestrator Tests (`orchestrator.spec.ts`)
- Intent creation and management
- Build workflow execution
- Evidence vault operations
- API endpoints

### 5. Integration Tests (`integration.spec.ts`)
- End-to-end workflow from intent to build
- Cross-service communication
- Data persistence across services

### 6. Data Integrity Tests (`data-integrity.spec.ts`)
- Backup restoration verification
- Database consistency
- File system operations

## Prerequisites

1. **Services Running:**
   ```bash
   # Start all services
   docker compose up -d

   # Start dashboard
   npm run dev:dashboard

   # Start orchestrator
   PORT=7654 npm run dev:orchestrator
   ```

2. **Environment:**
   - All databases restored from backups
   - Sophia CLI configured
   - Test data available

3. **Install Playwright:**
   ```bash
   npm install
   npx playwright install
   ```

## Running Tests

### Run All Tests
```bash
npm run test:e2e
```

### Run Specific Test File
```bash
npx playwright test tests/health-checks.spec.ts
```

### Run with UI
```bash
npm run test:e2e:ui
```

### Run in Headed Mode
```bash
npm run test:e2e:headed
```

### Debug Mode
```bash
npx playwright test --debug
```

## Test Data

Tests use isolated test data with the `e2e-test-` prefix. All test artifacts are cleaned up after test runs.

## CI/CD Integration

Add to your pipeline:
```yaml
- name: E2E Tests
  run: |
    docker compose up -d
    npm run dev:dashboard &
    npm run dev:orchestrator &
    sleep 30
    npm run test:e2e
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Connection refused | Ensure all services are running |
| Timeout errors | Increase timeout in `playwright.config.ts` |
| Database errors | Verify backups are restored |
| Port conflicts | Check for services already using ports |

## Test Documentation

Each test file includes:
- Test scenario descriptions
- Expected outcomes
- Related user stories
- Risk areas covered

## File Structure

```
e2e-tests/
├── README.md                 # This file
├── playwright.config.ts      # Playwright configuration
├── TEST_PLAN.md             # Detailed test plan with checklist
├── QUICKSTART.md            # Quick start guide
├── tests/
│   ├── health-checks.spec.ts
│   ├── sophia-cli.spec.ts
│   ├── dashboard.spec.ts
│   ├── orchestrator.spec.ts
│   ├── integration.spec.ts
│   └── data-integrity.spec.ts
├── helpers/
│   ├── api-client.ts
│   ├── test-utils.ts
│   └── fixtures.ts
└── fixtures/
    └── test-data.json
```

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Test Lead | | | |
| Developer | | | |
| Product Owner | | | |
