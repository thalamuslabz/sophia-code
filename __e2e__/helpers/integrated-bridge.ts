/**
 * Integrated Bridge - Combines spec routing, approval, and evidence capture
 * 
 * Flow:
 * 1. Spec detected in inbox
 * 2. Queue for approval (pending/)
 * 3. Poll for approval from Sophia API
 * 4. Once approved, route to Auto-Claude
 * 5. Start evidence capture
 * 6. Monitor execution
 * 7. Finalize evidence on completion
 */

import { watch, FSWatcher } from 'chokidar';
import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync, mkdirSync } from 'fs';
import { ApprovalEngine } from './approval-engine';
import { EvidenceCapture } from './evidence-capture';

interface IntegratedBridgeConfig {
  specDir: string;
  projectDir: string;
  evidenceDir?: string;
  sophiaApiUrl: string;
  autoApprove?: boolean;
}

export class IntegratedBridge {
  private config: IntegratedBridgeConfig;
  private approvalEngine: ApprovalEngine;
  private evidenceCapture: EvidenceCapture;
  private watcher: FSWatcher | null = null;
  private running: boolean = false;

  constructor(config: Partial<IntegratedBridgeConfig> = {}) {
    const home = process.env.HOME || '/tmp';
    
    this.config = {
      specDir: config.specDir || path.join(home, '.auto-claude', 'specs'),
      projectDir: config.projectDir || path.join(home, 'code', 'ac-projects'),
      sophiaApiUrl: config.sophiaApiUrl || 'http://localhost:7654',
      autoApprove: config.autoApprove || false
    };

    this.approvalEngine = new ApprovalEngine({
      pendingDir: path.join(this.config.specDir, '..', 'pending'),
      approvedDir: path.join(this.config.specDir, '..', 'approved'),
      sophiaApiUrl: this.config.sophiaApiUrl
    });

    this.evidenceCapture = new EvidenceCapture({
      acOutputDir: this.config.projectDir,
      evidenceDir: config.evidenceDir,
      sophiaApiUrl: this.config.sophiaApiUrl
    });

    // Set up approval callback
    this.approvalEngine.onIntentApproved((intent, specPath) => {
      this.handleApprovedIntent(intent, specPath);
    });
  }

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;

    console.log('[IntegratedBridge] Starting...');
    
    // Ensure directories exist
    this.ensureDirs();
    
    // Start approval engine polling
    this.approvalEngine.start();

    // Start watching spec directory
    this.watcher = watch(this.config.specDir, {
      persistent: true,
      ignoreInitial: false,
      awaitWriteFinish: { stabilityThreshold: 500 }
    });

    this.watcher.on('add', (filePath: string) => this.handleNewSpec(filePath));
    this.watcher.on('error', (error: Error) => console.error('[IntegratedBridge] Watcher error:', error));

    console.log('[IntegratedBridge] Ready');
    console.log('  Flow: Spec → Pending → Approval → AC → Evidence');
    
