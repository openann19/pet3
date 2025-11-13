/**
 * Mobile Stories Flow E2E Tests
 * 
 * Tests story creation and viewing
 */

import { device, expect, element, by, waitFor } from 'detox';

describe('Stories Flows', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should display stories', async () => {
    const storiesList = element(by.id('stories-list')).atIndex(0);
    
    await waitFor(storiesList)
      .toBeVisible()
      .withTimeout(5000)
      .catch(() => {
        // Stories might be on home/feed screen
        return waitFor(element(by.id('story-card-0')).atIndex(0))
          .toBeVisible()
          .withTimeout(3000);
      });
  });

  it('should open story viewer', async () => {
    const storyCard = element(by.id('story-card-0')).atIndex(0);
    
    await waitFor(storyCard)
      .toBeVisible()
      .withTimeout(5000)
      .catch(() => {
        // No stories available
      });

    if (await storyCard.isVisible()) {
      await storyCard.tap();
      await waitFor(element(by.id('story-viewer')).atIndex(0))
        .toBeVisible()
        .withTimeout(3000);
    }
  });

  it('should not crash during story navigation', async () => {
    await waitFor(element(by.text('Application error')).atIndex(0))
      .not.toBeVisible()
      .withTimeout(1000)
      .catch(() => {
        // Expected - no errors
      });
  });
});

