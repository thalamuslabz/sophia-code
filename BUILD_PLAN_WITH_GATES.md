# Build Plan with E2E Gates

**Goal:** Build Sophia + Auto-Claude integration with zero debugging marathons.

**Rule:** No feature proceeds until its E2E gate passes.

---

## Build Philosophy

```
Feature → E2E Test → Gate → (Pass) → Next Feature
              ↓
           (Fail) → Debug → Retry → Gate
```

**No accumulating technical debt. No "we'll fix it later."**

Each gate validates the entire integration chain for that feature.

---

## Week 1: Phase 1 - Core Intent Flow

### Goal
User can brainstorm in Open WebUI, say "lock this in," and intent appears in:
1. Spec file (`~/.auto-claude/specs/`)
2. Obsidian note (`06-PROJECTS/{project}/`)
3. Leantime ticket
4. Dashboard

### Tasks

#### Day 1-2: Open WebUI Function
**File:** `~/productivity-hub/ops-stack/data/openwebui/functions/auto_claude_trigger.py`

```python
# Must detect: 
# - "/lock this in as PROJECT/name"
# - Natural: "Lock this in...", "Create intent..."
# 
# Must extract:
# - Project name
# - Intent description
# - Acceptance criteria (from bullet points)
# - Tech stack (detected)
# - Architecture decisions (from conversation)
#
# Must output:
# - JSON spec to ~/.auto-claude/specs/
```

**Verification:**
```bash
# Manual test
curl -X POST http://localhost:3115/api/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "user", "content": "Build auth with OAuth2. /lock as SOPHIA/auth-v1"}
    ]
  }'

# Check: Spec file created
ls ~/.auto-claude/specs/spec-*.json
```

#### Day 3-4: n8n Intent Capture Workflow
**File:** `~/productivity-hub/ops-stack/data/n8n/workflows/intent-capture.json`

**Flow:**
```
Webhook: sophia-intent-created
  ↓
Parse intent JSON
  ↓
Create Obsidian note (06-PROJECTS/{project}/int-{id}.md)
  ↓
Create Leantime ticket
  ↓
Update Project MOC
  ↓
Response: {status: "created", intentId: "..."}
```

**Verification:**
```bash
# Trigger webhook
curl -X POST http://localhost:3118/webhook/sophia-intent-created \
  -d @test-intent.json

# Check: Note exists
ls "~/Documents/Obsidian Vault/Thalamus/06-PROJECTS/SOPHIA/int-*.md"

# Check: Leantime ticket
curl http://localhost:3116/api/jsonrpc \
  -d '{"method": "leantime.rpc.Tickets.getTicket", "params": {"id": 123}}'
```

#### Day 5: Dashboard Integration
**File:** `~/productivity-hub/thalamus-orchestrator/src/api/routes/intents.ts`

Add endpoint: `POST /api/intents` to receive from n8n

**Verification:**
```bash
# Create intent via API
curl -X POST http://localhost:7654/api/intents \
  -H "Content-Type: application/json" \
  -d @test-intent.json

# Verify: Intent appears in list
curl http://localhost:7654/api/intents | jq '.[] | select(.project == "SOPHIA")'
```

### 🚧 E2E Gate 1

**Command:**
```bash
cd /Users/sesloan/repos/thalamus-ai/sophia.code
npm run test:e2e -- tests/intent-full-flow.spec.ts
```

**Must Pass:**
- [ ] Test completes in < 30 seconds
- [ ] Intent appears in all 4 systems
- [ ] All assertions pass
- [ ] 5/5 consecutive passes (no flakiness)

**If Failed:**
1. Do NOT proceed to Phase 2
2. Debug integration
3. Fix and rerun gate
4. Only proceed on pass

**Gate Output:**
```
✅ E2E Gate 1 PASSED
   Intent: int-20260216-001
   Systems: Spec ✓ | Obsidian ✓ | Leantime ✓ | Dashboard ✓
   Time: 12.4s
   
🚀 PROCEED TO PHASE 2
```

---

## Week 2: Phase 2 - Auto-Claude Bridge

