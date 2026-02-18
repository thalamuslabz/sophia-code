/**
 * Test Setup - E2E Testing Utilities
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';

export interface TestEnvironment {
  testDir: string;
  specDir: string;
  projectDir: string;
  processedDir: string;
  errorDir: string;
  testProjectDir: string;
  logPath: string;
  configPath: string;
}

export async function setupE2EEnvironment(): Promise<TestEnvironment> {
  const testId = `e2e-${Date.now()}`;
  const baseDir = path.join(process.env.HOME || '/tmp', '.thalamus-e2e');
  const testDir = path.join(baseDir, testId);
  
  const env: TestEnvironment = {
    testDir,
    specDir: path.join(testDir, 'specs'),
    projectDir: path.join(testDir, 'projects'),
    processedDir: path.join(testDir, 'processed'),
    errorDir: path.join(testDir, 'errors'),
    testProjectDir: path.join(testDir, 'projects', 'test-react-app'),
    logPath: path.join(testDir, 'test.log'),
    configPath: path.join(testDir, 'config.json')
  };

  // Create all directories
  const dirs = [
    env.specDir,
    env.projectDir,
    env.processedDir,
    env.errorDir,
    env.testProjectDir,
    path.join(env.testProjectDir, '.auto-claude', 'specs'),
    path.join(testDir, 'obsidian', '06-PROJECTS', 'TEST'),
    path.join(testDir, 'leantime')
  ];

  for (const dir of dirs) {
    mkdirSync(dir, { recursive: true });
  }

  // Write test config
  writeFileSync(env.configPath, JSON.stringify({
    testId,
    created: new Date().toISOString(),
    services: {
      bridge: 'stopped',
      bridgePort: 0
    }
  }, null, 2));

  console.log(`✓ E2E environment ready: ${testDir}`);
  return env;
}

export async function cleanupE2EEnvironment(env: TestEnvironment): Promise<void> {
  try {
    await fs.rm(env.testDir, { recursive: true, force: true });
    console.log(`✓ Cleaned up: ${env.testDir}`);
  } catch (error) {
    console.error(`✗ Cleanup failed: ${error}`);
  }
}

export async function waitFor(
  condition: () => Promise<boolean> | boolean,
  timeout: number = 5000,
  interval: number = 100
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const result = await condition();
    if (result) return;
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Timeout waiting for condition after ${timeout}ms`);
}

export async function waitForFile(
  filePath: string,
  timeout: number = 5000
): Promise<void> {
  await waitFor(() => existsSync(filePath), timeout);
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf-8');
}

export async function readJson<T = any>(filePath: string): Promise<T> {
  const content = await readFile(filePath);
  return JSON.parse(content);
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  const dir = path.dirname(filePath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  await fs.writeFile(filePath, content, 'utf-8');
}

export async function createSpecFile(
  specDir: string,
  spec: Record<string, any>
): Promise<string> {
  const specId = spec.id || `spec-${Date.now()}`;
  const filePath = path.join(specDir, `${specId}.json`);
  await writeFile(filePath, JSON.stringify(spec, null, 2));
  return filePath;
}

export async function writeLog(env: TestEnvironment, message: string): Promise<void> {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] ${message}\n`;
  writeFileSync(env.logPath, entry, { flag: 'a' });
}

export function readLog(env: TestEnvironment): string {
  if (!existsSync(env.logPath)) return '';
  return readFileSync(env.logPath, 'utf-8');
}

// Mock webhook server for testing
export function startMockWebhookServer(port: number = 9876): { close: () => void } {
  const http = require('http');
  const requests: any[] = [];

  const server = http.createServer((req: any, res: any) => {
    let body = '';
    req.on('data', (chunk: Buffer) => body += chunk);
    req.on('end', () => {
      requests.push({
        url: req.url,
        method: req.method,
        headers: req.headers,
        body: body ? JSON.parse(body) : null,
        timestamp: new Date().toISOString()
      });
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: true, requestId: `req-${Date.now()}` }));
    });
  });

  server.listen(port);
  console.log(`Mock webhook server on port ${port}`);

  return {
    close: () => {
      server.close();
      console.log('Mock webhook server closed');
    },
    getRequests: () => requests,
    getLastRequest: () => requests[requests.length - 1]
  } as any;
}
