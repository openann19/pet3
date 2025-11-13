/**
 * Screen Error Boundary Wrapper
 * 
 * Higher-order component to wrap screens with error boundary for better error handling.
 * Provides graceful error recovery UI for individual screens.
 * 
 * Location: apps/mobile/src/components/ScreenErrorBoundary.tsx
 */

import React, { type ComponentType, type ReactNode } from 'react'
import { ErrorBoundary } from './ErrorBoundary'
import { PremiumErrorState } from './enhanced/states/PremiumErrorState'

interface ScreenErrorBoundaryProps {
  children: ReactNode
  screenName?: string
}

function ScreenErrorBoundary({ children, screenName = 'Screen' }: ScreenErrorBoundaryProps): React.JSX.Element {
  return (
    <ErrorBoundary
      fallback={
        <PremiumErrorState
          title="Something went wrong"
          message={`An error occurred on the ${screenName} screen. Please try again or go back.`}
          variant="default"
        />
      }
    >
      {children}
    </ErrorBoundary>
  )
}

/**
 * HOC to wrap a screen component with error boundary
 */
export function withScreenErrorBoundary<P extends object>(
  Component: ComponentType<P>,
  screenName?: string
): ComponentType<P> {
  const WrappedComponent = (props: P): React.JSX.Element => {
    return (
      <ScreenErrorBoundary screenName={screenName}>
        <Component {...props} />
      </ScreenErrorBoundary>
    )
  }

  WrappedComponent.displayName = `withScreenErrorBoundary(${Component.displayName ?? Component.name ?? 'Component'})`

  return WrappedComponent
}

export { ScreenErrorBoundary }

