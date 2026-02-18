/**
 * Mock Leantime Client for E2E tests
 */

import * as path from 'path';
import { writeFileSync, existsSync, readFileSync, mkdirSync } from 'fs';

const LEANTIME_DB = path.join(process.env.HOME || '/tmp', '.thalamus-e2e', 'leantime-mock.json');

interface Ticket {
  id: string;
  title: string;
  description: string;
  status: 'open' | 'in_progress' | 'done';
  project: string;
  created_at: string;
  acceptance_criteria?: string[];
}

function ensureDb(): Map<string, Ticket> {
  const dir = path.dirname(LEANTIME_DB);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  
  if (!existsSync(LEANTIME_DB)) {
    return new Map();
  }
  
  try {
    const data = JSON.parse(readFileSync(LEANTIME_DB, 'utf-8'));
    return new Map(Object.entries(data));
  } catch {
    return new Map();
  }
}

function saveDb(tickets: Map<string, Ticket>): void {
  const obj: Record<string, Ticket> = {};
  tickets.forEach((v, k) => obj[k] = v);
  writeFileSync(LEANTIME_DB, JSON.stringify(obj, null, 2));
}

export async function createTicket(ticket: Omit<Ticket, 'id' | 'created_at'>): Promise<Ticket> {
  const db = ensureDb();
  const newTicket: Ticket = {
    ...ticket,
    id: `TICKET-${Date.now()}`,
    created_at: new Date().toISOString()
  };
  
  db.set(newTicket.id, newTicket);
  saveDb(db);
  
  return newTicket;
}

export async function getTicket(id: string): Promise<Ticket | null> {
  const db = ensureDb();
  return db.get(id) || null;
}

export async function getTicketsByProject(project: string): Promise<Ticket[]> {
  const db = ensureDb();
  return Array.from(db.values()).filter(t => t.project === project);
}

export async function updateTicket(id: string, updates: Partial<Ticket>): Promise<Ticket | null> {
  const db = ensureDb();
  const ticket = db.get(id);
  if (!ticket) return null;
  
  const updated = { ...ticket, ...updates };
  db.set(id, updated);
  saveDb(db);
  
  return updated;
}

export async function deleteTicket(id: string): Promise<boolean> {
  const db = ensureDb();
  const existed = db.delete(id);
  if (existed) saveDb(db);
  return existed;
}

export function clearMockLeantime(): void {
  if (existsSync(LEANTIME_DB)) {
    writeFileSync(LEANTIME_DB, '{}');
  }
}
