/**
 * Dashboard API Client for E2E tests
 */

import * as path from 'path';
import { writeFileSync, existsSync, readFileSync, mkdirSync } from 'fs';

const DASHBOARD_DB = path.join(process.env.HOME || '/tmp', '.thalamus-e2e', 'dashboard-mock.json');

interface Intent {
  id: string;
  project: string;
  name: string;
  description: string;
  acceptance_criteria: string[];
  status: 'pending' | 'approved' | 'rejected' | 'in_progress' | 'completed';
  created_at: string;
  approved_by?: string;
  approved_at?: string;
}

function ensureDb(): Map<string, Intent> {
  const dir = path.dirname(DASHBOARD_DB);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  
  if (!existsSync(DASHBOARD_DB)) {
    return new Map();
  }
  
  try {
    const data = JSON.parse(readFileSync(DASHBOARD_DB, 'utf-8'));
    return new Map(Object.entries(data));
  } catch {
    return new Map();
  }
}

function saveDb(intents: Map<string, Intent>): void {
  const obj: Record<string, Intent> = {};
  intents.forEach((v, k) => obj[k] = v);
  writeFileSync(DASHBOARD_DB, JSON.stringify(obj, null, 2));
}

export async function createIntent(intent: Omit<Intent, 'id' | 'created_at' | 'status'>): Promise<Intent> {
  const db = ensureDb();
  const newIntent: Intent = {
    ...intent,
    id: `INTENT-${Date.now()}`,
    status: 'pending',
    created_at: new Date().toISOString()
  };
  
  db.set(newIntent.id, newIntent);
  saveDb(db);
  
  return newIntent;
}

export async function getIntent(id: string): Promise<Intent | null> {
  const db = ensureDb();
  return db.get(id) || null;
}

export async function listIntents(project?: string, status?: string): Promise<Intent[]> {
  const db = ensureDb();
  let intents = Array.from(db.values());
  
  if (project) {
    intents = intents.filter(i => i.project === project);
  }
  
  if (status) {
    intents = intents.filter(i => i.status === status);
  }
  
  return intents.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export async function approveIntent(id: string, approvedBy: string): Promise<Intent | null> {
  const db = ensureDb();
  const intent = db.get(id);
  if (!intent) return null;
  
  const updated: Intent = {
    ...intent,
    status: 'approved',
    approved_by: approvedBy,
    approved_at: new Date().toISOString()
  };
  
  db.set(id, updated);
  saveDb(db);
  
  return updated;
}

export async function rejectIntent(id: string): Promise<Intent | null> {
  const db = ensureDb();
  const intent = db.get(id);
  if (!intent) return null;
  
  const updated: Intent = { ...intent, status: 'rejected' };
  db.set(id, updated);
  saveDb(db);
  
  return updated;
}

export async function updateIntentStatus(id: string, status: Intent['status']): Promise<Intent | null> {
  const db = ensureDb();
  const intent = db.get(id);
  if (!intent) return null;
  
  const updated: Intent = { ...intent, status };
  db.set(id, updated);
  saveDb(db);
  
  return updated;
}

export function clearMockDashboard(): void {
  if (existsSync(DASHBOARD_DB)) {
    writeFileSync(DASHBOARD_DB, '{}');
  }
}

export async function fetchDashboardIntents(): Promise<Intent[]> {
  return listIntents();
}

// Exports are already defined above
