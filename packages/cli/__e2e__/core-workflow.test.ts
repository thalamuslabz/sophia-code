/**
 * E2E Test: CLI Core Workflow
 *
 * Tests the complete CLI workflow:
 * 1. Initialize a new project
 * 2. Detect project configuration
 * 3. Run health check
 * 4. Generate configuration
 * 5. Verify database operations
 *
 * Based on thalamus-orchestrator E2E patterns
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { Database } from "../src/core/database.js";
import { calculateHealth } from "../src/core/health.js";
import { generateDefaultConfig, writeConfig, readConfig } from "../src/core/config.js";
import { createProjectProfile, type ProjectProfile } from "@sophia-code/shared";

describe("E2E: CLI Core Workflow", () => {
  let testProjectPath: string;
  let db: Database;

  const testProfile: ProjectProfile = {
    language: "typescript",
    framework: "next.js",
    database: "postgresql",
    orm: "prisma",
    packageManager: "npm",
    testRunner: "vitest",
  };

  beforeAll(() => {
    // Create temporary test project
    testProjectPath = fs.mkdtempSync(path.join(os.tmpdir(), "sophia-cli-e2e-"));

    // Initialize .sophia directory
    const sophiaDir = path.join(testProjectPath, ".sophia");
    fs.mkdirSync(sophiaDir, { recursive: true });

    // Initialize database
    db = new Database(testProjectPath);
  });

  afterAll(() => {
    db.close();

    // Cleanup test project
    if (fs.existsSync(testProjectPath)) {
      fs.rmSync(testProjectPath, { recursive: true, force: true });
    }
  });

  describe("Phase 1: Project Initialization", () => {
    it("should create .sophia directory structure", () => {
      const sophiaDir = path.join(testProjectPath, ".sophia");
      fs.mkdirSync(path.join(sophiaDir, "sessions"), { recursive: true });
      fs.mkdirSync(path.join(sophiaDir, "health"), { recursive: true });

      expect(fs.existsSync(sophiaDir)).toBe(true);
      expect(fs.existsSync(path.join(sophiaDir, "sessions"))).toBe(true);
    });

    it("should generate default configuration", () => {
      const config = generateDefaultConfig("test-project", testProfile, [
        { name: "claude-code", config_file: "CLAUDE.md", status: "active" },
      ]);

      expect(config.sophia.version).toBe("1.0.0");
      expect(config.project.name).toBe("test-project");
      expect(config.project.tech_stack.language).toBe("typescript");
      expect(config.project.tech_stack.framework).toBe("next.js");
      expect(config.project.tech_stack.test_runner).toBe("vitest");
    });

    it("should write and read configuration", () => {
      const config = generateDefaultConfig("test-project", testProfile, []);

      writeConfig(testProjectPath, config);

      const read = readConfig(testProjectPath);
      expect(read).not.toBeNull();
      expect(read?.project.name).toBe("test-project");
    });
  });

  describe("Phase 2: Database Operations", () => {
    it("should store and retrieve sessions", () => {
      const session = db.createSession("claude-code", "Test intent");

      expect(session.id).toMatch(/^ses-[a-z0-9]{7}$/);
      expect(session.agent).toBe("claude-code");
      expect(session.intent).toBe("Test intent");

      const retrieved = db.getSession(session.id);
      expect(retrieved).not.toBeNull();
      expect(retrieved?.id).toBe(session.id);
    });

    it("should list active sessions", () => {
      // Create a session
      db.createSession("claude-code", "Active session");

      const active = db.listActiveSessions();
      expect(Array.isArray(active)).toBe(true);
      expect(active.length).toBeGreaterThan(0);
    });

    it("should record health scores", () => {
      db.recordHealthScore(85, "B+", { categories: {} });

      const history = db.getHealthHistory(1);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0].score).toBe(85);
      expect(history[0].grade).toBe("B+");
    });

    it("should add and retrieve bulletin entries", () => {
      db.addBulletinEntry("info", "Test message", { test: true });

      const entries = db.getRecentBulletin(10);
      expect(entries.length).toBeGreaterThan(0);
      expect(entries[0].message).toBe("Test message");
    });

    it("should manage claims", () => {
      const session = db.createSession("claude-code", "Test");
      db.recordClaim(session.id, "auth-flow", "correction");

      const claims = db.getActiveClaims();
      expect(claims.length).toBeGreaterThan(0);
      expect(claims[0].pattern).toBe("auth-flow");
    });
  });

  describe("Phase 3: Health Calculation", () => {
    it("should calculate health report", () => {
      // Create required files for health check
      fs.writeFileSync(path.join(testProjectPath, "CLAUDE.md"), "# Test");
      fs.writeFileSync(path.join(testProjectPath, "README.md"), "# Test");

      const report = calculateHealth(testProjectPath);

      expect(report).toHaveProperty("project");
      expect(report).toHaveProperty("overall_score");
      expect(report).toHaveProperty("grade");
      expect(report).toHaveProperty("categories");
      expect(report).toHaveProperty("timestamp");

      expect(typeof report.overall_score).toBe("number");
      expect(report.grade).toMatch(/^[A-F][+-]?$/);
    });

    it("should include all health categories", () => {
      const report = calculateHealth(testProjectPath);

      expect(report.categories).toHaveProperty("security");
      expect(report.categories).toHaveProperty("testing");
      expect(report.categories).toHaveProperty("quality");
      expect(report.categories).toHaveProperty("documentation");
      expect(report.categories).toHaveProperty("hygiene");
      expect(report.categories).toHaveProperty("build-config");
      expect(report.categories).toHaveProperty("governance");
    });
  });

  describe("Phase 4: Session Lifecycle", () => {
    it("should track session start and end", () => {
      const session = db.createSession("claude-code", "Lifecycle test");

      expect(session.started_at).toBeDefined();
      expect(session.ended_at).toBeNull();

      db.endSession(session.id);

      const ended = db.getSession(session.id);
      expect(ended?.ended_at).toBeDefined();
    });

    it("should update session intent", () => {
      const session = db.createSession("claude-code", "Initial intent");

      db.updateSessionIntent(session.id, "Updated intent");

      const updated = db.getSession(session.id);
      expect(updated?.intent).toBe("Updated intent");
    });
  });
});
