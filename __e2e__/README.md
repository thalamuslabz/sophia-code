# Sophia E2E Test Suite

## Overview

End-to-end tests for the Sophia Code intent-driven development system.

## Test Gates

### Gate 1: Intent Capture Flow (Skipped - requires full stack)
- Open WebUI → Spec file → Obsidian + Leantime + Dashboard
- Tests the initial intent creation and routing

### Gate 2: Auto-Claude Bridge Routing ✅
- Spec detection → AC directory structure → Notification
- Tests bridge routing to Auto-Claude compatible format

### Gate 3: Approval → Execution → Evidence ✅
- Pending queue → Approval → AC routing → Evidence capture
- Tests the approval workflow and evidence collection

### Gate 4: Evidence → Obsidian Feedback Loop ✅
- Evidence capture → Obsidian sync → Project index update
- Tests the complete feedback loop back to Obsidian

## Running Tests

```bash
# All E2E tests
npm run test:integration

# Specific gate
npx vitest run --config __e2e__/vitest.config.ts tests/ac-bridge-routing.spec.ts
npx vitest run --config __e2e__/vitest.config.ts tests/approval-execution-flow.spec.ts
npx vitest run --config __e2e__/vitest.config.ts tests/evidence-feedback-loop.spec.ts
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         COMPLETE SYSTEM FLOW                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  Phase 1: Intent Capture                                                │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────────┐  │
│  │ Open WebUI   │───▶│ n8n Workflow │───▶│ Spec File                │  │
│  │ /lock this   │    │ intent-capture│   │ ~/.auto-claude/specs/    │  │
│  └──────────────┘    └──────────────┘    └──────────────────────────┘  │
│                                                   │                      │
│                              ┌────────────────────┼────────────────────┐│
│                              ▼                    ▼                    ▼│
│                         ┌─────────┐        ┌──────────┐         ┌────────┐
│                         │Obsidian │        │Leantime  │         │Dashboard│
│                         └─────────┘        └──────────┘         └────────┘
│                                                                          │
│  Phase 2-3: Approval & Execution                                        │
│  ┌──────────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │ Approval Engine  │───▶│ Integrated   │───▶│ Auto-Claude Bridge   │  │
│  │ Queue/Approve    │    │ Bridge       │    │ Route to AC specs    │  │
│  └──────────────────┘    └──────────────┘    └──────────────────────┘  │
│                                                          │               │
│  ┌──────────────────┐    ┌───────────────────────────────────────────┐ │
│  │ Evidence Capture │◀───│ Watches AC output, captures artifacts     │ │
│  │ File watcher     │    └───────────────────────────────────────────┘ │
│  └────────┬─────────┘                                                   │
│           │                                                              │
│  Phase 4: Feedback Loop                                                 │
│           ▼                                                              │
│  ┌──────────────────┐    ┌───────────────────────────────────────────┐ │
│  │ Evidence Vault   │───▶│ Obsidian Sync                           │ │
│  │ Watches evidence │    │ Creates notes, updates project index    │ │
│  └──────────────────┘    └───────────────────────────────────────────┘ │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## Key Components

### Bridge (`helpers/bridge.ts`)
- Watches `~/.auto-claude/specs/` for new spec files
- Routes to Auto-Claude compatible directory structure
- Creates: requirements.json, spec.md, implementation_plan.json

### Approval Engine (`helpers/approval-engine.ts`)
- Manages approval queue (pending/, approved/, rejected/)
- Polls Sophia API for approval status
- Triggers execution on approval

### Evidence Capture (`helpers/evidence-capture.ts`)
- Watches AC output directories
- Captures artifacts with checksums
- Records test results
- Classifies files (source, test, config, doc)

### Evidence Vault (`helpers/evidence-vault.ts`)
- Syncs evidence to Obsidian
- Creates structured notes
- Updates project index
- Groups artifacts by type

### Integrated Bridge (`helpers/integrated-bridge.ts`)
- Combines all components
- Full flow: Spec → Pending → Approval → AC → Evidence

## Test Results

```
✅ E2E Gate 2: Bridge Routing (3 tests)
   - Spec detection and routing
   - Multiple specs in parallel
   - Invalid spec handling

✅ E2E Gate 3: Approval → Execution (2 tests)
   - Queue, approval, execution flow
   - Status reporting

✅ E2E Gate 4: Evidence → Obsidian (3 tests)
   - Evidence capture and sync
   - Multiple evidence files
   - Artifact classification
```
