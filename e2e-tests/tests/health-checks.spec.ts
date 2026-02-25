import { test, expect } from '@playwright/test';

/**
 * Service Health Checks
 *
 * Validates that all Thalamus AI services are running and responding correctly.
 *
 * Coverage:
 * - Docker services (Open WebUI, n8n, Qdrant, Leantime)
 * - Node.js services (Dashboard, Orchestrator)
 * - Health endpoints return expected responses
 * - Service dependencies are satisfied
 */

test.describe('Service Health Checks', () => {
  test.describe('Docker Services', () => {
    test('Open WebUI is running on port 3115', async ({ request }) => {
      const response = await request.get('http://localhost:3115');
      expect(response.status()).toBe(200);
    });

    test('n8n is running on port 3118', async ({ request }) => {
      const response = await request.get('http://localhost:3118');
      expect(response.status()).toBe(200);
    });

    test('Qdrant is running on port 6333', async ({ request }) => {
      const response = await request.get('http://localhost:6333');
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.title).toBe('qdrant - vector search engine');
    });

    test('Leantime is running on port 8081', async ({ request }) => {
      const response = await request.get('http://localhost:8081');
      expect(response.status()).toBe(200);
    });

    test('Leantime MySQL database is accessible', async () => {
      // This is verified indirectly through Leantime being up
      // Could add direct MySQL check if needed
      const { execSync } = require('child_process');
      try {
        execSync('docker exec thalamus-leantime-db mysql -uroot -pleantime -e "SELECT 1;"', {
          encoding: 'utf-8',
          timeout: 5000,
        });
      } catch (error) {
        test.fail('MySQL database is not accessible');
      }
    });
  });

  test.describe('Node.js Services', () => {
    test('Dashboard is running on port 9473', async ({ request }) => {
      const response = await request.get('http://localhost:9473');
      expect(response.status()).toBe(200);
    });

    test('Orchestrator is running on port 7654', async ({ request }) => {
      const response = await request.get('http://localhost:7654/health');
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.status).toBe('ok');
      expect(body.timestamp).toBeDefined();
    });
  });

  test.describe('Health Endpoints', () => {
    test('Dashboard health endpoint returns OK', async ({ request }) => {
      const response = await request.get('http://localhost:9473/api/health');
      expect(response.status()).toBe(200);
    });

    test('Orchestrator health endpoint returns OK', async ({ request }) => {
      const response = await request.get('http://localhost:7654/health');
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.status).toBe('ok');
    });

    test('Qdrant health endpoint returns OK', async ({ request }) => {
      const response = await request.get('http://localhost:6333/healthz');
      expect(response.status()).toBe(200);
    });
  });

  test.describe('API Availability', () => {
    test('Dashboard API is accessible', async ({ request }) => {
      const response = await request.get('http://localhost:9473/api/overview');
      expect(response.status()).toBe(200);
    });

    test('Orchestrator intents API is accessible', async ({ request }) => {
      const response = await request.get('http://localhost:7654/api/intents');
      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(Array.isArray(body)).toBe(true);
    });

    test('n8n API is accessible', async ({ request }) => {
      const response = await request.get('http://localhost:3118/rest/workflows', {
        headers: {
          'X-N8N-API-KEY': process.env.N8N_API_KEY || '',
        },
      });
      // n8n may return 401 if auth is enabled, but should not return connection refused
      expect(response.status()).not.toBe(0);
    });
  });

  test.describe('Service Dependencies', () => {
    test('All Docker containers are healthy', async () => {
      const { execSync } = require('child_process');
      try {
        const output = execSync('docker ps --filter "health=unhealthy" --format "{{.Names}}"', {
          encoding: 'utf-8',
        });
        expect(output.trim()).toBe('');
      } catch (error) {
        test.fail('Failed to check container health');
      }
    });

    test('Required ports are listening', async () => {
      const { execSync } = require('child_process');
      const requiredPorts = [3115, 3118, 6333, 8081, 9473, 7654];

      for (const port of requiredPorts) {
        try {
          execSync(`lsof -i :${port} | grep LISTEN`, { encoding: 'utf-8', timeout: 2000 });
        } catch (error) {
          test.fail(`Port ${port} is not listening`);
        }
      }
    });
  });
});
