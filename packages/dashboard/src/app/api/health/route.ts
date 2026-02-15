import { NextResponse } from "next/server";
import { getDb, readHealthReport } from "@/lib/db";
import type { HealthScoreRow } from "@/lib/db";

export const dynamic = "force-dynamic";

export function GET() {
  const report = readHealthReport();
  const db = getDb();

  let history: HealthScoreRow[] = [];
  if (db) {
    history = db
      .prepare("SELECT * FROM health_scores ORDER BY created_at DESC LIMIT 20")
      .all() as HealthScoreRow[];
    db.close();
  }

  return NextResponse.json({ report, history });
}
