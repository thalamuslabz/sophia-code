import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import YAML from "yaml";
import { MARKER_START, MARKER_END, SOPHIA_DIR } from "@sophia-code/shared";
import type { DetectedAgent, SophiaContext, Policy } from "@sophia-code/shared";
import { syncAgent, buildSophiaContext } from "./adapter-engine.js";

function makeTmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "sophia-adapter-test-"));
}

function makeMinimalConfig() {
  return {
    sophia: { version: "1.0.0", initialized: new Date().toISOString() },
    project: {
      name: "test-project",
      tech_stack: { language: "typescript", package_manager: "npm" },
      detected_at: new Date().toISOString(),
    },
    agents: { detected: [] },
    user: { experience_level: "beginner", governance_level: "community" },
    session: { auto_detect: true, stale_timeout_minutes: 30, claim_mode: "warn" },
    policies: { enabled: ["security"], strictness: "moderate" },
    teaching: { enabled: true, show_explanations: true, first_time_hints: true },
    health: { auto_score: true, score_on_commit: false },
  };
}

function makeContext(overrides: Partial<SophiaContext> = {}): SophiaContext {
  return {
    config: makeMinimalConfig() as SophiaContext["config"],
    policies: [],
    agents: [],
    workflows: [],
    sessionInstructions: "test instructions",
    patterns: [],
    ...overrides,
  };
}

function makeAgent(projectRoot: string, overrides: Partial<DetectedAgent> = {}): DetectedAgent {
  return {
    name: "claude-code",
    displayName: "Claude Code",
    configFile: "CLAUDE.md",
    configExists: false,
    existingContent: null,
    hasSophiaBlock: false,
    ...overrides,
  };
}

