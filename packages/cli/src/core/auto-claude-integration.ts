/**
 * Auto-Claude Integration Module
 * 
 * Handles automatic setup and management of Open WebUI ↔ Auto-Claude integration.
 * This runs as part of sophia init and manages the bridge service.
 */

import fs from "node:fs";
import path from "node:path";
import { spawn, exec } from "node:child_process";
import os from "node:os";
// Config type from shared package if available
// import type { Config } from "@sophia-code/shared";
import {
  installService,
  uninstallService,
  getServiceStatus as getManagedServiceStatus,
  restartService,
  startService,
  stopService,
  getDefaultServiceConfig,
} from "./auto-claude-service.js";

export interface AutoClaudeConfig {
  enabled: boolean;
  specDir: string;
  processedDir: string;
  triggerMethod: "auto" | "cli" | "file" | "api";
  autoStart: boolean;
  useN8n: boolean;
  n8nWebhookUrl: string;
}

interface ServiceStatus {
  running: boolean;
  pid?: number;
  uptime?: string;
  lastCheck: Date;
}

const DEFAULT_CONFIG: AutoClaudeConfig = {
  enabled: true,
  specDir: path.join(os.homedir(), ".auto-claude", "specs"),
  processedDir: path.join(os.homedir(), ".auto-claude", "processed"),
  triggerMethod: "auto",
  autoStart: true,
  useN8n: true,
  n8nWebhookUrl: "http://localhost:3118/webhook/auto-claude-trigger",
};

/**
 * Check if Auto-Claude is installed on the system
 */
export function isAutoClaudeInstalled(): boolean {
  const possiblePaths = [
    "/Applications/Auto-Claude.app",
    path.join(os.homedir(), "Applications", "Auto-Claude.app"),
    path.join(os.homedir(), ".local", "share", "auto-claude"),
    "/opt/auto-claude",
  ];

  // Check for macOS app
  for (const appPath of possiblePaths) {
    if (fs.existsSync(appPath)) {
      return true;
    }
  }

  // Check for CLI in PATH
  try {
    const result = require("node:child_process").execSync("which auto-claude", { encoding: "utf8" });
    return result.trim().length > 0;
  } catch {
    return false;
  }
}

/**
 * Detect if productivity-hub is set up
 */
export function isProductivityHubSetup(): boolean {
  const hubPath = path.join(os.homedir(), "productivity-hub");
  const requiredPaths = [
    path.join(hubPath, "ops-stack", "docker-compose.yml"),
    path.join(hubPath, "thalamus-orchestrator"),
  ];

  return requiredPaths.every((p) => fs.existsSync(p));
}

/**
 * Get the appropriate bridge script path
 */
export function getBridgeScriptPath(): string | null {
  const paths = [
    path.join(os.homedir(), "productivity-hub", "scripts", "auto-claude-bridge.js"),
    path.join(os.homedir(), ".sophia", "scripts", "auto-claude-bridge.js"),
    path.join(__dirname, "..", "scripts", "auto-claude-bridge.js"),
  ];

  for (const p of paths) {
    if (fs.existsSync(p)) {
      return p;
    }
  }
  return null;
}

/**
 * Get auto-claude configuration from sophia config
 */
export function getAutoClaudeConfig(projectRoot: string): AutoClaudeConfig {
  const sophiaConfigPath = path.join(projectRoot, ".sophia", "config.yaml");
  
  if (fs.existsSync(sophiaConfigPath)) {
    try {
      const content = fs.readFileSync(sophiaConfigPath, "utf8");
      // Simple YAML parsing for auto_claude section
      const match = content.match(/auto_claude:\s*\n((?:\s+\w+:.+\n?)*)/);
      if (match) {
        const section = match[1];
        const config: Partial<AutoClaudeConfig> = {};
        
        const enabledMatch = section?.match(/enabled:\s*(true|false)/);
        if (enabledMatch) config.enabled = enabledMatch[1] === "true";
        
        const triggerMethod = section?.match(/trigger_method:\s*(\w+)/);
        if (triggerMethod) config.triggerMethod = triggerMethod[1] as AutoClaudeConfig["triggerMethod"];
        
        const autoStart = section?.match(/auto_start:\s*(true|false)/);
        if (autoStart) config.autoStart = autoStart[1] === "true";
        
        const useN8n = section?.match(/use_n8n:\s*(true|false)/);
        if (useN8n) config.useN8n = useN8n[1] === "true";
        
        return { ...DEFAULT_CONFIG, ...config };
      }
    } catch {
      // Fall through to default
    }
  }
  
  return DEFAULT_CONFIG;
}

/**
 * Ensure all required directories exist
 */
export function ensureAutoClaudeDirectories(config: AutoClaudeConfig = DEFAULT_CONFIG): void {
  const dirs = [config.specDir, config.processedDir];
  
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}

/**
 * Get service status (delegates to service manager)
 */
export async function getServiceStatus(): Promise<ServiceStatus> {
  const managed = await getManagedServiceStatus();
  return {
    running: managed.running,
    pid: managed.pid,
    lastCheck: new Date(),
  };
}

/**
 * Install and start the bridge service
 */
export async function installBridgeService(config: AutoClaudeConfig = DEFAULT_CONFIG): Promise<boolean> {
  const serviceConfig = getDefaultServiceConfig();
  
  // Override with custom config if provided
  if (config.specDir) {
    serviceConfig.environment['AUTO_CLAUDE_SPEC_DIR'] = config.specDir;
  }
  if (config.processedDir) {
    serviceConfig.environment['AUTO_CLAUDE_PROCESSED_DIR'] = config.processedDir;
  }
  if (config.triggerMethod) {
    serviceConfig.environment['AUTO_CLAUDE_TRIGGER_METHOD'] = config.triggerMethod;
  }
  if (config.useN8n !== undefined) {
    serviceConfig.environment['AUTO_CLAUDE_USE_N8N'] = String(config.useN8n);
  }
  if (config.n8nWebhookUrl) {
    serviceConfig.environment['AUTO_CLAUDE_N8N_WEBHOOK'] = config.n8nWebhookUrl;
  }
  
  return installService(serviceConfig);
}



