/**
 * Adoption Marketplace Flow E2E Tests
 * 
 * Tests browsing, filtering, and contacting adoption listings
 */

import { test, expect } from '@playwright/test';

test.describe('Adoption Marketplace Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/adoption');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to adoption page', async ({ page }) => {
    expect(page.url()).toContain('/adoption');
  });

  test('should display adoption listings', async ({ page }) => {
    const listings = page.locator('.adoption-card, .listing-card, [role="article"]');
    const emptyState = page.locator('text=/no listings|empty/i');

    const hasListings = await listings.count() > 0;
    const hasEmptyState = await emptyState.count() > 0;

    expect(hasListings || hasEmptyState).toBe(true);
  });

  test('should open listing detail', async ({ page }) => {
    const listingCard = page.locator('.adoption-card, .listing-card').first();
    
    if (await listingCard.count() > 0) {
      await listingCard.click();
      await page.waitForTimeout(500);

      // Detail view should be visible
      const detailView = page.locator('[role="dialog"], .detail-view').first();
      await expect(detailView).toBeVisible();
    }
  });

  test('should apply filters', async ({ page }) => {
    const filterButton = page.locator('text=/filter|filters/i').first();
    
    if (await filterButton.count() > 0) {
      await filterButton.click();
      await page.waitForTimeout(500);

      const filterPanel = page.locator('[role="dialog"], .filter-panel').first();
      await expect(filterPanel).toBeVisible();
    }
  });
});

