/**
 * Auto-Claude Service Manager
 * 
 * Manages the bridge as a background service using:
 * - macOS: launchd (LaunchAgent)
 * - Linux: systemd (user service)
 * - Windows: (future) Windows Service or scheduled task
 * 
 * The service auto-starts on login and runs continuously.
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { spawn, exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export interface ServiceConfig {
  name: string;
  label: string;
  scriptPath: string;
  workingDir: string;
  environment: Record<string, string>;
  logDir: string;
}

/**
 * Get the default service configuration
 */
export function getDefaultServiceConfig(): ServiceConfig {
  const homeDir = os.homedir();
  const sophiaDir = path.join(homeDir, ".sophia");
  const autoClaudeDir = path.join(homeDir, ".auto-claude");
  
  return {
    name: "auto-claude-bridge",
    label: "com.thalamus.auto-claude-bridge",
    scriptPath: path.join(sophiaDir, "scripts", "auto-claude-bridge.js"),
    workingDir: homeDir,
    environment: {
      AUTO_CLAUDE_SPEC_DIR: path.join(autoClaudeDir, "specs"),
      AUTO_CLAUDE_PROCESSED_DIR: path.join(autoClaudeDir, "processed"),
      AUTO_CLAUDE_LOG_DIR: path.join(autoClaudeDir, "logs"),
      AUTO_CLAUDE_TRIGGER_METHOD: "auto",
      AUTO_CLAUDE_USE_N8N: "true",
      AUTO_CLAUDE_N8N_WEBHOOK: "http://localhost:3118/webhook/auto-claude-trigger",
      NODE_ENV: "production",
    },
    logDir: path.join(autoClaudeDir, "logs"),
  };
}

/**
 * Install and start the service for the current platform
 */
export async function installService(config: ServiceConfig = getDefaultServiceConfig()): Promise<boolean> {
  // Ensure directories exist
  fs.mkdirSync(config.logDir, { recursive: true });
  fs.mkdirSync(path.dirname(config.scriptPath), { recursive: true });
  
  // Ensure bridge script exists
  if (!fs.existsSync(config.scriptPath)) {
    await createBridgeScript(config.scriptPath);
  }

  switch (process.platform) {
    case "darwin":
      return installMacOSService(config);
    case "linux":
      return installLinuxService(config);
    default:
      console.warn(`Service installation not supported on ${process.platform}`);
      return false;
  }
}

/**
 * Stop and uninstall the service
 */
export async function uninstallService(config: ServiceConfig = getDefaultServiceConfig()): Promise<boolean> {
  switch (process.platform) {
    case "darwin":
      return uninstallMacOSService(config);
    case "linux":
      return uninstallLinuxService(config);
    default:
      return false;
  }
}

/**
 * Check if the service is installed and running
 */
export async function getServiceStatus(config: ServiceConfig = getDefaultServiceConfig()): Promise<{
  installed: boolean;
  running: boolean;
  pid?: number;
  uptime?: string;
}> {
  switch (process.platform) {
    case "darwin":
      return getMacOSServiceStatus(config);
    case "linux":
      return getLinuxServiceStatus(config);
    default:
      return { installed: false, running: false };
  }
}

/**
 * Restart the service
 */
export async function restartService(config: ServiceConfig = getDefaultServiceConfig()): Promise<boolean> {
  await stopService(config);
  await new Promise(resolve => setTimeout(resolve, 1000));
  return startService(config);
}

/**
 * Start the service (without reinstalling)
 */
export async function startService(config: ServiceConfig = getDefaultServiceConfig()): Promise<boolean> {
  switch (process.platform) {
    case "darwin": {
      const plistPath = path.join(os.homedir(), "Library", "LaunchAgents", `${config.label}.plist`);
      if (!fs.existsSync(plistPath)) {
        return false;
      }
      try {
        await execAsync(`launchctl load "${plistPath}"`);
        return true;
      } catch {
        return false;
      }
    }
    case "linux": {
      try {
        await execAsync("systemctl --user start auto-claude-bridge");
        return true;
      } catch {
        return false;
      }
    }
    default:
      return false;
  }
}

/**
 * Stop the service
 */
export async function stopService(config: ServiceConfig = getDefaultServiceConfig()): Promise<boolean> {
  switch (process.platform) {
    case "darwin": {
      const plistPath = path.join(os.homedir(), "Library", "LaunchAgents", `${config.label}.plist`);
      try {
        await execAsync(`launchctl unload "${plistPath}" 2>/dev/null || true`);
        return true;
      } catch {
        return false;
      }
    }
    case "linux": {
      try {
        await execAsync("systemctl --user stop auto-claude-bridge 2>/dev/null || true");
        return true;
      } catch {
        return false;
      }
    }
    default:
      return false;
  }
}

