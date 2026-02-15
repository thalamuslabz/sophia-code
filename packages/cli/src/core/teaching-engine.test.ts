import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { SOPHIA_DIR } from "@sophia-code/shared";
import type { PolicyRule } from "@sophia-code/shared";
import {
  generateTeaching,
  isFirstEncounter,
  markEncountered,
  listTopics,
  loadExplainContent,
} from "./teaching-engine.js";
import { initDb, closeDb } from "./database.js";

function makeRule(overrides: Partial<PolicyRule> = {}): PolicyRule {
  return {
    id: "SEC-001",
    name: "No hardcoded secrets",
    severity: "error",
    description: "Do not hardcode secrets in source files.",
    detection: { type: "pattern", patterns: ["password\\s*="] },
    auto_fixable: false,
    teaching: {
      beginner: "Secrets should be in environment variables, never in code.",
      intermediate: "Use .env files and ensure they are gitignored.",
      advanced: "Use a secrets manager like Vault or AWS Secrets Manager.",
      topic: "secrets-management",
      code_example: {
        wrong: 'const password = "hunter2";',
        right: "const password = process.env.DB_PASSWORD;",
      },
    },
    fix_suggestion: "Move the secret to an environment variable.",
    ...overrides,
  };
}

describe("teaching-engine", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sophia-teaching-test-"));
    initDb(tmpDir);
  });

  afterEach(() => {
    closeDb();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe("generateTeaching()", () => {
    it("returns advanced content for advanced level", () => {
      const rule = makeRule();
      const result = generateTeaching(rule, "security", "advanced", false);

      expect(result.severity).toBe("error");
      expect(result.headline).toBe("SEC-001: No hardcoded secrets");
      expect(result.explanation).toBe(rule.teaching!.advanced);
      expect(result.ruleReference).toBe("security.SEC-001");
      // Advanced level should not include learnMore
      expect(result.learnMore).toBeUndefined();
    });

    it("returns intermediate content for intermediate level", () => {
      const rule = makeRule();
      const result = generateTeaching(rule, "security", "intermediate", false);

      expect(result.headline).toBe("No hardcoded secrets");
      expect(result.explanation).toBe(rule.teaching!.intermediate);
      expect(result.ruleReference).toBe("security.SEC-001");
      expect(result.learnMore).toBe("sophia explain secrets-management");
    });

    it("returns beginner content with 'New Concept' for first encounter", () => {
      const rule = makeRule();
      const result = generateTeaching(rule, "security", "beginner", true);

      expect(result.headline).toBe("New Concept: No hardcoded secrets");
      expect(result.explanation).toBe(rule.teaching!.beginner);
      expect(result.codeExample).toEqual(rule.teaching!.code_example);
      expect(result.learnMore).toBe("sophia explain secrets-management");
      expect(result.ruleReference).toBe("security > SEC-001");
    });

    it("returns beginner content with 'Reminder' for repeat encounter", () => {
      const rule = makeRule();
      const result = generateTeaching(rule, "security", "beginner", false);

      expect(result.headline).toBe("Reminder: No hardcoded secrets");
    });

    it("falls back to description when teaching text is missing", () => {
      const rule = makeRule({ teaching: undefined });
      const result = generateTeaching(rule, "security", "beginner", true);

      expect(result.explanation).toBe(rule.description);
    });

    it("handles missing fix_suggestion", () => {
      const rule = makeRule({ fix_suggestion: undefined });
      const result = generateTeaching(rule, "security", "advanced", false);

      expect(result.fixSuggestion).toBe("");
    });

    it("omits learnMore when topic is not set", () => {
      const rule = makeRule({
        teaching: {
          beginner: "Some beginner text",
          // no topic
        },
      });
      const result = generateTeaching(rule, "security", "beginner", true);

      expect(result.learnMore).toBeUndefined();
    });
  });

  describe("isFirstEncounter()", () => {
    it("returns true for new encounters", () => {
      expect(isFirstEncounter(tmpDir, "SEC-001")).toBe(true);
    });

    it("returns false after markEncountered()", () => {
      markEncountered(tmpDir, "SEC-001");
      expect(isFirstEncounter(tmpDir, "SEC-001")).toBe(false);
    });
  });

  describe("markEncountered()", () => {
    it("prevents subsequent isFirstEncounter() from returning true", () => {
      expect(isFirstEncounter(tmpDir, "QA-001")).toBe(true);
      markEncountered(tmpDir, "QA-001");
      expect(isFirstEncounter(tmpDir, "QA-001")).toBe(false);
    });

    it("can be called multiple times without error (upsert)", () => {
      markEncountered(tmpDir, "SEC-001");
      markEncountered(tmpDir, "SEC-001");
      markEncountered(tmpDir, "SEC-001");

      expect(isFirstEncounter(tmpDir, "SEC-001")).toBe(false);
    });
  });

  describe("listTopics()", () => {
    it("returns available topics from .sophia/teaching/", () => {
      const teachingDir = path.join(tmpDir, SOPHIA_DIR, "teaching");
      fs.mkdirSync(teachingDir, { recursive: true });

      fs.writeFileSync(path.join(teachingDir, "secrets-management.md"), "# Secrets\n", "utf-8");
      fs.writeFileSync(path.join(teachingDir, "error-handling.md"), "# Errors\n", "utf-8");

      const topics = listTopics(tmpDir);
      expect(topics).toContain("secrets-management");
      expect(topics).toContain("error-handling");
      expect(topics.length).toBe(2);
    });

    it("returns empty array when teaching directory does not exist", () => {
      const topics = listTopics(tmpDir);
      expect(topics).toEqual([]);
    });

    it("excludes non-markdown files", () => {
      const teachingDir = path.join(tmpDir, SOPHIA_DIR, "teaching");
      fs.mkdirSync(teachingDir, { recursive: true });

      fs.writeFileSync(path.join(teachingDir, "topic.md"), "# Topic\n", "utf-8");
      fs.writeFileSync(path.join(teachingDir, "notes.txt"), "not a topic\n", "utf-8");

      const topics = listTopics(tmpDir);
      expect(topics).toEqual(["topic"]);
    });
  });

  describe("loadExplainContent()", () => {
    it("reads markdown files and parses content", () => {
      const teachingDir = path.join(tmpDir, SOPHIA_DIR, "teaching");
      fs.mkdirSync(teachingDir, { recursive: true });

      const mdContent = `# Secrets Management

Keep secrets out of code.

## Related Policies
- SEC-001
- SEC-002

## Patterns
See .sophia/patterns/env-config.md for more.
`;
      fs.writeFileSync(path.join(teachingDir, "secrets-management.md"), mdContent, "utf-8");

      const result = loadExplainContent(tmpDir, "secrets-management");

      expect(result).not.toBeNull();
      expect(result!.topic).toBe("secrets-management");
      expect(result!.title).toBe("Secrets Management");
      expect(result!.content).toBe(mdContent);
      expect(result!.relatedPolicies).toContain("SEC-001");
      expect(result!.relatedPolicies).toContain("SEC-002");
      expect(result!.relatedPatterns).toContain(".sophia/patterns/env-config.md");
    });

    it("returns null for non-existent topic", () => {
      const result = loadExplainContent(tmpDir, "nonexistent");
      expect(result).toBeNull();
    });

    it("uses topic as title when no heading found", () => {
      const teachingDir = path.join(tmpDir, SOPHIA_DIR, "teaching");
      fs.mkdirSync(teachingDir, { recursive: true });

      fs.writeFileSync(path.join(teachingDir, "no-heading.md"), "Just some text.\n", "utf-8");

      const result = loadExplainContent(tmpDir, "no-heading");
      expect(result).not.toBeNull();
      expect(result!.title).toBe("no-heading");
    });

    it("returns empty arrays when no related policies or patterns", () => {
      const teachingDir = path.join(tmpDir, SOPHIA_DIR, "teaching");
      fs.mkdirSync(teachingDir, { recursive: true });

      fs.writeFileSync(path.join(teachingDir, "basic.md"), "# Basic Topic\nJust text.\n", "utf-8");

      const result = loadExplainContent(tmpDir, "basic");
      expect(result).not.toBeNull();
      expect(result!.relatedPolicies).toEqual([]);
      expect(result!.relatedPatterns).toEqual([]);
    });
  });
});
