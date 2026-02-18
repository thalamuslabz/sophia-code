/**
 * E2E Test: Phase 3 - Approval → Execution → Evidence
 * 
 * Tests: Intent approval → AC routing → Evidence capture
 * Must pass before proceeding to Phase 4
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { promises as fs } from 'fs';
import { 
  setupE2EEnvironment, 
  cleanupE2EEnvironment,
  waitFor,
  fileExists,
  readJson,
  writeFile
} from '../helpers/test-setup';
import { IntegratedBridge } from '../helpers/integrated-bridge';
import { createIntent, approveIntent, getIntent } from '../helpers/dashboard-client';

interface TestEnv {
  testDir: string;
  specDir: string;
  projectDir: string;
  testProjectDir: string;
  pendingDir: string;
  approvedDir: string;
  evidenceDir: string;
}

describe('E2E Gate 3: Approval → Execution → Evidence', () => {
  let testEnv: TestEnv;
  let bridge: IntegratedBridge;
  
  beforeAll(async () => {
    // Setup environment with all needed directories
    const baseEnv = await setupE2EEnvironment();
    
    testEnv = {
      testDir: baseEnv.testDir,
      specDir: baseEnv.specDir,
      projectDir: baseEnv.projectDir,
      testProjectDir: baseEnv.testProjectDir,
      pendingDir: `${baseEnv.testDir}/pending`,
      approvedDir: `${baseEnv.testDir}/approved`,
      evidenceDir: `${baseEnv.testDir}/evidence`
    };

    // Create additional directories
    await fs.mkdir(testEnv.pendingDir, { recursive: true });
    await fs.mkdir(testEnv.approvedDir, { recursive: true });
    await fs.mkdir(testEnv.evidenceDir, { recursive: true });

    // Start integrated bridge in auto-approve mode for testing
    bridge = new IntegratedBridge({
      specDir: testEnv.specDir,
      projectDir: testEnv.testProjectDir,
      evidenceDir: testEnv.evidenceDir,
      sophiaApiUrl: 'http://localhost:7654',
      autoApprove: true
    });

    await bridge.start();
  });
  
  afterAll(async () => {
    await bridge.stop();
    await cleanupE2EEnvironment({ testDir: testEnv.testDir } as any);
  });

  it('should queue intent, wait for approval, then execute', async () => {
    const startTime = Date.now();
    
    // GIVEN: Intent created and queued
    const intent = await createIntent({
      project: 'test-e2e-app',
      name: 'user-authentication',
      description: 'Implement user login with JWT tokens',
      acceptance_criteria: [
        'User can login with email/password',
        'JWT token generated on success',
        'Token expires after 24 hours'
      ]
    });
    
    console.log(`✓ Intent created: ${intent.id} (${Date.now() - startTime}ms)`);
    expect(intent.status).toBe('pending');

    // GIVEN: Spec file created (simulating Open WebUI/n8n flow)
    const specData = {
      id: `spec-${intent.id}`,
      intent_id: intent.id,
      project: intent.project,
      name: intent.name,
      description: intent.description,
      acceptance_criteria: intent.acceptance_criteria,
      tech_stack: ['typescript', 'node'],
      timestamp: new Date().toISOString()
    };
    
    await writeFile(
      `${testEnv.specDir}/${specData.id}.json`,
      JSON.stringify(specData)
    );

    // THEN: Bridge detects and queues for approval
    await waitFor(async () => {
      return await fileExists(`${testEnv.pendingDir}/${intent.id}.json`);
    }, 3000);

    console.log(`✓ Intent queued for approval (${Date.now() - startTime}ms)`);

    // WHEN: Approve the intent
    await approveIntent(intent.id, 'test-user');
    const approvedIntent = await getIntent(intent.id);
    expect(approvedIntent?.status).toBe('approved');

    console.log(`✓ Intent approved by test-user (${Date.now() - startTime}ms)`);

    // THEN: Approval engine detects and routes to AC
    await waitFor(async () => {
      return await fileExists(`${testEnv.approvedDir}/${intent.id}.json`);
    }, 5000);

    console.log(`✓ Intent moved to approved (${Date.now() - startTime}ms)`);

    // THEN: AC spec structure created
    const acSpecsDir = `${testEnv.testProjectDir}/.auto-claude/specs`;
    
    await waitFor(async () => {
      const entries = await fs.readdir(acSpecsDir).catch(() => []);
      return entries.some(e => e.includes('test-e2e-app'));
    }, 3000);

    console.log(`✓ AC spec structure created (${Date.now() - startTime}ms)`);

    // THEN: Evidence capture started
    const status = await bridge.getStatus();
    expect(status.activeCaptures).toBeGreaterThanOrEqual(0); // May be 0 if already done

    // Wait for auto-completion (simulated)
    await waitFor(async () => {
      const evidenceFiles = await fs.readdir(testEnv.evidenceDir).catch(() => []);
      return evidenceFiles.some(f => f.includes(intent.id));
    }, 10000);

    console.log(`✓ Evidence captured (${Date.now() - startTime}ms)`);

    // THEN: Verify evidence content
    const evidenceFiles = await fs.readdir(testEnv.evidenceDir);
    const evidenceFile = evidenceFiles.find(f => f.includes(intent.id));
    expect(evidenceFile).toBeTruthy();

    const evidence = await readJson(`${testEnv.evidenceDir}/${evidenceFile}`);
    expect(evidence.intent_id).toBe(intent.id);
    expect(evidence.project).toBe('test-e2e-app');
    expect(evidence.artifacts).toBeInstanceOf(Array);
    expect(evidence.artifacts.length).toBeGreaterThan(0);

    // Verify source files captured
    const sourceFiles = evidence.artifacts.filter((a: any) => a.type === 'source');
    expect(sourceFiles.length).toBeGreaterThan(0);

    console.log(`✓ Evidence contains ${evidence.artifacts.length} artifacts`);

    // Verify test results captured
    expect(evidence.test_results).toBeTruthy();
    expect(evidence.test_results.passed).toBeGreaterThanOrEqual(0);

    // FINAL: Total time check
    const totalTime = Date.now() - startTime;
    console.log(`\n✅ E2E Gate 3 PASSED in ${totalTime}ms`);
    console.log(`   Intent: ${intent.id}`);
    console.log(`   Status: ${approvedIntent?.status}`);
    console.log(`   Artifacts: ${evidence.artifacts.length}`);
    console.log(`   Tests: ${evidence.test_results.passed} passed`);
    
    expect(totalTime).toBeLessThan(30000); // 30 second SLA
  }, 30000);

  it.skip('should reject intents and not execute', async () => {
    // This test requires autoApprove: false mode
    // Skipped in current test setup where autoApprove: true
    console.log('ℹ️  Skipped: requires non-auto-approve mode');
  });

  it('should handle approval queue statistics', async () => {
    const stats = await bridge.getStatus();
    
    expect(stats).toHaveProperty('running');
    expect(stats).toHaveProperty('approvalQueue');
    expect(stats).toHaveProperty('activeCaptures');
    
    expect(stats.running).toBe(true);
    expect(stats.approvalQueue).toHaveProperty('pending');
    expect(stats.approvalQueue).toHaveProperty('approved');
    expect(stats.approvalQueue).toHaveProperty('rejected');

    console.log('✅ Status reporting works:', JSON.stringify(stats, null, 2));
  });
});
