import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { SessionRow, ClaimRow } from "@/lib/db";

export const dynamic = "force-dynamic";

export function GET() {
  const db = getDb();
  if (!db) return NextResponse.json({ sessions: [], claims: [] });

  const sessions = db
    .prepare("SELECT * FROM sessions ORDER BY started_at DESC LIMIT 50")
    .all() as SessionRow[];

  const claims = db
    .prepare("SELECT * FROM claims ORDER BY created_at DESC LIMIT 50")
    .all() as ClaimRow[];

  db.close();

  return NextResponse.json({ sessions, claims });
}
