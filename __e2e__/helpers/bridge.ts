/**
 * Auto-Claude Bridge - Spec Router
 * 
 * Watches ~/.auto-claude/specs/ and routes to AC project directories
 */

import { watch, FSWatcher } from 'chokidar';
import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
// Optional notification support - loaded lazily
let notifierModule: any = null;

async function getNotifier(): Promise<Function | null> {
  if (notifierModule) return notifierModule;
  try {
    const mod = await import('node-notifier');
    notifierModule = mod.default?.notify?.bind(mod.default);
    return notifierModule;
  } catch {
    return null;
  }
}

interface Spec {
  id: string;
  intent_id: string;
  project: string;
  name: string;
  description: string;
  acceptance_criteria: string[];
  architecture_decisions?: string[];
  tech_stack?: string[];
  priority?: 'low' | 'medium' | 'high';
  timestamp: string;
  source: string;
}

interface BridgeConfig {
  specDir: string;
  projectDir: string;
  processedDir: string;
  errorDir: string;
  logFile: string;
}

export class AutoClaudeBridge {
  private watcher: FSWatcher | null = null;
  private config: BridgeConfig;
  private specCounter: number = 0;

  constructor(config: Partial<BridgeConfig> = {}) {
    const home = process.env.HOME || process.env.USERPROFILE || '/tmp';
    this.config = {
      specDir: config.specDir || process.env.AC_SPEC_DIR || path.join(home, '.auto-claude', 'specs'),
      projectDir: config.projectDir || process.env.AC_PROJECT_DIR || path.join(home, 'code', 'ac-projects'),
      processedDir: config.processedDir || process.env.AC_PROCESSED_DIR || path.join(home, '.auto-claude', 'processed'),
      errorDir: config.errorDir || process.env.AC_ERROR_DIR || path.join(home, '.auto-claude', 'errors'),
      logFile: config.logFile || process.env.AC_LOG_FILE || path.join(home, '.auto-claude', 'bridge.log')
    };
  }

  async start(): Promise<void> {
    // Ensure directories exist
    await this.ensureDirs();
    
    // Load counter from existing AC specs
    await this.loadCounter();
    
    // Start watching
    this.watcher = watch(this.config.specDir, {
      persistent: true,
      ignoreInitial: false,
      awaitWriteFinish: { stabilityThreshold: 500 }
    });

    this.watcher.on('add', (filePath: string) => this.handleNewSpec(filePath));
    this.watcher.on('error', (error: Error) => this.log('ERROR', `Watcher error: ${error.message}`));

    this.log('INFO', `Bridge started, watching: ${this.config.specDir}`);
  }

  async stop(): Promise<void> {
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
    this.log('INFO', 'Bridge stopped');
  }

  private async ensureDirs(): Promise<void> {
    const dirs = [
      this.config.specDir,
      this.config.projectDir,
      this.config.processedDir,
      this.config.errorDir,
      path.dirname(this.config.logFile)
    ];

    for (const dir of dirs) {
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    }
  }

  private async loadCounter(): Promise<void> {
    const acSpecsDir = path.join(this.config.projectDir, '.auto-claude', 'specs');
    if (!existsSync(acSpecsDir)) {
      this.specCounter = 0;
      return;
    }

    try {
      const entries = await fs.readdir(acSpecsDir);
      const maxNum = entries
        .filter(e => /^\d{3}-/.test(e))
        .map(e => parseInt(e.split('-')[0], 10))
        .reduce((max, n) => Math.max(max, n), 0);
      this.specCounter = maxNum;
    } catch {
      this.specCounter = 0;
    }
  }

  private async handleNewSpec(filePath: string): Promise<void> {
    const filename = path.basename(filePath);
    
    // Only process .json files
    if (!filename.endsWith('.json')) return;

    this.log('INFO', `New spec detected: ${filename}`);

    try {
      // Read and parse spec
      const content = await fs.readFile(filePath, 'utf-8');
      const spec: Spec = JSON.parse(content);

      // Validate required fields
      if (!spec.project || !spec.name || !spec.description) {
        throw new Error(`Invalid spec: missing required fields in ${filename}`);
      }

      // Create AC-compatible structure
      await this.createACSpec(spec);

      // Send notification
      await this.sendNotification(spec);

      // Move original to processed
      await fs.rename(filePath, path.join(this.config.processedDir, filename));
      this.log('INFO', `Spec ${spec.id} routed and processed`);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.log('ERROR', `Error processing ${filename}: ${message}`);
      
      // Move to error directory
      try {
        await fs.rename(filePath, path.join(this.config.errorDir, filename));
      } catch {
        // Ignore rename errors
      }
    }
  }