/**
 * Stop the bridge service
 */
export async function stopBridgeService(): Promise<boolean> {
  return stopService();
}

/**
 * Install Open WebUI function
 */
export function installOpenWebUIFunction(): boolean {
  const openwebuiFunctionsDir = path.join(
    os.homedir(),
    "productivity-hub",
    "ops-stack",
    "data",
    "openwebui",
    "functions"
  );

  // If productivity-hub doesn't exist, create in .sophia
  const targetDir = fs.existsSync(openwebuiFunctionsDir)
    ? openwebuiFunctionsDir
    : path.join(os.homedir(), ".sophia", "openwebui-functions");

  fs.mkdirSync(targetDir, { recursive: true });

  const functionPath = path.join(targetDir, "auto_claude_trigger.py");
  fs.writeFileSync(functionPath, getOpenWebUIFunction(), "utf8");

  // Create instructions for manual installation
  const instructionsPath = path.join(targetDir, "INSTALL_INSTRUCTIONS.md");
  fs.writeFileSync(instructionsPath, getOpenWebUIInstructions(), "utf8");

  return true;
}

/**
 * Install n8n workflow
 */
export function installN8NWorkflow(): boolean {
  const n8nWorkflowsDir = path.join(
    os.homedir(),
    "productivity-hub",
    "ops-stack",
    "data",
    "n8n",
    "workflows"
  );

  const targetDir = fs.existsSync(n8nWorkflowsDir)
    ? n8nWorkflowsDir
    : path.join(os.homedir(), ".sophia", "n8n-workflows");

  fs.mkdirSync(targetDir, { recursive: true });

  const workflowPath = path.join(targetDir, "auto-claude-router.json");
  fs.writeFileSync(workflowPath, getN8NWorkflow(), "utf8");

  return true;
}

/**
 * Add auto-claude configuration to sophia config
 */
export function addAutoClaudeToConfig(projectRoot: string): void {
  const configPath = path.join(projectRoot, ".sophia", "config.yaml");
  
  if (!fs.existsSync(configPath)) {
    return;
  }

  let content = fs.readFileSync(configPath, "utf8");
  
  // Check if already has auto_claude section
  if (content.includes("auto_claude:")) {
    return;
  }

  const autoClaudeSection = `
# Auto-Claude Integration
auto_claude:
  enabled: true
  spec_dir: "${DEFAULT_CONFIG.specDir}"
  processed_dir: "${DEFAULT_CONFIG.processedDir}"
  trigger_method: "${DEFAULT_CONFIG.triggerMethod}"
  auto_start: true
  use_n8n: true
  n8n_webhook_url: "${DEFAULT_CONFIG.n8nWebhookUrl}"
`;

  content += autoClaudeSection;
  fs.writeFileSync(configPath, content, "utf8");
}

/**
 * Run full initialization for auto-claude integration
 */
export async function initializeAutoClaudeIntegration(projectRoot: string): Promise<{
  success: boolean;
  installed: boolean;
  serviceRunning: boolean;
  message: string;
}> {
  // Check if Auto-Claude is installed
  const acInstalled = isAutoClaudeInstalled();
  
  if (!acInstalled) {
    return {
      success: true,
      installed: false,
      serviceRunning: false,
      message: "Auto-Claude not detected. Install Auto-Claude and run 'sophia auto-claude setup' to enable.",
    };
  }

  // Ensure directories
  ensureAutoClaudeDirectories();

  // Install Open WebUI function
  installOpenWebUIFunction();

  // Install n8n workflow
  installN8NWorkflow();

  // Add to sophia config
  addAutoClaudeToConfig(projectRoot);

  // Check service status
  let status = await getServiceStatus();

  // Start service if not running
  if (!status.running) {
    const started = await installBridgeService();
    if (started) {
      status = await getServiceStatus();
    }
  }

  return {
    success: true,
    installed: true,
    serviceRunning: status.running,
    message: status.running
      ? "Auto-Claude integration active. Bridge service running."
      : "Auto-Claude integration configured but bridge service failed to start. Run 'sophia auto-claude start'.",
  };
}

// Embedded content getters
function getEmbeddedBridgeScript(): string {
  // This would contain the full bridge script
  // For now, reference the external file
  return `#!/usr/bin/env node
// Auto-Claude Bridge - Embedded Version
// Full implementation at: ~/productivity-hub/scripts/auto-claude-bridge.js
console.log("Bridge script not fully embedded. Please run setup from productivity-hub.");
`;
}

function getOpenWebUIFunction(): string {
  // Reference to the full function
  return `# See ~/productivity-hub/ops-stack/data/openwebui/functions/auto_claude_trigger.py
# Or run: sophia auto-claude setup --openwebui`;
}

function getOpenWebUIInstructions(): string {
  return `# Open WebUI Auto-Claude Integration

## Installation

1. Open Open WebUI at http://localhost:3115
2. Go to Admin Settings → Functions
3. Click "Create Function"
4. Copy the contents of auto_claude_trigger.py
5. Save and enable

## Usage

In any chat, type:
- /build Create a React todo app
- Build me an API for user management

The spec will be sent to Auto-Claude automatically.
`;
}

function getN8NWorkflow(): string {
  return `{}`; // Reference to full workflow
}
