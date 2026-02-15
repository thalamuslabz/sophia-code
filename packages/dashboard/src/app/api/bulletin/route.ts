import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import type { BulletinRow } from "@/lib/db";

export const dynamic = "force-dynamic";

export function GET() {
  const db = getDb();
  if (!db) return NextResponse.json({ entries: [] });

  const entries = db
    .prepare("SELECT * FROM bulletin ORDER BY created_at DESC LIMIT 100")
    .all() as BulletinRow[];

  db.close();

  return NextResponse.json({ entries });
}
