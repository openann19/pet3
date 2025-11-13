/**
 * Profile data hook
 * Location: apps/mobile/src/hooks/useProfileData.ts
 */

import { useMemo } from 'react'
import { samplePets } from '@mobile/data/mock-data'
import type { PetProfile } from '@pet/domain/pet-model'

export interface UseProfileDataOptions {
  petId?: string | undefined
  userId?: string | undefined
}

export interface UseProfileDataReturn {
  displayedPets: PetProfile[]
}

/**
 * Hook to fetch and filter profile pet data
 */
export function useProfileData(options: UseProfileDataOptions): UseProfileDataReturn {
  const { petId, userId } = options

  // In production, use petId/userId to filter pets
  // For now, filter samplePets if petId is provided
  const displayedPets = useMemo(() => {
    if (petId !== null && petId !== undefined && petId !== '') {
      return samplePets.filter(pet => pet.id === petId)
    }
    if (userId !== null && userId !== undefined && userId !== '') {
      // In production, filter by userId/ownerId
      return samplePets
    }
    return samplePets
  }, [petId, userId])

  return {
    displayedPets,
  }
}

