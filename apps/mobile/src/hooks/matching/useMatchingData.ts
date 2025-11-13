/**
 * Hook for Matching Screen Data
 * 
 * Handles pet data fetching and state management for matching screen.
 * 
 * Location: apps/mobile/src/hooks/matching/useMatchingData.ts
 */

import { useMemo } from 'react'
import { usePets } from '@mobile/hooks/use-pets'
import type { PetProfile } from '@mobile/types/pet'

export interface UseMatchingDataReturn {
  pets: PetProfile[]
  isLoading: boolean
  error: Error | null
  refetch: () => Promise<void>
}

/**
 * Hook for managing matching screen data
 */
export function useMatchingData(): UseMatchingDataReturn {
  const { data, isLoading, error, refetch } = usePets()

  const pets = useMemo(() => data?.items ?? [], [data?.items])

  return {
    pets,
    isLoading,
    error: error instanceof Error ? error : null,
    refetch,
  }
}