  private async createACSpec(spec: Spec): Promise<void> {
    // Increment counter and create directory name
    this.specCounter++;
    const specNum = this.specCounter.toString().padStart(3, '0');
    const specDirName = `${specNum}-${spec.project}`;
    
    const acSpecDir = path.join(
      this.config.projectDir,
      '.auto-claude',
      'specs',
      specDirName
    );

    // Create directory
    mkdirSync(acSpecDir, { recursive: true });

    // Create requirements.json (AC format)
    const requirements = {
      task_description: spec.description,
      workflow_type: this.inferWorkflowType(spec),
      services_involved: this.inferServices(spec),
      output_path: path.join(this.config.projectDir, spec.project.replace(/\s+/g, '-').toLowerCase()),
      specific_requirements: spec.acceptance_criteria.map((ac, i) => ({
        requirement: ac,
        priority: spec.priority || 'medium'
      }))
    };

    await fs.writeFile(
      path.join(acSpecDir, 'requirements.json'),
      JSON.stringify(requirements, null, 2)
    );

    // Create spec.md
    const specMd = this.generateSpecMd(spec);
    await fs.writeFile(path.join(acSpecDir, 'spec.md'), specMd);

    // Create implementation_plan.json
    const plan = this.generateImplementationPlan(spec);
    await fs.writeFile(
      path.join(acSpecDir, 'implementation_plan.json'),
      JSON.stringify(plan, null, 2)
    );

    // Create IMPORT_INSTRUCTIONS.txt
    const instructions = this.generateImportInstructions(spec, specDirName);
    await fs.writeFile(path.join(acSpecDir, 'IMPORT_INSTRUCTIONS.txt'), instructions);

    // Save source spec for reference
    await fs.writeFile(
      path.join(acSpecDir, 'source-spec.json'),
      JSON.stringify(spec, null, 2)
    );

    this.log('INFO', `Created AC spec at: ${acSpecDir}`);
  }

  private inferWorkflowType(spec: Spec): string {
    if (spec.tech_stack?.includes('docker') || spec.tech_stack?.includes('kubernetes')) {
      return 'deployment';
    }
    if (spec.tech_stack?.includes('test') || spec.name.toLowerCase().includes('test')) {
      return 'testing';
    }
    return 'feature';
  }

  private inferServices(spec: Spec): string[] {
    const services: string[] = [];
    if (spec.tech_stack?.includes('react')) services.push('frontend');
    if (spec.tech_stack?.includes('node') || spec.tech_stack?.includes('python')) services.push('backend');
    if (spec.tech_stack?.includes('postgres') || spec.tech_stack?.includes('mongo')) services.push('database');
    if (services.length === 0) services.push('app');
    return services;
  }

  private generateSpecMd(spec: Spec): string {
    const decisions = spec.architecture_decisions || [];
    const stack = spec.tech_stack || [];

    return `# ${spec.project} - ${spec.name}

## Description
${spec.description}

## Acceptance Criteria
${spec.acceptance_criteria.map(ac => `- [ ] ${ac}`).join('\n')}

${decisions.length > 0 ? `## Architecture Decisions
${decisions.map(d => `- ${d}`).join('\n')}` : ''}

${stack.length > 0 ? `## Tech Stack
${stack.map(s => `- ${s}`).join('\n')}` : ''}

## Metadata
- **Intent ID**: ${spec.intent_id}
- **Source**: ${spec.source}
- **Created**: ${spec.timestamp}
`;
  }

  private generateImplementationPlan(spec: Spec): object {
    const phases = [
      {
        phase: 1,
        name: 'Setup',
        description: 'Initialize project structure',
        tasks: ['Create directories', 'Set up package.json']
      },
      {
        phase: 2,
        name: 'Implementation',
        description: 'Build core features',
        tasks: spec.acceptance_criteria.map((ac, i) => `Implement: ${ac}`)
      },
      {
        phase: 3,
        name: 'Verification',
        description: 'Test and validate',
        tasks: ['Run tests', 'Verify acceptance criteria']
      }
    ];

    return {
      project: spec.project,
      spec_name: spec.name,
      phases,
      estimated_duration: `${spec.acceptance_criteria.length * 30} minutes`
    };
  }

  private generateImportInstructions(spec: Spec, specDirName: string): string {
    return `==================================
  SPEC IMPORTED TO AUTO-CLAUDE
==================================

Spec: ${spec.name}
Project: ${spec.project}
Intent ID: ${spec.intent_id}

IMPORT STEPS:
1. Open Auto-Claude application
2. Go to File → Import Spec
3. Select: ${specDirName}
4. Review and confirm

OR use command line:
  ac import ${specDirName}

FILES CREATED:
- requirements.json (AC format)
- spec.md (readable spec)
- implementation_plan.json (execution plan)
- source-spec.json (original)

Original spec ID: ${spec.id}
Imported at: ${new Date().toISOString()}
`;
  }

  private async sendNotification(spec: Spec): Promise<void> {
    const notify = await getNotifier();
    if (!notify) {
      this.log('INFO', 'Notification skipped (notifier not available)');
      return;
    }
    try {
      notify({
        title: '🔒 Spec Ready for Auto-Claude',
        message: `${spec.project}: ${spec.name}`,
        timeout: 10,
        sound: true
      });
      this.log('INFO', 'Notification sent');
    } catch (error) {
      this.log('WARN', 'Failed to send notification');
    }
  }

  private log(level: string, message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${level}: ${message}\n`;
    
    // Console output
    console.log(`${level}: ${message}`);
    
    // File output
    try {
      writeFileSync(this.config.logFile, logEntry, { flag: 'a' });
    } catch {
      // Ignore write errors
    }
  }
}

// CLI entry point
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const bridge = new AutoClaudeBridge();
  
  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    await bridge.stop();
    process.exit(0);
  });

  bridge.start().catch(console.error);
}
