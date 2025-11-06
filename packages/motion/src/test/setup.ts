/**
 * Test setup for @petspark/motion package
 */

import { vi } from 'vitest';

// Mock react-native-reanimated
vi.mock('react-native-reanimated', () => {
  const actual = vi.importActual('react-native-reanimated');
  return {
    ...actual,
    useSharedValue: (initialValue) => ({
      value: initialValue,
    }),
    useAnimatedStyle: (updater) => updater(),
    withSpring: (toValue, config) => toValue,
    withTiming: (toValue, config) => toValue,
    withRepeat: (animation, iterations, reverse) => animation,
    withDelay: (delay, animation) => animation,
    Easing: {
      out: (easing) => easing,
      inOut: (easing) => easing,
      poly: (n) => (t) => Math.pow(t, n),
      exp: (t) => Math.pow(2, 10 * (t - 1)),
      cubic: (t) => t * t * t,
    },
  };
});

// Mock react-native
vi.mock('react-native', () => {
  return {
    Platform: {
      OS: 'web',
      select: (obj) => obj.web || obj.default,
    },
    AccessibilityInfo: {
      isReduceMotionEnabled: () => Promise.resolve(false),
      addEventListener: () => ({ remove: () => {} }),
    },
  };
});

// Mock window.matchMedia for reduced motion
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
