/**
 * Pet data mapping utilities
 * Location: apps/mobile/src/utils/pet-mappers.ts
 */

import type { PetProfile } from '@mobile/types/pet'
import type { PetApiResponse } from '@mobile/types/api'

/**
 * Valid species types
 */
type PetSpecies = 'dog' | 'cat' | 'bird' | 'rabbit' | 'other'

/**
 * Map API response pet to UI PetProfile
 */
export function mapApiPetToProfile(apiPet: PetApiResponse): PetProfile {
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

