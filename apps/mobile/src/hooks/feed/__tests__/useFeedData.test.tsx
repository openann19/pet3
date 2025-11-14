/**
 * useFeedData Hook Tests
 * Location: apps/mobile/src/hooks/feed/__tests__/useFeedData.test.ts
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { type ReactNode } from 'react'
import { useFeedData } from '../useFeedData'
import { matchingApi } from '@mobile/utils/api-client'
import type { PetProfile } from '@mobile/types/pet'

// Mock API client
vi.mock('@mobile/utils/api-client', () => ({
  matchingApi: {
    getAvailablePets: vi.fn(),
  },
}))

const mockMatchingApi = vi.mocked(matchingApi)

// Create test query client
function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
    },
  })
}

// Wrapper component for hooks
function createWrapper(): ({ children }: { children: ReactNode }) => React.JSX.Element {
  const queryClient = createTestQueryClient()
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

describe('useFeedData', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return loading state initially', async () => {
    mockMatchingApi.getAvailablePets.mockResolvedValue({
      pets: [],
      total: 0,
    })

    const { result } = renderHook(() => useFeedData(), {
      wrapper: createWrapper(),
    })

    expect(result.current.loading).toBe(true)
    expect(result.current.pets).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('should fetch and return pets successfully', async () => {
    const mockPets: PetProfile[] = [
      {
        id: 'pet1',
        ownerId: 'owner1',
        name: 'Fluffy',
        species: 'dog',
        breed: 'Golden Retriever',
        age: 3,
        photos: ['/photo1.jpg'],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z',
      },
      {
        id: 'pet2',
        ownerId: 'owner2',
        name: 'Buddy',
        species: 'cat',
        breed: 'Persian',
        age: 2,
        photos: ['/photo2.jpg'],
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z',
      },
    ]

    mockMatchingApi.getAvailablePets.mockResolvedValue({
      pets: [
        {
          id: 'pet1',
          ownerId: 'owner1',
          name: 'Fluffy',
          species: 'dog',
          breedId: 'breed1',
          breedName: 'Golden Retriever',
          sex: 'male',
          neuterStatus: 'neutered',
          dateOfBirth: '2021-01-01',
          ageMonths: 36,
          lifeStage: 'adult',
          size: 'large',
          weightKg: 30,
          intents: [],
          location: {
            geohash: 'abc123',
            roundedLat: 37.7749,
            roundedLng: -122.4194,
            city: 'San Francisco',
            country: 'USA',
            timezone: 'America/Los_Angeles',
          },
          media: [{ type: 'photo', url: '/photo1.jpg' }],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
        {
          id: 'pet2',
          ownerId: 'owner2',
          name: 'Buddy',
          species: 'cat',
          breedId: 'breed2',
          breedName: 'Persian',
          sex: 'female',
          neuterStatus: 'spayed',
          dateOfBirth: '2022-01-01',
          ageMonths: 24,
          lifeStage: 'adult',
          size: 'medium',
          weightKg: 5,
          intents: [],
          location: {
            geohash: 'def456',
            roundedLat: 37.7749,
            roundedLng: -122.4194,
            city: 'San Francisco',
            country: 'USA',
            timezone: 'America/Los_Angeles',
          },
          media: [{ type: 'photo', url: '/photo2.jpg' }],
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z',
        },
      ],
      total: 2,
    })

    const { result } = renderHook(() => useFeedData(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.pets).toHaveLength(2)
    expect(result.current.pets[0].name).toBe('Fluffy')
    expect(result.current.pets[1].name).toBe('Buddy')
    expect(result.current.error).toBeNull()
  })

  it('should handle errors correctly', async () => {
    const errorMessage = 'Failed to fetch pets'
    mockMatchingApi.getAvailablePets.mockRejectedValue(new Error(errorMessage))

    const { result } = renderHook(() => useFeedData(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBe(errorMessage)
    expect(result.current.pets).toEqual([])
  })

  it('should map API response to PetProfile correctly', async () => {
    mockMatchingApi.getAvailablePets.mockResolvedValue({
      pets: [
        {
          id: 'pet1',
          ownerId: 'owner1',
          name: 'Fluffy',
          species: 'dog',
          breedId: 'breed1',
          breedName: 'Golden Retriever',
          sex: 'male',
          neuterStatus: 'neutered',
          dateOfBirth: '2021-01-01',
          ageMonths: 36,
          lifeStage: 'adult',
          size: 'large',
          weightKg: 30,
          intents: [],
          location: {
            geohash: 'abc123',
            roundedLat: 37.7749,
            roundedLng: -122.4194,
            city: 'San Francisco',
            country: 'USA',
            timezone: 'America/Los_Angeles',
          },
          media: [
            { type: 'photo', url: '/photo1.jpg' },
            { type: 'video', url: '/video1.mp4' },
          ],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
      total: 1,
    })

    const { result } = renderHook(() => useFeedData(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    const pet = result.current.pets[0]
    if (pet) {
      expect(pet.age).toBe(3) // 36 months = 3 years
      expect(pet.photos).toEqual(['/photo1.jpg']) // Only photos, not videos
      expect(pet.species).toBe('dog')
    }
  })

  it('should handle invalid species by defaulting to other', async () => {
    mockMatchingApi.getAvailablePets.mockResolvedValue({
      pets: [
        {
          id: 'pet1',
          ownerId: 'owner1',
          name: 'Fluffy',
          species: 'invalid-species',
          breedId: 'breed1',
          breedName: 'Unknown',
          sex: 'male',
          neuterStatus: 'neutered',
          dateOfBirth: '2023-01-01',
          ageMonths: 12,
          lifeStage: 'adult',
          size: 'medium',
          weightKg: 15,
          intents: [],
          location: {
            geohash: 'abc123',
            roundedLat: 37.7749,
            roundedLng: -122.4194,
            city: 'San Francisco',
            country: 'USA',
            timezone: 'America/Los_Angeles',
          },
          media: [],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z',
        },
      ],
      total: 1,
    })

    const { result } = renderHook(() => useFeedData(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.pets[0].species).toBe('other')
  })

  it('should support custom limit parameter', async () => {
    mockMatchingApi.getAvailablePets.mockResolvedValue({
      pets: [],
      total: 0,
    })

    renderHook(() => useFeedData(50), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(mockMatchingApi.getAvailablePets).toHaveBeenCalledWith({ limit: 50 })
    })
  })

  it('should provide loadPets function for manual refresh', async () => {
    mockMatchingApi.getAvailablePets.mockResolvedValue({
      pets: [],
      total: 0,
    })

    const { result } = renderHook(() => useFeedData(), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(typeof result.current.loadPets).toBe('function')
    
    // Call loadPets should invalidate query
    await result.current.loadPets()
    
    // Query should be refetched
    await waitFor(() => {
      expect(mockMatchingApi.getAvailablePets).toHaveBeenCalledTimes(2)
    })
  })
})

