/**
 * Adoption data hook
 * Location: apps/mobile/src/hooks/useAdoptionData.ts
 */

import { useMemo } from 'react'
import { samplePets } from '@mobile/data/mock-data'
import { useDomainSnapshots } from '@mobile/hooks/use-domain-snapshots'
import type { PetProfile } from '@pet/domain/pet-model'

export interface UseAdoptionDataReturn {
  primaryPet: PetProfile | undefined
  adoption: ReturnType<typeof useDomainSnapshots>['adoption']
}

/**
 * Hook to fetch and manage adoption data
 */
export function useAdoptionData(): UseAdoptionDataReturn {
  const { adoption } = useDomainSnapshots()
  const [primaryPet] = samplePets

  return useMemo(
    () => ({
      primaryPet,
      adoption,
    }),
    [primaryPet, adoption]
  )
}