describe("adapter-engine", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = makeTmpDir();
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe("syncAgent()", () => {
    it("renders template and injects block into file", () => {
      const agent = makeAgent(tmpDir);
      const context = makeContext();

      const result = syncAgent(tmpDir, agent, context);

      expect(result.success).toBe(true);
      expect(result.blockInjected).toBeTruthy();
      expect(result.blockInjected.length).toBeGreaterThan(0);

      const filePath = path.join(tmpDir, agent.configFile);
      expect(fs.existsSync(filePath)).toBe(true);

      const written = fs.readFileSync(filePath, "utf-8");
      expect(written).toContain(MARKER_START);
      expect(written).toContain(MARKER_END);
    });

    it("preserves existing content outside markers", () => {
      const existingContent = "# My Project Rules\n\nDo not delete this.\n";
      const agent = makeAgent(tmpDir, {
        existingContent,
        configExists: true,
      });
      const context = makeContext();

      const result = syncAgent(tmpDir, agent, context);

      expect(result.success).toBe(true);
      expect(result.existingContentPreserved).toBe(true);

      const filePath = path.join(tmpDir, agent.configFile);
      const written = fs.readFileSync(filePath, "utf-8");
      expect(written).toContain("# My Project Rules");
      expect(written).toContain("Do not delete this.");
      expect(written).toContain(MARKER_START);
    });

    it("replaces existing SOPHIA:BEGIN/END block on re-sync (idempotent)", () => {
      const firstBlock = `${MARKER_START}\nold content\n${MARKER_END}`;
      const existingContent = `# Header\n\n${firstBlock}\n\n# Footer\n`;
      const agent = makeAgent(tmpDir, {
        existingContent,
        configExists: true,
        hasSophiaBlock: true,
      });
      const context = makeContext();

      const result = syncAgent(tmpDir, agent, context);

      expect(result.success).toBe(true);

      const filePath = path.join(tmpDir, agent.configFile);
      const written = fs.readFileSync(filePath, "utf-8");

      // Should not contain the old content
      expect(written).not.toContain("old content");
      // Should still have header and footer
      expect(written).toContain("# Header");
      expect(written).toContain("# Footer");
      // Should have exactly one SOPHIA:BEGIN marker
      const beginCount = written.split(MARKER_START).length - 1;
      expect(beginCount).toBe(1);
    });

    it("with dryRun returns block without writing", () => {
      const agent = makeAgent(tmpDir);
      const context = makeContext();

      const result = syncAgent(tmpDir, agent, context, { dryRun: true });

      expect(result.success).toBe(true);
      expect(result.blockInjected).toBeTruthy();

      const filePath = path.join(tmpDir, agent.configFile);
      expect(fs.existsSync(filePath)).toBe(false);
    });

    it("creates backup before first injection", () => {
      const existingContent = "# Existing rules\nKeep this safe.\n";
      const agent = makeAgent(tmpDir, {
        existingContent,
        configExists: true,
      });
      const context = makeContext();

      syncAgent(tmpDir, agent, context);

      const backupPath = path.join(tmpDir, agent.configFile + ".sophia-backup");
      expect(fs.existsSync(backupPath)).toBe(true);
      const backupContent = fs.readFileSync(backupPath, "utf-8");
      expect(backupContent).toBe(existingContent);
    });

    it("returns failure when template does not exist", () => {
      const agent = makeAgent(tmpDir, { name: "nonexistent-agent" });
      const context = makeContext();

      const result = syncAgent(tmpDir, agent, context);

      expect(result.success).toBe(false);
    });
  });

  describe("buildSophiaContext()", () => {
    it("loads config and policies", () => {
      // Set up .sophia/config.yaml
      const sophiaDir = path.join(tmpDir, SOPHIA_DIR);
      fs.mkdirSync(sophiaDir, { recursive: true });

      const config = makeMinimalConfig();
      fs.writeFileSync(
        path.join(sophiaDir, "config.yaml"),
        YAML.stringify(config),
        "utf-8",
      );

      const context = buildSophiaContext(tmpDir);

      expect(context.config).toBeDefined();
      expect(context.config.project.name).toBe("test-project");
      expect(context.policies).toEqual([]);
      expect(context.sessionInstructions).toBeTruthy();
    });

    it("loads patterns from .sophia/patterns/", () => {
      const sophiaDir = path.join(tmpDir, SOPHIA_DIR);
      const patternsDir = path.join(sophiaDir, "patterns");
      fs.mkdirSync(patternsDir, { recursive: true });

      const config = makeMinimalConfig();
      fs.writeFileSync(
        path.join(sophiaDir, "config.yaml"),
        YAML.stringify(config),
        "utf-8",
      );

      fs.writeFileSync(
        path.join(patternsDir, "error-handling.md"),
        "# Error Handling Pattern\n",
        "utf-8",
      );

      const context = buildSophiaContext(tmpDir);

      expect(context.patterns).toBeDefined();
      expect(context.patterns!.length).toBe(1);
      expect(context.patterns![0].name).toBe("error handling");
      expect(context.patterns![0].file).toBe(".sophia/patterns/error-handling.md");
    });
  });

  describe("injectBlock() behavior (via syncAgent)", () => {
    it("handles empty content by wrapping block only", () => {
      const agent = makeAgent(tmpDir, { existingContent: "" });
      const context = makeContext();

      syncAgent(tmpDir, agent, context);

      const filePath = path.join(tmpDir, agent.configFile);
      const written = fs.readFileSync(filePath, "utf-8");

      // Should start with the marker
      expect(written.startsWith(MARKER_START)).toBe(true);
      expect(written).toContain(MARKER_END);
    });

    it("handles content with existing block by replacing it", () => {
      const block = `${MARKER_START}\nold stuff\n${MARKER_END}`;
      const existingContent = `before\n${block}\nafter`;
      const agent = makeAgent(tmpDir, {
        existingContent,
        hasSophiaBlock: true,
      });
      const context = makeContext();

      syncAgent(tmpDir, agent, context);

      const filePath = path.join(tmpDir, agent.configFile);
      const written = fs.readFileSync(filePath, "utf-8");

      expect(written).toContain("before");
      expect(written).toContain("after");
      expect(written).not.toContain("old stuff");
      expect(written).toContain(MARKER_START);
    });

    it("handles content without block by appending", () => {
      const existingContent = "# My Rules\n\nSome content here.";
      const agent = makeAgent(tmpDir, {
        existingContent,
        configExists: true,
      });
      const context = makeContext();

      syncAgent(tmpDir, agent, context);

      const filePath = path.join(tmpDir, agent.configFile);
      const written = fs.readFileSync(filePath, "utf-8");

      // Existing content should come first
      expect(written.indexOf("# My Rules")).toBeLessThan(written.indexOf(MARKER_START));
    });
  });
});
