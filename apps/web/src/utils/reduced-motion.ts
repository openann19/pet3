/**
 * Utility for checking prefers-reduced-motion preference
 * Uses SSR-safe utilities for browser API access
 */

import { useState, useEffect } from 'react';
import { safeMatchMedia, isBrowser } from '@/utils/ssr-safe';

let prefersReducedMotion: boolean | null = null;

export function getPrefersReducedMotion(): boolean {
  if (prefersReducedMotion === null) {
    const mediaQuery = safeMatchMedia('(prefers-reduced-motion: reduce)');
    prefersReducedMotion = mediaQuery?.matches ?? false;
  }
  return prefersReducedMotion ?? false;
}

export function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(() => {
    if (!isBrowser()) return false;
    const mediaQuery = safeMatchMedia('(prefers-reduced-motion: reduce)');
    return mediaQuery?.matches ?? false;
  });

  useEffect(() => {
    if (!isBrowser()) return;

    const mediaQuery = safeMatchMedia('(prefers-reduced-motion: reduce)');
    if (!mediaQuery) return;

    const handleChange = (e: MediaQueryListEvent): void => {
      setPrefersReduced(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReduced;
}
