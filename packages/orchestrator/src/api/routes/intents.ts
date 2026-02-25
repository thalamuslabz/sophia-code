import { Router } from 'express';
import type { AppContext } from '../server.js';

export function createIntentRouter(context: AppContext): Router {
  const router = Router();

  router.post('/', (req, res) => {
    try {
      const { project, author, description, acceptanceCriteria, contractRef, contractHash, outOfScope } = req.body;

      if (!project || !author || !description || !acceptanceCriteria) {
        res.status(400).json({ error: 'Missing required fields: project, author, description, acceptanceCriteria' });
        return;
      }

      const intent = context.intentStore.create({
        project,
        author,
        description,
        acceptanceCriteria: Array.isArray(acceptanceCriteria) ? acceptanceCriteria : [acceptanceCriteria],
        contractRef,
        contractHash,
        outOfScope: outOfScope || []
      });

      res.status(201).json(intent);
    } catch (error) {
      console.error('Error creating intent:', error);
      res.status(500).json({ error: 'Failed to create intent', details: (error as Error).message });
    }
  });

  router.get('/', (req, res) => {
    try {
      const filter: { project?: string; status?: import('../../types/intent.js').IntentStatus; author?: string } = {};

      if (req.query.project) filter.project = req.query.project as string;
      if (req.query.status) filter.status = req.query.status as import('../../types/intent.js').IntentStatus;
      if (req.query.author) filter.author = req.query.author as string;

      const intents = context.intentStore.list(Object.keys(filter).length > 0 ? filter : undefined);
      res.json(intents);
    } catch (error) {
      res.status(500).json({ error: 'Failed to list intents', details: (error as Error).message });
    }
  });

  router.get('/:id', (req, res) => {
    try {
      const intent = context.intentStore.getById(req.params.id);

      if (!intent) {
        res.status(404).json({ error: 'Intent not found' });
        return;
      }

      res.json(intent);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get intent', details: (error as Error).message });
    }
  });

  router.post('/:id/approve', (req, res) => {
    try {
      const { approvedBy } = req.body;

      if (!approvedBy) {
        res.status(400).json({ error: 'Missing required field: approvedBy' });
        return;
      }

      const intent = context.intentStore.updateStatus(req.params.id, 'approved', { approvedBy });

      if (!intent) {
        res.status(404).json({ error: 'Intent not found' });
        return;
      }

      res.json(intent);
    } catch (error) {
      res.status(500).json({ error: 'Failed to approve intent', details: (error as Error).message });
    }
  });

  return router;
}
