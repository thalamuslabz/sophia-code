# Thalamus AI E2E Test Plan

## Overview

This document provides a comprehensive test plan for executing and documenting the Thalamus AI E2E test suite.

## Test Environment Setup

### Prerequisites Checklist
- [ ] Docker Desktop running
- [ ] All services started (`docker compose up -d`)
- [ ] Dashboard running (`npm run dev:dashboard`)
- [ ] Orchestrator running (`PORT=7654 npm run dev:orchestrator`)
- [ ] Playwright installed (`npx playwright install`)
- [ ] All database backups restored

### Service URLs
| Service | URL | Purpose |
|---------|-----|---------|
| Dashboard | http://localhost:9473 | Governance UI |
| Orchestrator | http://localhost:7654 | Build management API |
| Open WebUI | http://localhost:3115 | AI chat interface |
| n8n | http://localhost:3118 | Workflow automation |
| Qdrant | http://localhost:6333 | Vector search |
| Leantime | http://localhost:8081 | Project management |

## Test Execution Steps

### 1. Pre-Test Verification
```bash
# Verify services are running
curl http://localhost:9473
curl http://localhost:7654/health
curl http://localhost:3115
curl http://localhost:6333
```

### 2. Run Full Test Suite
```bash
# From e2e-tests directory
cd /Users/sesloan/sophia-code/e2e-tests
npm run test:e2e
```

### 3. Test Categories

#### Category A: Service Health (`health-checks.spec.ts`)
**Objective:** Verify all services are running and accessible

| Test ID | Test Name | Expected Result | Status |
|---------|-----------|-----------------|--------|
| HEALTH-01 | Open WebUI running | HTTP 200 | [ ] |
| HEALTH-02 | n8n running | HTTP 200 | [ ] |
| HEALTH-03 | Qdrant running | HTTP 200, version in response | [ ] |
| HEALTH-04 | Leantime running | HTTP 200 | [ ] |
| HEALTH-05 | Dashboard running | HTTP 200 | [ ] |
| HEALTH-06 | Orchestrator running | HTTP 200, status: ok | [ ] |
| HEALTH-07 | MySQL accessible | Connection successful | [ ] |
| HEALTH-08 | All ports listening | No connection refused | [ ] |

#### Category B: Dashboard UI (`dashboard.spec.ts`)
**Objective:** Verify web interface functionality

| Test ID | Test Name | Expected Result | Status |
|---------|-----------|-----------------|--------|
| DASH-01 | Sidebar navigation visible | All nav items present | [ ] |
| DASH-02 | Navigate to Sessions | URL changes to /sessions | [ ] |
| DASH-03 | Navigate to Claims | URL changes to /claims | [ ] |
| DASH-04 | Navigate to Policies | URL changes to /policies | [ ] |
| DASH-05 | Navigate to Memory | URL changes to /memory | [ ] |
| DASH-06 | Navigate to Health | URL changes to /health | [ ] |
| DASH-07 | Navigate to Bulletin | URL changes to /bulletin | [ ] |
| DASH-08 | Navigate to Settings | URL changes to /settings | [ ] |
| DASH-09 | Desktop viewport | Layout correct | [ ] |
| DASH-10 | Tablet viewport | Layout correct | [ ] |
| DASH-11 | Mobile viewport | Layout correct | [ ] |

#### Category C: Vibe Coding Workflow (`vibe-coding-workflow.spec.ts`)
**Objective:** Verify end-to-end intent-to-build workflow

| Test ID | Test Name | Expected Result | Status |
|---------|-----------|-----------------|--------|
| VIBE-01 | Access Open WebUI | Page loads successfully | [ ] |
| VIBE-02 | Create new chat | Chat interface ready | [ ] |
| VIBE-03 | Describe intent | Text entered in input | [ ] |
| VIBE-04 | Intent captured by API | Intent created with ID | [ ] |
| VIBE-05 | Intent appears in dashboard | Visible in sessions list | [ ] |
| VIBE-06 | Intent details viewable | Description visible | [ ] |
| VIBE-07 | Build triggered | Build API accepts request | [ ] |
| VIBE-08 | Build status checkable | Build list accessible | [ ] |
| VIBE-09 | Evidence vault accessible | Evidence API responds | [ ] |
| VIBE-10 | Dashboard reflects workflow | Sessions visible | [ ] |
| VIBE-11 | Health score calculated | Score/grade displayed | [ ] |
| VIBE-12 | Bulletin shows events | Events visible | [ ] |
| VIBE-13 | Cleanup successful | Test intent deleted | [ ] |

## Test Results Documentation

### Success Criteria
- All Category A tests: **Must Pass** (Critical services)
- All Category B tests: **Must Pass** (Core functionality)
- All Category C tests: **Should Pass** (End-to-end workflow)

### Bug Report Template
```
**Test ID:** [e.g., VIBE-04]
**Severity:** [Critical/High/Medium/Low]
**Description:** [Brief description]
**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
**Expected Result:** [What should happen]
**Actual Result:** [What actually happened]
**Screenshots:** [If applicable]
**Logs:** [Error messages, console output]
```

### Test Run Summary

| Date | Tester | Environment | Total Tests | Passed | Failed | Blocked |
|------|--------|-------------|-------------|--------|--------|---------|
| | | | | | | |

## Post-Test Cleanup

1. [ ] Stop test services (if needed)
2. [ ] Archive test results
3. [ ] Document any issues found
4. [ ] Update test plan if needed

## Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Test Lead | | | |
| Developer | | | |
| Product Owner | | | |
