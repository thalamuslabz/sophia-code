# E2E Test-Driven Build Strategy

**Goal:** Each major feature must pass end-to-end tests before proceeding. No debugging marathons.

---

## The Principle: E2E Gates

```
Phase 1: Core Intent Flow
    ↓
[E2E TEST: Create intent → Route to vault → Verify in Obsidian]
    ↓ ✅ PASS
Phase 2: Auto-Claude Bridge  
    ↓
[E2E TEST: Spec detection → AC routing → Notification]
    ↓ ✅ PASS
Phase 3: Build Evidence Capture
    ↓
[E2E TEST: Mock build → Evidence created → Vault updated]
    ↓ ✅ PASS
Phase 4: Full Integration
    ↓
[E2E TEST: Brainstorm → Approve → Build → Evidence → Review]
    ↓ ✅ PASS
DONE
```

**Rule:** If E2E fails, we don't add features. We fix the integration.

---

## Phase 1: Core Intent Flow (Week 1)

### Feature
- Open WebUI function captures "lock this in"
- Creates intent JSON
- n8n routes to Obsidian + Leantime

### E2E Test Definition

**Test Name:** `intent-full-flow.spec.ts`

```typescript
describe('E2E: Intent Creation Flow', () => {
  it('should create intent from Open WebUI and appear in all systems', async () => {
    // GIVEN: User brainstorms in Open WebUI
    const brainstormInput = {
      messages: [
        { role: 'user', content: 'Build auth system with OAuth2' },
        { role: 'assistant', content: 'Let me clarify requirements...' },
        { role: 'user', content: '/lock this in as SOPHIA/auth-v1' }
      ]
    };

    // WHEN: Intent is locked
    const result = await simulateOpenWebUIIntentCreation(brainstormInput);

    // THEN: Intent appears in all systems within 10 seconds
    
    // 1. Spec file exists
    const specPath = `~/.auto-claude/specs/${result.specId}.json`;
    expect(await fileExists(specPath)).toBe(true);
    expect(await readJson(specPath)).toMatchObject({
      project: 'SOPHIA',
      description: expect.stringContaining('OAuth2'),
      acceptance_criteria: expect.any(Array)
    });

    // 2. Obsidian note created
    const obsidianPath = `~/Documents/Obsidian Vault/Thalamus/06-PROJECTS/SOPHIA/int-${result.intentId}.md`;
    expect(await fileExists(obsidianPath)).toBe(true);
    const noteContent = await readFile(obsidianPath);
    expect(noteContent).toContain('OAuth2');
    expect(noteContent).toContain('Status: pending-approval');

    // 3. Leantime ticket created
    const leantimeTicket = await getLeantimeTicket(result.intentId);
    expect(leantimeTicket).toMatchObject({
      project: 'SOPHIA',
      status: 'To Do',
      headline: expect.stringContaining('auth')
    });

    // 4. Bridge detected the spec
    const bridgeLog = await readBridgeLog();
    expect(bridgeLog).toContain(`New spec detected: ${result.specId}`);

    // 5. Dashboard shows intent
    const dashboardIntents = await fetchDashboardIntents();
    expect(dashboardIntents).toContainEqual(
      expect.objectContaining({
        id: result.intentId,
        project: 'SOPHIA',
        status: 'pending-approval'
      })
    );
  }, 30000); // 30 second timeout
});
```

### Test Infrastructure Needed

```typescript
// __e2e__/helpers/test-setup.ts

export async function setupE2EEnvironment() {
  // Clean slate for each test
  await cleanDirectory('~/.auto-claude/specs');
  await cleanDirectory('~/.auto-claude/processed');
  
  // Ensure services running
  await verifyService('openwebui', 'http://localhost:3115');
  await verifyService('n8n', 'http://localhost:3118');
  await verifyService('thalamus-orchestrator', 'http://localhost:7654');
  
  // Clear test notes from Obsidian
  await cleanTestNotes();
  
  return { testRunId: generateTestId() };
}

export async function simulateOpenWebUIIntentCreation(input: BrainstormInput) {
  // Directly call the Open WebUI function logic
  const pipe = new AutoClaudeTriggerPipe();
  const result = await pipe.pipe({
    messages: input.messages,
    chat_id: `test-${Date.now()}`
  });
  
  // Wait for async processing
  await waitForAsyncProcessing(5000);
  
  return {
    specId: extractSpecId(result),
    intentId: extractIntentId(result)
  };
}
```

### Pass Criteria
- [ ] Test runs in < 30 seconds
- [ ] All 5 assertions pass
- [ ] No manual verification needed
- [ ] Runs reliably (5/5 passes)

---

## Phase 2: Auto-Claude Bridge (Week 2)

