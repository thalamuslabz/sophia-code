import type { BulletinEntry, BulletinType } from "@sophia-code/shared";
import { getDb } from "./database.js";

export function postBulletin(
  projectRoot: string,
  entry: {
    sessionId?: string;
    agent?: string;
    type: BulletinType;
    message: string;
    files?: string[];
    warning?: string;
  },
): void {
  const db = getDb(projectRoot);
  db.prepare(
    `INSERT INTO bulletin (session_id, agent, entry_type, message, files, warning, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    entry.sessionId ?? null,
    entry.agent ?? null,
    entry.type,
    entry.message,
    entry.files ? JSON.stringify(entry.files) : null,
    entry.warning ?? null,
    new Date().toISOString(),
  );
}

export function getRecentBulletin(
  projectRoot: string,
  limit: number = 10,
): BulletinEntry[] {
  const db = getDb(projectRoot);
  const rows = db
    .prepare("SELECT * FROM bulletin ORDER BY created_at DESC LIMIT ?")
    .all(limit) as RawBulletin[];
  return rows.map(parseBulletin);
}

export function getBulletinSince(
  projectRoot: string,
  since: string,
): BulletinEntry[] {
  const db = getDb(projectRoot);
  const rows = db
    .prepare("SELECT * FROM bulletin WHERE created_at > ? ORDER BY created_at ASC")
    .all(since) as RawBulletin[];
  return rows.map(parseBulletin);
}

interface RawBulletin {
  id: number;
  session_id: string | null;
  agent: string | null;
  entry_type: string;
  message: string;
  files: string | null;
  warning: string | null;
  created_at: string;
}

function parseBulletin(row: RawBulletin): BulletinEntry {
  return {
    id: row.id,
    session_id: row.session_id ?? undefined,
    agent: row.agent ?? undefined,
    entry_type: row.entry_type as BulletinType,
    message: row.message,
    files: row.files ? JSON.parse(row.files) : undefined,
    warning: row.warning ?? undefined,
    created_at: row.created_at,
  };
}
