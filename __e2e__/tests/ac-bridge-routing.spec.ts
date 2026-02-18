/**
 * E2E Test: Phase 2 - Auto-Claude Bridge Routing
 * 
 * Tests: Spec detection → AC routing → Notification
 * Must pass before proceeding to Phase 3
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { promises as fs } from 'fs';
import { 
  setupE2EEnvironment, 
  cleanupE2EEnvironment,
  waitFor,
  fileExists,
  readJson,
  readFile,
  writeFile
} from '../helpers/test-setup';
import { readBridgeLog, startBridgeService, stopBridgeService } from '../helpers/bridge-client';
import { getNotificationLog } from '../helpers/notification-client';

describe('E2E Gate 2: Auto-Claude Bridge Routing', () => {
  let testEnv: TestEnvironment;
  let bridgeProcess: any;
  
  beforeAll(async () => {
    testEnv = await setupE2EEnvironment();
    
    // Start bridge service
    bridgeProcess = await startBridgeService({
      specDir: testEnv.specDir,
      projectDir: testEnv.testProjectDir
    });
  });
  
  afterAll(async () => {
    await stopBridgeService(bridgeProcess);
    await cleanupE2EEnvironment(testEnv);
  });

  it('should detect spec and route to AC project directory', async () => {
    // GIVEN: Test project with AC structure
    const testProjectDir = testEnv.testProjectDir;
    const specId = `spec-test-${Date.now()}`;
    
    // GIVEN: Spec created in inbox
    const spec = {
      id: specId,
      intent_id: `int-${Date.now()}`,
      project: 'test-react-app',
      name: 'todo-list-feature',
      description: 'Build a React todo list with TypeScript',
      acceptance_criteria: [
        'Add new todos',
        'Mark todos complete',
        'Delete todos'
      ],
      tech_stack: ['react', 'typescript'],
      timestamp: new Date().toISOString(),
      source: 'e2e-test'
    };
    
    // WHEN: Spec dropped in inbox
    const specPath = `${testEnv.specDir}/${specId}.json`;
    await writeFile(specPath, JSON.stringify(spec, null, 2));
    
    const startTime = Date.now();
    
    // THEN: Bridge detects within 5 seconds
    await waitFor(() => {
      const log = readBridgeLog(testEnv.specDir.replace('/specs', '/bridge.log'));
      return log.includes(`New spec detected: ${specId}`);
    }, 5000);
    
    const detectionTime = Date.now() - startTime;
    console.log(`✓ Spec detected in ${detectionTime}ms`);
    expect(detectionTime).toBeLessThan(5000);
    
    // THEN: AC-compatible structure created
    const acSpecDir = `${testProjectDir}/.auto-claude/specs/001-test-react-app`;
    
    await waitFor(() => fileExists(acSpecDir), 3000);
    console.log('✓ AC spec directory created');
    
    // Verify required files
    expect(await fileExists(`${acSpecDir}/requirements.json`)).toBe(true);
    expect(await fileExists(`${acSpecDir}/spec.md`)).toBe(true);
    expect(await fileExists(`${acSpecDir}/implementation_plan.json`)).toBe(true);
    expect(await fileExists(`${acSpecDir}/IMPORT_INSTRUCTIONS.txt`)).toBe(true);
    expect(await fileExists(`${acSpecDir}/source-spec.json`)).toBe(true);
    
    console.log('✓ All AC spec files created');
    
    // THEN: requirements.json is valid
    const requirements = await readJson(`${acSpecDir}/requirements.json`);
    expect(requirements).toMatchObject({
      task_description: expect.stringContaining('React todo list'),
      workflow_type: 'feature',
      services_involved: expect.any(Array)
    });
    
    // THEN: spec.md is valid
    const specMd = await readFile(`${acSpecDir}/spec.md`);
    expect(specMd).toContain('# test-react-app');
    expect(specMd).toContain('React todo list');
    
    // THEN: implementation_plan.json is valid
    const plan = await readJson(`${acSpecDir}/implementation_plan.json`);
    expect(plan).toHaveProperty('phases');
    expect(plan.phases).toBeInstanceOf(Array);
    expect(plan.phases.length).toBeGreaterThan(0);
    
    // THEN: IMPORT_INSTRUCTIONS.txt is helpful
    const instructions = await readFile(`${acSpecDir}/IMPORT_INSTRUCTIONS.txt`);
    expect(instructions).toContain('SPEC IMPORTED');
    expect(instructions).toContain(specId);
    expect(instructions).toContain('Auto-Claude');
    
    // THEN: Original spec moved to processed
    expect(await fileExists(specPath)).toBe(false);
    expect(await fileExists(`${testEnv.processedDir}/${specId}.json`)).toBe(true);
    
    console.log('✓ Original spec moved to processed/');
    
    // THEN: Notification logged (desktop notification is optional)
    try {
      const notificationLog = await waitFor(() => getNotificationLog(), 2000);
      if (notificationLog.includes('Spec Ready for Auto-Claude')) {
        console.log('✓ Desktop notification sent');
      }
    } catch {
      console.log('ℹ Desktop notification skipped (notifier not available)');
    }
    
    // FINAL: Total time check
    const totalTime = Date.now() - startTime;
    console.log(`\n✅ E2E Gate 2 PASSED in ${totalTime}ms`);
    console.log(`   Spec: ${specId}`);
    console.log(`   Detection: ${detectionTime}ms`);
    console.log(`   AC Directory: ${acSpecDir}`);
    console.log(`   Files: requirements.json ✓ | spec.md ✓ | plan.json ✓ | instructions.txt ✓`);
    
    expect(totalTime).toBeLessThan(20000); // 20 second SLA
    
  }, 20000);

  it('should handle multiple specs in parallel', async () => {
    const baseTime = Date.now();
    const specs = [
      { project: 'app-a', name: 'feature-1' },
      { project: 'app-b', name: 'feature-2' },
      { project: 'app-c', name: 'feature-3' }
    ];
    const specIds: string[] = [];
    
    // Create all specs simultaneously
    await Promise.all(specs.map(async (spec, i) => {
      const specId = `spec-parallel-${baseTime}-${i}`;
      specIds.push(specId);
      const specData = {
        id: specId,
        intent_id: `int-${baseTime}-${i}`,
        project: spec.project,
        name: spec.name,
        description: `Test feature for ${spec.project}`,
        acceptance_criteria: ['Test criterion'],
        timestamp: new Date().toISOString()
      };
      
      await writeFile(
        `${testEnv.specDir}/${specId}.json`,
        JSON.stringify(specData)
      );
    }));
    
    // Wait for all to be processed
    const logPath = testEnv.specDir.replace('/specs', '/bridge.log');
    await waitFor(async () => {
      const log = readBridgeLog(logPath);
      return specIds.every(id => log.includes(id));
    }, 10000);
    
    // Verify all AC directories created (spec numbers may vary due to shared counter)
    for (const spec of specs) {
      // Look for any directory matching the project name
      const acSpecsDir = `${testEnv.testProjectDir}/.auto-claude/specs`;
      const entries = await fs.readdir(acSpecsDir).catch(() => []);
      const found = entries.some(e => e.includes(spec.project));
      expect(found).toBe(true);
    }
    
    console.log('✅ Parallel spec processing works');
  }, 15000);

  it('should handle invalid specs gracefully', async () => {
    const logPath = testEnv.specDir.replace('/specs', '/bridge.log');
    
    // Create invalid JSON spec
    const invalidSpecPath = `${testEnv.specDir}/invalid-spec.json`;
    await writeFile(invalidSpecPath, '{ invalid json }');
    
    // Wait for processing
    await waitFor(() => {
      const log = readBridgeLog(logPath);
      return log.includes('Error processing') || log.includes('invalid-spec');
    }, 5000);
    
    // Check error was logged but service continued
    const log = readBridgeLog(logPath);
    expect(log).toContain('invalid-spec');
    
    // Verify bridge is still running (can process another spec)
    const validSpec = {
      id: `spec-valid-${Date.now()}`,
      intent_id: `int-${Date.now()}`,
      project: 'valid-project',
      name: 'valid-feature',
      description: 'Valid feature',
      acceptance_criteria: ['Works'],
      timestamp: new Date().toISOString()
    };
    
    await writeFile(
      `${testEnv.specDir}/valid-spec.json`,
      JSON.stringify(validSpec)
    );
    
    await waitFor(() => {
      const log = readBridgeLog(logPath);
      return log.includes('valid-spec');
    }, 5000);
    
    console.log('✅ Graceful error handling works');
  }, 15000);
});