### Feature
- Bridge watches spec directory
- Routes to AC project directory
- Sends notifications

### E2E Test Definition

**Test Name:** `ac-bridge-routing.spec.ts`

```typescript
describe('E2E: Auto-Claude Bridge Routing', () => {
  it('should detect spec and route to AC project directory', async () => {
    // GIVEN: Test project with AC structure
    const testProjectDir = await createTestProject('test-react-app');
    process.env.AUTO_CLAUDE_PROJECT_DIR = testProjectDir;
    
    // GIVEN: Spec created in inbox
    const spec = createTestSpec({
      project: 'test-react-app',
      description: 'Build todo app',
      features: ['Add todos', 'Delete todos']
    });
    
    // WHEN: Spec dropped in inbox
    await writeFile('~/.auto-claude/specs/test-spec.json', spec);
    
    // THEN: Bridge detects within 5 seconds
    await waitFor(() => {
      const log = readBridgeLog();
      return log.includes('New spec detected: test-spec');
    }, 5000);
    
    // THEN: AC-compatible structure created
    const acSpecDir = `${testProjectDir}/.auto-claude/specs/001-test-react-app`;
    await waitFor(() => fileExists(acSpecDir), 3000);
    
    expect(await fileExists(`${acSpecDir}/requirements.json`)).toBe(true);
    expect(await fileExists(`${acSpecDir}/spec.md`)).toBe(true);
    expect(await fileExists(`${acSpecDir}/implementation_plan.json`)).toBe(true);
    expect(await fileExists(`${acSpecDir}/IMPORT_INSTRUCTIONS.txt`)).toBe(true);
    
    // THEN: Spec moved to processed
    expect(await fileExists('~/.auto-claude/specs/test-spec.json')).toBe(false);
    expect(await fileExists('~/.auto-claude/processed/test-spec.json')).toBe(true);
    
    // THEN: Notification sent (mocked in test, verified in logs)
    const notificationLog = readNotificationLog();
    expect(notificationLog).toContain('Spec Ready for Auto-Claude');
  }, 20000);
});
```

### Pass Criteria
- [ ] Spec detected in < 5 seconds
- [ ] AC structure created with all required files
- [ ] Original spec moved to processed
- [ ] Instructions file readable

---

## Phase 3: Build Evidence Capture (Week 3)

### Feature
- Mock build runner (simulates AC build)
- Evidence captured to vault
- Intent note updated

### E2E Test Definition

**Test Name:** `evidence-capture-flow.spec.ts`

```typescript
describe('E2E: Build Evidence Capture', () => {
  it('should capture build evidence and update vault', async () => {
    // GIVEN: Intent approved
    const intentId = 'int-20260216-001';
    const project = 'SOPHIA';
    await approveIntent(intentId);
    
    // GIVEN: Mock build runs
    const buildId = 'build-20260216-001';
    const mockEvidence = {
      recording: 'recording.mp4',
      testResults: 'test-results.xml',
      screenshots: ['login-success.png', 'error-handling.png'],
      logs: 'build.log'
    };
    
    // WHEN: Build completes and evidence saved
    await simulateBuildCompletion({
      intentId,
      buildId,
      evidence: mockEvidence
    });
    
    // THEN: Evidence in vault
    const evidenceDir = `~/Documents/Obsidian Vault/Thalamus/06-PROJECTS/${project}/evidence/${buildId}`;
    await waitFor(() => fileExists(evidenceDir), 5000);
    
    expect(await fileExists(`${evidenceDir}/recording.mp4`)).toBe(true);
    expect(await fileExists(`${evidenceDir}/test-results.xml`)).toBe(true);
    
    // THEN: Intent note updated
    const intentNotePath = `~/Documents/Obsidian Vault/Thalamus/06-PROJECTS/${project}/${intentId}.md`;
    const noteContent = await readFile(intentNotePath);
    
    expect(noteContent).toContain('Status: completed');
    expect(noteContent).toContain(buildId);
    expect(noteContent).toContain('recording.mp4');
    expect(noteContent).toContain('test-results.xml');
    
    // THEN: Daily note updated
    const dailyNotePath = getDailyNotePath();
    const dailyContent = await readFile(dailyNotePath);
    expect(dailyContent).toContain(intentId);
    expect(dailyContent).toContain('completed');
    
    // THEN: Dashboard shows completion
    const dashboardStatus = await fetchDashboardStatus(intentId);
    expect(dashboardStatus).toBe('completed');
  }, 30000);
});
```

### Pass Criteria
- [ ] Evidence files appear in vault
- [ ] Intent note updated with links
- [ ] Daily note includes build activity
- [ ] Dashboard reflects completion

---

