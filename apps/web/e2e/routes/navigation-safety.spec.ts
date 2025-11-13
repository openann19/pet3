/**
 * Navigation Safety E2E Tests
 * 
 * Tests all routes to ensure no runtime errors when navigating between pages.
 * This is critical for the "No Runtime Errors Between Pages" requirement.
 */

import { test, expect } from '@playwright/test';

const routes = [
  { path: '/', name: 'Home' },
  { path: '/discover', name: 'Discover' },
  { path: '/matches', name: 'Matches' },
  { path: '/profile', name: 'Profile' },
  { path: '/chat', name: 'Chat' },
  { path: '/community', name: 'Community' },
  { path: '/adoption', name: 'Adoption' },
  { path: '/lost-found', name: 'Lost & Found' },
];

test.describe('Navigation Safety', () => {
  test.beforeEach(async ({ page }) => {
    // Set up test environment
    await page.goto('/');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate to all routes without errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    for (const route of routes) {
      await page.goto(route.path);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000); // Wait for any async operations

      // Check for error overlays
      const errorOverlay = page.locator('text=/error|crash|something went wrong/i');
      const errorCount = await errorOverlay.count();
      
      expect(errorCount).toBe(0);
    }

    expect(errors.length).toBe(0);
  });

  test('should handle navigation between routes', async ({ page }) => {
    const errors: string[] = [];

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    // Navigate through routes in sequence
    for (let i = 0; i < routes.length; i++) {
      const route = routes[i];
      await page.goto(route.path);
      await page.waitForLoadState('networkidle');

      // Navigate to next route
      if (i < routes.length - 1) {
        const nextRoute = routes[i + 1];
        await page.goto(nextRoute.path);
        await page.waitForLoadState('networkidle');
      }
    }

    expect(errors.length).toBe(0);
  });

  test('should handle back navigation', async ({ page }) => {
    const errors: string[] = [];

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    // Navigate forward
    await page.goto('/discover');
    await page.waitForLoadState('networkidle');
    
    await page.goto('/matches');
    await page.waitForLoadState('networkidle');

    // Navigate back
    await page.goBack();
    await page.waitForLoadState('networkidle');

    expect(errors.length).toBe(0);
    expect(page.url()).toContain('/discover');
  });

  test('should handle deep linking with params', async ({ page }) => {
    const errors: string[] = [];

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    // Test routes with parameters
    const routesWithParams = [
      '/profile?tab=pets',
      '/chat?room=room1',
      '/adoption?filter=active',
    ];

    for (const route of routesWithParams) {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(500);
    }

    expect(errors.length).toBe(0);
  });

  test('should handle invalid routes gracefully', async ({ page }) => {
    const errors: string[] = [];

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.goto('/invalid-route-12345');
    await page.waitForLoadState('networkidle');

    // Should show 404 or redirect, not crash
    const hasErrorOverlay = await page.locator('text=/error|crash/i').count();
    expect(hasErrorOverlay).toBe(0);
  });
});