### Goal
Bridge detects specs and routes to AC project directory with notifications.

### Tasks

#### Day 1-2: Enhanced Bridge Script
**File:** `~/.sophia/scripts/auto-claude-bridge-enhanced.js`

**Requirements:**
- Watch `~/.auto-claude/specs/`
- Detect new JSON files
- Route to `AUTO_CLAUDE_PROJECT_DIR/.auto-claude/specs/XXX-name/`
- Create AC-compatible structure:
  - `requirements.json`
  - `spec.md`
  - `implementation_plan.json`
  - `IMPORT_INSTRUCTIONS.txt`
- Send macOS notification
- Move original to `processed/`

**Configuration:**
```bash
export AUTO_CLAUDE_PROJECT_DIR=~/projects/my-app
node ~/.sophia/scripts/auto-claude-bridge-enhanced.js
```

#### Day 3: Service Integration
Install as launchd service (auto-start on login)

**Verification:**
```bash
# Check service
launchctl list | grep com.thalamus.auto-claude-bridge

# Check logs
tail -f ~/.auto-claude/logs/bridge.log
```

#### Day 4-5: AC Directory Structure
Ensure bridge creates AC-compatible spec folders.

**Test:**
```bash
# Create test spec
echo '{"project": "test-app", "description": "Test"}' > ~/.auto-claude/specs/test.json

# Wait 5 seconds

# Verify AC structure
ls ~/projects/my-app/.auto-claude/specs/001-test-app/
# Should show: requirements.json, spec.md, implementation_plan.json, IMPORT_INSTRUCTIONS.txt
```

### 🚧 E2E Gate 2

**Command:**
```bash
npm run test:e2e -- tests/ac-bridge-routing.spec.ts
```

**Must Pass:**
- [ ] Spec detected in < 5 seconds
- [ ] AC structure created correctly
- [ ] Notification sent
- [ ] Original moved to processed

**Gate Output:**
```
✅ E2E Gate 2 PASSED
   Detection: 2.1s
   Routing: ✓
   Notification: ✓
   
🚀 PROCEED TO PHASE 3
```

---

## Week 3: Phase 3 - Build Evidence Capture

### Goal
Simulate build completion and verify evidence flows to vault.

### Tasks

#### Day 1-2: Mock Build Runner
Create script that simulates AC build completion.

**File:** `~/productivity-hub/thalamus-orchestrator/scripts/mock-build.js`

**Simulates:**
- Build started
- Tests run (pass/fail)
- Screenshots captured
- Logs generated
- Build completed

**Outputs:**
- Evidence to `~/test-evidence/{build-id}/`
- Triggers evidence capture workflow

#### Day 3-4: Evidence Capture Workflow
**File:** `~/productivity-hub/ops-stack/data/n8n/workflows/evidence-capture.json`

**Flow:**
```
Webhook: build-completed
  ↓
Copy evidence to Obsidian: 06-PROJECTS/{project}/evidence/{build-id}/
  ↓
Update intent note with evidence links
  ↓
Update daily note with build activity
  ↓
Update dashboard status
```

#### Day 5: Evidence Vault Integration
**File:** `~/productivity-hub/thalamus-orchestrator/src/core/evidence-vault.ts`

Link evidence to intents with SHA-256 integrity.

### 🚧 E2E Gate 3

**Command:**
```bash
npm run test:e2e -- tests/evidence-capture-flow.spec.ts
```

**Must Pass:**
- [ ] Evidence files in vault
- [ ] Intent note updated
- [ ] Daily note includes activity
- [ ] Dashboard shows completion

**Gate Output:**
```
✅ E2E Gate 3 PASSED
   Evidence: 3 files captured
   Intent note: Updated ✓
   Daily note: Updated ✓
   Dashboard: Status updated ✓
   
🚀 PROCEED TO PHASE 4
```

---

## Week 4: Phase 4 - Full Integration & "Add On"

### Goal
Complete flow works end-to-end. Context preserved for follow-up intents.

### Tasks

