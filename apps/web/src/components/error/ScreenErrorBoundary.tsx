/**
 * ScreenErrorBoundary
 * Higher-order component wrapper for screens with screen-specific error handling
 * 
 * Provides:
 * - Screen-specific error context
 * - Navigation recovery options
 * - Design token consistency
 * - Error reporting capabilities
 */

import { ErrorBoundary } from './ErrorBoundary';
import type { ReactNode } from 'react';
import { useCallback } from 'react';

export interface ScreenErrorBoundaryProps {
  /**
   * Screen/section name for context-aware error messages
   */
  screenName: string;
  /**
   * Children to wrap with ErrorBoundary
   */
  children: ReactNode;
  /**
   * Custom fallback UI (optional)
   */
  fallback?: ReactNode;
  /**
   * Callback when error occurs
   */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /**
   * Custom reset handler
   */
  onReset?: () => void;
  /**
   * Enable navigation recovery (default: true)
   */
  enableNavigation?: boolean;
  /**
   * Enable error reporting (default: false)
   */
  enableReporting?: boolean;
}

/**
 * ScreenErrorBoundary Component
 * Wraps a screen with ErrorBoundary and provides screen-specific error handling
 */
export function ScreenErrorBoundary({
  screenName,
  children,
  fallback,
  onError,
  onReset,
  enableNavigation = true,
  enableReporting = false,
}: ScreenErrorBoundaryProps): ReactNode {
  const handleError = useCallback(
    (error: Error, errorInfo: React.ErrorInfo) => {
      // Call custom error handler if provided
      onError?.(error, errorInfo);
    },
    [onError]
  );

  const handleReset = useCallback(() => {
    // Call custom reset handler if provided
    onReset?.();
  }, [onReset]);

  return (
    <ErrorBoundary
      context={screenName}
      fallback={fallback}
      onError={handleError}
      onReset={handleReset}
      enableNavigation={enableNavigation}
      enableReporting={enableReporting}
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * HOC version for wrapping screen components
 */
export function withScreenErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  screenName: string,
  options?: Omit<ScreenErrorBoundaryProps, 'screenName' | 'children'>
) {
  return function WrappedComponent(props: P) {
    return (
      <ScreenErrorBoundary screenName={screenName} {...options}>
        <Component {...props} />
      </ScreenErrorBoundary>
    );
  };
}

