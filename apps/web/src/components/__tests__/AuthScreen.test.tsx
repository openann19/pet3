import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import AuthScreen from '../AuthScreen'

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

vi.mock('@/effects/reanimated/use-animate-presence', () => ({
  useAnimatePresence: vi.fn(() => ({
    isVisible: true,
    style: {}
  }))
}))

// Mock dependencies
vi.mock('@/contexts/AppContext', () => ({
  useApp: vi.fn(() => ({
    t: {
      common: {
        back: 'Back'
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

vi.mock('@/components/auth/SignInForm', () => ({
  default: ({ onSuccess }: { onSuccess: () => void }) => (
    <div data-testid="signin-form">
      <button onClick={onSuccess}>Sign In</button>
    </div>
  )
}))

vi.mock('@/components/auth/SignUpForm', () => ({
  default: ({ onSuccess }: { onSuccess: () => void }) => (
    <div data-testid="signup-form">
      <button onClick={onSuccess}>Sign Up</button>
    </div>
  )
}))

describe('AuthScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render sign up form by default', () => {
    const onBack = vi.fn()
    const onSuccess = vi.fn()

    render(<AuthScreen onBack={onBack} onSuccess={onSuccess} />)

    expect(screen.getByTestId('signup-form')).toBeInTheDocument()
  })

  it('should render sign in form when initialMode is signin', () => {
    const onBack = vi.fn()
    const onSuccess = vi.fn()

    render(<AuthScreen initialMode="signin" onBack={onBack} onSuccess={onSuccess} />)

    expect(screen.getByTestId('signin-form')).toBeInTheDocument()
  })

  it('should call onBack when back button is clicked', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    const onSuccess = vi.fn()

    render(<AuthScreen onBack={onBack} onSuccess={onSuccess} />)

    const backButton = screen.getByLabelText('Back')
    await user.click(backButton)

    expect(onBack).toHaveBeenCalled()
  })

  it('should call onSuccess when form succeeds', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    const onSuccess = vi.fn()

    render(<AuthScreen onBack={onBack} onSuccess={onSuccess} />)

    const signUpButton = screen.getByText('Sign Up')
    await user.click(signUpButton)

    expect(onSuccess).toHaveBeenCalled()
  })
})