## Phase 4: Full Integration (Week 4)

### Feature
- Complete flow: Brainstorm → Approve → Build → Evidence → Review

### E2E Test Definition

**Test Name:** `full-integration-journey.spec.ts`

```typescript
describe('E2E: Complete Integration Journey', () => {
  it('should handle full lifecycle from brainstorm to review', async () => {
    const testId = `e2e-${Date.now()}`;
    
    // STEP 1: Brainstorm in Open WebUI
    const brainstorm = await simulateBrainstormSession({
      topic: 'Create dashboard with analytics',
      clarifications: [
        { q: 'Which charts?', a: 'Line chart for trends, pie for breakdown' },
        { q: 'Data source?', a: 'Existing API at /api/metrics' }
      ]
    });
    
    // STEP 2: Lock intent
    const lockResult = await simulateIntentLock({
      session: brainstorm.sessionId,
      project: 'SYNAPTICA',
      name: 'analytics-dashboard-v1'
    });
    
    // VERIFY: Intent exists everywhere
    await verifyIntentCreated(lockResult.intentId, {
      obsidian: true,
      leantime: true,
      dashboard: true,
      specs: true
    });
    
    // STEP 3: Review in dashboard
    const dashboardView = await fetchDashboardIntent(lockResult.intentId);
    expect(dashboardView.acceptanceCriteria).toHaveLength(4);
    expect(dashboardView.architectureDecisions).toContainEqual(
      expect.objectContaining({ decision: 'Chart library' })
    );
    
    // STEP 4: Approve intent
    await approveIntent(lockResult.intentId);
    
    // VERIFY: Status updated
    expect(await getIntentStatus(lockResult.intentId)).toBe('approved');
    
    // STEP 5: Simulate build completion
    await simulateFullBuild({
      intentId: lockResult.intentId,
      duration: '45m',
      tests: { passed: 23, failed: 0 },
      evidence: ['recording.mp4', 'coverage.html', 'test-results.xml']
    });
    
    // VERIFY: Evidence captured
    const evidenceDir = await getEvidenceDir(lockResult.intentId);
    expect(evidenceDir.files).toHaveLength(3);
    
    // VERIFY: Obsidian updated
    const finalNote = await readObsidianNote(lockResult.intentId);
    expect(finalNote).toContain('Status: completed');
    expect(finalNote).toContain('23/23 tests passing');
    expect(finalNote).toContain('recording.mp4');
    
    // STEP 6: Verify "add on" capability
    const followUp = await simulateFollowUpIntent({
      parentId: lockResult.intentId,
      description: 'Add export to CSV feature'
    });
    
    // VERIFY: Parent context retrieved
    expect(followUp.suggestedContext).toContain('Existing chart implementation');
    expect(followUp.parentLink).toBe(lockResult.intentId);
    
  }, 120000); // 2 minute timeout for full journey
});
```

### Pass Criteria
- [ ] Full journey completes in < 2 minutes
- [ ] All verification points pass
- [ ] Context preserved for follow-up
- [ ] Evidence immutable and verifiable

---

## E2E Test Infrastructure

### Docker Compose for Tests

```yaml
# __e2e__/docker-compose.test.yml
version: '3.8'

services:
  sophia-cli-test:
    build:
      context: ../../packages/cli
      dockerfile: ../../__e2e__/Dockerfile.test
    volumes:
      - test-specs:/tmp/specs
      - test-evidence:/tmp/evidence
      - obsidian-mock:/tmp/obsidian
    environment:
      - NODE_ENV=test
      - SOPHIA_TEST_MODE=true
      - AUTO_CLAUDE_SPEC_DIR=/tmp/specs
      - OBSIDIAN_VAULT_DIR=/tmp/obsidian
    depends_on:
      - n8n-test
      - openwebui-test
      
  n8n-test:
    image: n8nio/n8n:latest
    ports:
      - "3118:5678"
    volumes:
      - n8n-test-data:/home/node/.n8n
      - ./n8n/workflows:/workflows
      
  openwebui-test:
    image: ghcr.io/open-webui/open-webui:latest
    ports:
      - "3115:8080"
    environment:
      - WEBUI_SECRET_KEY=test-secret
      - ENABLE_SIGNUP=false
      
volumes:
  test-specs:
  test-evidence:
  obsidian-mock:
  n8n-test-data:
```

### Test Runner Script

```bash
#!/bin/bash
# __e2e__/run-e2e-tests.sh

set -e

echo "🧹 Cleaning test environment..."
docker-compose -f docker-compose.test.yml down -v
docker-compose -f docker-compose.test.yml up -d

echo "⏳ Waiting for services..."
sleep 10

echo "🧪 Running E2E tests..."
npx vitest run __e2e__/ --reporter=verbose

echo "📊 Test results:"
docker-compose -f docker-compose.test.yml logs sophia-cli-test

echo "🧹 Cleanup..."
docker-compose -f docker-compose.test.yml down

echo "✅ E2E tests complete"
```

