import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { SOPHIA_DIR } from "@sophia-code/shared";
import { calculateHealth, getHealthHistory } from "./health.js";
import { initDb, closeDb } from "./database.js";

function setupProject(tmpDir: string, files: Record<string, string> = {}): void {
  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(tmpDir, filePath);
    const dir = path.dirname(fullPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(fullPath, content, "utf-8");
  }
}

describe("health", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sophia-health-test-"));
    initDb(tmpDir);
  });

  afterEach(() => {
    closeDb();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe("calculateHealth()", () => {
    it("returns a valid HealthReport", () => {
      setupProject(tmpDir, {
        ".gitignore": "node_modules\n.env\n",
        "README.md": "# Test\n",
      });

      const report = calculateHealth(tmpDir);

      expect(report).toBeDefined();
      expect(report.project).toBe(path.basename(tmpDir));
      expect(report.timestamp).toBeTruthy();
      expect(typeof report.overall_score).toBe("number");
      expect(report.overall_score).toBeGreaterThanOrEqual(0);
      expect(report.overall_score).toBeLessThanOrEqual(100);
      expect(report.grade).toBeTruthy();
      expect(report.categories).toBeDefined();
    });

    it("has all expected health categories", () => {
      setupProject(tmpDir, { ".gitignore": "node_modules\n" });

      const report = calculateHealth(tmpDir);
      const expectedCategories = [
        "security",
        "testing",
        "quality",
        "documentation",
        "hygiene",
      ];

      for (const category of expectedCategories) {
        expect(report.categories[category]).toBeDefined();
        expect(typeof report.categories[category].score).toBe("number");
      }
    });

    it("stores report in database", () => {
      setupProject(tmpDir, { ".gitignore": "node_modules\n" });

      calculateHealth(tmpDir);

      const history = getHealthHistory(tmpDir);
      expect(history.length).toBe(1);
      expect(typeof history[0].score).toBe("number");
      expect(history[0].grade).toBeTruthy();
    });

    it("writes report.json to .sophia/health/", () => {
      setupProject(tmpDir, { ".gitignore": "node_modules\n" });

      calculateHealth(tmpDir);

      const reportPath = path.join(tmpDir, SOPHIA_DIR, "health", "report.json");
      expect(fs.existsSync(reportPath)).toBe(true);

      const written = JSON.parse(fs.readFileSync(reportPath, "utf-8"));
      expect(written.overall_score).toBeDefined();
      expect(written.grade).toBeDefined();
    });

    it("gives higher security score when .env is in .gitignore", () => {
      setupProject(tmpDir, {
        ".gitignore": "node_modules\n.env\n",
        ".env": "SECRET=abc",
      });
      const withIgnore = calculateHealth(tmpDir);

      // Reset for second calculation
      closeDb();
      const tmpDir2 = fs.mkdtempSync(path.join(os.tmpdir(), "sophia-health-test2-"));
      initDb(tmpDir2);

      setupProject(tmpDir2, {
        ".env": "SECRET=abc",
        // No .gitignore
      });
      const withoutIgnore = calculateHealth(tmpDir2);

      expect(withIgnore.categories["security"].score).toBeGreaterThan(
        withoutIgnore.categories["security"].score,
      );

      closeDb();
      fs.rmSync(tmpDir2, { recursive: true, force: true });
      // Reinit for afterEach cleanup
      initDb(tmpDir);
    });
  });

  describe("scoreToGrade()", () => {
    // scoreToGrade is not exported directly, but we can test it through calculateHealth
    // by checking the grade corresponds to the overall_score
    it("maps scores to correct letter grades via calculateHealth", () => {
      setupProject(tmpDir, {
        ".gitignore": "node_modules\n.env\n",
        "README.md": "# Test\n",
      });

      const report = calculateHealth(tmpDir);
      const score = report.overall_score;
      const grade = report.grade;

      // Verify the grade matches the documented scale
      if (score >= 97) expect(grade).toBe("A+");
      else if (score >= 93) expect(grade).toBe("A");
      else if (score >= 90) expect(grade).toBe("A-");
      else if (score >= 87) expect(grade).toBe("B+");
      else if (score >= 83) expect(grade).toBe("B");
      else if (score >= 80) expect(grade).toBe("B-");
      else if (score >= 77) expect(grade).toBe("C+");
      else if (score >= 73) expect(grade).toBe("C");
      else if (score >= 70) expect(grade).toBe("C-");
      else if (score >= 67) expect(grade).toBe("D+");
      else if (score >= 63) expect(grade).toBe("D");
      else if (score >= 60) expect(grade).toBe("D-");
      else expect(grade).toBe("F");
    });
  });

  describe("getHealthHistory()", () => {
    it("returns stored history", () => {
      setupProject(tmpDir, { ".gitignore": "node_modules\n" });

      calculateHealth(tmpDir);
      calculateHealth(tmpDir);

      const history = getHealthHistory(tmpDir);
      expect(history.length).toBe(2);
      expect(history[0].score).toBeDefined();
      expect(history[0].grade).toBeDefined();
      expect(history[0].date).toBeDefined();
    });

    it("returns entries in reverse chronological order", async () => {
      setupProject(tmpDir, { ".gitignore": "node_modules\n" });

      calculateHealth(tmpDir);
      await new Promise((r) => setTimeout(r, 10));
      calculateHealth(tmpDir);

      const history = getHealthHistory(tmpDir);
      expect(history.length).toBe(2);
      // First entry should be more recent
      expect(new Date(history[0].date).getTime()).toBeGreaterThanOrEqual(
        new Date(history[1].date).getTime(),
      );
    });

    it("respects limit parameter", () => {
      setupProject(tmpDir, { ".gitignore": "node_modules\n" });

      for (let i = 0; i < 5; i++) {
        calculateHealth(tmpDir);
      }

      const history = getHealthHistory(tmpDir, 2);
      expect(history.length).toBe(2);
    });

    it("returns empty array when no history exists", () => {
      const history = getHealthHistory(tmpDir);
      expect(history).toEqual([]);
    });
  });
});
