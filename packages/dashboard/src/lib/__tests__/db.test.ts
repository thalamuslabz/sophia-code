/**
 * Unit Test: Database Utilities
 *
 * Tests dashboard database utilities:
 * 1. Database connection handling
 * 2. Config file reading
 * 3. Health report reading
 * 4. Path resolution
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { getDb, readConfig, readHealthReport } from "../db";
import Database from "better-sqlite3";

describe("Database Utilities", () => {
  let tmpDir: string;
  let originalProjectRoot: string | undefined;

  beforeEach(() => {
    // Save original env var
    originalProjectRoot = process.env["SOPHIA_PROJECT_ROOT"];

    // Create temp directory
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sophia-db-test-"));
    process.env["SOPHIA_PROJECT_ROOT"] = tmpDir;

    // Create .sophia directory
    fs.mkdirSync(path.join(tmpDir, ".sophia"), { recursive: true });
  });

  afterEach(() => {
    // Restore original env var
    if (originalProjectRoot === undefined) {
      delete process.env["SOPHIA_PROJECT_ROOT"];
    } else {
      process.env["SOPHIA_PROJECT_ROOT"] = originalProjectRoot;
    }

    // Cleanup temp directory
    if (fs.existsSync(tmpDir)) {
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  describe("getDb", () => {
    it("returns null when database does not exist", () => {
      const db = getDb();
      expect(db).toBeNull();
    });

    it("returns database connection when file exists", () => {
      // Create database file
      const dbPath = path.join(tmpDir, ".sophia", "sophia.db");
      const db = new Database(dbPath);
      db.exec(`
        CREATE TABLE sessions (
          id TEXT PRIMARY KEY,
          agent TEXT NOT NULL,
          status TEXT NOT NULL
        );
      `);
      db.close();

      const conn = getDb();
      expect(conn).not.toBeNull();
      conn?.close();
    });
  });

  describe("readConfig", () => {
    it("returns null when config file does not exist", () => {
      const config = readConfig();
      expect(config).toBeNull();
    });

    it("returns parsed config when file exists", () => {
      const configPath = path.join(tmpDir, ".sophia", "config.yaml");
      fs.writeFileSync(
        configPath,
        `
project:
  name: test-project
  tech_stack:
    language: typescript
`
      );

      const config = readConfig();
      expect(config).not.toBeNull();
      expect(config?.project).toEqual({
        name: "test-project",
        tech_stack: {
          language: "typescript",
        },
      });
    });
  });

  describe("readHealthReport", () => {
    it("returns null when report file does not exist", () => {
      const report = readHealthReport();
      expect(report).toBeNull();
    });

    it("returns parsed report when file exists", () => {
      const healthDir = path.join(tmpDir, ".sophia", "health");
      fs.mkdirSync(healthDir, { recursive: true });

      const reportPath = path.join(healthDir, "report.json");
      const testReport = {
        overall_score: 85,
        grade: "B+",
        categories: {
          security: { score: 90 },
          testing: { score: 80 },
        },
      };
      fs.writeFileSync(reportPath, JSON.stringify(testReport));

      const report = readHealthReport();
      expect(report).toEqual(testReport);
    });
  });
});
