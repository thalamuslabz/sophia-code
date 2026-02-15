import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { initDb, getDb, closeDb } from "./database";

describe("database", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sophia-test-"));
  });

  afterEach(() => {
    closeDb();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe("initDb", () => {
    it("creates .sophia directory and database file", () => {
      initDb(tmpDir);

      const dbPath = path.join(tmpDir, ".sophia", "sophia.db");
      expect(fs.existsSync(dbPath)).toBe(true);
    });

    it("creates all required tables", () => {
      const db = initDb(tmpDir);

      const tables = db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
        )
        .all() as { name: string }[];

      const tableNames = tables.map((t) => t.name);
      expect(tableNames).toContain("sessions");
      expect(tableNames).toContain("claims");
      expect(tableNames).toContain("corrections");
      expect(tableNames).toContain("patterns");
      expect(tableNames).toContain("decisions");
      expect(tableNames).toContain("health_scores");
      expect(tableNames).toContain("bulletin");
      expect(tableNames).toContain("encounters");
    });

    it("creates required indexes", () => {
      const db = initDb(tmpDir);

      const indexes = db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%' ORDER BY name",
        )
        .all() as { name: string }[];

      const indexNames = indexes.map((i) => i.name);
      expect(indexNames).toContain("idx_sessions_status");
      expect(indexNames).toContain("idx_claims_session");
      expect(indexNames).toContain("idx_claims_active");
      expect(indexNames).toContain("idx_corrections_keywords");
      expect(indexNames).toContain("idx_patterns_keywords");
      expect(indexNames).toContain("idx_bulletin_created");
    });
  });

  describe("getDb", () => {
    it("returns the same instance after initDb", () => {
      const db1 = initDb(tmpDir);
      const db2 = getDb(tmpDir);

      expect(db2).toBe(db1);
    });
  });

  describe("WAL mode", () => {
    it("database is in WAL journal mode", () => {
      const db = initDb(tmpDir);

      const result = db.pragma("journal_mode") as { journal_mode: string }[];
      expect(result[0].journal_mode).toBe("wal");
    });
  });
});
