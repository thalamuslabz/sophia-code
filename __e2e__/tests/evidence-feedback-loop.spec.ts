/**
 * E2E Test: Phase 4 - Evidence Vault → Obsidian Feedback Loop
 * 
 * Tests: Evidence capture → Obsidian sync → Project index update
 * Final gate - validates complete system loop
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { promises as fs } from 'fs';
import * as path from 'path';
import { 
  setupE2EEnvironment, 
  cleanupE2EEnvironment,
  waitFor,
  fileExists,
  readFile,
  readJson
} from '../helpers/test-setup';
import { IntegratedBridge } from '../helpers/integrated-bridge';
import { EvidenceVault } from '../helpers/evidence-vault';
import { createIntent } from '../helpers/dashboard-client';
import { writeFile } from '../helpers/test-setup';

interface TestEnv {
  testDir: string;
  specDir: string;
  projectDir: string;
  evidenceDir: string;
  obsidianDir: string;
}

describe('E2E Gate 4: Evidence → Obsidian Feedback Loop', () => {
  let testEnv: TestEnv;
  let bridge: IntegratedBridge;
  let vault: EvidenceVault;
  
  beforeAll(async () => {
    // Setup environment
    const baseEnv = await setupE2EEnvironment();
    
    testEnv = {
      testDir: baseEnv.testDir,
      specDir: baseEnv.specDir,
      projectDir: baseEnv.testProjectDir,
      evidenceDir: `${baseEnv.testDir}/evidence`,
      obsidianDir: `${baseEnv.testDir}/obsidian`
    };

    // Create directories
    await fs.mkdir(testEnv.evidenceDir, { recursive: true });
    await fs.mkdir(testEnv.obsidianDir, { recursive: true });
    await fs.mkdir(`${testEnv.obsidianDir}/06-PROJECTS`, { recursive: true });

    // Start integrated bridge
    bridge = new IntegratedBridge({
      specDir: testEnv.specDir,
      projectDir: testEnv.projectDir,
      evidenceDir: testEnv.evidenceDir,
      sophiaApiUrl: 'http://localhost:7654',
      autoApprove: true
    });

    await bridge.start();

    // Start evidence vault
    vault = new EvidenceVault({
      evidenceDir: testEnv.evidenceDir,
      obsidianVaultDir: testEnv.obsidianDir,
      projectsSubdir: '06-PROJECTS'
    });

    await vault.start();
  });
  
  afterAll(async () => {
    await vault.stop();
    await bridge.stop();
    await cleanupE2EEnvironment({ testDir: testEnv.testDir } as any);
  });

  it('should capture evidence and sync to Obsidian', async () => {
    const startTime = Date.now();
    
    // GIVEN: Intent created
    const intent = await createIntent({
      project: 'sophia',
      name: 'dashboard-component',
      description: 'Create React dashboard component with charts',
      acceptance_criteria: [
        'Line chart component',
        'Bar chart component',
        'Data table with sorting'
      ]
    });
    
    console.log(`✓ Intent created: ${intent.id}`);

    // GIVEN: Spec file created
    const specData = {
      id: `spec-${intent.id}`,
      intent_id: intent.id,
      project: intent.project,
      name: intent.name,
      description: intent.description,
      acceptance_criteria: intent.acceptance_criteria,
      tech_stack: ['react', 'typescript'],
      timestamp: new Date().toISOString()
    };
    
    await writeFile(
      `${testEnv.specDir}/${specData.id}.json`,
      JSON.stringify(specData)
    );

    // THEN: Evidence is created (via auto-approve flow)
    await waitFor(async () => {
      return await fileExists(`${testEnv.evidenceDir}/${intent.id}.json`);
    }, 15000);

    console.log(`✓ Evidence created (${Date.now() - startTime}ms)`);

    // THEN: Evidence is synced to Obsidian
    const obsidianProjectDir = `${testEnv.obsidianDir}/06-PROJECTS/SOPHIA`;
    
    await waitFor(async () => {
      return await fileExists(`${obsidianProjectDir}/${intent.id}.md`);
    }, 5000);

    console.log(`✓ Obsidian note created (${Date.now() - startTime}ms)`);

    // THEN: Verify note content
    const noteContent = await readFile(`${obsidianProjectDir}/${intent.id}.md`);
    
    expect(noteContent).toContain(`# Evidence: sophia`);
    expect(noteContent).toContain(`**Intent ID**: ${intent.id}`);
    expect(noteContent).toContain('## Artifacts');
    expect(noteContent).toContain('## Test Results');
    expect(noteContent).toContain('[[Execution Log]]');
    expect(noteContent).toContain('[[sophia - Architecture]]');

    console.log(`✓ Obsidian note content validated`);

    // THEN: Project index is updated
    await waitFor(async () => {
      return await fileExists(`${obsidianProjectDir}/_Index.md`);
    }, 3000);

    const indexContent = await readFile(`${obsidianProjectDir}/_Index.md`);
    expect(indexContent).toContain(intent.id);
    expect(indexContent).toContain('Execution Index');

    console.log(`✓ Project index updated`);

    // THEN: Evidence stats show synced
    const stats = await vault.getStats();
    expect(stats.synced).toBeGreaterThan(0);

    console.log(`✓ Stats: ${stats.synced} synced, ${stats.pending} pending`);

    // FINAL: Verify complete flow
    const evidence = await readJson(`${testEnv.evidenceDir}/${intent.id}.json`);
    expect(evidence.intent_id).toBe(intent.id);
    expect(evidence.artifacts.length).toBeGreaterThan(0);

    const totalTime = Date.now() - startTime;
    console.log(`\n✅ E2E Gate 4 PASSED in ${totalTime}ms`);
    console.log(`   Intent: ${intent.id}`);
    console.log(`   Artifacts: ${evidence.artifacts.length}`);
    console.log(`   Obsidian: ${obsidianProjectDir}/${intent.id}.md`);
    console.log(`   Index: ${obsidianProjectDir}/_Index.md`);
    
    expect(totalTime).toBeLessThan(30000);
  }, 30000);

  it('should handle multiple evidence files', async () => {
    // Create intents sequentially to avoid race conditions
    const intents = [];
    for (let i = 1; i <= 2; i++) {
      const intent = await createIntent({
        project: 'sophia',
        name: `feature-${i}`,
        description: `Feature ${i}`,
        acceptance_criteria: ['Works']
      });
      intents.push(intent);

      const specData = {
        id: `spec-${intent.id}`,
        intent_id: intent.id,
        project: intent.project,
        name: intent.name,
        description: intent.description,
        acceptance_criteria: intent.acceptance_criteria,
        timestamp: new Date().toISOString()
      };
      
      await writeFile(
        `${testEnv.specDir}/${specData.id}.json`,
        JSON.stringify(specData)
      );

      // Wait for this evidence to be created before starting next
      await waitFor(async () => {
        return await fileExists(`${testEnv.evidenceDir}/${intent.id}.json`);
      }, 15000);
    }

    // Wait for both obsidian notes
    const obsidianProjectDir = `${testEnv.obsidianDir}/06-PROJECTS/SOPHIA`;
    await waitFor(async () => {
      const hasIntent1 = await fileExists(`${obsidianProjectDir}/${intents[0].id}.md`);
      const hasIntent2 = await fileExists(`${obsidianProjectDir}/${intents[1].id}.md`);
      return hasIntent1 && hasIntent2;
    }, 5000);

    // Verify index contains both
    const indexContent = await readFile(`${obsidianProjectDir}/_Index.md`);
    expect(indexContent).toContain(intents[0].id);
    expect(indexContent).toContain(intents[1].id);

    console.log('✅ Multiple evidence sync works');
  }, 40000);

  it('should classify artifacts correctly', async () => {
    // Create test evidence with different artifact types
    const testEvidence = {
      id: `evidence-test-${Date.now()}`,
      intent_id: `INTENT-TEST-${Date.now()}`,
      spec_id: 'spec-test',
      project: 'sophia',
      timestamp: new Date().toISOString(),
      artifacts: [
        { type: 'source', path: 'src/index.ts', size: 1024, checksum: 'abc123' },
        { type: 'test', path: 'src/index.test.ts', size: 512, checksum: 'def456' },
        { type: 'config', path: 'package.json', size: 256, checksum: 'ghi789' },
        { type: 'doc', path: 'README.md', size: 128, checksum: 'jkl012' }
      ],
      test_results: {
        passed: 5,
        failed: 0,
        skipped: 1,
        duration_ms: 1234,
        output: 'Tests passed'
      }
    };

    await writeFile(
      `${testEnv.evidenceDir}/${testEvidence.intent_id}.json`,
      JSON.stringify(testEvidence)
    );

    // Wait for sync
    const obsidianProjectDir = `${testEnv.obsidianDir}/06-PROJECTS/SOPHIA`;
    await waitFor(async () => {
      return await fileExists(`${obsidianProjectDir}/${testEvidence.intent_id}.md`);
    }, 5000);

    // Verify classification in note
    const noteContent = await readFile(`${obsidianProjectDir}/${testEvidence.intent_id}.md`);
    
    expect(noteContent).toContain('### Source Files');
    expect(noteContent).toContain('### Test Files');
    expect(noteContent).toContain('### Config Files');
    expect(noteContent).toContain('### Doc Files');
    expect(noteContent).toContain('Passed**: 5 ✅');

    console.log('✅ Artifact classification works');
  }, 10000);
});
