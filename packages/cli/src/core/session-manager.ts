import crypto from "node:crypto";
import { minimatch } from "minimatch";
import type { Session, Claim, ClaimStatus } from "@sophia-code/shared";
import { getDb } from "./database.js";

export function registerSession(
  projectRoot: string,
  params: { agent: string; pid?: number; intent?: string },
): Session {
  const db = getDb(projectRoot);
  const id = `sess_${crypto.randomBytes(4).toString("hex")}`;
  const now = new Date().toISOString();

  db.prepare(
    `INSERT INTO sessions (id, agent, pid, intent, status, started_at, last_activity_at)
     VALUES (?, ?, ?, ?, 'active', ?, ?)`,
  ).run(id, params.agent, params.pid ?? null, params.intent ?? null, now, now);

  return {
    id,
    agent: params.agent,
    pid: params.pid,
    intent: params.intent,
    status: "active",
    started_at: now,
    last_activity_at: now,
  };
}

export function touchSession(projectRoot: string, sessionId: string): void {
  const db = getDb(projectRoot);
  db.prepare(
    "UPDATE sessions SET last_activity_at = ? WHERE id = ?",
  ).run(new Date().toISOString(), sessionId);
}

export function endSession(projectRoot: string, sessionId: string): void {
  const db = getDb(projectRoot);
  const now = new Date().toISOString();

  db.prepare(
    "UPDATE sessions SET status = 'ended', ended_at = ? WHERE id = ?",
  ).run(now, sessionId);

  // Release all claims
  db.prepare(
    "UPDATE claims SET released_at = ? WHERE session_id = ? AND released_at IS NULL",
  ).run(now, sessionId);
}

export function listActiveSessions(projectRoot: string): Session[] {
  const db = getDb(projectRoot);
  return db
    .prepare("SELECT * FROM sessions WHERE status = 'active' ORDER BY started_at DESC")
    .all() as Session[];
}

export function cleanupStaleSessions(projectRoot: string, staleMinutes: number = 30): number {
  const db = getDb(projectRoot);
  const cutoff = new Date(Date.now() - staleMinutes * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  const stale = db
    .prepare("SELECT id FROM sessions WHERE status = 'active' AND last_activity_at < ?")
    .all(cutoff) as { id: string }[];

  for (const session of stale) {
    db.prepare("UPDATE sessions SET status = 'ended', ended_at = ? WHERE id = ?")
      .run(now, session.id);
    db.prepare("UPDATE claims SET released_at = ? WHERE session_id = ? AND released_at IS NULL")
      .run(now, session.id);
  }

  return stale.length;
}

export function createClaim(
  projectRoot: string,
  sessionId: string,
  pattern: string,
  claimType: "soft" | "hard" = "soft",
): Claim {
  const db = getDb(projectRoot);
  const now = new Date().toISOString();

  const result = db.prepare(
    `INSERT OR REPLACE INTO claims (session_id, pattern, claim_type, created_at)
     VALUES (?, ?, ?, ?)`,
  ).run(sessionId, pattern, claimType, now);

  return {
    id: Number(result.lastInsertRowid),
    session_id: sessionId,
    pattern,
    claim_type: claimType,
    created_at: now,
  };
}

export function releaseClaim(projectRoot: string, sessionId: string, pattern?: string): void {
  const db = getDb(projectRoot);
  const now = new Date().toISOString();

  if (pattern) {
    db.prepare(
      "UPDATE claims SET released_at = ? WHERE session_id = ? AND pattern = ? AND released_at IS NULL",
    ).run(now, sessionId, pattern);
  } else {
    db.prepare(
      "UPDATE claims SET released_at = ? WHERE session_id = ? AND released_at IS NULL",
    ).run(now, sessionId);
  }
}

export function listActiveClaims(projectRoot: string): (Claim & { agent: string })[] {
  const db = getDb(projectRoot);
  return db
    .prepare(
      `SELECT c.*, s.agent FROM claims c
       JOIN sessions s ON c.session_id = s.id
       WHERE c.released_at IS NULL
       ORDER BY c.created_at DESC`,
    )
    .all() as (Claim & { agent: string })[];
}

export function checkFile(projectRoot: string, filePath: string): ClaimStatus {
  const claims = listActiveClaims(projectRoot);

  for (const claim of claims) {
    if (minimatch(filePath, claim.pattern)) {
      const db = getDb(projectRoot);
      const session = db
        .prepare("SELECT * FROM sessions WHERE id = ?")
        .get(claim.session_id) as Session | undefined;

      return {
        filePath,
        claimed: true,
        claimedBy: {
          sessionId: claim.session_id,
          agent: claim.agent,
          intent: session?.intent,
          claimType: claim.claim_type,
        },
      };
    }
  }

  return { filePath, claimed: false };
}

export function getMostRecentActiveSession(projectRoot: string): Session | null {
  const db = getDb(projectRoot);
  const session = db
    .prepare("SELECT * FROM sessions WHERE status = 'active' ORDER BY last_activity_at DESC LIMIT 1")
    .get() as Session | undefined;
  return session ?? null;
}
