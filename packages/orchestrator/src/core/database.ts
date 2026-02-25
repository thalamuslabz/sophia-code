import DatabaseBetter from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

export class Database {
  private db: DatabaseBetter.Database;

  constructor(dbPath: string = './.thalamus/orchestrator.db') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new DatabaseBetter(dbPath);
    this.init();
  }

  private init(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS intents (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        project TEXT NOT NULL,
        author TEXT NOT NULL,
        description TEXT NOT NULL,
        contract_ref TEXT,
        contract_hash TEXT,
        acceptance_criteria TEXT NOT NULL,
        out_of_scope TEXT,
        status TEXT NOT NULL,
        approved_at TEXT,
        approved_by TEXT,
        rejected_at TEXT,
        rejected_reason TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_intents_project ON intents(project);
      CREATE INDEX IF NOT EXISTS idx_intents_status ON intents(status);
    `);

    this.db.exec(`
      CREATE TABLE IF NOT EXISTS builds (
        id TEXT PRIMARY KEY,
        intent_id TEXT NOT NULL,
        project TEXT NOT NULL,
        status TEXT NOT NULL,
        started_at TEXT NOT NULL,
        completed_at TEXT,
        evidence_path TEXT,
        manifest_hash TEXT,
        FOREIGN KEY (intent_id) REFERENCES intents(id)
      );
    `);
  }

  getConnection(): DatabaseBetter.Database {
    return this.db;
  }

  close(): void {
    this.db.close();
  }
}
