import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from '../ProtectedRoute'

// Mock dependencies
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    isAuthenticated: false,
    isLoading: false
  }))
}))

vi.mock('@/lib/kyc-service', () => ({
  getKYCStatus: vi.fn(() => Promise.resolve('verified'))
}))

vi.mock('@/lib/logger', () => ({
  createLogger: vi.fn(() => ({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }))
}))

vi.mock('@/components/ui/spinner', () => ({
  Spinner: () => <div data-testid="spinner">Loading...</div>
}))

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render children when authenticated', () => {
    const { useAuth } = require('@/contexts/AuthContext')
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user1', roles: ['user'] },
      isAuthenticated: true,
      isLoading: false
    })

    render(
      <TestWrapper>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </TestWrapper>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  it('should show loading when auth is loading', () => {
    const { useAuth } = require('@/contexts/AuthContext')
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true
    })

    render(
      <TestWrapper>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </TestWrapper>
    )

    expect(screen.getByTestId('spinner')).toBeInTheDocument()
  })

  it('should redirect when not authenticated', () => {
    const { useAuth } = require('@/contexts/AuthContext')
    vi.mocked(useAuth).mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false
    })

    render(
      <TestWrapper>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </TestWrapper>
    )

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  it('should check admin role when adminOnly is true', () => {
    const { useAuth } = require('@/contexts/AuthContext')
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'user1', roles: ['user'] },
      isAuthenticated: true,
      isLoading: false
    })

    render(
      <TestWrapper>
        <ProtectedRoute adminOnly>
          <div>Admin Content</div>
        </ProtectedRoute>
      </TestWrapper>
    )

    expect(screen.queryByText('Admin Content')).not.toBeInTheDocument()
  })

  it('should allow admin access when adminOnly is true', () => {
    const { useAuth } = require('@/contexts/AuthContext')
    vi.mocked(useAuth).mockReturnValue({
      user: { id: 'admin1', roles: ['admin'] },
      isAuthenticated: true,
      isLoading: false
    })

    render(
      <TestWrapper>
        <ProtectedRoute adminOnly>
          <div>Admin Content</div>
        </ProtectedRoute>
      </TestWrapper>
    )

    expect(screen.getByText('Admin Content')).toBeInTheDocument()
  })
})
