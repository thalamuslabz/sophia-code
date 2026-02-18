/**
 * Evidence Vault - Syncs execution evidence to Obsidian
 *
 * Watches evidence directory and creates/updates Obsidian notes
 * with full execution context, artifacts, and test results.
 */
import { watch } from 'chokidar';
import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync, mkdirSync } from 'fs';
export class EvidenceVault {
    constructor(config = {}) {
        this.watcher = null;
        this.running = false;
        const home = process.env.HOME || '/tmp';
        this.config = {
            evidenceDir: config.evidenceDir || path.join(home, '.auto-claude', 'evidence'),
            obsidianVaultDir: config.obsidianVaultDir || path.join(home, 'Documents', 'Obsidian Vault'),
            projectsSubdir: config.projectsSubdir || '06-PROJECTS'
        };
    }
    async start() {
        if (this.running)
            return;
        this.running = true;
        console.log('[EvidenceVault] Starting...');
        // Ensure evidence directory exists
        if (!existsSync(this.config.evidenceDir)) {
            mkdirSync(this.config.evidenceDir, { recursive: true });
        }
        // Start watching evidence directory
        this.watcher = watch(this.config.evidenceDir, {
            persistent: true,
            ignoreInitial: false,
            awaitWriteFinish: { stabilityThreshold: 1000 }
        });
        this.watcher.on('add', (filePath) => this.handleNewEvidence(filePath));
        this.watcher.on('change', (filePath) => this.handleNewEvidence(filePath));
        console.log(`[EvidenceVault] Watching: ${this.config.evidenceDir}`);
    }
    async stop() {
        this.running = false;
        if (this.watcher) {
            await this.watcher.close();
            this.watcher = null;
        }
        console.log('[EvidenceVault] Stopped');
    }
    /**
     * Manually sync an evidence file
     */
    async syncEvidence(intentId) {
        const evidencePath = path.join(this.config.evidenceDir, `${intentId}.json`);
        if (!existsSync(evidencePath)) {
            throw new Error(`Evidence not found: ${evidencePath}`);
        }
        await this.handleNewEvidence(evidencePath);
    }
    async handleNewEvidence(filePath) {
        const filename = path.basename(filePath);
        if (!filename.endsWith('.json'))
            return;
        console.log(`[EvidenceVault] Processing: ${filename}`);
        try {
            const content = await fs.readFile(filePath, 'utf-8');
            const evidence = JSON.parse(content);
            // Sync to Obsidian
            await this.syncToObsidian(evidence);
            console.log(`[EvidenceVault] Synced: ${evidence.intent_id}`);
        }
        catch (error) {
            console.error(`[EvidenceVault] Error processing ${filename}:`, error);
        }
    }
    async syncToObsidian(evidence) {
        const projectDir = this.sanitizeProjectName(evidence.project);
        const obsidianProjectDir = path.join(this.config.obsidianVaultDir, this.config.projectsSubdir, this.inferProjectCode(evidence.project));
        // Ensure directory exists
        if (!existsSync(obsidianProjectDir)) {
            mkdirSync(obsidianProjectDir, { recursive: true });
        }
        // Create evidence note
        const notePath = path.join(obsidianProjectDir, `${evidence.intent_id}.md`);
        const noteContent = this.generateObsidianNote(evidence);
        await fs.writeFile(notePath, noteContent);
        // Update project index
        await this.updateProjectIndex(obsidianProjectDir, evidence);
        console.log(`[EvidenceVault] Created note: ${notePath}`);
    }
    generateObsidianNote(evidence) {
        const date = new Date(evidence.timestamp).toLocaleString();
        // Group artifacts by type
        const artifactsByType = this.groupArtifactsByType(evidence.artifacts);
        // Build artifact sections
        const artifactSections = Object.entries(artifactsByType)
            .map(([type, artifacts]) => {
            const artifactList = artifacts
                .map(a => `- \`${a.path}\` (${this.formatBytes(a.size)}) - \`${a.checksum}\``)
                .join('\n');
            return `### ${type.charAt(0).toUpperCase() + type.slice(1)} Files\n${artifactList}`;
        })
            .join('\n\n');
        // Test results section
        const testSection = evidence.test_results
            ? `## Test Results
- **Passed**: ${evidence.test_results.passed} ✅
- **Failed**: ${evidence.test_results.failed} ❌
- **Skipped**: ${evidence.test_results.skipped} ⏭️
- **Duration**: ${evidence.test_results.duration_ms}ms

<details>
<summary>Test Output</summary>

\`\`\`
${evidence.test_results.output}
\`\`\`
</details>`
            : '## Test Results\n*No test results captured*';
        return `# Evidence: ${evidence.project}

## Metadata
- **Intent ID**: ${evidence.intent_id}
- **Spec ID**: ${evidence.spec_id}
- **Executed**: ${date}
- **Evidence ID**: \`${evidence.id}\`

## Artifacts
${evidence.artifacts.length} files captured

${artifactSections}

${testSection}

## Links
- [[Execution Log]]
- [[${evidence.project} - Architecture]]
- Dashboard: http://localhost:7654/intents/${evidence.intent_id}

---
*Generated by Evidence Vault*
`;
    }
    async updateProjectIndex(projectDir, evidence) {
        const indexPath = path.join(projectDir, '_Index.md');
        let indexContent = '';
        const date = new Date(evidence.timestamp).toLocaleDateString();
        const entry = `- [[${evidence.intent_id}]] - ${date} - ${evidence.artifacts.length} artifacts`;
        if (existsSync(indexPath)) {
            indexContent = await fs.readFile(indexPath, 'utf-8');
            // Check if entry already exists
            if (!indexContent.includes(evidence.intent_id)) {
                indexContent += `\n${entry}`;
            }
        }
        else {
            const projectName = path.basename(projectDir);
            indexContent = `# ${projectName} - Execution Index

## Completed Executions

${entry}

---
*Auto-generated index*
`;
        }
        await fs.writeFile(indexPath, indexContent);
    }
    groupArtifactsByType(artifacts) {
        return artifacts.reduce((groups, artifact) => {
            const type = artifact.type;
            if (!groups[type])
                groups[type] = [];
            groups[type].push(artifact);
            return groups;
        }, {});
    }
    formatBytes(bytes) {
        if (bytes < 1024)
            return `${bytes} B`;
        if (bytes < 1024 * 1024)
            return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
    sanitizeProjectName(name) {
        return name.replace(/[^a-zA-Z0-9-_]/g, '-').toLowerCase();
    }
    inferProjectCode(project) {
        // Map common project names to their codes
        const codeMap = {
            'sophia': 'SOPHIA',
            'sophia-code': 'SOPHIA',
            'test-e2e-app': 'ExecutionIQ',
            'test-react-app': 'ExecutionIQ'
        };
        const normalized = project.toLowerCase();
        return codeMap[normalized] || 'ExecutionIQ';
    }
    /**
     * Get sync statistics
     */
    async getStats() {
        const evidenceFiles = await fs.readdir(this.config.evidenceDir).catch(() => []);
        const evidenceCount = evidenceFiles.filter(f => f.endsWith('.json')).length;
        // Count synced notes (simple heuristic - count evidence files that have corresponding notes)
        let syncedCount = 0;
        for (const file of evidenceFiles) {
            if (!file.endsWith('.json'))
                continue;
            const intentId = file.replace('.json', '');
            // Check if note exists in any project directory
            const projectsDir = path.join(this.config.obsidianVaultDir, this.config.projectsSubdir);
            if (existsSync(projectsDir)) {
                const projects = await fs.readdir(projectsDir);
                for (const project of projects) {
                    const notePath = path.join(projectsDir, project, `${intentId}.md`);
                    if (existsSync(notePath)) {
                        syncedCount++;
                        break;
                    }
                }
            }
        }
        return {
            synced: syncedCount,
            pending: evidenceCount - syncedCount
        };
    }
}
