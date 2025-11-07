import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DiscoverView from '../DiscoverView'
import type { Pet } from '@/lib/types'

// Mock react-native-reanimated
vi.mock('react-native-reanimated', () => ({
  default: {
    useSharedValue: vi.fn((initial: number) => ({ value: initial })),
    useAnimatedStyle: vi.fn(() => ({})),
    withSpring: vi.fn((v) => v),
    withTiming: vi.fn((v) => v),
    withRepeat: vi.fn((v) => v),
    withSequence: vi.fn((v) => v),
    withDelay: vi.fn((v) => v),
  },
  useSharedValue: vi.fn((initial: number) => ({ value: initial })),
  useAnimatedStyle: vi.fn(() => ({})),
  withSpring: vi.fn((v) => v),
  withTiming: vi.fn((v) => v),
  withRepeat: vi.fn((v) => v),
  withSequence: vi.fn((v) => v),
  withDelay: vi.fn((v) => v),
}))

vi.mock('@/effects/reanimated/animated-view', () => ({
  AnimatedView: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="animated-view" {...props}>{children}</div>
  )
}))

vi.mock('@/effects/reanimated/animate-presence', () => ({
  AnimatePresence: ({ children }: { children?: React.ReactNode }) => <>{children}</>
}))

vi.mock('@/effects/reanimated/transitions', () => ({
  springConfigs: {
    smooth: {},
    bouncy: {}
  },
  timingConfigs: {
    smooth: {},
    fast: {}
  }
}))

vi.mock('@/effects/reanimated/use-hover-lift', () => ({
  useHoverLift: vi.fn(() => ({
    animatedStyle: {},
    handleEnter: vi.fn(),
    handleLeave: vi.fn()
  }))
}))

// Mock hooks
vi.mock('@/hooks/useStorage', () => ({
  useStorage: vi.fn((key: string, defaultValue: unknown) => {
    const storage: Record<string, unknown> = {
      'user-pets': [],
      'swipe-history': [],
      'matches': [],
      'verification-requests': {},
      'discovery-preferences': {
        minAge: 0,
        maxAge: 15,
        sizes: ['small', 'medium', 'large', 'extra-large'],
        maxDistance: 50,
        personalities: [],
        interests: [],
        lookingFor: [],
        minCompatibility: 0,
        mediaFilters: {
          cropSize: 'any',
          photoQuality: 'any',
          hasVideo: false,
          minPhotos: 1,
        },
        advancedFilters: {
          verified: false,
          activeToday: false,
          hasStories: false,
          respondQuickly: false,
          superLikesOnly: false,
        },
      }
    }
    const setValue = vi.fn()
    return [storage[key] ?? defaultValue, setValue]
  })
}))

vi.mock('@/hooks/useSwipe', () => ({
  useSwipe: vi.fn(() => ({
    animatedStyle: {},
    likeOpacityStyle: {},
    passOpacityStyle: {},
    handleMouseDown: vi.fn(),
    handleMouseMove: vi.fn(),
    handleMouseUp: vi.fn(),
    handleTouchStart: vi.fn(),
    handleTouchMove: vi.fn(),
    handleTouchEnd: vi.fn(),
    reset: vi.fn()
  }))
}))

vi.mock('@/hooks/usePetDiscovery', () => ({
  usePetDiscovery: vi.fn(() => ({
    availablePets: [],
    currentPet: null,
    currentIndex: 0,
    nextPet: vi.fn(),
    markAsSwiped: vi.fn()
  }))
}))

vi.mock('@/hooks/useMatching', () => ({
  useMatching: vi.fn(() => ({
    compatibilityScore: 85,
    compatibilityFactors: [],
    matchReasoning: []
  }))
}))

vi.mock('@/hooks/useViewMode', () => ({
  useViewMode: vi.fn(() => ({
    viewMode: 'cards',
    setMode: vi.fn()
  }))
}))

