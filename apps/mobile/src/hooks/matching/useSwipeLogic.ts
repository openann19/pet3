/**
 * Hook for Swipe Logic
 * 
 * Handles swipe actions (like/dislike) and match detection.
 * 
 * Location: apps/mobile/src/hooks/matching/useSwipeLogic.ts
 */

import { useCallback, useState } from 'react'
import { useDislikePet, useLikePet } from '@mobile/hooks/use-pets'
import { useUserStore } from '@mobile/store/user-store'
import type { ApiResponse } from '@mobile/types/api'
import type { Match, PetProfile } from '@mobile/types/pet'
import { safeArrayAccess } from '@mobile/utils/runtime-safety'
import * as Haptics from 'expo-haptics'

export interface UseSwipeLogicReturn {
  showMatch: boolean
  matchPetNames: [string, string]
  handleSwipeLeft: (petId: string) => void
  handleSwipeRight: (petId: string) => void
  handleMatchComplete: () => void
}

/**
 * Hook for managing swipe logic and match detection
 */
export function useSwipeLogic(pets: PetProfile[]): UseSwipeLogicReturn {
  const [showMatch, setShowMatch] = useState(false)
  const [matchPetNames, setMatchPetNames] = useState<[string, string]>(['', ''])
  const likePet = useLikePet()
  const dislikePet = useDislikePet()
  const { user } = useUserStore()

  const handleSwipeLeft = useCallback(
    (petId: string): void => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      dislikePet.mutate(petId)
    },
    [dislikePet]
  )

  const handleSwipeRight = useCallback(
    (petId: string): void => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
      likePet.mutate(petId, {
        onSuccess: (response: ApiResponse<Match | null>) => {
          if (response.data && 'id' in response.data) {
            // Match occurred
            const swipedPet = pets.find((p: { id: string }) => p.id === petId)
            const userPet = safeArrayAccess(user?.pets, 0)
            if (swipedPet && userPet) {
              setMatchPetNames([userPet.name, swipedPet.name])
              setShowMatch(true)
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            }
          }
        },
      })
    },
    [likePet, pets, user]
  )

  const handleMatchComplete = useCallback((): void => {
    setShowMatch(false)
    setMatchPetNames(['', ''])
  }, [])

  return {
    showMatch,
    matchPetNames,
    handleSwipeLeft,
    handleSwipeRight,
    handleMatchComplete,
  }
}

