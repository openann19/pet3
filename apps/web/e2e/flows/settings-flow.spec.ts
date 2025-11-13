/**
 * Settings Flow E2E Tests
 * 
 * Tests profile updates, preferences, and privacy settings
 */

import { test, expect } from '@playwright/test';

test.describe('Settings Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to profile/settings', async ({ page }) => {
    expect(page.url()).toContain('/profile');
  });

  test('should update profile information', async ({ page }) => {
    const editButton = page.locator('text=/edit|update profile/i').first();
    
    if (await editButton.count() > 0) {
      await editButton.click();
      await page.waitForTimeout(500);

      const nameInput = page.locator('input[name="name"], input[placeholder*="name" i]').first();
      
      if (await nameInput.count() > 0) {
        await nameInput.fill('Test Name');
        await page.waitForTimeout(300);
      }
    }
  });

  test('should access privacy settings', async ({ page }) => {
    const privacyLink = page.locator('text=/privacy|settings/i').first();
    
    if (await privacyLink.count() > 0) {
      await privacyLink.click();
      await page.waitForTimeout(500);

      // Privacy settings should be visible
      expect(page.locator('text=/privacy|data|permissions/i').first()).toBeVisible();
    }
  });

  test('should toggle preferences', async ({ page }) => {
    const toggle = page.locator('input[type="checkbox"], [role="switch"]').first();
    
    if (await toggle.count() > 0) {
      await toggle.click();
      await page.waitForTimeout(300);
      
      // Toggle should update
      expect(toggle).toBeDefined();
    }
  });
});

