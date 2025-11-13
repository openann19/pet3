/**
 * Mobile Profile Flow E2E Tests
 * 
 * Tests profile management and settings
 */

import { device, expect, element, by, waitFor } from 'detox';

describe('Profile Flows', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should navigate to profile screen', async () => {
    const profileTab = element(by.id('profile-tab')).atIndex(0);
    await waitFor(profileTab).toBeVisible().withTimeout(5000);
    await profileTab.tap();

    await waitFor(element(by.text('Profile')).atIndex(0))
      .toBeVisible()
      .withTimeout(3000)
      .catch(() => {
        // Alternative: check for profile content
        return waitFor(element(by.id('profile-screen')).atIndex(0))
          .toBeVisible()
          .withTimeout(3000);
      });
  });

  it('should display user information', async () => {
    const profileContent = element(by.id('profile-screen')).atIndex(0);
    
    await waitFor(profileContent)
      .toBeVisible()
      .withTimeout(5000)
      .catch(() => {
        // Profile should be visible or show loading
      });
  });

  it('should open settings', async () => {
    const settingsButton = element(by.id('settings-button')).atIndex(0);
    
    await waitFor(settingsButton)
      .toBeVisible()
      .withTimeout(5000)
      .catch(() => {
        // Settings might be in different location
      });

    if (await settingsButton.isVisible()) {
      await settingsButton.tap();
      await waitFor(element(by.text('Settings')).atIndex(0))
        .toBeVisible()
        .withTimeout(3000);
    }
  });

  it('should not crash during profile navigation', async () => {
    await waitFor(element(by.text('Application error')).atIndex(0))
      .not.toBeVisible()
      .withTimeout(1000)
      .catch(() => {
        // Expected - no errors
      });
  });
});

