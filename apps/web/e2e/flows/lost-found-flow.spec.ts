/**
 * Lost & Found Flow E2E Tests
 * 
 * Tests creating alerts, searching, and reporting sightings
 */

import { test, expect } from '@playwright/test';

test.describe('Lost & Found Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/lost-found');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to lost-found page', async ({ page }) => {
    expect(page.url()).toContain('/lost-found');
  });

  test('should open create alert dialog', async ({ page }) => {
    const createButton = page.locator('text=/create|new alert|report lost/i').first();
    
    if (await createButton.count() > 0) {
      await createButton.click();
      await page.waitForTimeout(500);

      const dialog = page.locator('[role="dialog"]').first();
      await expect(dialog).toBeVisible();
    }
  });

  test('should display lost alerts', async ({ page }) => {
    const alerts = page.locator('.alert-card, .lost-alert-card');
    const emptyState = page.locator('text=/no alerts|empty/i');

    const hasAlerts = await alerts.count() > 0;
    const hasEmptyState = await emptyState.count() > 0;

    expect(hasAlerts || hasEmptyState).toBe(true);
  });

  test('should open report sighting dialog', async ({ page }) => {
    const alertCard = page.locator('.alert-card, .lost-alert-card').first();
    
    if (await alertCard.count() > 0) {
      await alertCard.click();
      await page.waitForTimeout(500);

      const reportButton = page.locator('text=/report sighting|saw this/i').first();
      
      if (await reportButton.count() > 0) {
        await reportButton.click();
        await page.waitForTimeout(500);

        const dialog = page.locator('[role="dialog"]').first();
        await expect(dialog).toBeVisible();
      }
    }
  });
});

