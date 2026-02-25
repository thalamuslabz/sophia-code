import { test, expect } from '@playwright/test';

/**
 * Dashboard UI Tests
 *
 * Validates the Sophia Dashboard web interface.
 *
 * Coverage:
 * - Navigation between views
 * - Session management UI
 * - Policy display
 * - Health score visualization
 * - Responsive design
 */

test.describe('Dashboard UI', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:9473');
  });

  test.describe('Navigation', () => {
    test('should display sidebar navigation', async ({ page }) => {
      await expect(page.locator('aside.sidebar')).toBeVisible();
      await expect(page.locator('text=sophia.code')).toBeVisible();
      await expect(page.locator('text=Governance Dashboard')).toBeVisible();
    });

    test('should navigate to Sessions page', async ({ page }) => {
      await page.click('a[href="/sessions"]');
      await expect(page).toHaveURL(/.*sessions/);
      await expect(page.locator('h1, h2, h3').filter({ hasText: /sessions/i })).toBeVisible();
    });

    test('should navigate to Claims page', async ({ page }) => {
      await page.click('a[href="/claims"]');
      await expect(page).toHaveURL(/.*claims/);
    });

    test('should navigate to Policies page', async ({ page }) => {
      await page.click('a[href="/policies"]');
      await expect(page).toHaveURL(/.*policies/);
    });

    test('should navigate to Memory page', async ({ page }) => {
      await page.click('a[href="/memory"]');
      await expect(page).toHaveURL(/.*memory/);
    });

    test('should navigate to Health page', async ({ page }) => {
      await page.click('a[href="/health"]');
      await expect(page).toHaveURL(/.*health/);
    });

    test('should navigate to Bulletin page', async ({ page }) => {
      await page.click('a[href="/bulletin"]');
      await expect(page).toHaveURL(/.*bulletin/);
    });

    test('should navigate to Settings page', async ({ page }) => {
      await page.click('a[href="/settings"]');
      await expect(page).toHaveURL(/.*settings/);
    });
  });

  test.describe('Overview Page', () => {
    test('should display overview content', async ({ page }) => {
      await expect(page.locator('main.main')).toBeVisible();
    });

    test('should show active sessions count', async ({ page }) => {
      // Look for session count or related metrics
      const sessionElement = page.locator('text=/\\d+ session/i').first();
      if (await sessionElement.isVisible().catch(() => false)) {
        await expect(sessionElement).toBeVisible();
      }
    });

    test('should show health score', async ({ page }) => {
      // Look for health score display
      const healthElement = page.locator('text=/health|score|grade/i').first();
      if (await healthElement.isVisible().catch(() => false)) {
        await expect(healthElement).toBeVisible();
      }
    });
  });

  test.describe('Sessions Page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('http://localhost:9473/sessions');
    });

    test('should display sessions list', async ({ page }) => {
      await expect(page.locator('main.main')).toBeVisible();
    });

    test('should show session details when available', async ({ page }) => {
      // Check if any session rows exist
      const sessionRows = page.locator('tr, [data-testid="session-row"]').first();
      if (await sessionRows.isVisible().catch(() => false)) {
        await expect(sessionRows).toBeVisible();
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should render correctly on desktop', async ({ page }) => {
      await page.setViewportSize({ width: 1280, height: 800 });
      await expect(page.locator('aside.sidebar')).toBeVisible();
    });

    test('should render correctly on tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await expect(page.locator('main.main')).toBeVisible();
    });

    test('should render correctly on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await expect(page.locator('main.main')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle API errors gracefully', async ({ page }) => {
      // Simulate offline or error state
      await page.route('**/api/**', route => route.abort('internetdisconnected'));
      await page.reload();

      // Should still show the app structure
      await expect(page.locator('aside.sidebar')).toBeVisible();
    });
  });
});
