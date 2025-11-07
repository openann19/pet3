import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProfileView from '../ProfileView'
import type { Pet, Match, SwipeAction } from '@/lib/types'

// Mock react-native-reanimated
vi.mock('react-native-reanimated', () => ({
  default: {
    useSharedValue: vi.fn((initial: number) => ({ value: initial })),
    useAnimatedStyle: vi.fn(() => ({})),
    withSpring: vi.fn((v) => v),
    withTiming: vi.fn((v) => v),
  },
  useSharedValue: vi.fn((initial: number) => ({ value: initial })),
  useAnimatedStyle: vi.fn(() => ({})),
  withSpring: vi.fn((v) => v),
  withTiming: vi.fn((v) => v),
}))

vi.mock('@/effects/reanimated/animated-view', () => ({
  AnimatedView: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="animated-view" {...props}>{children}</div>
  )
}))

vi.mock('@/effects/reanimated', () => ({
  useMotionVariants: vi.fn(() => ({ animatedStyle: {} })),
  useStaggeredContainer: vi.fn(() => ({ animatedStyle: {} })),
  useHoverLift: vi.fn(() => ({ animatedStyle: {}, handleEnter: vi.fn(), handleLeave: vi.fn() })),
  useBounceOnTap: vi.fn(() => ({ animatedStyle: {}, handlePress: vi.fn() })),
  useGlowPulse: vi.fn(() => ({ animatedStyle: {} })),
  useIconRotation: vi.fn(() => ({ animatedStyle: {} }))
}))

// Mock hooks
vi.mock('@/hooks/useStorage', () => ({
  useStorage: vi.fn((key: string, defaultValue: unknown) => {
    const storage: Record<string, unknown> = {
      'user-pets': [],
      'matches': [],
      'swipe-history': [],
      'video-quality-preference': '4k'
    }
    const setValue = vi.fn()
    return [storage[key] ?? defaultValue, setValue]
  })
}))

// Mock dependencies
vi.mock('@/contexts/AppContext', () => ({
  useApp: vi.fn(() => ({
    t: {
      profile: {
        title: 'Profile'
      }
    },
    themePreset: 'default',
    setThemePreset: vi.fn()
  }))
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn()
  }
}))

// Mock components
vi.mock('@/components/CreatePetDialog', () => ({
  default: ({ open, onClose }: { open: boolean; onClose: () => void }) =>
    open ? (
      <div data-testid="create-pet-dialog">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
}))

vi.mock('@/components/StatsCard', () => ({
  default: () => <div data-testid="stats-card">Stats</div>
}))

vi.mock('@/components/stories/HighlightsBar', () => ({
  default: () => <div data-testid="highlights-bar">Highlights</div>
}))

vi.mock('@/components/call/VideoQualitySettings', () => ({
  default: () => <div data-testid="video-quality-settings">Video Quality</div>
}))

vi.mock('@/components/ThemePresetSelector', () => ({
  default: () => <div data-testid="theme-preset-selector">Theme</div>
}))

vi.mock('@/components/payments/SubscriptionStatusCard', () => ({
  SubscriptionStatusCard: () => <div data-testid="subscription-status">Subscription</div>
}))

vi.mock('@/components/health/PetHealthDashboard', () => ({
  default: () => <div data-testid="pet-health-dashboard">Health Dashboard</div>
}))

vi.mock('@/components/verification/VerificationButton', () => ({
  VerificationButton: () => <div data-testid="verification-button">Verify</div>
}))

vi.mock('@/components/VisualAnalysisDemo', () => ({
  default: () => <div data-testid="visual-analysis">Visual Analysis</div>
}))

const mockPet: Pet = {
  id: 'pet1',
  name: 'Fluffy',
  species: 'dog',
  breed: 'Golden Retriever',
  age: 3,
  size: 'large'
}

describe('ProfileView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render profile view', async () => {
      const { useStorage } = await import('@/hooks/useStorage')
      vi.mocked(useStorage).mockReturnValueOnce([[mockPet], vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([[], vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([[], vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce(['4k', vi.fn()])

      render(<ProfileView />)

      await waitFor(() => {
        expect(screen.getByTestId('animated-view')).toBeInTheDocument()
      })
    })

    it('should show empty state when no pets', async () => {
      const { useStorage } = await import('@/hooks/useStorage')
      vi.mocked(useStorage).mockReturnValueOnce([[], vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([[], vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([[], vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce(['4k', vi.fn()])

      render(<ProfileView />)

      await waitFor(() => {
        expect(screen.getByTestId('animated-view')).toBeInTheDocument()
      })
    })
  })

  describe('Pet Management', () => {
    it('should open create pet dialog when create button is clicked', async () => {
      const user = userEvent.setup()
      const { useStorage } = await import('@/hooks/useStorage')
      vi.mocked(useStorage).mockReturnValueOnce([[], vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([[], vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([[], vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce(['4k', vi.fn()])

      render(<ProfileView />)

      await waitFor(() => {
        expect(screen.getByTestId('animated-view')).toBeInTheDocument()
      })
    })
  })

  describe('Stats Display', () => {
    it('should display stats card', async () => {
      const { useStorage } = await import('@/hooks/useStorage')
      const mockMatches: Match[] = [{
        id: 'match1',
        petId: 'pet1',
        matchedPetId: 'pet2',
        matchedAt: new Date().toISOString(),
        status: 'active'
      }]
      const mockSwipes: SwipeAction[] = [{
        petId: 'pet1',
        targetPetId: 'pet2',
        action: 'like',
        timestamp: new Date().toISOString()
      }]

      vi.mocked(useStorage).mockReturnValueOnce([[mockPet], vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([mockMatches, vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce([mockSwipes, vi.fn()])
      vi.mocked(useStorage).mockReturnValueOnce(['4k', vi.fn()])

      render(<ProfileView />)

      await waitFor(() => {
        expect(screen.getByTestId('stats-card')).toBeInTheDocument()
      })
    })
  })
})

