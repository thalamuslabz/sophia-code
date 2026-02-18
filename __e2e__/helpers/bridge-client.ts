/**
 * Bridge Client - Helpers for testing the Auto-Claude bridge
 */

import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import * as path from 'path';
import { existsSync, mkdirSync } from 'fs';

interface BridgeServiceConfig {
  specDir: string;
  projectDir: string;
  processedDir?: string;
}

let bridgeProcess: ChildProcess | null = null;

export async function startBridgeService(
  config: BridgeServiceConfig,
  timeout: number = 5000
): Promise<ChildProcess> {
  const logPath = path.join(config.specDir, '..', 'bridge.log');
  
  // Ensure directories exist
  [config.specDir, config.projectDir, config.processedDir].forEach(dir => {
    if (dir && !existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  });

  // Start bridge process
  bridgeProcess = spawn('node', [
    path.join(__dirname, 'bridge.js')
  ], {
    env: {
      ...process.env,
      AC_SPEC_DIR: config.specDir,
      AC_PROJECT_DIR: config.projectDir,
      AC_PROCESSED_DIR: config.processedDir || path.join(config.specDir, '..', 'processed'),
      AC_LOG_FILE: logPath
    },
    detached: false,
    stdio: ['ignore', 'pipe', 'pipe']
  });

  // Wait for bridge to start
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => {
      // Check if process is still running
      if (bridgeProcess && !bridgeProcess.killed) {
        resolve(); // Assume it's running even if we didn't see the message
      } else {
        reject(new Error('Bridge failed to start within timeout'));
      }
    }, timeout);

    bridgeProcess?.stdout?.on('data', (data: Buffer) => {
      const output = data.toString();
      console.log('Bridge:', output.trim());
      if (output.includes('Bridge started') || output.includes('watching')) {
        clearTimeout(timer);
        resolve();
      }
    });

    bridgeProcess?.stderr?.on('data', (data: Buffer) => {
      const err = data.toString();
      console.error('Bridge stderr:', err);
      // Don't fail on stderr - just log it
    });

    bridgeProcess?.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    
    bridgeProcess?.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        clearTimeout(timer);
        reject(new Error(`Bridge exited with code ${code}`));
      }
    });
  });

  return bridgeProcess;
}

export async function stopBridgeService(process: ChildProcess | null): Promise<void> {
  if (process && !process.killed) {
    process.kill('SIGTERM');
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (!process.killed) {
      process.kill('SIGKILL');
    }
  }
  bridgeProcess = null;
}

export function readBridgeLog(logPath?: string): string {
  // First check if there's a test-specific log file
  const testLogPath = process.env.AC_LOG_FILE;
  const defaultPath = path.join(process.env.HOME || '/tmp', '.auto-claude', 'bridge.log');
  const logFile = logPath || testLogPath || defaultPath;
  
  if (!existsSync(logFile)) {
    return '';
  }
  
  try {
    return require('fs').readFileSync(logFile, 'utf-8');
  } catch {
    return '';
  }
}

export async function waitForBridgeDetection(
  specId: string,
  timeout: number = 5000
): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const log = readBridgeLog();
    if (log.includes(`New spec detected: ${specId}`) || 
        log.includes(specId)) {
      return true;
    }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return false;
}

export async function cleanupBridgeTest(
  config: BridgeServiceConfig
): Promise<void> {
  // Stop service
  await stopBridgeService(bridgeProcess);
  
  // Cleanup directories
  const dirs = [
    config.specDir,
    config.projectDir,
    config.processedDir || path.join(config.specDir, '..', 'processed'),
    path.join(config.specDir, '..', 'errors')
  ];
  
  for (const dir of dirs) {
    if (existsSync(dir)) {
      try {
        await fs.rm(dir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
    }
  }
  
  // Cleanup log
  const logPath = path.join(config.specDir, '..', 'bridge.log');
  if (existsSync(logPath)) {
    try {
      await fs.unlink(logPath);
    } catch {
      // Ignore
    }
  }
}
