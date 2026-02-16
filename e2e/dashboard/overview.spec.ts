/**
 * E2E UI Test: Dashboard Overview Page
 *
 * Tests the dashboard UI through the browser:
 * 1. Dashboard loads with correct structure
 * 2. Overview page displays project information
 * 3. Navigation works between sections
 * 4. Data updates are reflected in UI
 *
 * Based on thalamus-orchestrator E2E patterns
 */

import { test, expect, Page } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

// Test project configuration
const TEST_PROJECT = {
  name: `e2e-test-project-${Date.now().toString(36).slice(-4)}`,
  language: "typescript",
  framework: "next.js",
};

let projectPath: string;

test.describe.configure({ mode: "serial" });

test.describe("E2E: Dashboard Overview", () => {
  test.beforeAll(() => {
    // Create test project
    projectPath = fs.mkdtempSync(path.join(os.tmpdir(), "sophia-dashboard-test-"));

    const sophiaDir = path.join(projectPath, ".sophia");
    fs.mkdirSync(sophiaDir, { recursive: true });

    // Write test config
    fs.writeFileSync(
      path.join(sophiaDir, "config.json"),
      JSON.stringify(
        {
          sophia: { version: "1.0.0", initialized: true },
          project: {
            name: TEST_PROJECT.name,
            tech_stack: {
              language: TEST_PROJECT.language,
              framework: TEST_PROJECT.framework,
            },
          },
          agents: { detected: [] },
          user: { experience_level: "intermediate", governance_level: "standard" },
          policies: { enabled: ["security", "testing"] },
        },
        null,
        2
      )
    );

    // Set env var for dashboard
    process.env.SOPHIA_PROJECT_ROOT = projectPath;
  });

  test.afterAll(() => {
    // Cleanup
    if (projectPath && fs.existsSync(projectPath)) {
      fs.rmSync(projectPath, { recursive: true, force: true });
    }
    delete process.env.SOPHIA_PROJECT_ROOT;
  });

  test("Phase 1: Dashboard loads with correct structure", async ({ page }) => {
    await page.goto("/");

    // Wait for loading to complete
    await expect(page.locator("text=Loading...")).not.toBeVisible({ timeout: 10000 });

    // Verify main navigation
    await expect(page.locator("nav")).toBeVisible();
    await expect(page.locator("nav")).toContainText("Overview");
    await expect(page.locator("nav")).toContainText("Health");
    await expect(page.locator("nav")).toContainText("Sessions");
    await expect(page.locator("nav")).toContainText("Bulletin");
    await expect(page.locator("nav")).toContainText("Memory");
    await expect(page.locator("nav")).toContainText("Claims");
    await expect(page.locator("nav")).toContainText("Policies");
    await expect(page.locator("nav")).toContainText("Settings");
  });

  test("Phase 2: Overview page displays project information", async ({ page }) => {
    await page.goto("/");

    // Wait for data to load
    await expect(page.locator("text=Loading...")).not.toBeVisible({ timeout: 10000 });

    // Verify project name is displayed
    await expect(page.locator("h2")).toContainText(TEST_PROJECT.name);

    // Verify tech stack is shown
    await expect(page.locator(".page-header p")).toContainText(TEST_PROJECT.language);
    await expect(page.locator(".page-header p")).toContainText(TEST_PROJECT.framework);
  });

  test("Phase 3: Health section displays correctly", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("text=Loading...")).not.toBeVisible({ timeout: 10000 });

    // Verify health grade card exists
    const healthCard = page.locator(".card:has(.card-header:has-text(\"Health Grade\"))");
    await expect(healthCard).toBeVisible();

    // Verify grade display
    const gradeDisplay = healthCard.locator(".grade-display");
    await expect(gradeDisplay).toBeVisible();

    // Score label should be present
    await expect(healthCard.locator(".stat-label")).toBeVisible();
  });

  test("Phase 4: Active sessions card displays", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("text=Loading...")).not.toBeVisible({ timeout: 10000 });

    // Verify sessions card
    const sessionsCard = page.locator(".card:has(.card-header:has-text(\"Active Sessions\"))");
    await expect(sessionsCard).toBeVisible();
  });

  test("Phase 5: Navigation to Sessions page works", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("text=Loading...")).not.toBeVisible({ timeout: 10000 });

    // Click on Sessions in nav
    await page.click("nav >> text=Sessions");

    // Verify URL changed
    await expect(page).toHaveURL(/.*sessions/);

    // Verify page header
    await expect(page.locator("h2")).toContainText("Active Sessions");
  });

  test("Phase 6: Navigation to Health page works", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("text=Loading...")).not.toBeVisible({ timeout: 10000 });

    // Click on Health in nav
    await page.click("nav >> text=Health");

    // Verify URL changed
    await expect(page).toHaveURL(/.*health/);

    // Verify page header
    await expect(page.locator("h2")).toContainText("Health Report");
  });

  test("Phase 7: Navigation to Bulletin page works", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("text=Loading...")).not.toBeVisible({ timeout: 10000 });

    // Click on Bulletin in nav
    await page.click("nav >> text=Bulletin");

    // Verify URL changed
    await expect(page).toHaveURL(/.*bulletin/);

    // Verify page header
    await expect(page.locator("h2")).toContainText("Bulletin");
  });
});
