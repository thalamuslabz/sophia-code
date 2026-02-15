import { NextResponse } from "next/server";
import { getDb, readConfig, readHealthReport } from "@/lib/db";
import type { SessionRow, BulletinRow, ClaimRow } from "@/lib/db";

export const dynamic = "force-dynamic";

export function GET() {
  const config = readConfig();
  const healthReport = readHealthReport();
  const db = getDb();

  let activeSessions: SessionRow[] = [];
  let recentBulletin: BulletinRow[] = [];
  let activeClaims: ClaimRow[] = [];
  let correctionCount = 0;
  let patternCount = 0;

  if (db) {
    activeSessions = db
      .prepare("SELECT * FROM sessions WHERE status = 'active' ORDER BY last_activity_at DESC")
      .all() as SessionRow[];

    recentBulletin = db
      .prepare("SELECT * FROM bulletin ORDER BY created_at DESC LIMIT 10")
      .all() as BulletinRow[];

    activeClaims = db
      .prepare("SELECT * FROM claims WHERE released_at IS NULL ORDER BY created_at DESC")
      .all() as ClaimRow[];

    const corrRow = db.prepare("SELECT COUNT(*) as count FROM corrections").get() as { count: number };
    correctionCount = corrRow.count;

    const patRow = db.prepare("SELECT COUNT(*) as count FROM patterns").get() as { count: number };
    patternCount = patRow.count;

    db.close();
  }

  return NextResponse.json({
    config,
    health: healthReport,
    activeSessions,
    recentBulletin,
    activeClaims,
    correctionCount,
    patternCount,
  });
}
