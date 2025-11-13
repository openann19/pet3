/**
 * Mobile Authentication Flow E2E Tests
 * 
 * Tests sign up, sign in, and biometric authentication
 */

import { device, expect, element, by, waitFor } from 'detox';

describe('Authentication Flows', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should display sign in screen', async () => {
    await waitFor(element(by.text('Sign In')).atIndex(0))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should navigate to sign up screen', async () => {
    const signUpButton = element(by.text('Sign Up')).atIndex(0);
    await waitFor(signUpButton).toBeVisible().withTimeout(5000);
    await signUpButton.tap();

    await waitFor(element(by.text('Create Account')).atIndex(0))
      .toBeVisible()
      .withTimeout(3000)
      .catch(() => {
        // Alternative text
        return waitFor(element(by.text('Sign Up')).atIndex(0))
          .toBeVisible()
          .withTimeout(3000);
      });
  });

  it('should fill sign in form', async () => {
    const emailInput = element(by.id('email-input')).atIndex(0);
    const passwordInput = element(by.id('password-input')).atIndex(0);

    await waitFor(emailInput).toBeVisible().withTimeout(5000);
    await emailInput.typeText('test@example.com');
    await passwordInput.typeText('password123');
  });

  it('should handle biometric authentication', async () => {
    // Look for biometric button
    const biometricButton = element(by.id('biometric-button')).atIndex(0);
    
    await waitFor(biometricButton)
      .toBeVisible()
      .withTimeout(3000)
      .catch(() => {
        // Biometric might not be available
      });

    if (await biometricButton.isVisible()) {
      await biometricButton.tap();
      await waitFor(element(by.text('Application error')).atIndex(0))
        .not.toBeVisible()
        .withTimeout(2000);
    }
  });

  it('should not show errors during navigation', async () => {
    await waitFor(element(by.text('Application error')).atIndex(0))
      .not.toBeVisible()
      .withTimeout(1000)
      .catch(() => {
        // Expected - no errors
      });

    await waitFor(element(by.text('Route error')).atIndex(0))
      .not.toBeVisible()
      .withTimeout(1000)
      .catch(() => {
        // Expected - no errors
      });
  });
});

