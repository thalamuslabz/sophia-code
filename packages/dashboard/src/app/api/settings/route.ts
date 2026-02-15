import { NextResponse } from "next/server";
import { readConfig } from "@/lib/db";

export const dynamic = "force-dynamic";

export function GET() {
  const config = readConfig();
  return NextResponse.json({ config });
}
