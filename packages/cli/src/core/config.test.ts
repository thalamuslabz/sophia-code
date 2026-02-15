import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { generateDefaultConfig, writeConfig, readConfig, configExists } from "./config";
import type { ProjectProfile, DetectedAgentConfig } from "@sophia-code/shared";

describe("config", () => {
  let tmpDir: string;

  const testProfile: ProjectProfile = {
    language: "typescript",
    framework: "next.js",
    database: "postgresql",
    orm: "prisma",
    packageManager: "pnpm",
    testRunner: "vitest",
  };

  const testAgents: DetectedAgentConfig[] = [
    { name: "claude-code", config_file: "CLAUDE.md", status: "active" },
  ];

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sophia-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe("generateDefaultConfig", () => {
    it("produces a valid config with all required sections", () => {
      const config = generateDefaultConfig("my-project", testProfile, testAgents);

      expect(config.sophia.version).toBe("1.0.0");
      expect(config.sophia.initialized).toBeTruthy();
      expect(config.project.name).toBe("my-project");
      expect(config.project.tech_stack.language).toBe("typescript");
      expect(config.project.tech_stack.framework).toBe("next.js");
      expect(config.project.tech_stack.database).toBe("postgresql");
      expect(config.project.tech_stack.orm).toBe("prisma");
      expect(config.project.tech_stack.package_manager).toBe("pnpm");
      expect(config.project.tech_stack.test_runner).toBe("vitest");
      expect(config.agents.detected).toEqual(testAgents);
      expect(config.user.experience_level).toBe("beginner");
      expect(config.user.governance_level).toBe("enterprise");
      expect(config.session.auto_detect).toBe(true);
      expect(config.session.claim_mode).toBe("warn");
      expect(config.policies.enabled).toContain("security");
      expect(config.policies.strictness).toBe("strict");
      expect(config.teaching.enabled).toBe(true);
      expect(config.health.auto_score).toBe(true);
    });

    it("sets initialized and detected_at to ISO date strings", () => {
      const before = new Date().toISOString();
      const config = generateDefaultConfig("test", testProfile, []);
      const after = new Date().toISOString();

      expect(config.sophia.initialized >= before).toBe(true);
      expect(config.sophia.initialized <= after).toBe(true);
      expect(config.project.detected_at >= before).toBe(true);
      expect(config.project.detected_at <= after).toBe(true);
    });
  });

  describe("writeConfig", () => {
    it("creates config.yaml inside .sophia directory", () => {
      const config = generateDefaultConfig("test-project", testProfile, testAgents);
      writeConfig(tmpDir, config);

      const configPath = path.join(tmpDir, ".sophia", "config.yaml");
      expect(fs.existsSync(configPath)).toBe(true);

      const content = fs.readFileSync(configPath, "utf-8");
      expect(content).toContain("test-project");
      expect(content).toContain("typescript");
    });

    it("creates .sophia directory if it does not exist", () => {
      const sophiaDir = path.join(tmpDir, ".sophia");
      expect(fs.existsSync(sophiaDir)).toBe(false);

      const config = generateDefaultConfig("test", testProfile, []);
      writeConfig(tmpDir, config);

      expect(fs.existsSync(sophiaDir)).toBe(true);
    });
  });

  describe("readConfig", () => {
    it("reads and validates a previously written config", () => {
      const config = generateDefaultConfig("read-test", testProfile, testAgents);
      writeConfig(tmpDir, config);

      const loaded = readConfig(tmpDir);
      expect(loaded.project.name).toBe("read-test");
      expect(loaded.project.tech_stack.language).toBe("typescript");
      expect(loaded.agents.detected).toEqual(testAgents);
    });

    it("throws when config.yaml does not exist", () => {
      expect(() => readConfig(tmpDir)).toThrow(".sophia/config.yaml not found");
    });
  });

  describe("configExists", () => {
    it("returns false when no config exists", () => {
      expect(configExists(tmpDir)).toBe(false);
    });

    it("returns true after writing config", () => {
      const config = generateDefaultConfig("exists-test", testProfile, []);
      writeConfig(tmpDir, config);

      expect(configExists(tmpDir)).toBe(true);
    });
  });
});
