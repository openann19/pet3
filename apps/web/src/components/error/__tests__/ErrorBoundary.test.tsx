/**
 * ErrorBoundary Tests - 100% Coverage
 * 
 * Tests error boundary functionality including:
 * - Error catching
 * - Error logging
 * - Custom fallback
 * - Reset functionality
 * - Error details in dev mode
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ErrorBoundary } from '../ErrorBoundary'
import { createLogger } from '@/lib/logger'

// Mock logger
const mockLogger = {
  error: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  debug: vi.fn(),
}

vi.mock('@/lib/logger', () => ({
  createLogger: () => mockLogger,
}))

// Mock environment
const originalEnv = import.meta.env

// Component that throws error
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }): React.ReactElement => {
  if (shouldThrow) {
    throw new Error('Test error message')
  }
  return <div>No error</div>
}

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Suppress console.error for error boundary tests
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('error catching', () => {
    it('should catch errors in child components', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
      expect(mockLogger.error).toHaveBeenCalled()
    })

    it('should render children when no error', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      expect(screen.getByText('No error')).toBeInTheDocument()
      expect(mockLogger.error).not.toHaveBeenCalled()
    })

    it('should call getDerivedStateFromError', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      // Error should be caught and state updated
      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
    })
  })

  describe('error logging', () => {
    it('should log error with component stack', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(mockLogger.error).toHaveBeenCalledWith(
        'ErrorBoundary caught error',
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
          errorBoundary: true,
        })
      )
    })

    it('should call custom onError handler', () => {
      const onError = vi.fn()

      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        })
      )
    })
  })

  describe('custom fallback', () => {
    it('should render custom fallback when provided', () => {
      const customFallback = <div>Custom error message</div>

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Custom error message')).toBeInTheDocument()
      expect(screen.queryByText('Oops! Something went wrong')).not.toBeInTheDocument()
    })
  })

  describe('reset functionality', () => {
    it('should reset error state when Try Again is clicked', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()

      const tryAgainButton = screen.getByText('Try Again')
      fireEvent.click(tryAgainButton)

      // Re-render with no error
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      )

      // After reset, should render children
      expect(screen.getByText('No error')).toBeInTheDocument()
    })

    it('should call custom onReset handler', () => {
      const onReset = vi.fn()

      render(
        <ErrorBoundary onReset={onReset}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const tryAgainButton = screen.getByText('Try Again')
      fireEvent.click(tryAgainButton)

      expect(onReset).toHaveBeenCalled()
    })

    it('should reload page when Refresh Page is clicked', () => {
      const reloadSpy = vi.spyOn(window.location, 'reload').mockImplementation(() => {})

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const refreshButton = screen.getByText('Refresh Page')
      fireEvent.click(refreshButton)

      expect(reloadSpy).toHaveBeenCalled()

      reloadSpy.mockRestore()
    })
  })

  describe('error details in dev mode', () => {
    it('should show error details in dev mode', () => {
      // Mock dev environment
      Object.defineProperty(import.meta, 'env', {
        value: { ...originalEnv, DEV: true },
        writable: true,
      })

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      const details = screen.getByText('Error details')
      expect(details).toBeInTheDocument()

      fireEvent.click(details)

      // Error message should be visible
      expect(screen.getByText(/Test error message/)).toBeInTheDocument()
    })

    it('should not show error details in production mode', () => {
      // Mock production environment
      Object.defineProperty(import.meta, 'env', {
        value: { ...originalEnv, DEV: false },
        writable: true,
      })

      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.queryByText('Error details')).not.toBeInTheDocument()
    })

    it('should not show error details when error is null', () => {
      Object.defineProperty(import.meta, 'env', {
        value: { ...originalEnv, DEV: true },
        writable: true,
      })

      // This shouldn't happen in practice, but test the condition
      const { container } = render(
        <ErrorBoundary>
          <div>No error</div>
        </ErrorBoundary>
      )

      expect(container.querySelector('details')).not.toBeInTheDocument()
    })
  })

  describe('default error UI', () => {
    it('should render default error UI with all elements', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
      expect(screen.getByText(/We encountered an unexpected error/)).toBeInTheDocument()
      expect(screen.getByText('Try Again')).toBeInTheDocument()
      expect(screen.getByText('Refresh Page')).toBeInTheDocument()
    })

    it('should render warning icon', () => {
      const { container } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      // Check for icon (Phosphor icons render as SVG)
      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('should handle multiple errors', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()

      // Reset
      const tryAgainButton = screen.getByText('Try Again')
      fireEvent.click(tryAgainButton)

      // Throw another error
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      )

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
      expect(mockLogger.error).toHaveBeenCalledTimes(2)
    })

    it('should handle error without message', () => {
      const ThrowErrorNoMessage = (): React.ReactElement => {
        throw new Error()
      }

      render(
        <ErrorBoundary>
          <ThrowErrorNoMessage />
        </ErrorBoundary>
      )

      expect(screen.getByText('Oops! Something went wrong')).toBeInTheDocument()
      expect(mockLogger.error).toHaveBeenCalled()
    })
  })
})

