import { useEffect, useState } from 'react'
import { useStorage } from '@/hooks/useStorage'
import { generateSamplePets } from '@/lib/seedData'
import { initializeCommunityData } from '@/lib/community-seed-data'
import { initializeAdoptionProfiles } from '@/lib/adoption-seed-data'
import type { Pet } from '@/lib/types'
import { createLogger } from '@/lib/logger'
import { ENV } from '@/config/env'

const logger = createLogger('SeedDataInitializer')

/**
 * SeedDataInitializer
 * 
 * Only runs when VITE_USE_MOCKS=true (development/mock mode).
 * In production, data comes from the backend API.
 */
export default function SeedDataInitializer() {
  const useMocks = ENV.VITE_USE_MOCKS === 'true'
  const [allPets, setAllPets] = useStorage<Pet[]>('all-pets', [])
  const [isInitialized, setIsInitialized] = useStorage<boolean>('data-initialized', false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Only run in mock mode
    if (!useMocks) {
      logger.debug('SeedDataInitializer disabled - using backend API')
      return
    }

    async function initializeData() {
      if (isInitialized || isLoading) return
      
      const currentPets = allPets || []
      if (currentPets.length > 0) {
        setIsInitialized(true)
        await initializeCommunityData()
        await initializeAdoptionProfiles()
        return
      }

      setIsLoading(true)
      try {
        const samplePets = await generateSamplePets(15) // Generate 15 profiles
        setAllPets(samplePets)
        await initializeCommunityData()
        await initializeAdoptionProfiles()
        setIsInitialized(true)
      } catch (error) {
        logger.error('Failed to initialize sample data', error instanceof Error ? error : new Error(String(error)))
      } finally {
        setIsLoading(false)
      }
    }

    void initializeData()
  }, [useMocks, isInitialized, isLoading, allPets, setAllPets, setIsInitialized])

  // Return null - this component doesn't render anything
  return null
}
