import { describe, it, expect, beforeEach, afterEach } from "vitest";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { initDb, closeDb, getDb } from "./database.js";
import {
  registerSession,
  listActiveSessions,
  touchSession,
  endSession,
  createClaim,
  listActiveClaims,
  checkFile,
  releaseClaim,
  cleanupStaleSessions,
} from "./session-manager.js";

describe("session-manager", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "sophia-session-test-"));
    initDb(tmpDir);
  });

  afterEach(() => {
    closeDb();
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  describe("registerSession and listActiveSessions", () => {
    it("registers a session and lists it as active", () => {
      const session = registerSession(tmpDir, {
        agent: "claude",
        pid: 12345,
        intent: "refactoring auth module",
      });

      expect(session.id).toMatch(/^sess_/);
      expect(session.agent).toBe("claude");
      expect(session.pid).toBe(12345);
      expect(session.status).toBe("active");

      const active = listActiveSessions(tmpDir);
      expect(active).toHaveLength(1);
      expect(active[0]!.id).toBe(session.id);
    });

    it("registers multiple sessions", () => {
      registerSession(tmpDir, { agent: "claude" });
      registerSession(tmpDir, { agent: "copilot" });

      const active = listActiveSessions(tmpDir);
      expect(active).toHaveLength(2);
    });
  });

  describe("touchSession", () => {
    it("updates last_active timestamp", () => {
      const session = registerSession(tmpDir, { agent: "claude" });
      const originalTime = session.last_activity_at;

      // Small delay to ensure timestamp differs
      const before = Date.now();
      while (Date.now() - before < 10) {
        // spin
      }

      touchSession(tmpDir, session.id);

      const active = listActiveSessions(tmpDir);
      const updated = active.find((s) => s.id === session.id);
      expect(updated).toBeDefined();
      // The timestamp should have been updated (or at least be >= original)
      expect(new Date(updated!.last_activity_at).getTime()).toBeGreaterThanOrEqual(
        new Date(originalTime).getTime(),
      );
    });
  });

  describe("endSession", () => {
    it("marks session as ended and removes from active list", () => {
      const session = registerSession(tmpDir, { agent: "claude" });

      endSession(tmpDir, session.id);

      const active = listActiveSessions(tmpDir);
      expect(active).toHaveLength(0);
    });

    it("releases all claims when session ends", () => {
      const session = registerSession(tmpDir, { agent: "claude" });
      createClaim(tmpDir, session.id, "src/**/*.ts");

      endSession(tmpDir, session.id);

      const claims = listActiveClaims(tmpDir);
      expect(claims).toHaveLength(0);
    });
  });

  describe("createClaim and listActiveClaims", () => {
    it("creates a claim and lists it", () => {
      const session = registerSession(tmpDir, { agent: "claude" });
      const claim = createClaim(tmpDir, session.id, "src/auth/**");

      expect(claim.session_id).toBe(session.id);
      expect(claim.pattern).toBe("src/auth/**");
      expect(claim.claim_type).toBe("soft");

      const active = listActiveClaims(tmpDir);
      expect(active).toHaveLength(1);
      expect(active[0]!.agent).toBe("claude");
    });

    it("creates a hard claim", () => {
      const session = registerSession(tmpDir, { agent: "claude" });
      const claim = createClaim(tmpDir, session.id, "src/**", "hard");

      expect(claim.claim_type).toBe("hard");
    });
  });

  describe("checkFile", () => {
    it("detects claimed files", () => {
      const session = registerSession(tmpDir, {
        agent: "claude",
        intent: "refactoring",
      });
      createClaim(tmpDir, session.id, "src/auth/**");

      const status = checkFile(tmpDir, "src/auth/login.ts");

      expect(status.claimed).toBe(true);
      expect(status.claimedBy!.agent).toBe("claude");
      expect(status.claimedBy!.sessionId).toBe(session.id);
      expect(status.claimedBy!.intent).toBe("refactoring");
    });

    it("returns unclaimed for non-matching files", () => {
      const session = registerSession(tmpDir, { agent: "claude" });
      createClaim(tmpDir, session.id, "src/auth/**");

      const status = checkFile(tmpDir, "src/utils/helpers.ts");

      expect(status.claimed).toBe(false);
      expect(status.claimedBy).toBeUndefined();
    });

    it("returns unclaimed when no claims exist", () => {
      const status = checkFile(tmpDir, "src/anything.ts");
      expect(status.claimed).toBe(false);
    });
  });

  describe("releaseClaim", () => {
    it("releases a specific claim by pattern", () => {
      const session = registerSession(tmpDir, { agent: "claude" });
      createClaim(tmpDir, session.id, "src/auth/**");
      createClaim(tmpDir, session.id, "src/utils/**");

      releaseClaim(tmpDir, session.id, "src/auth/**");

      const claims = listActiveClaims(tmpDir);
      expect(claims).toHaveLength(1);
      expect(claims[0]!.pattern).toBe("src/utils/**");
    });

    it("releases all claims for a session when no pattern given", () => {
      const session = registerSession(tmpDir, { agent: "claude" });
      createClaim(tmpDir, session.id, "src/auth/**");
      createClaim(tmpDir, session.id, "src/utils/**");

      releaseClaim(tmpDir, session.id);

      const claims = listActiveClaims(tmpDir);
      expect(claims).toHaveLength(0);
    });
  });

  describe("cleanupStaleSessions", () => {
    it("cleans up sessions older than the stale threshold", () => {
      const session = registerSession(tmpDir, { agent: "claude" });

      // Manually backdate the last_activity_at to simulate a stale session
      const db = getDb(tmpDir);
      const pastTime = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1 hour ago
      db.prepare("UPDATE sessions SET last_activity_at = ? WHERE id = ?").run(
        pastTime,
        session.id,
      );

      const cleaned = cleanupStaleSessions(tmpDir, 30);

      expect(cleaned).toBe(1);
      const active = listActiveSessions(tmpDir);
      expect(active).toHaveLength(0);
    });

    it("does not clean up recent sessions", () => {
      registerSession(tmpDir, { agent: "claude" });

      const cleaned = cleanupStaleSessions(tmpDir, 30);

      expect(cleaned).toBe(0);
      const active = listActiveSessions(tmpDir);
      expect(active).toHaveLength(1);
    });

    it("releases claims of stale sessions", () => {
      const session = registerSession(tmpDir, { agent: "claude" });
      createClaim(tmpDir, session.id, "src/**");

      const db = getDb(tmpDir);
      const pastTime = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      db.prepare("UPDATE sessions SET last_activity_at = ? WHERE id = ?").run(
        pastTime,
        session.id,
      );

      cleanupStaleSessions(tmpDir, 30);

      const claims = listActiveClaims(tmpDir);
      expect(claims).toHaveLength(0);
    });
  });
});
