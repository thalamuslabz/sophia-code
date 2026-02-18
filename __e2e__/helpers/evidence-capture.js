/**
 * Evidence Capture - Tracks Auto-Claude execution and captures artifacts
 *
 * Watches AC output directories and captures:
 * - Generated files
 * - Test results
 * - Build artifacts
 * - Execution logs
 */
import { watch } from 'chokidar';
import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync, mkdirSync } from 'fs';
export class EvidenceCapture {
    constructor(config = {}) {
        this.watchers = new Map();
        this.activeCaptures = new Map();
        const home = process.env.HOME || '/tmp';
        this.config = {
            acOutputDir: config.acOutputDir || path.join(home, 'code', 'ac-projects'),
            evidenceDir: config.evidenceDir || path.join(home, '.auto-claude', 'evidence'),
            sophiaApiUrl: config.sophiaApiUrl || process.env.SOPHIA_API_URL || 'http://localhost:7654'
        };
    }
    /**
     * Start capturing evidence for a spec execution
     */
    async startCapture(intentId, specId, project) {
        const projectDir = path.join(this.config.acOutputDir, project.replace(/\s+/g, '-').toLowerCase());
        // Initialize evidence record immediately
        const evidence = {
            id: `evidence-${Date.now()}`,
            intent_id: intentId,
            spec_id: specId,
            project,
            timestamp: new Date().toISOString(),
            artifacts: []
        };
        this.activeCaptures.set(intentId, evidence);
        if (!existsSync(projectDir)) {
            console.log(`[EvidenceCapture] Project dir not found yet: ${projectDir}`);
            // Watch for directory creation
            await this.watchForProjectCreation(intentId, specId, project, projectDir);
            return;
        }
        await this.setupWatcher(intentId, specId, project, projectDir);
    }
    /**
     * Stop capturing for a spec
     */
    async stopCapture(intentId) {
        const watcher = this.watchers.get(intentId);
        if (watcher) {
            await watcher.close();
            this.watchers.delete(intentId);
        }
        const evidence = this.activeCaptures.get(intentId);
        if (evidence) {
            // Save final evidence
            await this.saveEvidence(evidence);
            this.activeCaptures.delete(intentId);
            // Report to Sophia
            await this.reportToSophia(evidence);
            return evidence;
        }
        return null;
    }
    /**
     * Capture final artifacts
     */
    async captureArtifacts(intentId) {
        const evidence = this.activeCaptures.get(intentId);
        if (!evidence)
            return;
        const projectDir = path.join(this.config.acOutputDir, evidence.project.replace(/\s+/g, '-').toLowerCase());
        if (!existsSync(projectDir))
            return;
        // Scan for all files
        const files = await this.scanDirectory(projectDir);
        for (const file of files) {
            // Skip node_modules and other build artifacts we don't want
            if (file.includes('node_modules') || file.includes('.git'))
                continue;
            const stats = await fs.stat(file);
            const relativePath = path.relative(projectDir, file);
            const artifact = {
                type: this.classifyArtifact(file),
                path: relativePath,
                size: stats.size,
                checksum: await this.computeChecksum(file)
            };
            // Only add if not already captured
            if (!evidence.artifacts.some(a => a.path === relativePath)) {
                evidence.artifacts.push(artifact);
            }
        }
        // Try to capture test results
        evidence.test_results = await this.captureTestResults(projectDir);
        console.log(`[EvidenceCapture] Captured ${evidence.artifacts.length} artifacts for ${intentId}`);
    }
    /**
     * Get capture statistics
     */
    async getStats(intentId) {
        const evidence = this.activeCaptures.get(intentId);
        if (!evidence) {
            return { files: 0, lastActivity: null };
        }
        return {
            files: evidence.artifacts.length,
            lastActivity: evidence.timestamp
        };
    }
    async setupWatcher(intentId, specId, project, projectDir) {
        // Get or create evidence record
        let evidence = this.activeCaptures.get(intentId);
        if (!evidence) {
            evidence = {
                id: `evidence-${Date.now()}`,
                intent_id: intentId,
                spec_id: specId,
                project,
                timestamp: new Date().toISOString(),
                artifacts: []
            };
            this.activeCaptures.set(intentId, evidence);
        }
        // Set up watcher
        const watcher = watch(projectDir, {
            persistent: true,
            ignoreInitial: false,
            ignored: [
                '**/node_modules/**',
                '**/.git/**',
                '**/dist/**',
                '**/build/**',
                '**/*.log'
            ],
            awaitWriteFinish: { stabilityThreshold: 1000 }
        });
        watcher.on('add', async (filePath) => {
            await this.handleFileChange(intentId, filePath, projectDir);
        });
        watcher.on('change', async (filePath) => {
            await this.handleFileChange(intentId, filePath, projectDir);
        });
        this.watchers.set(intentId, watcher);
        console.log(`[EvidenceCapture] Watching: ${projectDir}`);
    }
    async watchForProjectCreation(intentId, specId, project, projectDir) {
        const parentDir = path.dirname(projectDir);
        const watcher = watch(parentDir, {
            persistent: true,
            ignoreInitial: true,
            depth: 0
        });
        const checkAndSetup = async (createdPath) => {
            if (createdPath === projectDir || createdPath.startsWith(projectDir)) {
                await watcher.close();
                await this.setupWatcher(intentId, specId, project, projectDir);
            }
        };
        watcher.on('addDir', checkAndSetup);
        // Timeout after 5 minutes
        setTimeout(() => {
            watcher.close();
        }, 5 * 60 * 1000);
    }
    async handleFileChange(intentId, filePath, projectDir) {
        const evidence = this.activeCaptures.get(intentId);
        if (!evidence)
            return;
        // Skip ignored paths
        if (filePath.includes('node_modules') || filePath.includes('.git'))
            return;
        try {
            const stats = await fs.stat(filePath);
            const relativePath = path.relative(projectDir, filePath);
            const artifact = {
                type: this.classifyArtifact(filePath),
                path: relativePath,
                size: stats.size,
                checksum: await this.computeChecksum(filePath)
            };
            // Update or add artifact
            const existingIndex = evidence.artifacts.findIndex(a => a.path === relativePath);
            if (existingIndex >= 0) {
                evidence.artifacts[existingIndex] = artifact;
            }
            else {
                evidence.artifacts.push(artifact);
            }
            evidence.timestamp = new Date().toISOString();
        }
        catch {
            // File might have been deleted
        }
    }
    classifyArtifact(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        const basename = path.basename(filePath).toLowerCase();
        // Test files
        if (basename.includes('.test.') || basename.includes('.spec.') || basename.includes('_test')) {
            return 'test';
        }
        // Config files
        if (['.json', '.yaml', '.yml', '.toml', '.ini', '.conf'].includes(ext)) {
            if (basename.includes('config') || basename.includes('.rc')) {
                return 'config';
            }
        }
        // Documentation
        if (['.md', '.mdx', '.txt', '.rst'].includes(ext)) {
            return 'doc';
        }
        // Source code
        if (['.ts', '.tsx', '.js', '.jsx', '.py', '.go', '.rs', '.java', '.cpp', '.c', '.h'].includes(ext)) {
            return 'source';
        }
        return 'other';
    }
    async computeChecksum(filePath) {
        const crypto = await import('crypto');
        const content = await fs.readFile(filePath);
        return crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
    }
    async scanDirectory(dir) {
        const files = [];
        const scan = async (currentDir) => {
            const entries = await fs.readdir(currentDir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(currentDir, entry.name);
                if (entry.isDirectory()) {
                    if (!entry.name.includes('node_modules') && !entry.name.startsWith('.')) {
                        await scan(fullPath);
                    }
                }
                else {
                    files.push(fullPath);
                }
            }
        };
        await scan(dir);
        return files;
    }
    async captureTestResults(projectDir) {
        // Look for common test result files
        const testResultFiles = [
            'test-results.json',
            'junit.xml',
            'test-output.txt',
            'vitest-result.json'
        ];
        for (const file of testResultFiles) {
            const filePath = path.join(projectDir, file);
            if (existsSync(filePath)) {
                try {
                    const content = await fs.readFile(filePath, 'utf-8');
                    if (file.endsWith('.json')) {
                        const results = JSON.parse(content);
                        return {
                            passed: results.passed || results.numPassedTests || 0,
                            failed: results.failed || results.numFailedTests || 0,
                            skipped: results.skipped || results.numPendingTests || 0,
                            duration_ms: results.duration || 0,
                            output: content
                        };
                    }
                    // Simple parsing for text files
                    return {
                        passed: (content.match(/✓|passed|PASS/g) || []).length,
                        failed: (content.match(/✗|failed|FAIL/g) || []).length,
                        skipped: (content.match(/skipped|SKIP/g) || []).length,
                        duration_ms: 0,
                        output: content
                    };
                }
                catch {
                    // Ignore parse errors
                }
            }
        }
        return undefined;
    }
    async saveEvidence(evidence) {
        if (!existsSync(this.config.evidenceDir)) {
            mkdirSync(this.config.evidenceDir, { recursive: true });
        }
        const evidencePath = path.join(this.config.evidenceDir, `${evidence.intent_id}.json`);
        await fs.writeFile(evidencePath, JSON.stringify(evidence, null, 2));
        console.log(`[EvidenceCapture] Saved: ${evidencePath}`);
    }
    async reportToSophia(evidence) {
        try {
            const response = await fetch(`${this.config.sophiaApiUrl}/api/intents/${evidence.intent_id}/evidence`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(evidence)
            });
            if (!response.ok) {
                console.log(`[EvidenceCapture] API report failed (may be offline), evidence saved locally`);
            }
            else {
                console.log(`[EvidenceCapture] Reported to Sophia: ${evidence.intent_id}`);
            }
        }
        catch {
            console.log(`[EvidenceCapture] API unavailable, evidence saved locally`);
        }
    }
}