    if (this.config.autoApprove) {
      console.log('  Mode: AUTO-APPROVE (for testing)');
    }
  }

  async stop(): Promise<void> {
    this.running = false;
    
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
    
    this.approvalEngine.stop();
    
    // Stop all evidence capture
    for (const intentId of Array.from(this.evidenceCapture['activeCaptures']?.keys?.() || [])) {
      await this.evidenceCapture.stopCapture(intentId);
    }

    console.log('[IntegratedBridge] Stopped');
  }

  /**
   * Get system status
   */
  async getStatus(): Promise<{
    running: boolean;
    approvalQueue: { pending: number; approved: number; rejected: number };
    activeCaptures: number;
  }> {
    const approvalStats = await this.approvalEngine.getStats();
    const activeCaptures = this.evidenceCapture['activeCaptures']?.size || 0;

    return {
      running: this.running,
      approvalQueue: approvalStats,
      activeCaptures
    };
  }

  /**
   * Manually approve an intent
   */
  async approveIntent(intentId: string, approvedBy: string): Promise<void> {
    await this.approvalEngine.approveIntent(intentId, approvedBy);
  }

  /**
   * Manually trigger evidence finalization
   */
  async finalizeEvidence(intentId: string): Promise<any> {
    await this.evidenceCapture.captureArtifacts(intentId);
    return await this.evidenceCapture.stopCapture(intentId);
  }

  private ensureDirs(): void {
    const dirs = [
      this.config.specDir,
      this.config.projectDir,
      path.join(this.config.specDir, '..', 'pending'),
      path.join(this.config.specDir, '..', 'approved'),
      path.join(this.config.specDir, '..', 'processed')
    ];

    for (const dir of dirs) {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    }
  }

  private async handleNewSpec(filePath: string): Promise<void> {
    const filename = path.basename(filePath);
    
    if (!filename.endsWith('.json')) return;

    console.log(`[IntegratedBridge] New spec detected: ${filename}`);

    try {
      // Read and parse spec
      const content = await fs.readFile(filePath, 'utf-8');
      const spec = JSON.parse(content);

      // Validate required fields
      if (!spec.project || !spec.name || !spec.description) {
        throw new Error(`Invalid spec: missing required fields`);
      }

      // Create intent object
      const intent = {
        id: spec.intent_id || `intent-${Date.now()}`,
        project: spec.project,
        name: spec.name,
        description: spec.description,
        acceptance_criteria: spec.acceptance_criteria || [],
        status: 'pending' as const,
        created_at: new Date().toISOString()
      };

      // Queue for approval
      await this.approvalEngine.queueForApproval(intent, spec);

      // Move original to processed
      const processedDir = path.join(this.config.specDir, '..', 'processed');
      await fs.rename(filePath, path.join(processedDir, filename));

      console.log(`[IntegratedBridge] Intent ${intent.id} queued for approval`);

      // If auto-approve mode, approve immediately
      if (this.config.autoApprove) {
        setTimeout(async () => {
          await this.approvalEngine.approveIntent(intent.id, 'auto-approver');
        }, 100);
      }

    } catch (error) {
      console.error(`[IntegratedBridge] Error processing ${filename}:`, error);
      
      // Move to error directory
      const errorDir = path.join(this.config.specDir, '..', 'errors');
      if (!existsSync(errorDir)) mkdirSync(errorDir, { recursive: true });
      
      try {
        await fs.rename(filePath, path.join(errorDir, filename));
      } catch {
        // Ignore
      }
    }
  }

  private async handleApprovedIntent(intent: any, specPath: string): Promise<void> {
    console.log(`[IntegratedBridge] Intent approved: ${intent.id}`);
    
    // Read the approved spec
    const content = await fs.readFile(specPath, 'utf-8');
    const approvedSpec = JSON.parse(content);

    // Route to Auto-Claude
    await this.routeToAutoClaude(approvedSpec);

    // Start evidence capture
    await this.evidenceCapture.startCapture(
      intent.id,
      approvedSpec.spec?.id || 'unknown',
      intent.project
    );

    // If auto-approve mode, simulate completion after delay
    if (this.config.autoApprove) {
      setTimeout(async () => {
        await this.simulateCompletion(intent.id);
      }, 5000);
    }
  }

  private async routeToAutoClaude(approvedSpec: any): Promise<void> {
    const { spec, intent } = approvedSpec;
    
    const specDirName = `AC-${Date.now().toString().slice(-6)}-${intent.project}`;
    const acSpecDir = path.join(
      this.config.projectDir,
      '.auto-claude',
      'specs',
      specDirName
    );

    // Create directory
    if (!existsSync(acSpecDir)) {
      mkdirSync(acSpecDir, { recursive: true });
    }

    // Create AC-compatible files
    const requirements = {
      task_description: intent.description,
      workflow_type: 'feature',
      services_involved: this.inferServices(spec?.tech_stack),
      output_path: path.join(this.config.projectDir, intent.project.replace(/\s+/g, '-').toLowerCase()),
      specific_requirements: (intent.acceptance_criteria || []).map((ac: string) => ({
        requirement: ac,
        priority: 'medium'
      }))
    };

    await fs.writeFile(
      path.join(acSpecDir, 'requirements.json'),
      JSON.stringify(requirements, null, 2)
    );

    // Create spec.md
    const specMd = this.generateSpecMd(intent, spec);
    await fs.writeFile(path.join(acSpecDir, 'spec.md'), specMd);

    // Create implementation plan
    const plan = {
      project: intent.project,
      spec_name: intent.name,
      phases: [
        { phase: 1, name: 'Setup', tasks: ['Initialize project'] },
        { phase: 2, name: 'Implementation', tasks: intent.acceptance_criteria || [] },
        { phase: 3, name: 'Verification', tasks: ['Run tests'] }
      ]
    };
    await fs.writeFile(
      path.join(acSpecDir, 'implementation_plan.json'),
      JSON.stringify(plan, null, 2)
    );

    // Create IMPORT_INSTRUCTIONS.txt
    const instructions = `==================================
  APPROVED SPEC - READY FOR AC
==================================

Spec: ${intent.name}
Project: ${intent.project}
Intent ID: ${intent.id}
Approved By: ${intent.approved_by}
Approved At: ${intent.approved_at}

AC Directory: ${acSpecDir}
`;
    await fs.writeFile(path.join(acSpecDir, 'IMPORT_INSTRUCTIONS.txt'), instructions);

    // Save source spec
    await fs.writeFile(
      path.join(acSpecDir, 'source-spec.json'),
      JSON.stringify(approvedSpec, null, 2)
    );

    console.log(`[IntegratedBridge] Routed to AC: ${acSpecDir}`);
  }

  private async simulateCompletion(intentId: string): Promise<void> {
    console.log(`[IntegratedBridge] Simulating completion for ${intentId}`);
    
    // Get evidence
    const evidence = this.evidenceCapture['activeCaptures']?.get(intentId);
    if (evidence) {
      const outputDir = path.join(
        this.config.projectDir,
        evidence.project.replace(/\s+/g, '-').toLowerCase()
      );

      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }

      // Create mock source file
      await fs.writeFile(
        path.join(outputDir, 'index.ts'),
        `// Generated by Auto-Claude for ${evidence.project}\nexport function main() { return 'Hello World'; }`
      );

      // Create mock test file
      await fs.writeFile(
        path.join(outputDir, 'index.test.ts'),
        `// Tests for ${evidence.project}\nimport { main } from './index';\ntest('main', () => expect(main()).toBe('Hello World'));`
      );

      // Create test results
      await fs.writeFile(
        path.join(outputDir, 'test-results.json'),
        JSON.stringify({ passed: 1, failed: 0, skipped: 0, duration: 100 })
      );
    }

    // Finalize evidence
    await this.finalizeEvidence(intentId);
    console.log(`[IntegratedBridge] Evidence finalized for ${intentId}`);
  }

  private inferServices(techStack?: string[]): string[] {
    if (!techStack) return ['app'];
    
    const services: string[] = [];
    if (techStack.includes('react') || techStack.includes('vue')) services.push('frontend');
    if (techStack.includes('node') || techStack.includes('python')) services.push('backend');
    if (services.length === 0) services.push('app');
    return services;
  }

  private generateSpecMd(intent: any, spec: any): string {
    return `# ${intent.project} - ${intent.name}

## Description
${intent.description}

## Acceptance Criteria
${(intent.acceptance_criteria || []).map((ac: string) => `- [ ] ${ac}`).join('\n')}

## Metadata
- **Intent ID**: ${intent.id}
- **Approved By**: ${intent.approved_by}
- **Approved At**: ${intent.approved_at}
`;
  }
}
