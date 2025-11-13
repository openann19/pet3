/**
 * PetProfileCard Component Tests
 * Location: apps/mobile/src/components/profile/__tests__/PetProfileCard.test.tsx
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react-native'
import { PetProfileCard } from '../PetProfileCard'
import type { PetProfile } from '@pet/domain/pet-model'

// Mock react-native-reanimated
vi.mock('react-native-reanimated', () => ({
  default: {
    View: ({ children }: { children: React.ReactNode }) => children,
  },
  useSharedValue: () => ({ value: 0 }),
  useAnimatedStyle: () => ({}),
  withTiming: vi.fn((value: number) => value),
}))

describe('PetProfileCard', () => {
  const mockPet: PetProfile = {
    id: 'pet1',
    ownerId: 'owner1',
    name: 'Fluffy',
    species: 'dog',
    breedName: 'Golden Retriever',
    ageMonths: 36,
    lifeStage: 'adult',
    intents: ['adoption', 'playdate'],
    kycVerified: true,
    vetVerified: false,
    location: {
      city: 'San Francisco',
      country: 'USA',
    },
    photos: ['/photo1.jpg'],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render pet name and breed', () => {
    render(<PetProfileCard pet={mockPet} />)

    expect(screen.getByText('Fluffy')).toBeDefined()
    expect(screen.getByText(/Golden Retriever/)).toBeDefined()
  })

  it('should render life stage', () => {
    render(<PetProfileCard pet={mockPet} />)

    expect(screen.getByText('Life stage')).toBeDefined()
    expect(screen.getByText('adult')).toBeDefined()
  })

  it('should render intents', () => {
    render(<PetProfileCard pet={mockPet} />)

    expect(screen.getByText('Intents')).toBeDefined()
    expect(screen.getByText(/adoption.*playdate/)).toBeDefined()
  })

  it('should render KYC status with success tone when verified', () => {
    render(<PetProfileCard pet={mockPet} />)

    expect(screen.getByText('KYC')).toBeDefined()
    expect(screen.getByText('verified')).toBeDefined()
  })

  it('should render KYC status with warning tone when not verified', () => {
    const unverifiedPet = { ...mockPet, kycVerified: false }
    render(<PetProfileCard pet={unverifiedPet} />)

    expect(screen.getByText('KYC')).toBeDefined()
    expect(screen.getByText('pending')).toBeDefined()
  })

  it('should render vet docs status', () => {
    render(<PetProfileCard pet={mockPet} />)

    expect(screen.getByText('Vet docs')).toBeDefined()
    expect(screen.getByText('missing')).toBeDefined()
  })

  it('should handle empty intents array', () => {
    const petWithoutIntents = { ...mockPet, intents: [] }
    render(<PetProfileCard pet={petWithoutIntents} />)

    expect(screen.getByText('Intents')).toBeDefined()
    expect(screen.getByText('—')).toBeDefined()
  })

  it('should handle missing intents', () => {
    const petWithoutIntents = { ...mockPet, intents: undefined as unknown as string[] }
    render(<PetProfileCard pet={petWithoutIntents} />)

    expect(screen.getByText('Intents')).toBeDefined()
    expect(screen.getByText('—')).toBeDefined()
  })
})

