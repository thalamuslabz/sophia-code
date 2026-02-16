/**
 * Test project fixtures for E2E testing
 * Based on thalamus-orchestrator test patterns
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";

export interface TestProjectConfig {
  name: string;
  language: "typescript" | "python" | "go";
  framework?: string;
  testRunner?: string;
  packageManager?: string;
}

/**
 * Create a temporary test project directory
 */
export function createTestProject(config: TestProjectConfig): string {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `sophia-test-${config.name}-`));

  // Create .sophia directory structure
  const sophiaDir = path.join(tmpDir, ".sophia");
  fs.mkdirSync(sophiaDir, { recursive: true });

  // Create config file
  const configContent = {
    sophia: {
      version: "1.0.0",
      initialized: true,
    },
    project: {
      name: config.name,
      tech_stack: {
        language: config.language,
        framework: config.framework,
        test_runner: config.testRunner,
        package_manager: config.packageManager,
      },
    },
    agents: {
      detected: [{ name: "claude-code", config_file: "CLAUDE.md", status: "active" }],
    },
    user: {
      experience_level: "intermediate",
      governance_level: "standard",
    },
    session: {
      auto_detect: true,
      claim_mode: "warn",
    },
    policies: {
      enabled: ["security", "testing", "documentation"],
    },
  };

  fs.writeFileSync(
    path.join(sophiaDir, "config.json"),
    JSON.stringify(configContent, null, 2)
  );

  // Create empty database
  const Database = require("better-sqlite3");
  const db = new Database(path.join(sophiaDir, "sophia.db"));

  // Initialize schema
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      agent TEXT NOT NULL,
      intent TEXT,
      started_at TEXT NOT NULL,
      ended_at TEXT,
      context TEXT
    );

    CREATE TABLE IF NOT EXISTS claims (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      pattern TEXT NOT NULL,
      claim_type TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS bulletin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entry_type TEXT NOT NULL,
      message TEXT NOT NULL,
      context TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS health_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      score INTEGER NOT NULL,
      grade TEXT NOT NULL,
      details TEXT,
      created_at TEXT NOT NULL
    );
  `);

  db.close();

  // Create CLAUDE.md
  fs.writeFileSync(
    path.join(tmpDir, "CLAUDE.md"),
    `# ${config.name}\n\nTest project for E2E testing.\n`
  );

  return tmpDir;
}

/**
 * Clean up a test project directory
 */
export function cleanupTestProject(projectPath: string): void {
  if (fs.existsSync(projectPath)) {
    fs.rmSync(projectPath, { recursive: true, force: true });
  }
}

/**
 * Standard test project configurations
 */
export const TestProjects = {
  typescript: {
    name: "test-ts-app",
    language: "typescript" as const,
    framework: "next.js",
    testRunner: "vitest",
    packageManager: "npm",
  },
  python: {
    name: "test-py-app",
    language: "python" as const,
    framework: "fastapi",
    testRunner: "pytest",
    packageManager: "pip",
  },
  go: {
    name: "test-go-app",
    language: "go" as const,
    testRunner: "go test",
    packageManager: "go mod",
  },
};
