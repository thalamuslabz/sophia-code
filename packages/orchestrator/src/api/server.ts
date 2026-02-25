import express from 'express';
import cors from 'cors';
import { Database } from '../core/database.js';
import { IntentStore } from '../core/intent-store.js';
import { EvidenceVault } from '../core/evidence-vault.js';
import { BuildAgent } from '../core/build-agent.js';

export interface AppContext {
  database: Database;
  intentStore: IntentStore;
  evidenceVault: EvidenceVault;
  buildAgent: BuildAgent;
}

export function createApp(context?: Partial<AppContext>): express.Application {
  const app = express();

  // Use provided context or create test instances
  const db = context?.database ?? new Database(':memory:');
  const intentStore = context?.intentStore ?? new IntentStore(db);
  const evidenceVault = context?.evidenceVault ?? new EvidenceVault('./test-evidence');
  const buildAgent = context?.buildAgent ?? new BuildAgent('./test-work');

  const fullContext: AppContext = {
    database: db,
    intentStore,
    evidenceVault,
    buildAgent
  };

  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  app.use('/api/intents', createIntentRouter(fullContext));
  app.use('/api/builds', createBuildRouter(fullContext));

  return app;
}

import { createIntentRouter } from './routes/intents.js';
import { createBuildRouter } from './routes/builds.js';
