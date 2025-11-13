/**
 * useValidatedRouteParams Hook
 * 
 * Provides type-safe, validated route params for tab screens with defensive guards.
 * Ensures runtime safety when accessing route parameters using Zod validation.
 * 
 * Location: apps/mobile/src/hooks/use-validated-route-params.ts
 */

import { useRoute } from '@react-navigation/native'
import { useMemo } from 'react'
import { getSafeRouteParams } from '@mobile/navigation/helpers'
import type { RootTabParamList } from '@mobile/navigation/types'

/**
 * Hook to get validated route params for a tab screen
 * Returns validated params with safe defaults if validation fails
 * Uses Zod schemas for runtime validation
 */
export function useValidatedRouteParams<T extends keyof RootTabParamList>(
  screenName: T
): RootTabParamList[T] {
  const route = useRoute()

  return useMemo(() => {
    // route.params is typed as object | undefined, but we need to validate it
    // getSafeRouteParams handles the Zod validation and type narrowing
    const validatedParams = getSafeRouteParams(screenName, route.params)
    return validatedParams as RootTabParamList[T]
  }, [route.params, screenName])
}

/**
 * Hook to get a specific validated param with optional default
 * Returns the param value if valid, otherwise returns defaultValue
 */
export function useValidatedRouteParam<T extends keyof RootTabParamList>(
  screenName: T,
  paramKey: keyof NonNullable<RootTabParamList[T]>,
  defaultValue?: unknown
): unknown {
  const params = useValidatedRouteParams(screenName)
  
  // Guard: ensure params is an object
  if (!params || typeof params !== 'object') {
    return defaultValue
  }
  
  // Type-safe access to params object
  const paramsRecord = params as Record<string, unknown>
  const value = paramsRecord[String(paramKey)]
  return value !== undefined ? value : defaultValue
}

