import Database from "better-sqlite3";
import path from "node:path";
import fs from "node:fs";
import YAML from "yaml";

function getProjectRoot(): string {
  return process.env["SOPHIA_PROJECT_ROOT"] ?? process.cwd();
}

function getDbPath(): string {
  return path.join(getProjectRoot(), ".sophia", "sophia.db");
}

export function getDb(): Database.Database | null {
  const dbPath = getDbPath();
  if (!fs.existsSync(dbPath)) return null;
  return new Database(dbPath, { readonly: true });
}

export function readConfig(): Record<string, unknown> | null {
  const configPath = path.join(getProjectRoot(), ".sophia", "config.yaml");
  if (!fs.existsSync(configPath)) return null;
  const content = fs.readFileSync(configPath, "utf-8");
  return YAML.parse(content) as Record<string, unknown>;
}

export function readHealthReport(): Record<string, unknown> | null {
  const reportPath = path.join(getProjectRoot(), ".sophia", "health", "report.json");
  if (!fs.existsSync(reportPath)) return null;
  return JSON.parse(fs.readFileSync(reportPath, "utf-8")) as Record<string, unknown>;
}

// These match the actual SQLite schema in database.ts
export interface SessionRow {
  id: string;
  agent: string;
  pid: number | null;
  intent: string | null;
  status: string;
  started_at: string;
  last_activity_at: string;
  ended_at: string | null;
}

export interface ClaimRow {
  id: number;
  session_id: string;
  pattern: string;
  claim_type: string;
  created_at: string;
  released_at: string | null;
}

export interface CorrectionRow {
  id: number;
  pattern: string;
  reason: string;
  correction: string;
  keywords: string;
  severity: string;
  times_applied: number;
  created_at: string;
}

export interface PatternRow {
  id: number;
  description: string;
  implementation: string;
  keywords: string;
  context: string | null;
  times_used: number;
  created_at: string;
}

export interface BulletinRow {
  id: number;
  session_id: string | null;
  agent: string | null;
  entry_type: string;
  message: string;
  files: string | null;
  created_at: string;
}

export interface HealthScoreRow {
  id: number;
  overall_score: number;
  grade: string;
  categories: string;
  created_at: string;
}
