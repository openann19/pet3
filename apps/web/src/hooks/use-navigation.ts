/**
 * Typed Navigation Hook
 * Provides type-safe navigation for the app
 */

import { useCallback } from 'react';
import type { View, RouteConfig } from '@/lib/routes';
import { routes, getSafeRouteParams, isValidView, getDefaultView } from '@/lib/routes';

export interface UseNavigationReturn {
  navigate: (config: RouteConfig) => void;
  navigateToView: (view: View) => void;
  routes: typeof routes;
}

/**
 * Hook for type-safe navigation
 * Returns navigation functions and route helpers
 */
export function useNavigation(
  setCurrentView: (view: View) => void
): UseNavigationReturn {
  const navigate = useCallback(
    (config: RouteConfig) => {
      // Validate params if schema exists - this ensures runtime safety
      // getSafeRouteParams will return safe defaults if validation fails
      if (config.params) {
        getSafeRouteParams(config.view, config.params);
      }
      // Ensure view is valid before setting
      const validView = isValidView(config.view) ? config.view : getDefaultView();
      setCurrentView(validView);
    },
    [setCurrentView]
  );

  const navigateToView = useCallback(
    (view: View | string) => {
      // Validate view before navigation for runtime safety
      const validView = isValidView(view) ? view : getDefaultView();
      setCurrentView(validView);
    },
    [setCurrentView]
  );

  return {
    navigate,
    navigateToView,
    routes,
  };
}

