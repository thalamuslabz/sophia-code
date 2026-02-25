import { Database } from './core/database.js';
import { IntentStore } from './core/intent-store.js';
import { EvidenceVault } from './core/evidence-vault.js';
import { BuildAgent } from './core/build-agent.js';
import { createApp } from './api/server.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const DB_PATH = process.env.DB_PATH || './thalamus.db';
const EVIDENCE_PATH = process.env.EVIDENCE_PATH || './evidence';
const WORK_DIR = process.env.WORK_DIR || './work';

const database = new Database(DB_PATH);
const intentStore = new IntentStore(database);
const evidenceVault = new EvidenceVault(EVIDENCE_PATH);
const buildAgent = new BuildAgent(WORK_DIR);

const app = createApp({
  database,
  intentStore,
  evidenceVault,
  buildAgent
});

app.listen(PORT, () => {
  console.log(`Thalamus Orchestrator running on port ${PORT}`);
  console.log(`Database: ${DB_PATH}`);
  console.log(`Evidence Vault: ${EVIDENCE_PATH}`);
  console.log(`Work Directory: ${WORK_DIR}`);
});

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  database.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Shutting down gracefully...');
  database.close();
  process.exit(0);
});
