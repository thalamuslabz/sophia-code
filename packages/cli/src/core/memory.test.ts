import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { initDb, closeDb } from "./database.js";
import {
  recordCorrection,
  recordPattern,
  recordDecision,
  findCorrections,
  findPatterns,
  getMemoryStats,
  markCorrectionApplied,
  markPatternUsed,
} from "./memory.js";

describe("memory", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sophia-memory-test-"));
    initDb(tmpDir);
  });

  afterEach(() => {
    closeDb();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe("recordCorrection and findCorrections", () => {
    it("records a correction and finds it by keyword", () => {
      recordCorrection(tmpDir, {
        pattern: "var x = ...",
        reason: "Use const instead of var",
        correction: "const x = ...",
        keywords: ["var", "const", "declaration"],
        severity: "medium",
      });

      const results = findCorrections(tmpDir, { keywords: ["var"] });

      expect(results).toHaveLength(1);
      expect(results[0]!.pattern).toBe("var x = ...");
      expect(results[0]!.correction).toBe("const x = ...");
      expect(results[0]!.keywords).toContain("var");
    });

    it("returns empty when no keywords match", () => {
      recordCorrection(tmpDir, {
        pattern: "var x",
        reason: "use const",
        correction: "const x",
        keywords: ["var"],
        severity: "low",
      });

      const results = findCorrections(tmpDir, { keywords: ["python"] });
      expect(results).toHaveLength(0);
    });

    it("returns all corrections when no filters are given", () => {
      recordCorrection(tmpDir, {
        pattern: "a",
        reason: "r",
        correction: "c",
        keywords: ["x"],
        severity: "low",
      });
      recordCorrection(tmpDir, {
        pattern: "b",
        reason: "r",
        correction: "c",
        keywords: ["y"],
        severity: "high",
      });

      const results = findCorrections(tmpDir, {});
      expect(results).toHaveLength(2);
    });

    it("respects limit parameter", () => {
      for (let i = 0; i < 10; i++) {
        recordCorrection(tmpDir, {
          pattern: `pattern-${i}`,
          reason: "reason",
          correction: "correction",
          keywords: ["common"],
          severity: "low",
        });
      }

      const results = findCorrections(tmpDir, { keywords: ["common"], limit: 3 });
      expect(results).toHaveLength(3);
    });
  });

  describe("recordPattern and findPatterns", () => {
    it("records a pattern and finds it by keyword", () => {
      recordPattern(tmpDir, {
        description: "Repository pattern",
        implementation: "class UserRepo { ... }",
        keywords: ["repository", "data-access"],
        effectiveness: "high",
      });

      const results = findPatterns(tmpDir, { keywords: ["repository"] });

      expect(results).toHaveLength(1);
      expect(results[0]!.description).toBe("Repository pattern");
      expect(results[0]!.effectiveness).toBe("high");
    });

    it("returns all patterns when no keywords given", () => {
      recordPattern(tmpDir, {
        description: "Pattern A",
        implementation: "impl A",
        keywords: ["a"],
        effectiveness: "low",
      });
      recordPattern(tmpDir, {
        description: "Pattern B",
        implementation: "impl B",
        keywords: ["b"],
        effectiveness: "medium",
      });

      const results = findPatterns(tmpDir, {});
      expect(results).toHaveLength(2);
    });

    it("stores optional context", () => {
      recordPattern(tmpDir, {
        description: "Singleton",
        context: "When you need exactly one instance",
        implementation: "class Singleton { ... }",
        keywords: ["singleton"],
        effectiveness: "medium",
      });

      const results = findPatterns(tmpDir, { keywords: ["singleton"] });
      expect(results[0]!.context).toBe("When you need exactly one instance");
    });
  });

  describe("recordDecision", () => {
    it("records a decision and includes it in stats", () => {
      const id = recordDecision(tmpDir, {
        decision: "Use PostgreSQL over MySQL",
        rationale: "Better JSON support",
        alternatives: ["MySQL", "SQLite"],
        filesAffected: ["docker-compose.yml"],
      });

      expect(id).toBeGreaterThan(0);

      const stats = getMemoryStats(tmpDir);
      expect(stats.totalDecisions).toBe(1);
    });

    it("records a decision with minimal fields", () => {
      const id = recordDecision(tmpDir, {
        decision: "Use TypeScript",
      });

      expect(id).toBeGreaterThan(0);
    });
  });

  describe("getMemoryStats", () => {
    it("returns correct counts", () => {
      recordCorrection(tmpDir, {
        pattern: "p1",
        reason: "r",
        correction: "c",
        keywords: ["k"],
        severity: "low",
      });
      recordCorrection(tmpDir, {
        pattern: "p2",
        reason: "r",
        correction: "c",
        keywords: ["k"],
        severity: "medium",
      });
      recordPattern(tmpDir, {
        description: "d",
        implementation: "i",
        keywords: ["k"],
        effectiveness: "high",
      });
      recordDecision(tmpDir, { decision: "d1" });
      recordDecision(tmpDir, { decision: "d2" });
      recordDecision(tmpDir, { decision: "d3" });

      const stats = getMemoryStats(tmpDir);

      expect(stats.totalCorrections).toBe(2);
      expect(stats.totalPatterns).toBe(1);
      expect(stats.totalDecisions).toBe(3);
    });

    it("returns zeros for empty database", () => {
      const stats = getMemoryStats(tmpDir);

      expect(stats.totalCorrections).toBe(0);
      expect(stats.totalPatterns).toBe(0);
      expect(stats.totalDecisions).toBe(0);
      expect(stats.mostCommonMistakes).toEqual([]);
      expect(stats.mostUsedPatterns).toEqual([]);
    });
  });

  describe("markCorrectionApplied", () => {
    it("increments times_applied count", () => {
      const id = recordCorrection(tmpDir, {
        pattern: "var x",
        reason: "use const",
        correction: "const x",
        keywords: ["var"],
        severity: "medium",
      });

      markCorrectionApplied(tmpDir, id);
      markCorrectionApplied(tmpDir, id);

      const results = findCorrections(tmpDir, {});
      expect(results[0]!.times_applied).toBe(2);
    });
  });

  describe("markPatternUsed", () => {
    it("increments times_used count", () => {
      const id = recordPattern(tmpDir, {
        description: "Singleton",
        implementation: "class S {}",
        keywords: ["singleton"],
        effectiveness: "medium",
      });

      markPatternUsed(tmpDir, id);
      markPatternUsed(tmpDir, id);
      markPatternUsed(tmpDir, id);

      const results = findPatterns(tmpDir, {});
      expect(results[0]!.times_used).toBe(3);
    });
  });
});
