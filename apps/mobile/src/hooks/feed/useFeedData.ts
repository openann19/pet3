/**
 * Hook for Feed Screen Data Management
 * 
 * Handles pet data fetching, loading states, and error handling using TanStack Query.
 * 
 * Location: apps/mobile/src/hooks/feed/useFeedData.ts
 */

import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { UseQueryResult } from '@tanstack/react-query'
import type { PetProfile } from '@mobile/types/pet'
import type { PetApiResponse } from '@mobile/types/api'
import { matchingApi } from '@mobile/utils/api-client'
import { queryKeys } from '@mobile/lib/query-client'
import { createLogger } from '@mobile/utils/logger'

const logger = createLogger('useFeedData')

/**
 * Valid species types
 */
type PetSpecies = 'dog' | 'cat' | 'bird' | 'rabbit' | 'other'

/**
 * Map API response pet to UI PetProfile
 */
function mapApiPetToProfile(apiPet: PetApiResponse): PetProfile {
  // Validate species - default to 'other' if invalid
  const validSpecies: PetSpecies[] = ['dog', 'cat', 'bird', 'rabbit', 'other']
  const species = validSpecies.includes(apiPet.species as PetSpecies)
    ? (apiPet.species as PetSpecies)
    : 'other'

  // Filter and map media to photos
  const photos = apiPet.media.filter(media => media.type === 'photo').map(media => media.url)

  // Use API timestamps if available, otherwise use current time as fallback
  const now = new Date().toISOString()
  const createdAt = apiPet.createdAt ?? now
  const updatedAt = apiPet.updatedAt ?? createdAt

  return {
    id: apiPet.id,
    ownerId: apiPet.ownerId,
    name: apiPet.name,
    species,
    breed: apiPet.breedName,
    age: Math.floor(apiPet.ageMonths / 12),
    photos,
    createdAt,
    updatedAt,
  }
}

/**
 * Fetch feed pets from API
 */
async function fetchFeedPets(limit: number = 20): Promise<PetProfile[]> {
  try {
    const response = await matchingApi.getAvailablePets({ limit })
    return response.pets.map((pet) => mapApiPetToProfile(pet))
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to load pets'
    logger.error('Failed to load pets', err instanceof Error ? err : new Error(errorMessage))
    throw err
  }
}

export interface UseFeedDataReturn {
  pets: PetProfile[]
  loading: boolean
  error: string | null
  loadPets: () => Promise<void>
}

/**
 * Hook for managing feed data using TanStack Query
 */
export function useFeedData(limit: number = 20): UseFeedDataReturn {
  const queryClient = useQueryClient()
  const queryKey = queryKeys.pets.feed(limit)

  const query: UseQueryResult<PetProfile[], Error> = useQuery({
    queryKey,
    queryFn: () => fetchFeedPets(limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  })

  const pets = useMemo(() => query.data ?? [], [query.data])

  const loadPets = useMemo(
    () => async (): Promise<void> => {
      await queryClient.invalidateQueries({ queryKey })
    },
    [queryClient, queryKey]
  )

  return {
    pets,
    loading: query.isLoading,
    error: query.error !== null && query.error !== undefined ? query.error.message : null,
    loadPets,
  }
}

