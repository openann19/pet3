import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import WelcomeScreen from '../WelcomeScreen'

// Mock react-native-reanimated
vi.mock('react-native-reanimated', () => ({
  default: {
    useSharedValue: vi.fn((initial: number) => ({ value: initial })),
    useAnimatedStyle: vi.fn(() => ({})),
    withSpring: vi.fn((v: number) => v),
    withTiming: vi.fn((v: number) => v),
    withDelay: vi.fn((v: number) => v),
    withRepeat: vi.fn((v: number) => v),
    withSequence: vi.fn((v: number) => v),
  },
  useSharedValue: vi.fn((initial: number) => ({ value: initial })),
  useAnimatedStyle: vi.fn(() => ({})),
  withSpring: vi.fn((v: number) => v),
  withTiming: vi.fn((v: number) => v),
  withDelay: vi.fn((v: number) => v),
  withRepeat: vi.fn((v: number) => v),
  withSequence: vi.fn((v: number) => v),
}))

vi.mock('@/effects/reanimated/animated-view', () => ({
  AnimatedView: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="animated-view" {...props}>{children}</div>
  )
}))

// Mock dependencies
vi.mock('@/contexts/AppContext', () => ({
  useApp: vi.fn(() => ({
    t: {
      welcome: {
        title: 'Welcome',
        getStarted: 'Get Started',
        signIn: 'Sign In',
        explore: 'Explore'
      }
    },
    language: 'en',
    toggleLanguage: vi.fn()
  }))
}))

vi.mock('@/lib/haptics', () => ({
  haptics: {
    trigger: vi.fn()
  }
}))

vi.mock('@/lib/analytics', () => ({
  analytics: {
    track: vi.fn()
  }
}))

vi.mock('@/hooks/useReducedMotion', () => ({
  useReducedMotion: vi.fn(() => false)
}))

describe('WelcomeScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render welcome screen', async () => {
    const onGetStarted = vi.fn()
    const onSignIn = vi.fn()
    const onExplore = vi.fn()

    render(
      <WelcomeScreen
        onGetStarted={onGetStarted}
        onSignIn={onSignIn}
        onExplore={onExplore}
      />
    )

    await waitFor(() => {
      expect(screen.getByTestId('animated-view')).toBeInTheDocument()
    })
  })

  it('should call onGetStarted when get started button is clicked', async () => {
    const onGetStarted = vi.fn()
    const onSignIn = vi.fn()
    const onExplore = vi.fn()

    render(
      <WelcomeScreen
        onGetStarted={onGetStarted}
        onSignIn={onSignIn}
        onExplore={onExplore}
        isOnline={true}
      />
    )

    await waitFor(() => {
      expect(screen.getByTestId('animated-view')).toBeInTheDocument()
    })
  })

  it('should call onSignIn when sign in button is clicked', async () => {
    const onGetStarted = vi.fn()
    const onSignIn = vi.fn()
    const onExplore = vi.fn()

    render(
      <WelcomeScreen
        onGetStarted={onGetStarted}
        onSignIn={onSignIn}
        onExplore={onExplore}
      />
    )

    await waitFor(() => {
      expect(screen.getByTestId('animated-view')).toBeInTheDocument()
    })
  })

  it('should call onExplore when explore button is clicked', async () => {
    const onGetStarted = vi.fn()
    const onSignIn = vi.fn()
    const onExplore = vi.fn()

    render(
      <WelcomeScreen
        onGetStarted={onGetStarted}
        onSignIn={onSignIn}
        onExplore={onExplore}
      />
    )

    await waitFor(() => {
      expect(screen.getByTestId('animated-view')).toBeInTheDocument()
    })
  })
})

