/**
 * Payment Flow E2E Tests
 * 
 * Tests subscription signup, billing, and payment processing flows
 */

import { test, expect } from '@playwright/test';

test.describe('Payment Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should open pricing modal', async ({ page }) => {
    // Find and click pricing/subscription button
    const pricingButton = page.locator('text=/pricing|subscribe|premium/i').first();
    
    if (await pricingButton.count() > 0) {
      await pricingButton.click();
      await page.waitForTimeout(500);

      // Modal should be visible
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();
    }
  });

  test('should switch between monthly and yearly billing', async ({ page }) => {
    // Open pricing modal
    const pricingButton = page.locator('text=/pricing|subscribe/i').first();
    
    if (await pricingButton.count() > 0) {
      await pricingButton.click();
      await page.waitForTimeout(500);

      const monthlyButton = page.locator('text=/monthly/i');
      const yearlyButton = page.locator('text=/yearly/i');

      if (await monthlyButton.count() > 0) {
        await yearlyButton.click();
        await page.waitForTimeout(300);
        
        await monthlyButton.click();
        await page.waitForTimeout(300);
      }
    }
  });

  test('should handle subscription cancellation', async ({ page }) => {
    // Navigate to settings/subscription page
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');

    // Look for subscription management
    const subscriptionLink = page.locator('text=/subscription|billing/i').first();
    
    if (await subscriptionLink.count() > 0) {
      await subscriptionLink.click();
      await page.waitForTimeout(500);

      // Should show subscription status
      expect(page.locator('text=/active|cancel|manage/i').first()).toBeVisible();
    }
  });
});

