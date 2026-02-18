/**
 * Evidence Sync - Watches build evidence and syncs to Obsidian vault
 * 
 * Creates structured notes with:
 * - Execution metadata
 * - Artifact listings with checksums
 * - Test results
 * - Links to related notes
 */

import { watch, FSWatcher } from 'chokidar';
import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync, mkdirSync } from 'fs';

export interface Evidence {
  id: string;
  intent_id: string;
  spec_id: string;
  project: string;
  timestamp: string;
  status: 'success' | 'failure' | 'partial';
  artifacts: Artifact[];
  test_results?: TestResults;
  build_log?: string;
  git_commit?: string;
  duration_ms?: number;
  ai_agents?: string[];
}

export interface Artifact {
  type: 'source' | 'test' | 'config' | 'doc' | 'asset' | 'other';
  path: string;
  size: number;
  checksum: string;
  language?: string;
  description?: string;
}

export interface TestResults {
  passed: number;
  failed: number;
  skipped: number;
  duration_ms: number;
  output: string;
  coverage?: number;
}

export interface VaultConfig {
  evidenceDir: string;
  vaultDir: string;
  projectsSubdir: string;
  dailyNotesDir: string;
  templatesDir: string;
}

export class EvidenceSync {
  private config: VaultConfig;
  private watcher: FSWatcher | null = null;
  private running: boolean = false;

  constructor(config: Partial<VaultConfig> = {}) {
    const home = process.env.HOME || process.env.USERPROFILE || '/tmp';
    this.config = {
      evidenceDir: config.evidenceDir || path.join(home, '.auto-claude', 'evidence'),
      vaultDir: config.vaultDir || this.detectVaultDir(),
      projectsSubdir: config.projectsSubdir || '06-PROJECTS',
      dailyNotesDir: config.dailyNotesDir || 'Daily Notes',
      templatesDir: config.templatesDir || '_templates'
    };
  }

  private detectVaultDir(): string {
    const home = process.env.HOME || process.env.USERPROFILE || '/tmp';
    const commonPaths = [
      path.join(home, 'Documents', 'Obsidian Vault'),
      path.join(home, 'Documents', 'Vault'),
      path.join(home, 'Obsidian Vault'),
      path.join(home, 'vault')
    ];

    for (const vaultPath of commonPaths) {
      if (existsSync(path.join(vaultPath, '.obsidian'))) {
        return vaultPath;
      }
    }

    // Default fallback
    return path.join(home, 'Documents', 'Obsidian Vault');
  }

  async start(): Promise<void> {
    if (this.running) return;
    this.running = true;

    console.log('[EvidenceSync] Starting...');
    console.log(`[EvidenceSync] Vault: ${this.config.vaultDir}`);
    
    // Ensure directories exist
    if (!existsSync(this.config.evidenceDir)) {
      mkdirSync(this.config.evidenceDir, { recursive: true });
    }

    // Start watching
    this.watcher = watch(this.config.evidenceDir, {
      persistent: true,
      ignoreInitial: false,
      awaitWriteFinish: { stabilityThreshold: 1000 }
    });

    this.watcher.on('add', (filePath: string) => this.handleEvidence(filePath));
    this.watcher.on('change', (filePath: string) => this.handleEvidence(filePath));

    console.log(`[EvidenceSync] Watching: ${this.config.evidenceDir}`);
  }

  async stop(): Promise<void> {
    this.running = false;
    if (this.watcher) {
      await this.watcher.close();
      this.watcher = null;
    }
    console.log('[EvidenceSync] Stopped');
  }

