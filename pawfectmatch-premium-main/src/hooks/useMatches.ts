import { useState, useEffect, useMemo } from 'react'
import { useStorage } from '@/hooks/useStorage'
import type { Pet, Match } from '@/lib/types'
import { generateMatchReasoning } from '@/lib/matching'

export function useMatches() {
  const [matches] = useStorage<Match[]>('matches', [])
  const [allPets] = useStorage<Pet[]>('all-pets', [])
  const [userPets] = useStorage<Pet[]>('user-pets', [])
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null)
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [matchReasoning, setMatchReasoning] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const userPet = useMemo(() => {
    return Array.isArray(userPets) && userPets.length > 0 ? userPets[0] : undefined
  }, [userPets])

  const matchedPets = useMemo(() => {
    if (!Array.isArray(matches) || !Array.isArray(allPets)) return []
    return matches
      .filter(m => m.status === 'active')
      .map(match => {
        const pet = allPets.find(p => p.id === match.matchedPetId)
        return pet ? { ...pet, match } : null
      })
      .filter((p): p is Pet & { match: Match } => p !== null)
  }, [matches, allPets])

  useEffect(() => {
    if (matches !== undefined) {
      setIsLoading(false)
    }
  }, [matches])

  useEffect(() => {
    if (selectedPet && userPet && selectedMatch) {
      generateMatchReasoning(userPet, selectedPet).then(setMatchReasoning)
    } else {
      setMatchReasoning([])
    }
  }, [selectedPet?.id, userPet?.id, selectedMatch])

  const selectPet = (pet: Pet | null, match: Match | null) => {
    setSelectedPet(pet)
    setSelectedMatch(match)
  }

  const clearSelection = () => {
    setSelectedPet(null)
    setSelectedMatch(null)
  }

  return {
    matches,
    allPets,
    userPets,
    userPet,
    matchedPets,
    selectedPet,
    selectedMatch,
    matchReasoning,
    isLoading,
    selectPet,
    clearSelection,
  }
}

