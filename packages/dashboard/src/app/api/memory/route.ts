import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { CorrectionRow, PatternRow } from "@/lib/db";

export const dynamic = "force-dynamic";

export function GET() {
  const db = getDb();
  if (!db) return NextResponse.json({ corrections: [], patterns: [], decisions: [] });

  const corrections = db
    .prepare("SELECT * FROM corrections ORDER BY created_at DESC LIMIT 50")
    .all() as CorrectionRow[];

  const patterns = db
    .prepare("SELECT * FROM patterns ORDER BY created_at DESC LIMIT 50")
    .all() as PatternRow[];

  const decisions = db
    .prepare("SELECT * FROM decisions ORDER BY created_at DESC LIMIT 50")
    .all() as { id: number; decision: string; rationale: string | null; alternatives: string | null; created_at: string }[];

  db.close();

  return NextResponse.json({ corrections, patterns, decisions });
}
