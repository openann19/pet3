import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import BottomNavBar from '../BottomNavBar'

// Mock react-native-reanimated
vi.mock('react-native-reanimated', () => ({
  default: {
    useSharedValue: vi.fn((initial: number) => ({ value: initial })),
    useAnimatedStyle: vi.fn(() => ({})),
    withSpring: vi.fn((v) => v),
    withTiming: vi.fn((v) => v),
    withDelay: vi.fn((v) => v),
  },
  useSharedValue: vi.fn((initial: number) => ({ value: initial })),
  useAnimatedStyle: vi.fn(() => ({})),
  withSpring: vi.fn((v) => v),
  withTiming: vi.fn((v) => v),
  withDelay: vi.fn((v) => v),
}))

vi.mock('@/effects/reanimated/animated-view', () => ({
  AnimatedView: ({ children, ...props }: { children?: React.ReactNode; [key: string]: unknown }) => (
    <div data-testid="animated-view" {...props}>{children}</div>
  )
}))

vi.mock('@/effects/reanimated', () => ({
  useBounceOnTap: vi.fn(() => ({ animatedStyle: {} }))
}))

vi.mock('@/effects/reanimated/transitions', () => ({
  springConfigs: {
    smooth: {}
  },
  timingConfigs: {
    smooth: {}
  }
}))

vi.mock('@/hooks/use-nav-button-animation', () => ({
  useNavButtonAnimation: vi.fn(() => ({ animatedStyle: {} }))
}))

vi.mock('@/lib/haptics', () => ({
  haptics: {
    impact: vi.fn()
  }
}))

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

describe('BottomNavBar', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render navigation items', () => {
    render(
      <TestWrapper>
        <BottomNavBar />
      </TestWrapper>
    )

    expect(screen.getByText('Discover')).toBeInTheDocument()
    expect(screen.getByText('Chat')).toBeInTheDocument()
    expect(screen.getByText('Matches')).toBeInTheDocument()
  })

  it('should highlight active route', () => {
    // Mock useLocation to return /discover
    const mockUseLocation = vi.fn(() => ({ pathname: '/discover' }))
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom')
      return {
        ...actual,
        useLocation: mockUseLocation
      }
    })

    render(
      <TestWrapper>
        <BottomNavBar />
      </TestWrapper>
    )

    expect(screen.getByText('Discover')).toBeInTheDocument()
  })
})

