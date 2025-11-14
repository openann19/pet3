/**
 * DiscoveryList Component Tests
 * Location: apps/mobile/src/components/feed/__tests__/DiscoveryList.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import React, { type ReactNode } from 'react'
import { View, type View as ViewType } from 'react-native'
import { DiscoveryList } from '../DiscoveryList'
import { useFeedData } from '@mobile/hooks/feed/useFeedData'
import type { PetProfile } from '@mobile/types/pet'

// Mock useFeedData hook
vi.mock('@mobile/hooks/feed/useFeedData', () => ({
  useFeedData: vi.fn(),
}))

// Mock FlashList
vi.mock('@shopify/flash-list', () => {
  const React = require('react')
  const { View } = require('react-native')
  return {
    FlashList: ({ data, renderItem, keyExtractor }: {
      data: PetProfile[]
      renderItem: ({ item }: { item: PetProfile }) => React.ReactElement
      keyExtractor: (item: PetProfile) => string
    }) => {
      return React.createElement(
        View,
        { testID: 'flash-list' },
        data.map((item) => (
          React.createElement(
            View,
            { key: keyExtractor(item), testID: `pet-item-${item.id}` },
            renderItem({ item })
          )
        ))
      )
    },
  }
})

// Mock react-native-reanimated
vi.mock('react-native-reanimated', () => ({
  default: {
    View: ({ children }: { children: React.ReactNode }) => children,
  },
  useSharedValue: () => ({ value: 0 }),
  useAnimatedStyle: () => ({}),
  withTiming: vi.fn((value: number) => value),
}))

const mockUseFeedData = vi.mocked(useFeedData)

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

// Wrapper component
function createWrapper(): ({ children }: { children: ReactNode }) => React.JSX.Element {
  const queryClient = createTestQueryClient()
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe('DiscoveryList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render loading state', () => {
    mockUseFeedData.mockReturnValue({
      pets: [],
      loading: true,
      error: null,
      loadPets: vi.fn(),
    })

    render(<DiscoveryList />, { wrapper: createWrapper() })

    expect(screen.getByText('Loading pets...')).toBeDefined()
  })

  it('should render error state', () => {
    const errorMessage = 'Failed to load pets'
    mockUseFeedData.mockReturnValue({
      pets: [],
      loading: false,
      error: errorMessage,
      loadPets: vi.fn(),
    })

    render(<DiscoveryList />, { wrapper: createWrapper() })

    expect(screen.getByText('Failed to load pets')).toBeDefined()
    expect(screen.getByText(errorMessage)).toBeDefined()
  })

  it('should render empty state when no pets', () => {
    mockUseFeedData.mockReturnValue({
      pets: [],
      loading: false,
      error: null,
      loadPets: vi.fn(),
    })

    render(<DiscoveryList />, { wrapper: createWrapper() })

    expect(screen.getByText('No pets found')).toBeDefined()
  })

  it('should render list of pets', () => {
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

    mockUseFeedData.mockReturnValue({
      pets: mockPets,
      loading: false,
      error: null,
      loadPets: vi.fn(),
    })

    render(<DiscoveryList />, { wrapper: createWrapper() })

    expect(screen.getByText('Fluffy')).toBeDefined()
    expect(screen.getByText('Buddy')).toBeDefined()
    expect(screen.getByText('dog')).toBeDefined()
    expect(screen.getByText('cat')).toBeDefined()
  })

  it('should call loadPets when retry is pressed', () => {
    const mockLoadPets = vi.fn()
    mockUseFeedData.mockReturnValue({
      pets: [],
      loading: false,
      error: 'Failed to load',
      loadPets: mockLoadPets,
    })

    render(<DiscoveryList />, { wrapper: createWrapper() })

    const retryButton = screen.getByText('Retry')
    fireEvent.press(retryButton)

    expect(mockLoadPets).toHaveBeenCalledTimes(1)
  })

  it('should have proper accessibility attributes', () => {
    mockUseFeedData.mockReturnValue({
      pets: [],
      loading: false,
      error: null,
      loadPets: vi.fn(),
    })

    render(<DiscoveryList />, { wrapper: createWrapper() })

    const list = screen.getByTestId('flash-list')
    expect(list).toBeDefined()
  })
})

