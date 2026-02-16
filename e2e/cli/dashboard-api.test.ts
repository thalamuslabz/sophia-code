/**
 * E2E Test: Dashboard API Integration
 *
 * Tests the dashboard API routes with a real project:
 * 1. Health endpoint returns valid data
 * 2. Overview endpoint aggregates project data
 * 3. Sessions endpoint manages session lifecycle
 * 4. Bulletin endpoint records events
 *
 * Based on thalamus-orchestrator E2E patterns
 */

import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { createTestProject, cleanupTestProject, TestProjects } from "../fixtures/index.js";
import type { TestProjectConfig } from "../fixtures/index.js";

// API base URL for dashboard
const API_BASE = "http://localhost:9473/api";

interface HealthResponse {
  report: {
    overall_score: number;
    grade: string;
    categories: Record<string, { score: number }>;
  } | null;
  history: Array<{
    id: number;
    score: number;
    grade: string;
    created_at: string;
  }>;
}

interface OverviewResponse {
  config: {
    project?: { name: string; tech_stack: Record<string, string> };
    user?: { experience_level: string; governance_level: string };
    policies?: { enabled: string[] };
  } | null;
  health: {
    overall_score: number;
    grade: string;
    categories: Record<string, { score: number }>;
  } | null;
  activeSessions: Array<{
    id: string;
    agent: string;
    intent: string | null;
    started_at: string;
  }>;
  recentBulletin: Array<{
    entry_type: string;
    message: string;
    created_at: string;
  }>;
  activeClaims: Array<{
    session_id: string;
    pattern: string;
    claim_type: string;
  }>;
  correctionCount: number;
  patternCount: number;
}

describe("E2E: Dashboard API Integration", () => {
  let projectPath: string;
  const testProject = TestProjects.typescript;

  beforeAll(() => {
    // Create test project with .sophia structure
    projectPath = createTestProject(testProject);

    // Set project root for dashboard to use
    process.env.SOPHIA_PROJECT_ROOT = projectPath;
  });

  afterAll(() => {
    cleanupTestProject(projectPath);
    delete process.env.SOPHIA_PROJECT_ROOT;
  });

  describe("Phase 1: Health Endpoint", () => {
    it("should return health data with valid structure", async () => {
      const response = await fetch(`${API_BASE}/health`);

      expect(response.status).toBe(200);

      const data = (await response.json()) as HealthResponse;
      expect(data).toHaveProperty("report");
      expect(data).toHaveProperty("history");
      expect(Array.isArray(data.history)).toBe(true);
    });

    it("should include health report with score and grade", async () => {
      const response = await fetch(`${API_BASE}/health`);
      const data = (await response.json()) as HealthResponse;

      if (data.report) {
        expect(typeof data.report.overall_score).toBe("number");
        expect(typeof data.report.grade).toBe("string");
        expect(data.report.grade).toMatch(/^[A-F][+-]?$/);
        expect(data.report.categories).toBeDefined();
      }
    });
  });

  describe("Phase 2: Overview Endpoint", () => {
    it("should return complete project overview", async () => {
      const response = await fetch(`${API_BASE}/overview`);

      expect(response.status).toBe(200);

      const data = (await response.json()) as OverviewResponse;
      expect(data).toHaveProperty("config");
      expect(data).toHaveProperty("health");
      expect(data).toHaveProperty("activeSessions");
      expect(data).toHaveProperty("recentBulletin");
      expect(data).toHaveProperty("activeClaims");
      expect(data).toHaveProperty("correctionCount");
      expect(data).toHaveProperty("patternCount");
    });

    it("should include project configuration", async () => {
      const response = await fetch(`${API_BASE}/overview`);
      const data = (await response.json()) as OverviewResponse;

      expect(data.config).not.toBeNull();
      expect(data.config?.project?.name).toBe(testProject.name);
      expect(data.config?.project?.tech_stack.language).toBe(testProject.language);
    });

    it("should include user settings", async () => {
      const response = await fetch(`${API_BASE}/overview`);
      const data = (await response.json()) as OverviewResponse;

      expect(data.config?.user?.experience_level).toBeDefined();
      expect(data.config?.user?.governance_level).toBeDefined();
    });

    it("should include enabled policies", async () => {
      const response = await fetch(`${API_BASE}/overview`);
      const data = (await response.json()) as OverviewResponse;

      expect(Array.isArray(data.config?.policies?.enabled)).toBe(true);
      expect(data.config?.policies?.enabled).toContain("security");
    });
  });

  describe("Phase 3: Sessions Endpoint", () => {
    it("should list sessions", async () => {
      const response = await fetch(`${API_BASE}/sessions`);

      expect(response.status).toBe(200);

      const data = (await response.json()) as {
        sessions: Array<{
          id: string;
          agent: string;
          intent: string | null;
          started_at: string;
        }>;
      };
      expect(Array.isArray(data.sessions)).toBe(true);
    });
  });

  describe("Phase 4: Bulletin Endpoint", () => {
    it("should return bulletin entries", async () => {
      const response = await fetch(`${API_BASE}/bulletin`);

      expect(response.status).toBe(200);

      const data = (await response.json()) as {
        entries: Array<{
          id: number;
          entry_type: string;
          message: string;
          created_at: string;
        }>;
      };
      expect(Array.isArray(data.entries)).toBe(true);
    });
  });

  describe("Phase 5: Settings Endpoint", () => {
    it("should return settings", async () => {
      const response = await fetch(`${API_BASE}/settings`);

      expect(response.status).toBe(200);

      const data = (await response.json()) as {
        config: Record<string, unknown>;
      };
      expect(data.config).toBeDefined();
    });
  });
});
