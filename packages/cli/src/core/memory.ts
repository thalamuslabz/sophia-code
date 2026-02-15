import { minimatch } from "minimatch";
import type { Correction, Pattern, Decision, MemoryStats } from "@sophia-code/shared";
import { getDb } from "./database.js";

export function recordCorrection(
  projectRoot: string,
  params: {
    pattern: string;
    reason: string;
    correction: string;
    fileTypes?: string[];
    keywords: string[];
    severity: "low" | "medium" | "high";
  },
): number {
  const db = getDb(projectRoot);
  const now = new Date().toISOString();
  const today = now.split("T")[0]!;

  const result = db
    .prepare(
      `INSERT INTO corrections (date, pattern, reason, correction, file_types, keywords, severity, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      today,
      params.pattern,
      params.reason,
      params.correction,
      params.fileTypes ? JSON.stringify(params.fileTypes) : null,
      JSON.stringify(params.keywords),
      params.severity,
      now,
    );

  return Number(result.lastInsertRowid);
}

export function recordPattern(
  projectRoot: string,
  params: {
    description: string;
    context?: string;
    implementation: string;
    fileTypes?: string[];
    keywords: string[];
    effectiveness: "low" | "medium" | "high";
  },
): number {
  const db = getDb(projectRoot);
  const now = new Date().toISOString();
  const today = now.split("T")[0]!;

  const result = db
    .prepare(
      `INSERT INTO patterns (date, description, context, implementation, file_types, keywords, effectiveness, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      today,
      params.description,
      params.context ?? null,
      params.implementation,
      params.fileTypes ? JSON.stringify(params.fileTypes) : null,
      JSON.stringify(params.keywords),
      params.effectiveness,
      now,
    );

  return Number(result.lastInsertRowid);
}

export function recordDecision(
  projectRoot: string,
  params: {
    sessionId?: string;
    decision: string;
    rationale?: string;
    alternatives?: string[];
    filesAffected?: string[];
  },
): number {
  const db = getDb(projectRoot);
  const now = new Date().toISOString();

  const result = db
    .prepare(
      `INSERT INTO decisions (session_id, decision, rationale, alternatives, files_affected, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
    )
    .run(
      params.sessionId ?? null,
      params.decision,
      params.rationale ?? null,
      params.alternatives ? JSON.stringify(params.alternatives) : null,
      params.filesAffected ? JSON.stringify(params.filesAffected) : null,
      now,
    );

  return Number(result.lastInsertRowid);
}

export function findCorrections(
  projectRoot: string,
  params: { keywords?: string[]; fileTypes?: string[]; limit?: number },
): Correction[] {
  const db = getDb(projectRoot);
  const limit = params.limit ?? 5;

  if (!params.keywords?.length && !params.fileTypes?.length) {
    const rows = db
      .prepare(
        "SELECT * FROM corrections ORDER BY times_applied DESC, created_at DESC LIMIT ?",
      )
      .all(limit) as RawCorrection[];
    return rows.map(parseCorrection);
  }

  const all = db.prepare("SELECT * FROM corrections").all() as RawCorrection[];

  return all
    .map((c) => {
      const storedKeywords: string[] = JSON.parse(c.keywords ?? "[]");
      let score = 0;

      if (params.keywords) {
        for (const kw of params.keywords) {
          if (storedKeywords.some((sk) => sk.toLowerCase().includes(kw.toLowerCase()))) {
            score += 2;
          }
        }
      }

      score += Math.min(c.times_applied * 0.5, 3);

      return { ...c, score };
    })
    .filter((c) => c.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(parseCorrection);
}

export function findPatterns(
  projectRoot: string,
  params: { keywords?: string[]; limit?: number },
): Pattern[] {
  const db = getDb(projectRoot);
  const limit = params.limit ?? 5;

  if (!params.keywords?.length) {
    const rows = db
      .prepare("SELECT * FROM patterns ORDER BY times_used DESC, created_at DESC LIMIT ?")
      .all(limit) as RawPattern[];
    return rows.map(parsePattern);
  }

  const all = db.prepare("SELECT * FROM patterns").all() as RawPattern[];

  return all
    .map((p) => {
      const storedKeywords: string[] = JSON.parse(p.keywords ?? "[]");
      let score = 0;

      for (const kw of params.keywords!) {
        if (storedKeywords.some((sk) => sk.toLowerCase().includes(kw.toLowerCase()))) {
          score += 2;
        }
      }

      score += Math.min(p.times_used * 0.5, 3);
      return { ...p, score };
    })
    .filter((p) => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(parsePattern);
}

export function getMemoryStats(projectRoot: string): MemoryStats {
  const db = getDb(projectRoot);

  const totalCorrections = (
    db.prepare("SELECT COUNT(*) as count FROM corrections").get() as { count: number }
  ).count;
  const totalPatterns = (
    db.prepare("SELECT COUNT(*) as count FROM patterns").get() as { count: number }
  ).count;
  const totalDecisions = (
    db.prepare("SELECT COUNT(*) as count FROM decisions").get() as { count: number }
  ).count;

  const topMistakes = db
    .prepare(
      "SELECT pattern, times_applied as count FROM corrections ORDER BY times_applied DESC LIMIT 5",
    )
    .all() as { pattern: string; count: number }[];

  const topPatterns = db
    .prepare(
      "SELECT description, times_used as count FROM patterns ORDER BY times_used DESC LIMIT 5",
    )
    .all() as { description: string; count: number }[];

  return {
    totalCorrections,
    totalPatterns,
    totalDecisions,
    mostCommonMistakes: topMistakes,
    mostUsedPatterns: topPatterns,
  };
}

export function markCorrectionApplied(projectRoot: string, id: number): void {
  const db = getDb(projectRoot);
  db.prepare("UPDATE corrections SET times_applied = times_applied + 1 WHERE id = ?").run(id);
}

export function markPatternUsed(projectRoot: string, id: number): void {
  const db = getDb(projectRoot);
  db.prepare("UPDATE patterns SET times_used = times_used + 1 WHERE id = ?").run(id);
}

// Internal types for raw SQLite rows
interface RawCorrection {
  id: number;
  date: string;
  project: string | null;
  pattern: string;
  reason: string;
  correction: string;
  file_types: string | null;
  keywords: string | null;
  severity: string;
  times_applied: number;
  created_at: string;
  score?: number;
}

interface RawPattern {
  id: number;
  date: string;
  project: string | null;
  description: string;
  context: string | null;
  implementation: string;
  file_types: string | null;
  keywords: string | null;
  effectiveness: string;
  times_used: number;
  created_at: string;
  score?: number;
}

function parseCorrection(row: RawCorrection): Correction {
  return {
    id: row.id,
    date: row.date,
    project: row.project ?? undefined,
    pattern: row.pattern,
    reason: row.reason,
    correction: row.correction,
    file_types: row.file_types ? JSON.parse(row.file_types) : undefined,
    keywords: JSON.parse(row.keywords ?? "[]"),
    severity: row.severity as "low" | "medium" | "high",
    times_applied: row.times_applied,
    created_at: row.created_at,
  };
}

function parsePattern(row: RawPattern): Pattern {
  return {
    id: row.id,
    date: row.date,
    project: row.project ?? undefined,
    description: row.description,
    context: row.context ?? undefined,
    implementation: row.implementation,
    file_types: row.file_types ? JSON.parse(row.file_types) : undefined,
    keywords: JSON.parse(row.keywords ?? "[]"),
    effectiveness: row.effectiveness as "low" | "medium" | "high",
    times_used: row.times_used,
    created_at: row.created_at,
  };
}
