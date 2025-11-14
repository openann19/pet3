import { useEffect, useState } from 'react';
import { createLogger } from '@/lib/logger';

const logger = createLogger('useReducedMotion');

const FORCE_ANIMATION_STORAGE_KEY = 'petspark:force-motion';

type ImportMetaWithEnv = ImportMeta & { env?: Record<string, string | undefined> };

const getImportMetaEnv = (): Record<string, string | undefined> | undefined => {
  if (typeof import.meta === 'undefined') {
    return undefined;
  }

  return (import.meta as ImportMetaWithEnv).env;
};

const isForceAnimationsEnabled = (): boolean => {
  const env = getImportMetaEnv();
  if (env?.VITE_FORCE_ANIMATIONS === 'true') {
    return true;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return window.localStorage.getItem(FORCE_ANIMATION_STORAGE_KEY) === 'true';
  } catch (error) {
    logger.warn('Unable to read localStorage override', error);
    return false;
  }
};

const resolveReducedMotionPreference = (mediaQuery?: MediaQueryList): boolean => {
  if (isForceAnimationsEnabled()) {
    return false;
  }

  if (typeof window === 'undefined') {
    return false;
  }

  const query = mediaQuery ?? window.matchMedia('(prefers-reduced-motion: reduce)');
  return query.matches;
};

const setForceAnimationsOverride = (enabled: boolean): boolean => {
  let result = false;
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    if (enabled) {
      window.localStorage.setItem(FORCE_ANIMATION_STORAGE_KEY, 'true');
    } else {
      window.localStorage.removeItem(FORCE_ANIMATION_STORAGE_KEY);
    }
    result = enabled;
  } catch (error) {
    logger.warn('Unable to persist force-motion override', error);
  }

  window.dispatchEvent(new Event('petspark:force-motion-change'));
  return result || isForceAnimationsEnabled();
};

const getForceAnimationsOverride = (): boolean => isForceAnimationsEnabled();

if (typeof window !== 'undefined') {
  window.petspark = {
    ...(window.petspark ?? {}),
    setForceAnimations: setForceAnimationsOverride,
    getForceAnimations: getForceAnimationsOverride,
  };
}

declare global {
  interface Window {
    petspark?: {
      setForceAnimations?: (enabled: boolean) => boolean;
      getForceAnimations?: () => boolean;
    };
  }
}

/**
 * Hook to detect if user prefers reduced motion
 * Respects system accessibility settings with a developer override.
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return resolveReducedMotionPreference();
  });

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const updatePreference = () => {
      setPrefersReducedMotion(resolveReducedMotionPreference(mediaQuery));
    };

    updatePreference();

    const handleChange = (): void => {
      updatePreference();
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange);
    }

    const handleStorage = (event: StorageEvent): void => {
      if (!event.key || event.key === FORCE_ANIMATION_STORAGE_KEY) {
        updatePreference();
      }
    };

    const handleForceEvent = (): void => {
      updatePreference();
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('petspark:force-motion-change', handleForceEvent);

    window.petspark = {
      ...(window.petspark ?? {}),
      setForceAnimations: setForceAnimationsOverride,
      getForceAnimations: getForceAnimationsOverride,
    };

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }

      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('petspark:force-motion-change', handleForceEvent);
    };
  }, []);

  return prefersReducedMotion;
}