vi.mock('@/hooks/useDialog', () => ({
  useDialog: vi.fn(() => ({
    open: vi.fn(),
    close: vi.fn(),
    isOpen: false
  }))
}))

vi.mock('@/hooks/useStories', () => ({
  useStories: vi.fn(() => ({
    stories: [],
    addStory: vi.fn(),
    updateStory: vi.fn()
  }))
}))

// Mock dependencies
vi.mock('@/contexts/AppContext', () => ({
  useApp: vi.fn(() => ({
    t: {
      common: {
        itsAMatch: "It's a Match!",
        and: 'and',
        areNowConnected: 'are now connected'
      }
    }
  }))
}))

vi.mock('@/api/adoption-api', () => ({
  adoptionApi: {
    getAdoptionProfiles: vi.fn(() => Promise.resolve({ profiles: [] }))
  }
}))

vi.mock('@/lib/haptics', () => ({
  haptics: {
    impact: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
    trigger: vi.fn()
  }
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

vi.mock('@/lib/logger', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  }))
}))

vi.mock('@/lib/matching', () => ({
  generateMatchReasoning: vi.fn(() => Promise.resolve(['Great match!']))
}))

// Mock components
vi.mock('@/components/DiscoveryFilters', () => ({
  default: () => <div data-testid="discovery-filters">Filters</div>
}))

vi.mock('@/components/discovery/SavedSearchesManager', () => ({
  default: () => <div data-testid="saved-searches">Saved Searches</div>
}))

vi.mock('@/components/DiscoverMapMode', () => ({
  default: () => <div data-testid="discover-map">Map View</div>
}))

vi.mock('@/components/MatchCelebration', () => ({
  default: () => <div data-testid="match-celebration">Match Celebration</div>
}))

vi.mock('@/components/enhanced/EnhancedPetDetailView', () => ({
  EnhancedPetDetailView: () => <div data-testid="pet-detail-view">Pet Detail</div>
}))

const mockUserPet: Pet = {
  id: 'user1',
  name: 'Fluffy',
  species: 'dog',
  breed: 'Golden Retriever',
  age: 3,
  size: 'large',
  location: {
    city: 'San Francisco',
    country: 'USA',
    lat: 37.7749,
    lon: -122.4194
  }
}

const mockPets: Pet[] = [
  {
    id: 'pet1',
    name: 'Buddy',
    species: 'dog',
    breed: 'Labrador',
    age: 2,
    size: 'large',
    location: {
      city: 'San Francisco',
      country: 'USA',
      lat: 37.7849,
      lon: -122.4094
    }
  },
  {
    id: 'pet2',
    name: 'Max',
    species: 'dog',
    breed: 'Beagle',
    age: 4,
    size: 'medium',
    location: {
      city: 'Oakland',
      country: 'USA',
      lat: 37.8044,
      lon: -122.2711
    }
  }
]