// macOS Implementation

async function installMacOSService(config: ServiceConfig): Promise<boolean> {
  const plistPath = path.join(os.homedir(), "Library", "LaunchAgents", `${config.label}.plist`);
  
  // Ensure LaunchAgents directory exists
  fs.mkdirSync(path.dirname(plistPath), { recursive: true });
  
  // Find node path
  let nodePath = "/usr/local/bin/node";
  try {
    const { stdout } = await execAsync("which node");
    nodePath = stdout.trim();
  } catch {
    // Use default
  }
  
  const plistContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${config.label}</string>
    <key>ProgramArguments</key>
    <array>
        <string>${nodePath}</string>
        <string>${config.scriptPath}</string>
        <string>--watch</string>
        <string>--daemon</string>
    </array>
    <key>EnvironmentVariables</key>
    <dict>
        ${Object.entries(config.environment).map(([k, v]) => `<key>${k}</key><string>${v}</string>`).join("\n        ")}
    </dict>
    <key>WorkingDirectory</key>
    <string>${config.workingDir}</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <dict>
        <key>SuccessfulExit</key>
        <false/>
        <key>Crashed</key>
        <true/>
    </dict>
    <key>ThrottleInterval</key>
    <integer>10</integer>
    <key>StandardOutPath</key>
    <string>${config.logDir}/bridge.log</string>
    <key>StandardErrorPath</key>
    <string>${config.logDir}/bridge.error.log</string>
</dict>
</plist>`;

  try {
    // Stop existing service if running
    await stopService(config);
    
    // Write plist
    fs.writeFileSync(plistPath, plistContent, "utf8");
    
    // Load and start service
    await execAsync(`launchctl load "${plistPath}"`);
    
    // Verify it's running
    await new Promise(resolve => setTimeout(resolve, 500));
    const status = await getMacOSServiceStatus(config);
    
    return status.running;
  } catch (error) {
    console.error("Failed to install macOS service:", error);
    return false;
  }
}

async function uninstallMacOSService(config: ServiceConfig): Promise<boolean> {
  const plistPath = path.join(os.homedir(), "Library", "LaunchAgents", `${config.label}.plist`);
  
  try {
    await stopService(config);
    
    if (fs.existsSync(plistPath)) {
      fs.unlinkSync(plistPath);
    }
    
    return true;
  } catch (error) {
    console.error("Failed to uninstall macOS service:", error);
    return false;
  }
}

async function getMacOSServiceStatus(config: ServiceConfig): Promise<{
  installed: boolean;
  running: boolean;
  pid?: number;
  uptime?: string;
}> {
  const plistPath = path.join(os.homedir(), "Library", "LaunchAgents", `${config.label}.plist`);
  const installed = fs.existsSync(plistPath);
  
  if (!installed) {
    return { installed: false, running: false };
  }
  
  try {
    const { stdout } = await execAsync(`launchctl list | grep "${config.label}" || true`);
    
    const trimmed = stdout?.trim();
    if (trimmed) {
      const parts = trimmed.split(/\s+/);
      const pid = parts[0] ? parseInt(parts[0], 10) : NaN;
      
      return {
        installed: true,
        running: !isNaN(pid) && pid > 0,
        pid: !isNaN(pid) && pid > 0 ? pid : undefined,
      };
    }
    
    return { installed: true, running: false };
  } catch {
    return { installed: true, running: false };
  }
}

// Linux Implementation

async function installLinuxService(config: ServiceConfig): Promise<boolean> {
  const systemdDir = path.join(os.homedir(), ".config", "systemd", "user");
  const servicePath = path.join(systemdDir, "auto-claude-bridge.service");
  
  // Ensure directory exists
  fs.mkdirSync(systemdDir, { recursive: true });
  
  // Find node path
  let nodePath = "/usr/bin/node";
  try {
    const { stdout } = await execAsync("which node");
    nodePath = stdout.trim();
  } catch {
    // Use default
  }
  
  const serviceContent = `[Unit]
Description=Auto-Claude Bridge Service
Documentation=https://github.com/thalamus-ai/sophia.code
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=${nodePath} ${config.scriptPath} --watch --daemon
Restart=on-failure
RestartSec=10
Environment="AUTO_CLAUDE_SPEC_DIR=${config.environment['AUTO_CLAUDE_SPEC_DIR']}"
Environment="AUTO_CLAUDE_PROCESSED_DIR=${config.environment['AUTO_CLAUDE_PROCESSED_DIR']}"
Environment="AUTO_CLAUDE_LOG_DIR=${config.environment['AUTO_CLAUDE_LOG_DIR']}"
Environment="AUTO_CLAUDE_TRIGGER_METHOD=${config.environment['AUTO_CLAUDE_TRIGGER_METHOD']}"
Environment="AUTO_CLAUDE_USE_N8N=${config.environment['AUTO_CLAUDE_USE_N8N']}"
Environment="AUTO_CLAUDE_N8N_WEBHOOK=${config.environment['AUTO_CLAUDE_N8N_WEBHOOK']}"
Environment="NODE_ENV=${config.environment['NODE_ENV']}"

[Install]
WantedBy=default.target`;

  try {
    // Stop existing service
    await stopService(config);
    
    // Write service file
    fs.writeFileSync(servicePath, serviceContent, "utf8");
    
    // Enable and start
    await execAsync("systemctl --user daemon-reload");
    await execAsync("systemctl --user enable auto-claude-bridge");
    await execAsync("systemctl --user start auto-claude-bridge");
    
    // Verify
    await new Promise(resolve => setTimeout(resolve, 500));
    const status = await getLinuxServiceStatus(config);
    
    return status.running;
  } catch (error) {
    console.error("Failed to install Linux service:", error);
    return false;
  }
}

async function uninstallLinuxService(config: ServiceConfig): Promise<boolean> {
  const servicePath = path.join(os.homedir(), ".config", "systemd", "user", "auto-claude-bridge.service");
  
  try {
    await stopService(config);
    await execAsync("systemctl --user disable auto-claude-bridge 2>/dev/null || true");
    
    if (fs.existsSync(servicePath)) {
      fs.unlinkSync(servicePath);
    }
    
    await execAsync("systemctl --user daemon-reload");
    return true;
  } catch (error) {
    console.error("Failed to uninstall Linux service:", error);
    return false;
  }
}

async function getLinuxServiceStatus(config: ServiceConfig): Promise<{
  installed: boolean;
  running: boolean;
  pid?: number;
  uptime?: string;
}> {
  const servicePath = path.join(os.homedir(), ".config", "systemd", "user", "auto-claude-bridge.service");
  const installed = fs.existsSync(servicePath);
  
  if (!installed) {
    return { installed: false, running: false };
  }
  
  try {
    const { stdout } = await execAsync("systemctl --user is-active auto-claude-bridge");
    const running = stdout.trim() === "active";
    
    if (running) {
      // Try to get PID
      try {
        const { stdout: pidOut } = await execAsync("systemctl --user show auto-claude-bridge --property=MainPID --value");
        const pid = parseInt(pidOut?.trim() ?? '0', 10);
        return { installed: true, running, pid: pid > 0 ? pid : undefined };
      } catch {
        return { installed: true, running };
      }
    }
    
    return { installed: true, running: false };
  } catch {
    return { installed: true, running: false };
  }
}

/**
 * Create the bridge script if it doesn't exist
 */
async function createBridgeScript(scriptPath: string): Promise<void> {
  fs.mkdirSync(path.dirname(scriptPath), { recursive: true });
  
  // For now, create a minimal bridge that references the full implementation
  // In production, this would embed the full bridge script
  const minimalBridge = `#!/usr/bin/env node
/**
 * Auto-Claude Bridge Service
 * Auto-generated by Sophia CLI
 */

const fs = require('fs');
const path = require('path');

const CONFIG = {
  specDir: process.env.AUTO_CLAUDE_SPEC_DIR || path.join(require('os').homedir(), '.auto-claude', 'specs'),
  logFile: path.join(process.env.AUTO_CLAUDE_LOG_DIR || path.join(require('os').homedir(), '.auto-claude', 'logs'), 'bridge.log'),
};

function log(level, message) {
  const entry = { timestamp: new Date().toISOString(), level, message };
  console.log(JSON.stringify(entry));
  fs.appendFileSync(CONFIG.logFile, JSON.stringify(entry) + '\\n');
}

log('info', 'Bridge service starting...');
log('info', 'Watching: ' + CONFIG.specDir);

// Ensure directory exists
if (!fs.existsSync(CONFIG.specDir)) {
  fs.mkdirSync(CONFIG.specDir, { recursive: true });
}

// Watch for specs
fs.watch(CONFIG.specDir, (event, filename) => {
  if (filename && filename.endsWith('.json')) {
    log('info', 'New spec detected: ' + filename);
    // Process spec...
  }
});

// Keep running
setInterval(() => {}, 1000);
log('info', 'Bridge service ready');
`;

  fs.writeFileSync(scriptPath, minimalBridge, "utf8");
  fs.chmodSync(scriptPath, 0o755);
}
