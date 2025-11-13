/**
 * Matches data hook
 * Location: apps/mobile/src/hooks/matches/useMatchesData.ts
 */

import { useMemo } from 'react'
import type { Match } from '@mobile/types/pet'

export interface UseMatchesDataOptions {
  matchId?: string | undefined
}

export interface UseMatchesDataReturn {
  matches: Match[]
  isLoading: boolean
  selectedMatch: Match | undefined
}

/**
 * Hook to fetch and manage matches data
 * In production, this would fetch from API
 */
export function useMatchesData(options: UseMatchesDataOptions): UseMatchesDataReturn {
  const { matchId } = options

  // In production, this would fetch matches from API
  const matches: Match[] = []
  const isLoading = false

  const selectedMatch = useMemo(() => {
    if (matchId !== null && matchId !== undefined && matchId !== '') {
      return matches.find(match => match.id === matchId)
    }
    return undefined
  }, [matchId, matches])

  return {
    matches,
    isLoading,
    selectedMatch,
  }
}

