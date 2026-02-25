import { Router } from 'express';
import type { AppContext } from '../server.js';

export function createBuildRouter(context: AppContext): Router {
  const router = Router();

  router.get('/', (req, res) => {
    try {
      const project = req.query.project as string | undefined;
      const builds = context.evidenceVault.listBuilds(project);
      res.json(builds);
    } catch (error) {
      res.status(500).json({ error: 'Failed to list builds', details: (error as Error).message });
    }
  });

  router.get('/:project/:buildId', (req, res) => {
    try {
      const { project, buildId } = req.params;
      const manifest = context.evidenceVault.readManifest(project, buildId);

      if (!manifest) {
        res.status(404).json({ error: 'Build not found' });
        return;
      }

      res.json(manifest);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get build', details: (error as Error).message });
    }
  });

  router.post('/:project/:buildId/verify', (req, res) => {
    try {
      const { project, buildId } = req.params;
      const manifest = context.evidenceVault.readManifest(project, buildId);

      if (!manifest) {
        res.status(404).json({ error: 'Build not found' });
        return;
      }

      const verification = context.evidenceVault.verifyIntegrity(project, buildId);
      res.json({
        buildId,
        project,
        valid: verification.valid,
        errors: verification.errors
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to verify build', details: (error as Error).message });
    }
  });

  // POST /api/builds - Create a new build (simulates build agent)
  router.post('/', (req, res) => {
    try {
      const { project, intentId, files } = req.body;

      if (!project || !intentId) {
        res.status(400).json({ error: 'Missing required fields: project, intentId' });
        return;
      }

      const buildId = `build-${Date.now()}`;
      const now = new Date().toISOString();

      // Create build directory
      context.evidenceVault.createBuildDirectory(project, buildId);

      // Create manifest
      const manifest = {
        buildId,
        project,
        intentId,
        createdAt: now,
        files: files || {},
        chainHash: 'sha256:genesis'
      };

      context.evidenceVault.writeManifest(manifest);

      res.status(201).json({
        buildId,
        project,
        intentId,
        createdAt: now,
        status: 'completed'
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to create build', details: (error as Error).message });
    }
  });

  return router;
}
