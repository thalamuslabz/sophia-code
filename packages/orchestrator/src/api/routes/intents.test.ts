import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { Database } from '../../core/database';
import { IntentStore } from '../../core/intent-store';
import { EvidenceVault } from '../../core/evidence-vault';
import { BuildAgent } from '../../core/build-agent';
import { createApp } from '../server';
import fs from 'fs';
import type { AppContext } from '../server';

describe('Intent Routes', () => {
  const testDbPath = './test-api.db';
  const testEvidencePath = './test-api-evidence';
  const testWorkDir = './test-api-work';
  let context: AppContext;

  beforeEach(() => {
    [testDbPath, testEvidencePath, testWorkDir].forEach(p => {
      if (fs.existsSync(p)) {
        fs.rmSync(p, { recursive: true, force: true });
      }
    });

    const database = new Database(testDbPath);
    const intentStore = new IntentStore(database);
    const evidenceVault = new EvidenceVault(testEvidencePath);
    const buildAgent = new BuildAgent(testWorkDir);

    context = { database, intentStore, evidenceVault, buildAgent };
  });

  afterEach(() => {
    context.database.close();
    [testDbPath, testEvidencePath, testWorkDir].forEach(p => {
      if (fs.existsSync(p)) {
        fs.rmSync(p, { recursive: true, force: true });
      }
    });
  });

  it('should create an intent via POST /api/intents', async () => {
    const app = createApp(context);

    const response = await request(app)
      .post('/api/intents')
      .send({
        project: 'ASO',
        author: 'test-user',
        description: 'Add new feature',
        acceptanceCriteria: ['Feature works', 'Tests pass']
      });

    expect(response.status).toBe(201);
    expect(response.body.id).toMatch(/^int-\d{8}-[a-z0-9]{7}$/);
    expect(response.body.project).toBe('ASO');
    expect(response.body.status).toBe('pending');
  });

  it('should return 400 when creating intent with missing fields', async () => {
    const app = createApp(context);

    const response = await request(app)
      .post('/api/intents')
      .send({
        project: 'ASO'
      });

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Missing required fields');
  });

  it('should list intents via GET /api/intents', async () => {
    const app = createApp(context);

    await context.intentStore.create({
      project: 'ASO',
      author: 'test',
      description: 'Intent 1',
      acceptanceCriteria: ['It works']
    });

    await context.intentStore.create({
      project: 'BETA',
      author: 'other',
      description: 'Intent 2',
      acceptanceCriteria: ['It works too']
    });

    const response = await request(app).get('/api/intents');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(2);
  });

  it('should filter intents by project', async () => {
    const app = createApp(context);

    await context.intentStore.create({
      project: 'ASO',
      author: 'test',
      description: 'Intent 1',
      acceptanceCriteria: ['It works']
    });

    await context.intentStore.create({
      project: 'BETA',
      author: 'other',
      description: 'Intent 2',
      acceptanceCriteria: ['It works too']
    });

    const response = await request(app).get('/api/intents?project=ASO');

    expect(response.status).toBe(200);
    expect(response.body).toHaveLength(1);
    expect(response.body[0].project).toBe('ASO');
  });

  it('should get intent by id', async () => {
    const app = createApp(context);

    const created = context.intentStore.create({
      project: 'ASO',
      author: 'test',
      description: 'Test intent',
      acceptanceCriteria: ['It works']
    });

    const response = await request(app).get(`/api/intents/${created.id}`);

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(created.id);
  });

  it('should return 404 for non-existent intent', async () => {
    const app = createApp(context);

    const response = await request(app).get('/api/intents/int-20240101-0000000');

    expect(response.status).toBe(404);
  });

  it('should approve an intent', async () => {
    const app = createApp(context);

    const created = context.intentStore.create({
      project: 'ASO',
      author: 'test',
      description: 'Test intent',
      acceptanceCriteria: ['It works']
    });

    const response = await request(app)
      .post(`/api/intents/${created.id}/approve`)
      .send({ approvedBy: 'admin' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('approved');
    expect(response.body.approvedBy).toBe('admin');
  });
});
