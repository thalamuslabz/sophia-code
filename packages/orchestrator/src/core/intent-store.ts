import { Database } from './database.js';
import type { Intent, IntentCreateInput, IntentFilter } from '../types/intent.js';

export class IntentStore {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  create(input: IntentCreateInput): Intent {
    const id = this.generateId();
    const now = new Date().toISOString();

    const intent: Intent = {
      id,
      createdAt: now,
      project: input.project,
      author: input.author,
      description: input.description,
      contractRef: input.contractRef,
      contractHash: input.contractHash,
      acceptanceCriteria: input.acceptanceCriteria,
      outOfScope: input.outOfScope ?? [],
      status: 'pending'
    };

    const stmt = this.db.getConnection().prepare(`
      INSERT INTO intents (
        id, created_at, project, author, description,
        contract_ref, contract_hash, acceptance_criteria,
        out_of_scope, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      intent.id,
      intent.createdAt,
      intent.project,
      intent.author,
      intent.description,
      intent.contractRef ?? null,
      intent.contractHash ?? null,
      JSON.stringify(intent.acceptanceCriteria),
      JSON.stringify(intent.outOfScope),
      intent.status
    );

    return intent;
  }

  getById(id: string): Intent | null {
    const stmt = this.db.getConnection().prepare(
      'SELECT * FROM intents WHERE id = ?'
    );
    const row = stmt.get(id) as Record<string, unknown> | undefined;

    if (!row) return null;
    return this.rowToIntent(row);
  }

  list(filter?: IntentFilter): Intent[] {
    let sql = 'SELECT * FROM intents WHERE 1=1';
    const params: (string | number)[] = [];

    if (filter?.project) {
      sql += ' AND project = ?';
      params.push(filter.project);
    }
    if (filter?.status) {
      sql += ' AND status = ?';
      params.push(filter.status);
    }
    if (filter?.author) {
      sql += ' AND author = ?';
      params.push(filter.author);
    }

    sql += ' ORDER BY created_at DESC';

    const stmt = this.db.getConnection().prepare(sql);
    const rows = stmt.all(...params) as Record<string, unknown>[];

    return rows.map(row => this.rowToIntent(row));
  }

  updateStatus(
    id: string,
    status: Intent['status'],
    metadata?: { approvedBy?: string; rejectedReason?: string }
  ): Intent | null {
    const now = new Date().toISOString();

    let sql: string;
    let params: (string | null)[];

    if (status === 'approved' && metadata?.approvedBy) {
      sql = 'UPDATE intents SET status = ?, approved_at = ?, approved_by = ? WHERE id = ?';
      params = [status, now, metadata.approvedBy, id];
    } else if (status === 'rejected' && metadata?.rejectedReason) {
      sql = 'UPDATE intents SET status = ?, rejected_at = ?, rejected_reason = ? WHERE id = ?';
      params = [status, now, metadata.rejectedReason, id];
    } else {
      sql = 'UPDATE intents SET status = ? WHERE id = ?';
      params = [status, id];
    }

    const stmt = this.db.getConnection().prepare(sql);
    const result = stmt.run(...params);

    if (result.changes === 0) return null;
    return this.getById(id);
  }

  private generateId(): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const timestamp = Date.now().toString(36).slice(-4);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `int-${date}-${timestamp}${random}`;
  }

  private rowToIntent(row: Record<string, unknown>): Intent {
    return {
      id: row.id as string,
      createdAt: row.created_at as string,
      project: row.project as string,
      author: row.author as string,
      description: row.description as string,
      contractRef: row.contract_ref as string | undefined,
      contractHash: row.contract_hash as string | undefined,
      acceptanceCriteria: this.safeJsonParse(row.acceptance_criteria as string, []),
      outOfScope: this.safeJsonParse((row.out_of_scope as string) ?? '[]', []),
      status: row.status as Intent['status'],
      approvedAt: row.approved_at as string | undefined,
      approvedBy: row.approved_by as string | undefined,
      rejectedAt: row.rejected_at as string | undefined,
      rejectedReason: row.rejected_reason as string | undefined
    };
  }

  private safeJsonParse<T>(json: string, fallback: T): T {
    try {
      return JSON.parse(json) as T;
    } catch {
      return fallback;
    }
  }
}
