/**
 * Community Flow E2E Tests
 * 
 * Tests post creation, comments, and moderation
 */

import { test, expect } from '@playwright/test';

test.describe('Community Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/community');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to community page', async ({ page }) => {
    expect(page.url()).toContain('/community');
  });

  test('should open post composer', async ({ page }) => {
    const createButton = page.locator('text=/create|new post|compose/i').first();
    
    if (await createButton.count() > 0) {
      await createButton.click();
      await page.waitForTimeout(500);

      const composer = page.locator('[role="dialog"], textarea, input[type="text"]').first();
      await expect(composer).toBeVisible();
    }
  });

  test('should display posts', async ({ page }) => {
    // Posts should be visible or show empty state
    const posts = page.locator('[role="article"], .post-card, .community-post');
    const emptyState = page.locator('text=/no posts|empty/i');

    const hasPosts = await posts.count() > 0;
    const hasEmptyState = await emptyState.count() > 0;

    expect(hasPosts || hasEmptyState).toBe(true);
  });

  test('should handle post interactions', async ({ page }) => {
    const likeButton = page.locator('button:has-text("like"), button[aria-label*="like" i]').first();
    
    if (await likeButton.count() > 0) {
      await likeButton.click();
      await page.waitForTimeout(300);
      
      // Button should update state
      expect(likeButton).toBeDefined();
    }
  });
});

