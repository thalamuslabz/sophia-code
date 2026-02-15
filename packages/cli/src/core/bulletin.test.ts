import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { postBulletin, getRecentBulletin, getBulletinSince } from "./bulletin.js";
import { initDb, closeDb } from "./database.js";

describe("bulletin", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sophia-bulletin-test-"));
    initDb(tmpDir);
  });

  afterEach(() => {
    closeDb();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe("postBulletin()", () => {
    it("inserts an entry that can be retrieved", () => {
      postBulletin(tmpDir, {
        type: "file_change",
        message: "Modified auth.ts",
        agent: "claude-code",
      });

      const entries = getRecentBulletin(tmpDir);
      expect(entries.length).toBe(1);
      expect(entries[0].message).toBe("Modified auth.ts");
      expect(entries[0].entry_type).toBe("file_change");
      expect(entries[0].agent).toBe("claude-code");
    });

    it("stores files array as JSON", () => {
      postBulletin(tmpDir, {
        type: "file_change",
        message: "Changed files",
        files: ["src/a.ts", "src/b.ts"],
      });

      const entries = getRecentBulletin(tmpDir);
      expect(entries[0].files).toEqual(["src/a.ts", "src/b.ts"]);
    });

    it("stores optional fields as undefined when not provided", () => {
      postBulletin(tmpDir, {
        type: "warning",
        message: "Test warning",
      });

      const entries = getRecentBulletin(tmpDir);
      expect(entries[0].session_id).toBeUndefined();
      expect(entries[0].agent).toBeUndefined();
      expect(entries[0].files).toBeUndefined();
      expect(entries[0].warning).toBeUndefined();
    });
  });

  describe("getRecentBulletin()", () => {
    it("returns entries in reverse chronological order", async () => {
      postBulletin(tmpDir, { type: "file_change", message: "first" });
      // Small delay to ensure different timestamps
      await new Promise((r) => setTimeout(r, 10));
      postBulletin(tmpDir, { type: "file_change", message: "second" });
      await new Promise((r) => setTimeout(r, 10));
      postBulletin(tmpDir, { type: "file_change", message: "third" });

      const entries = getRecentBulletin(tmpDir);
      expect(entries.length).toBe(3);
      expect(entries[0].message).toBe("third");
      expect(entries[1].message).toBe("second");
      expect(entries[2].message).toBe("first");
    });

    it("respects limit parameter", () => {
      for (let i = 0; i < 5; i++) {
        postBulletin(tmpDir, { type: "file_change", message: `entry-${i}` });
      }

      const entries = getRecentBulletin(tmpDir, 2);
      expect(entries.length).toBe(2);
    });

    it("returns empty array when no entries exist", () => {
      const entries = getRecentBulletin(tmpDir);
      expect(entries).toEqual([]);
    });
  });

  describe("getBulletinSince()", () => {
    it("filters entries by timestamp", async () => {
      postBulletin(tmpDir, { type: "file_change", message: "old entry" });

      await new Promise((r) => setTimeout(r, 50));
      const cutoff = new Date().toISOString();
      await new Promise((r) => setTimeout(r, 50));

      postBulletin(tmpDir, { type: "file_change", message: "new entry" });

      const entries = getBulletinSince(tmpDir, cutoff);
      expect(entries.length).toBe(1);
      expect(entries[0].message).toBe("new entry");
    });

    it("returns entries in ascending order", async () => {
      const cutoff = new Date().toISOString();
      await new Promise((r) => setTimeout(r, 10));

      postBulletin(tmpDir, { type: "file_change", message: "a" });
      await new Promise((r) => setTimeout(r, 10));
      postBulletin(tmpDir, { type: "file_change", message: "b" });

      const entries = getBulletinSince(tmpDir, cutoff);
      expect(entries.length).toBe(2);
      expect(entries[0].message).toBe("a");
      expect(entries[1].message).toBe("b");
    });

    it("returns empty array when no entries after timestamp", () => {
      postBulletin(tmpDir, { type: "file_change", message: "old" });

      // Use a future date
      const future = new Date(Date.now() + 100000).toISOString();
      const entries = getBulletinSince(tmpDir, future);
      expect(entries).toEqual([]);
    });
  });
});
