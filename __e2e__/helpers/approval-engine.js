/**
 * Approval Engine - Manages intent approval before execution
 *
 * Integrates with Sophia API to check approval status
 * Queues specs until approved, then routes to Auto-Claude
 */
import * as fs from 'fs/promises';
import * as path from 'path';
import { existsSync, mkdirSync } from 'fs';
export class ApprovalEngine {
    constructor(config = {}) {
        this.checkInterval = null;
        this.onApproved = null;
        const home = process.env.HOME || '/tmp';
        this.config = {
            pendingDir: config.pendingDir || path.join(home, '.auto-claude', 'pending'),
            approvedDir: config.approvedDir || path.join(home, '.auto-claude', 'approved'),
            sophiaApiUrl: config.sophiaApiUrl || process.env.SOPHIA_API_URL || 'http://localhost:7654',
            checkIntervalMs: config.checkIntervalMs || 5000
        };
    }
    /**
     * Set callback for when intent is approved
     */
    onIntentApproved(callback) {
        this.onApproved = callback;
    }
    /**
     * Start polling for approval status
     */
    start() {
        this.ensureDirs();
        // Initial scan
        this.checkPendingIntents();
        // Start polling
        this.checkInterval = setInterval(() => {
            this.checkPendingIntents();
        }, this.config.checkIntervalMs);
        console.log(`[ApprovalEngine] Started, checking every ${this.config.checkIntervalMs}ms`);
    }
    /**
     * Stop polling
     */
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = null;
        }
        console.log('[ApprovalEngine] Stopped');
    }
    /**
     * Queue a spec for approval
     */
    async queueForApproval(intent, specData) {
        const pendingPath = path.join(this.config.pendingDir, `${intent.id}.json`);
        const pendingSpec = {
            intent,
            spec: specData,
            queued_at: new Date().toISOString()
        };
        await fs.writeFile(pendingPath, JSON.stringify(pendingSpec, null, 2));
        console.log(`[ApprovalEngine] Queued for approval: ${intent.id}`);
        return pendingPath;
    }
    /**
     * Check if intent is approved
     */
    async checkApprovalStatus(intentId) {
        try {
            // Try to fetch from Sophia API
            const response = await fetch(`${this.config.sophiaApiUrl}/api/intents/${intentId}`);
            if (!response.ok) {
                // Fallback: check local mock for testing
                return this.checkLocalApproval(intentId);
            }
            const intent = await response.json();
            return intent;
        }
        catch {
            // API unavailable, check local
            return this.checkLocalApproval(intentId);
        }
    }
    /**
     * Approve an intent (for testing or local mode)
     */
    async approveIntent(intentId, approvedBy) {
        const approvedPath = path.join(this.config.approvedDir, `${intentId}.json`);
        const pendingPath = path.join(this.config.pendingDir, `${intentId}.json`);
        // Read pending spec
        let pendingSpec;
        try {
            const content = await fs.readFile(pendingPath, 'utf-8');
            pendingSpec = JSON.parse(content);
        }
        catch {
            console.error(`[ApprovalEngine] Pending spec not found: ${intentId}`);
            return;
        }
        // Update intent status
        pendingSpec.intent.status = 'approved';
        pendingSpec.intent.approved_by = approvedBy;
        pendingSpec.intent.approved_at = new Date().toISOString();
        pendingSpec.approved_at = new Date().toISOString();
        // Move to approved
        await fs.writeFile(approvedPath, JSON.stringify(pendingSpec, null, 2));
        await fs.unlink(pendingPath);
        console.log(`[ApprovalEngine] Intent approved: ${intentId} by ${approvedBy}`);
        // Trigger callback
        if (this.onApproved) {
            this.onApproved(pendingSpec.intent, approvedPath);
        }
    }
    /**
     * Reject an intent
     */
    async rejectIntent(intentId, reason) {
        const pendingPath = path.join(this.config.pendingDir, `${intentId}.json`);
        const rejectedPath = path.join(this.config.approvedDir, '..', 'rejected', `${intentId}.json`);
        try {
            const content = await fs.readFile(pendingPath, 'utf-8');
            const pendingSpec = JSON.parse(content);
            pendingSpec.intent.status = 'rejected';
            pendingSpec.rejected_at = new Date().toISOString();
            pendingSpec.rejection_reason = reason || 'No reason provided';
            await fs.mkdir(path.dirname(rejectedPath), { recursive: true });
            await fs.writeFile(rejectedPath, JSON.stringify(pendingSpec, null, 2));
            await fs.unlink(pendingPath);
            console.log(`[ApprovalEngine] Intent rejected: ${intentId}`);
        }
        catch {
            // Ignore if not found
        }
    }
    ensureDirs() {
        const dirs = [
            this.config.pendingDir,
            this.config.approvedDir,
            path.join(this.config.approvedDir, '..', 'rejected')
        ];
        for (const dir of dirs) {
            if (!existsSync(dir)) {
                mkdirSync(dir, { recursive: true });
            }
        }
    }
    async checkPendingIntents() {
        try {
            const files = await fs.readdir(this.config.pendingDir);
            const pendingFiles = files.filter(f => f.endsWith('.json'));
            for (const file of pendingFiles) {
                const pendingPath = path.join(this.config.pendingDir, file);
                try {
                    const content = await fs.readFile(pendingPath, 'utf-8');
                    const pendingSpec = JSON.parse(content);
                    const intentId = pendingSpec.intent.id;
                    // Check approval status
                    const intent = await this.checkApprovalStatus(intentId);
                    if (intent?.status === 'approved') {
                        await this.approveIntent(intentId, intent.approved_by || 'unknown');
                    }
                    else if (intent?.status === 'rejected') {
                        await this.rejectIntent(intentId);
                    }
                }
                catch (error) {
                    console.error(`[ApprovalEngine] Error checking ${file}:`, error);
                }
            }
        }
        catch {
            // Directory might not exist yet
        }
    }
    async checkLocalApproval(intentId) {
        const approvedPath = path.join(this.config.approvedDir, `${intentId}.json`);
        if (!existsSync(approvedPath)) {
            return null;
        }
        try {
            const content = await fs.readFile(approvedPath, 'utf-8');
            const spec = JSON.parse(content);
            return spec.intent;
        }
        catch {
            return null;
        }
    }
    /**
     * Get queue statistics
     */
    async getStats() {
        const pendingFiles = await fs.readdir(this.config.pendingDir).catch(() => []);
        const approvedFiles = await fs.readdir(this.config.approvedDir).catch(() => []);
        const rejectedDir = path.join(this.config.approvedDir, '..', 'rejected');
        const rejectedFiles = await fs.readdir(rejectedDir).catch(() => []);
        return {
            pending: pendingFiles.filter(f => f.endsWith('.json')).length,
            approved: approvedFiles.filter(f => f.endsWith('.json')).length,
            rejected: rejectedFiles.filter(f => f.endsWith('.json')).length
        };
    }
}