describe('DiscoverView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render discover view', async () => {
      const { useStorage } = await import('@/hooks/useStorage')
      vi.mocked(useStorage).mockReturnValueOnce([[], vi.fn()]) // user-pets
      vi.mocked(useStorage).mockReturnValueOnce([[], vi.fn()]) // swipe-history
      vi.mocked(useStorage).mockReturnValueOnce([[], vi.fn()]) // matches
      vi.mocked(useStorage).mockReturnValueOnce([{}, vi.fn()]) // verification-requests
      vi.mocked(useStorage).mockReturnValueOnce([{
        minAge: 0,
        maxAge: 15,
        sizes: ['small', 'medium', 'large'],
        maxDistance: 50
      }, vi.fn()]) // preferences

      const { usePetDiscovery } = await import('@/hooks/usePetDiscovery')
      vi.mocked(usePetDiscovery).mockReturnValue({
        availablePets: mockPets,
        currentPet: mockPets[0],
        currentIndex: 0,
        nextPet: vi.fn(),
        markAsSwiped: vi.fn()
      })

      render(<DiscoverView />)

      await waitFor(() => {
        expect(screen.getByTestId('animated-view')).toBeInTheDocument()
      })
    })

    it('should show empty state when no pets available', async () => {
      const { useStorage } = await import('@/hooks/useStorage')
      vi.mocked(useStorage).mockReturnValueOnce([[], vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([[], vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([[], vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([{}, vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([{}, vi.fn()])

      const { usePetDiscovery } = await import('@/hooks/usePetDiscovery')
      vi.mocked(usePetDiscovery).mockReturnValue({
        availablePets: [],
        currentPet: null,
        currentIndex: 0,
        nextPet: vi.fn(),
        markAsSwiped: vi.fn()
      })

      render(<DiscoverView />)

      await waitFor(() => {
        // Empty state should be rendered
        expect(screen.getByTestId('animated-view')).toBeInTheDocument()
      })
    })
  })

  describe('View Mode Toggle', () => {
    it('should toggle between cards and map view', async () => {
      const { useStorage } = await import('@/hooks/useStorage')
      const setMode = vi.fn()
      vi.mocked(useStorage).mockReturnValueOnce([[], vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([[], vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([[], vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([{}, vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([{}, vi.fn()])

      const { useViewMode } = await import('@/hooks/useViewMode')
      vi.mocked(useViewMode).mockReturnValue({
        viewMode: 'cards',
        setMode
      })

      const { usePetDiscovery } = await import('@/hooks/usePetDiscovery')
      vi.mocked(usePetDiscovery).mockReturnValue({
        availablePets: mockPets,
        currentPet: mockPets[0],
        currentIndex: 0,
        nextPet: vi.fn(),
        markAsSwiped: vi.fn()
      })

      render(<DiscoverView />)

      await waitFor(() => {
        expect(screen.getByTestId('animated-view')).toBeInTheDocument()
      })
    })
  })

  describe('Swipe Functionality', () => {
    it('should handle like swipe', async () => {
      const user = userEvent.setup()
      const { useStorage } = await import('@/hooks/useStorage')
      const setSwipeHistory = vi.fn()
      const setMatches = vi.fn()
      
      vi.mocked(useStorage).mockReturnValueOnce([[mockUserPet], vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([[], setSwipeHistory])
      vi.mocked(useStorage).mockReturnValueOnce([[], setMatches])
      vi.mocked(useStorage).mockReturnValueOnce([{}, vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([{}, vi.fn()])

      const nextPet = vi.fn()
      const markAsSwiped = vi.fn()
      const { usePetDiscovery } = await import('@/hooks/usePetDiscovery')
      vi.mocked(usePetDiscovery).mockReturnValue({
        availablePets: mockPets,
        currentPet: mockPets[0],
        currentIndex: 0,
        nextPet,
        markAsSwiped
      })

      render(<DiscoverView />)

      await waitFor(() => {
        expect(screen.getByTestId('animated-view')).toBeInTheDocument()
      })
    })

    it('should handle pass swipe', async () => {
      const { useStorage } = await import('@/hooks/useStorage')
      const setSwipeHistory = vi.fn()
      
      vi.mocked(useStorage).mockReturnValueOnce([[mockUserPet], vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([[], setSwipeHistory])
      vi.mocked(useStorage).mockReturnValueOnce([[], vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([{}, vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([{}, vi.fn()])

      const nextPet = vi.fn()
      const markAsSwiped = vi.fn()
      const { usePetDiscovery } = await import('@/hooks/usePetDiscovery')
      vi.mocked(usePetDiscovery).mockReturnValue({
        availablePets: mockPets,
        currentPet: mockPets[0],
        currentIndex: 0,
        nextPet,
        markAsSwiped
      })

      render(<DiscoverView />)

      await waitFor(() => {
        expect(screen.getByTestId('animated-view')).toBeInTheDocument()
      })
    })
  })

  describe('Filters', () => {
    it('should render discovery filters', async () => {
      const { useStorage } = await import('@/hooks/useStorage')
      vi.mocked(useStorage).mockReturnValueOnce([[], vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([[], vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([[], vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([{}, vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([{}, vi.fn()])

      const { usePetDiscovery } = await import('@/hooks/usePetDiscovery')
      vi.mocked(usePetDiscovery).mockReturnValue({
        availablePets: mockPets,
        currentPet: mockPets[0],
        currentIndex: 0,
        nextPet: vi.fn(),
        markAsSwiped: vi.fn()
      })

      render(<DiscoverView />)

      await waitFor(() => {
        expect(screen.getByTestId('discovery-filters')).toBeInTheDocument()
      })
    })
  })

  describe('Match Celebration', () => {
    it('should show match celebration dialog when match occurs', async () => {
      const { useStorage } = await import('@/hooks/useStorage')
      const setMatches = vi.fn()
      
      vi.mocked(useStorage).mockReturnValueOnce([[mockUserPet], vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([[], vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([[], setMatches])
      vi.mocked(useStorage).mockReturnValueOnce([{}, vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([{}, vi.fn()])

      const { useDialog } = await import('@/hooks/useDialog')
      const open = vi.fn()
      vi.mocked(useDialog).mockReturnValueOnce({
        open,
        close: vi.fn(),
        isOpen: false
      })
      vi.mocked(useDialog).mockReturnValueOnce({
        open: vi.fn(),
        close: vi.fn(),
        isOpen: false
      })
      vi.mocked(useDialog).mockReturnValueOnce({
        open: vi.fn(),
        close: vi.fn(),
        isOpen: true // Celebration dialog open
      })
      vi.mocked(useDialog).mockReturnValueOnce({
        open: vi.fn(),
        close: vi.fn(),
        isOpen: false
      })

      const { usePetDiscovery } = await import('@/hooks/usePetDiscovery')
      vi.mocked(usePetDiscovery).mockReturnValue({
        availablePets: mockPets,
        currentPet: mockPets[0],
        currentIndex: 0,
        nextPet: vi.fn(),
        markAsSwiped: vi.fn()
      })

      render(<DiscoverView />)

      await waitFor(() => {
        expect(screen.getByTestId('match-celebration')).toBeInTheDocument()
      })
    })
  })

  describe('Pet Detail View', () => {
    it('should open pet detail view when pet is selected', async () => {
      const { useStorage } = await import('@/hooks/useStorage')
      const open = vi.fn()
      
      vi.mocked(useStorage).mockReturnValueOnce([[], vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([[], vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([[], vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([{}, vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([{}, vi.fn()])

      const { useDialog } = await import('@/hooks/useDialog')
      vi.mocked(useDialog).mockReturnValueOnce({
        open,
        close: vi.fn(),
        isOpen: true // Pet detail dialog open
      })
      vi.mocked(useDialog).mockReturnValueOnce({
        open: vi.fn(),
        close: vi.fn(),
        isOpen: false
      })
      vi.mocked(useDialog).mockReturnValueOnce({
        open: vi.fn(),
        close: vi.fn(),
        isOpen: false
      })
      vi.mocked(useDialog).mockReturnValueOnce({
        open: vi.fn(),
        close: vi.fn(),
        isOpen: false
      })

      const { usePetDiscovery } = await import('@/hooks/usePetDiscovery')
      vi.mocked(usePetDiscovery).mockReturnValue({
        availablePets: mockPets,
        currentPet: mockPets[0],
        currentIndex: 0,
        nextPet: vi.fn(),
        markAsSwiped: vi.fn()
      })

      render(<DiscoverView />)

      await waitFor(() => {
        expect(screen.getByTestId('pet-detail-view')).toBeInTheDocument()
      })
    })
  })
})

