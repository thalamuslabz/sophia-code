import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Database } from './database';
import { IntentStore } from './intent-store';
import fs from 'fs';

describe('IntentStore', () => {
  const testDbPath = './test-intents.db';
  let db: Database;
  let store: IntentStore;

  beforeEach(() => {
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
    db = new Database(testDbPath);
    store = new IntentStore(db);
  });

  afterEach(() => {
    db.close();
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  it('should create an intent', () => {
    const intent = store.create({
      project: 'ASO',
      author: 'test',
      description: 'Add feature X',
      acceptanceCriteria: ['It works']
    });

    expect(intent.id).toMatch(/^int-\d{8}-[a-z0-9]{7}$/);
    expect(intent.project).toBe('ASO');
    expect(intent.status).toBe('pending');
  });

  it('should retrieve an intent by id', () => {
    const created = store.create({
      project: 'ASO',
      author: 'test',
      description: 'Add feature X',
      acceptanceCriteria: ['It works']
    });

    const retrieved = store.getById(created.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(created.id);
  });

  it('should return null for non-existent intent', () => {
    const retrieved = store.getById('int-20240101-0000000');
    expect(retrieved).toBeNull();
  });

  it('should list all intents without filter', () => {
    store.create({
      project: 'ASO',
      author: 'test',
      description: 'Add feature X',
      acceptanceCriteria: ['It works']
    });
    store.create({
      project: 'BETA',
      author: 'other',
      description: 'Add feature Y',
      acceptanceCriteria: ['It works too']
    });

    const intents = store.list();
    expect(intents).toHaveLength(2);
  });

  it('should list intents with project filter', () => {
    store.create({
      project: 'ASO',
      author: 'test',
      description: 'Add feature X',
      acceptanceCriteria: ['It works']
    });
    store.create({
      project: 'BETA',
      author: 'other',
      description: 'Add feature Y',
      acceptanceCriteria: ['It works too']
    });

    const intents = store.list({ project: 'ASO' });
    expect(intents).toHaveLength(1);
    expect(intents[0].project).toBe('ASO');
  });

  it('should list intents with status filter', () => {
    const intent = store.create({
      project: 'ASO',
      author: 'test',
      description: 'Add feature X',
      acceptanceCriteria: ['It works']
    });
    store.updateStatus(intent.id, 'approved', { approvedBy: 'admin' });

    const pendingIntents = store.list({ status: 'pending' });
    const approvedIntents = store.list({ status: 'approved' });

    expect(pendingIntents).toHaveLength(0);
    expect(approvedIntents).toHaveLength(1);
  });

  it('should list intents with author filter', () => {
    store.create({
      project: 'ASO',
      author: 'test',
      description: 'Add feature X',
      acceptanceCriteria: ['It works']
    });
    store.create({
      project: 'BETA',
      author: 'other',
      description: 'Add feature Y',
      acceptanceCriteria: ['It works too']
    });

    const intents = store.list({ author: 'test' });
    expect(intents).toHaveLength(1);
    expect(intents[0].author).toBe('test');
  });

  it('should approve an intent', () => {
    const created = store.create({
      project: 'ASO',
      author: 'test',
      description: 'Add feature X',
      acceptanceCriteria: ['It works']
    });

    const updated = store.updateStatus(created.id, 'approved', { approvedBy: 'admin' });

    expect(updated).not.toBeNull();
    expect(updated?.status).toBe('approved');
    expect(updated?.approvedBy).toBe('admin');
    expect(updated?.approvedAt).toBeDefined();
  });

  it('should reject an intent', () => {
    const created = store.create({
      project: 'ASO',
      author: 'test',
      description: 'Add feature X',
      acceptanceCriteria: ['It works']
    });

    const updated = store.updateStatus(created.id, 'rejected', { rejectedReason: 'Not aligned with roadmap' });

    expect(updated).not.toBeNull();
    expect(updated?.status).toBe('rejected');
    expect(updated?.rejectedReason).toBe('Not aligned with roadmap');
    expect(updated?.rejectedAt).toBeDefined();
  });

  it('should return null when updating non-existent intent', () => {
    const updated = store.updateStatus('int-20240101-0000000', 'approved', { approvedBy: 'admin' });
    expect(updated).toBeNull();
  });
});
