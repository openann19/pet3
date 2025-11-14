/**
 * Type stub for detox
 * This file provides type definitions when detox is not installed
 * Install detox for e2e testing: npm install --save-dev detox
 */

declare module 'detox' {
  export const device: {
    launchApp: (config?: unknown) => Promise<void>;
    reloadReactNative: () => Promise<void>;
    sendToHome: () => Promise<void>;
    takeScreenshot: (name: string) => Promise<void>;
    [key: string]: unknown;
  };
  export const element: (selector: unknown) => {
    tap: () => Promise<void>;
    typeText: (text: string) => Promise<void>;
    scroll: (distance: number, direction: string) => Promise<void>;
    [key: string]: unknown;
  };
  export const by: {
    id: (id: string) => unknown;
    text: (text: string) => unknown;
    label: (label: string) => unknown;
    [key: string]: unknown;
  };
  export const waitFor: (element: unknown) => Promise<unknown>;
  export const expect: (element: unknown) => {
    toBeVisible: () => Promise<void>;
    toHaveText: (text: string) => Promise<void>;
    [key: string]: unknown;
  };
}