### CI/CD Integration

```yaml
# .github/workflows/e2e.yml
name: E2E Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 20
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build packages
        run: npm run build
        
      - name: Run E2E tests
        run: |
          cd __e2e__
          ./run-e2e-tests.sh
          
      - name: Upload test artifacts
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: e2e-failure-logs
          path: __e2e__/logs/
```

---

## Test Data Management

### Fixture Factory

```typescript
// __e2e__/fixtures/intent-factory.ts

export function createTestIntent(overrides: Partial<Intent> = {}): Intent {
  return {
    id: `int-test-${Date.now()}`,
    project: 'TEST',
    description: 'Test intent for E2E',
    acceptance_criteria: ['Criterion 1', 'Criterion 2'],
    tech_stack: ['react', 'typescript'],
    features: ['Feature A', 'Feature B'],
    timestamp: new Date().toISOString(),
    source: 'e2e-test',
    ...overrides
  };
}

export function createBrainstormSession(messages: Message[]): BrainstormSession {
  return {
    sessionId: `session-${Date.now()}`,
    messages,
    extractedRequirements: extractRequirements(messages),
    architectureDecisions: extractDecisions(messages)
  };
}
```

### Test Isolation

```typescript
// __e2e__/helpers/isolation.ts

export async function withCleanEnvironment(testFn: () => Promise<void>) {
  const testId = `test-${Date.now()}`;
  const cleanup = [];
  
  try {
    // Setup isolated test environment
    const testDirs = await createTestDirectories(testId);
    cleanup.push(() => removeTestDirectories(testDirs));
    
    // Run test
    await testFn();
    
  } finally {
    // Cleanup in reverse order
    for (const fn of cleanup.reverse()) {
      await fn().catch(console.error);
    }
  }
}
```

---

## Debugging Failed E2E Tests

### When Tests Fail

1. **Don't add features. Debug the integration.**

2. **Check logs in order:**
   ```bash
   # 1. Bridge logs
   tail -100 ~/.auto-claude/logs/bridge.log
   
   # 2. n8n execution logs
   curl http://localhost:3118/rest/executions
   
   # 3. Service status
   docker-compose ps
   
   # 4. Test artifacts
   ls -la __e2e__/artifacts/
   ```

3. **Reproduce manually:**
   ```bash
   # The test should give you exact steps
   npm run test:e2e -- --grep "intent-full-flow" --verbose
   ```

### Common Failure Points

| Failure | Likely Cause | Fix |
|---------|--------------|-----|
| Spec not detected | Bridge not watching | Check `fs.watch` on correct dir |
| Obsidian note missing | n8n webhook failed | Check n8n credentials |
| Leantime ticket missing | API key expired | Rotate credentials |
| Dashboard not updated | WebSocket disconnected | Add retry logic |

---

## Success Metrics

### Phase Gate Criteria

| Phase | E2E Tests | Pass Rate | Time | Gate |
|-------|-----------|-----------|------|------|
| 1 | intent-full-flow | 100% (5/5) | <30s | ✅ Proceed |
| 2 | ac-bridge-routing | 100% (5/5) | <20s | ✅ Proceed |
| 3 | evidence-capture | 100% (5/5) | <30s | ✅ Proceed |
| 4 | full-journey | 100% (5/5) | <2m | ✅ SHIP |

### Build Quality Metrics

- **Flakiness:** <5% (same test, same code, should always pass)
- **Speed:** Full suite <5 minutes
- **Coverage:** All integration points tested
- **Reliability:** Can run 100x without failure

---

## Summary: Build Order with Gates

```
Week 1: Phase 1 - Core Intent Flow
  ├─ Feature: Open WebUI → Obsidian + Leantime
  └─ Gate: E2E test passes (intent appears in all 3 systems)

Week 2: Phase 2 - Auto-Claude Bridge
  ├─ Feature: Bridge routing to AC
  └─ Gate: E2E test passes (spec → AC directory + notification)

Week 3: Phase 3 - Evidence Capture
  ├─ Feature: Build evidence → Vault
  └─ Gate: E2E test passes (evidence captured, note updated)

Week 4: Phase 4 - Full Integration
  ├─ Feature: Complete flow + "add on" capability
  └─ Gate: E2E test passes (brainstorm → evidence → follow-up)

SHIP: All 4 E2E tests pass reliably
```

**No phase proceeds until the previous E2E gate passes.**

---

*This ensures we build it right, not just build it fast.*