  private async handleEvidence(filePath: string): Promise<void> {
    const filename = path.basename(filePath);
    if (!filename.endsWith('.json')) return;

    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const evidence: Evidence = JSON.parse(content);
      await this.syncToVault(evidence);
      console.log(`[EvidenceSync] Synced: ${evidence.intent_id}`);
    } catch (error) {
      console.error(`[EvidenceSync] Error processing ${filename}:`, error);
    }
  }

  private async syncToVault(evidence: Evidence): Promise<void> {
    const projectDir = await this.ensureProjectDir(evidence.project);
    
    // Create evidence note
    await this.createEvidenceNote(projectDir, evidence);
    
    // Update project index
    await this.updateProjectIndex(projectDir, evidence);
    
    // Update daily note
    await this.updateDailyNote(evidence);
    
    // Update master index
    await this.updateMasterIndex(evidence);
  }

  private async ensureProjectDir(projectName: string): Promise<string> {
    const sanitized = this.sanitizeName(projectName);
    const projectCode = this.inferProjectCode(projectName);
    const projectDir = path.join(
      this.config.vaultDir,
      this.config.projectsSubdir,
      projectCode
    );

    // Create project structure
    const subdirs = ['builds', 'tasks', 'architecture', 'notes'];
    for (const subdir of subdirs) {
      const dir = path.join(projectDir, subdir);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    }

    return projectDir;
  }

  private async createEvidenceNote(projectDir: string, evidence: Evidence): Promise<void> {
    const buildsDir = path.join(projectDir, 'builds');
    const notePath = path.join(buildsDir, `${evidence.intent_id}.md`);
    const content = this.generateEvidenceNote(evidence);
    await fs.writeFile(notePath, content, 'utf-8');
  }

  private generateEvidenceNote(evidence: Evidence): string {
    const date = new Date(evidence.timestamp);
    const statusEmoji = {
      success: '✅',
      failure: '❌',
      partial: '⚠️'
    }[evidence.status];

    const artifactsByType = this.groupArtifacts(evidence.artifacts);
    
    const artifactSections = Object.entries(artifactsByType)
      .map(([type, artifacts]) => {
        const list = artifacts.map(a => {
          const lang = a.language ? ` \`${a.language}\`` : '';
          const desc = a.description ? ` - ${a.description}` : '';
          return `- \`${a.path}\`${lang} (${this.formatBytes(a.size)})${desc}`;
        }).join('\n');
        return `### ${this.capitalize(type)} Files
${list}`;
      }).join('\n\n');

    const testSection = evidence.test_results ? `
## Test Results
- **Status**: ${evidence.test_results.failed === 0 ? '✅ All Passed' : `❌ ${evidence.test_results.failed} Failed`}
- **Passed**: ${evidence.test_results.passed} ✅
- **Failed**: ${evidence.test_results.failed} ❌
- **Skipped**: ${evidence.test_results.skipped} ⏭️
- **Duration**: ${this.formatDuration(evidence.test_results.duration_ms)}
${evidence.test_results.coverage ? `- **Coverage**: ${evidence.test_results.coverage}%` : ''}

<details>
<summary>View Test Output</summary>

\`\`\`
${evidence.test_results.output}
\`\`\`
</details>` : '';

    const agentsSection = evidence.ai_agents ? `
## AI Agents Used
${evidence.ai_agents.map(agent => `- ${agent}`).join('\n')}` : '';

    const commitSection = evidence.git_commit ? `
## Git Commit
\`${evidence.git_commit}\`` : '';

    return `# ${statusEmoji} Build: ${evidence.project}

## Metadata
| Field | Value |
|-------|-------|
| **Intent ID** | \`${evidence.intent_id}\` |
| **Spec ID** | \`${evidence.spec_id}\` |
| **Status** | ${statusEmoji} ${this.capitalize(evidence.status)} |
| **Date** | ${date.toLocaleString()} |
| **Duration** | ${evidence.duration_ms ? this.formatDuration(evidence.duration_ms) : 'N/A'} |
| **Artifacts** | ${evidence.artifacts.length} files |

## Artifacts
${artifactSections}
${testSection}
${agentsSection}
${commitSection}

## Links
- [[${evidence.project} - Architecture]]
- [[${evidence.project} - Tasks]]
- Dashboard: http://localhost:9473
- Orchestrator: http://localhost:7654/intents/${evidence.intent_id}

---
*Synced by Thalamus AI*
`;
  }

  private async updateProjectIndex(projectDir: string, evidence: Evidence): Promise<void> {
    const indexPath = path.join(projectDir, '_Index.md');
    const date = new Date(evidence.timestamp).toLocaleDateString();
    const entry = `- [[${evidence.intent_id}]] - ${date} - ${evidence.status === 'success' ? '✅' : '❌'}`;

    let content = '';
    if (existsSync(indexPath)) {
      content = await fs.readFile(indexPath, 'utf-8');
      if (!content.includes(evidence.intent_id)) {
        content += `\n${entry}`;
      }
    } else {
      content = `# ${path.basename(projectDir)} - Project Index

## Recent Builds

${entry}

## Quick Links
- [[Architecture]] - System design docs
- [[Tasks]] - Active tasks
- [[Notes]] - Project notes

---
*Auto-generated by Thalamus AI*
`;
    }

    await fs.writeFile(indexPath, content, 'utf-8');
  }

  private async updateDailyNote(evidence: Evidence): Promise<void> {
    const date = new Date(evidence.timestamp);
    const dateStr = date.toISOString().split('T')[0];
    const dailyNotePath = path.join(
      this.config.vaultDir,
      this.config.dailyNotesDir,
      `${dateStr}.md`
    );

    const entry = `- ${evidence.status === 'success' ? '✅' : '❌'} [[${evidence.intent_id}]] - ${evidence.project}`;

    let content = '';
    if (existsSync(dailyNotePath)) {
      content = await fs.readFile(dailyNotePath, 'utf-8');
      if (!content.includes(evidence.intent_id)) {
        // Add to AI Builds section or create section
        if (content.includes('## AI Builds')) {
          content = content.replace(
            /## AI Builds\n/,
            `## AI Builds\n${entry}\n`
          );
        } else {
          content += `\n## AI Builds\n${entry}\n`;
        }
      }
    } else {
      content = `# ${dateStr}

## AI Builds
${entry}

## Notes

---
`;
    }

    await fs.writeFile(dailyNotePath, content, 'utf-8');
  }

  private async updateMasterIndex(evidence: Evidence): Promise<void> {
    const masterIndexPath = path.join(
      this.config.vaultDir,
      this.config.projectsSubdir,
      '_Master Index.md'
    );

    const projectCode = this.inferProjectCode(evidence.project);
    const entry = `- [[${evidence.intent_id}]] - ${evidence.project}`;

    let content = '';
    if (existsSync(masterIndexPath)) {
      content = await fs.readFile(masterIndexPath, 'utf-8');
      
      // Find or create project section
      const sectionRegex = new RegExp(`## ${projectCode}.*?\\n(?=##|$)`, 's');
      if (sectionRegex.test(content)) {
        // Add to existing section if not already there
        if (!content.includes(evidence.intent_id)) {
          content = content.replace(
            sectionRegex,
            match => match.trim() + `\n${entry}\n\n`
          );
        }
      } else {
        // Add new section
        content += `\n## ${projectCode}\n${entry}\n\n`;
      }
    } else {
      content = `# Projects Master Index

## ${projectCode}
${entry}

---
*Auto-generated by Thalamus AI*
`;
    }

    await fs.writeFile(masterIndexPath, content, 'utf-8');
  }

  private groupArtifacts(artifacts: Artifact[]): Record<string, Artifact[]> {
    return artifacts.reduce((groups, artifact) => {
      const type = artifact.type;
      if (!groups[type]) groups[type] = [];
      groups[type].push(artifact);
      return groups;
    }, {} as Record<string, Artifact[]>);
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }

  private sanitizeName(name: string): string {
    return name.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private inferProjectCode(project: string): string {
    const codeMap: Record<string, string> = {
      'sophia': 'SOPHIA',
      'sophia-code': 'SOPHIA',
      'sophia-ai': 'SOPHIA',
      'thalamus': 'THALAMUS',
      'executioniq': 'ExecutionIQ',
      'synaptica': 'SYNAPTICA'
    };

    const normalized = project.toLowerCase().replace(/[^a-z0-9]/g, '');
    return codeMap[normalized] || project.substring(0, 10).toUpperCase();
  }

  async getStats(): Promise<{ synced: number; pending: number }> {
    const files = await fs.readdir(this.config.evidenceDir).catch(() => []);
    const evidenceCount = files.filter(f => f.endsWith('.json')).length;

    // Count synced
    let syncedCount = 0;
    const projectsDir = path.join(this.config.vaultDir, this.config.projectsSubdir);
    
    if (existsSync(projectsDir)) {
      const projects = await fs.readdir(projectsDir);
      for (const project of projects) {
        const buildsDir = path.join(projectsDir, project, 'builds');
        if (existsSync(buildsDir)) {
          const notes = await fs.readdir(buildsDir);
          syncedCount += notes.filter(n => n.endsWith('.md')).length;
        }
      }
    }

    return { synced: syncedCount, pending: evidenceCount };
  }
}
