/**
 * Feed data fetching hook
 * Location: apps/mobile/src/hooks/useFeedData.ts
 */

import { useCallback, useEffect, useState } from 'react'
import type { PetProfile } from '@mobile/types/pet'
import { matchingApi } from '@mobile/utils/api-client'
import { createLogger } from '@mobile/utils/logger'
import { mapApiPetToProfile } from '@mobile/utils/pet-mappers'

const logger = createLogger('useFeedData')

export interface UseFeedDataReturn {
  pets: PetProfile[]
  loading: boolean
  error: string | null
  loadPets: () => Promise<void>
}

/**
 * Hook to fetch and manage feed pet data
 */
export function useFeedData(): UseFeedDataReturn {
  const [pets, setPets] = useState<PetProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPets = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      const response = await matchingApi.getAvailablePets({ limit: 20 })

      // Map API response to PetProfile format using type-safe mapper
      const mappedPets: PetProfile[] = response.pets.map((pet) => mapApiPetToProfile(pet))

      setPets(mappedPets)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load pets'
      logger.error('Failed to load pets', err instanceof Error ? err : new Error(String(err)))
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadPets()
  }, [loadPets])

  return {
    pets,
    loading,
    error,
    loadPets,
  }
}

