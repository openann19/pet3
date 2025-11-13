/**
 * SSR-Safe Utilities
 * Helper functions for safely accessing browser APIs in SSR environments
 */

/**
 * Check if code is running in browser environment
 * @returns true if window is defined (browser), false otherwise (SSR)
 */
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}

/**
 * Safely access window object
 * @returns window object if in browser, null otherwise
 */
export function safeWindow(): Window | null {
  return isBrowser() ? window : null;
}

/**
 * Safely access document object
 * @returns document object if in browser, null otherwise
 */
export function safeDocument(): Document | null {
  return isBrowser() && typeof document !== 'undefined' ? document : null;
}

/**
 * Safely access navigator object
 * @returns navigator object if in browser, null otherwise
 */
export function safeNavigator(): Navigator | null {
  return isBrowser() && typeof navigator !== 'undefined' ? navigator : null;
}

/**
 * Safely access localStorage with error handling
 * @param key - Storage key
 * @param defaultValue - Default value if key doesn't exist or error occurs
 * @returns Stored value or default
 */
export function safeLocalStorageGet(key: string, defaultValue: string = ''): string {
  if (!isBrowser()) {
    return defaultValue;
  }
  
  try {
    const value = localStorage.getItem(key);
    return value ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Safely set localStorage value with error handling
 * @param key - Storage key
 * @param value - Value to store
 * @returns true if successful, false otherwise
 */
export function safeLocalStorageSet(key: string, value: string): boolean {
  if (!isBrowser()) {
    return false;
  }
  
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely remove localStorage item with error handling
 * @param key - Storage key
 * @returns true if successful, false otherwise
 */
export function safeLocalStorageRemove(key: string): boolean {
  if (!isBrowser()) {
    return false;
  }
  
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely access sessionStorage with error handling
 * @param key - Storage key
 * @param defaultValue - Default value if key doesn't exist or error occurs
 * @returns Stored value or default
 */
export function safeSessionStorageGet(key: string, defaultValue: string = ''): string {
  if (!isBrowser()) {
    return defaultValue;
  }
  
  try {
    const value = sessionStorage.getItem(key);
    return value ?? defaultValue;
  } catch {
    return defaultValue;
  }
}

/**
 * Safely set sessionStorage value with error handling
 * @param key - Storage key
 * @param value - Value to store
 * @returns true if successful, false otherwise
 */
export function safeSessionStorageSet(key: string, value: string): boolean {
  if (!isBrowser()) {
    return false;
  }
  
  try {
    sessionStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely create a MediaQueryList with error handling
 * @param query - Media query string
 * @returns MediaQueryList or null if not available
 */
export function safeMatchMedia(query: string): MediaQueryList | null {
  if (!isBrowser() || !window.matchMedia) {
    return null;
  }
  
  try {
    return window.matchMedia(query);
  } catch {
    return null;
  }
}