#### Day 1-2: Intent History System
**File:** `~/productivity-hub/thalamus-orchestrator/src/core/intent-history.ts`

Track:
- Parent/child relationships
- Architecture decisions
- Build evidence
- Maintenance history

#### Day 3-4: Context Retrieval
When user says "add to SOPHIA/auth":
- Find intent-20260216-001
- Retrieve full context
- Pre-fill new intent with:
  - Architecture decisions
  - Tech stack
  - Related files

#### Day 5: Integration Polish
- Error handling
- Retry logic
- Notifications
- Dashboard UI

### 🚧 E2E Gate 4 (Final)

**Command:**
```bash
npm run test:e2e -- tests/full-integration-journey.spec.ts
```

**Must Pass:**
- [ ] Brainstorm → Intent created (< 30s)
- [ ] Approve → Build queued (< 10s)
- [ ] Build complete → Evidence captured (< 30s)
- [ ] Follow-up intent → Context retrieved (< 10s)
- [ ] Total journey < 2 minutes

**Gate Output:**
```
✅ E2E Gate 4 PASSED - SYSTEM READY
   
   Full Journey:
   ├── Brainstorm: 45s
   ├── Intent created: 8s
   ├── Approval: 2s
   ├── Build: (simulated) 30s
   ├── Evidence: 12s
   └── Follow-up context: 5s
   
   Total: 1m 42s
   
🎉 ALL GATES PASSED - READY FOR VIDEO
```

---

## Gate Failure Protocol

### If Any Gate Fails

1. **STOP** - Do not proceed to next phase
2. **Debug** - Run test with verbose logging:
   ```bash
   npm run test:e2e -- --verbose --grep "intent-full-flow"
   ```
3. **Fix** - Address the integration issue
4. **Verify** - Run gate 5 times, must pass 5/5
5. **Proceed** - Only then continue

### Common Fixes

| Issue | Fix |
|-------|-----|
| Timing/race condition | Add explicit waits, retry logic |
| Service not ready | Add health check polling |
| File permissions | Fix directory ownership |
| Network timeout | Increase timeout, add retry |
| Data format mismatch | Validate schemas |

---

## Daily Workflow

### Morning Standup
```bash
# Check status
npm run test:e2e

# If all green, proceed with today's tasks
# If red, debug before adding features
```

### Before Commit
```bash
# Run gate for current phase
npm run test:e2e -- tests/phase-X.spec.ts

# Must pass before git commit
```

### End of Week
```bash
# Run all gates
npm run test:e2e

# All must pass to consider week complete
```

---

## Success Criteria

### Technical
- [ ] All 4 E2E gates pass
- [ ] Test suite runs in < 5 minutes
- [ ] < 5% flakiness rate
- [ ] Each gate passes 5/5 consecutive runs

### User Experience
- [ ] Brainstorm → Intent: < 30 seconds
- [ ] Intent → Approval: < 10 seconds  
- [ ] Approval → Build: < 5 seconds
- [ ] Build → Evidence: < 30 seconds
- [ ] Context retrieval: < 10 seconds

### Integration
- [ ] Open WebUI → Spec ✓
- [ ] Spec → Obsidian ✓
- [ ] Spec → Leantime ✓
- [ ] Spec → Dashboard ✓
- [ ] Dashboard → Auto-Claude ✓
- [ ] Build → Evidence vault ✓
- [ ] Follow-up → Context ✓

---

## Video Prep Checklist

Once Gate 4 passes:

- [ ] Record brainstorm session
- [ ] Show "lock this in" command
- [ ] Demo intent appearing everywhere
- [ ] Show dashboard approval
- [ ] Demo build running in background
- [ ] Show evidence captured
- [ ] Demo 3-month follow-up with context

---

## Summary

```
Week 1: Intent Flow (Gate 1)
Week 2: AC Bridge (Gate 2)  
Week 3: Evidence (Gate 3)
Week 4: Integration (Gate 4)

Each gate: Build → Test → Pass → Proceed
No gate passing? No proceeding.

Result: Working system, no debugging marathons.
```

---

*Build it right. Test it continuously. Ship with confidence.*
