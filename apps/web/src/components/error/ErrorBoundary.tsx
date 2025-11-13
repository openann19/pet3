import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowClockwise, ArrowLeft, Warning, XCircle, WifiSlash, Bug } from '@phosphor-icons/react';
import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';
import { isTruthy } from '@petspark/shared';
import { getTypographyClasses, getSpacingClassesMultiple, getRadiusClasses, getColorClasses, getMotionClasses, focusRing } from '@/lib/design-token-utils';
import { cn } from '@/lib/utils';
import { 
  type ErrorCategory, 
  createStandardError, 
  logError, 
  getUserFriendlyMessage 
} from '@/lib/error-handling';
import { safeWindow } from '@/utils/ssr-safe';
import { getShadow } from '@/lib/design-tokens';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  onReset?: () => void;
  /**
   * Screen/section name for context-aware error messages
   */
  context?: string;
  /**
   * Enable navigation recovery (go back)
   */
  enableNavigation?: boolean;
  /**
   * Enable error reporting
   */
  enableReporting?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorCategory: ErrorCategory;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorCategory: 'unknown',
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    const standardError = createStandardError(error);
    return {
      hasError: true,
      error,
      errorCategory: standardError.category,
      errorId: standardError.errorId,
    };
  }

  override componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const standardError = logError(error, this.props.context, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
    });

    // Update state with standardized error
    this.setState({
      errorCategory: standardError.category,
      errorId: standardError.errorId,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorCategory: 'unknown',
      errorId: '',
    });

    // Call custom reset handler if provided
    this.props.onReset?.();
  };

  handleReload = (): void => {
    const win = safeWindow();
    if (win) {
      win.location.reload();
    }
  };

  handleGoBack = (): void => {
    const win = safeWindow();
    if (win && win.history.length > 1) {
      win.history.back();
    }
  };

  handleReportError = (): void => {
    // In a real app, this would send error to error tracking service
    if (this.state.error) {
      logError(this.state.error, this.props.context, {
        userReported: true,
        errorId: this.state.errorId,
      });
    }
    // Show feedback to user (could use toast notification)
  };

  getErrorIcon = (): ReactNode => {
    const iconSize = 48;
    const iconClasses = getColorClasses('destructive', 'text');

    switch (this.state.errorCategory) {
      case 'network':
        return <WifiSlash size={iconSize} weight="bold" className={iconClasses} />;
      case 'render':
        return <XCircle size={iconSize} weight="bold" className={iconClasses} />;
      case 'state':
        return <Bug size={iconSize} weight="bold" className={iconClasses} />;
      default:
        return <Warning size={iconSize} weight="bold" className={iconClasses} />;
    }
  };

  getErrorMessage = (): { title: string; description: string } => {
    if (!this.state.error) {
      return {
        title: 'Unknown Error',
        description: 'An unexpected error occurred.',
      };
    }

    const standardError = createStandardError(this.state.error, this.props.context);
    const userMessage = getUserFriendlyMessage(standardError, this.props.context);
    
    return {
      title: userMessage.title,
      description: userMessage.description,
    };
  };

  override render(): ReactNode {
    if (isTruthy(this.state.hasError)) {
      // Use custom fallback if provided
      if (isTruthy(this.props.fallback)) {
        return this.props.fallback;
      }

      const errorMessage = this.getErrorMessage();
      const headingClasses = getTypographyClasses('h1');
      const bodyClasses = getTypographyClasses('body');
      const captionClasses = getTypographyClasses('caption');
      const cardRadius = getRadiusClasses('xl');
      const cardPadding = getSpacingClassesMultiple('xl', ['padding']);
      const spacingY = getSpacingClassesMultiple('lg', ['spaceY']);
      const spacingX = getSpacingClassesMultiple('md', ['gap']);
      const motionClasses = getMotionClasses('normal', 'standard');
      const errorBg = getColorClasses('destructive', 'bg');
      const mutedBg = getColorClasses('muted', 'bg');
      const mutedText = getColorClasses('mutedForeground', 'text');

      // Default error UI with design tokens
      return (
        <div
          className={cn(
            'flex min-h-screen items-center justify-center',
            getSpacingClassesMultiple('xl', ['padding']),
            getColorClasses('background', 'bg'),
            motionClasses
          )}
          role="alert"
          aria-live="assertive"
        >
          <Card
            className={cn(
              'max-w-md w-full text-center',
              cardRadius,
              cardPadding,
              spacingY,
              motionClasses
            )}
            style={{ boxShadow: getShadow('raised') }}
          >
            {/* Error Icon */}
            <div className="flex justify-center">
              <div
                className={cn(
                  'rounded-full',
                  getRadiusClasses('full'),
                  getSpacingClassesMultiple('xl', ['padding']),
                  errorBg + '/10',
                  'flex items-center justify-center',
                  motionClasses
                )}
              >
                {this.getErrorIcon()}
              </div>
            </div>

            {/* Error Message */}
            <div className={spacingY}>
              <h1 className={cn(headingClasses, getColorClasses('foreground', 'text'))}>
                {errorMessage.title}
              </h1>
              <p className={cn(bodyClasses, mutedText)}>
                {errorMessage.description}
              </p>
            </div>

            {/* Error Details (Dev Only) */}
            {this.state.error && import.meta.env.DEV && (
              <details className="text-left">
                <summary
                  className={cn(
                    'cursor-pointer',
                    captionClasses,
                    mutedText,
                    'hover:' + getColorClasses('foreground', 'text'),
                    motionClasses
                  )}
                >
                  Error details
                </summary>
                <pre
                  className={cn(
                    'mt-2 overflow-auto',
                    getRadiusClasses('md'),
                    mutedBg,
                    getSpacingClassesMultiple('md', ['padding']),
                    captionClasses,
                    'font-mono',
                    getColorClasses('destructive', 'text'),
                    motionClasses
                  )}
                >
                  {this.state.error.toString()}
                  {this.state.error.stack && `\n\n${this.state.error.stack}`}
                </pre>
                {this.state.errorId && (
                  <p className={cn('mt-2', captionClasses, mutedText)}>
                    Error ID: {this.state.errorId}
                  </p>
                )}
              </details>
            )}

            {/* Recovery Actions */}
            <div className={cn('flex flex-wrap justify-center', spacingX)}>
              <Button
                onClick={this.handleReset}
                variant="default"
                className={cn(focusRing, motionClasses)}
                aria-label="Try again"
              >
                <ArrowClockwise size={20} weight="bold" className="mr-2" />
                Try Again
              </Button>

              <Button
                onClick={this.handleReload}
                variant="outline"
                className={cn(focusRing, motionClasses)}
                aria-label="Refresh page"
              >
                Refresh Page
              </Button>

              {this.props.enableNavigation && (
                <Button
                  onClick={this.handleGoBack}
                  variant="ghost"
                  className={cn(focusRing, motionClasses)}
                  aria-label="Go back"
                >
                  <ArrowLeft size={20} weight="bold" className="mr-2" />
                  Go Back
                </Button>
              )}

              {this.props.enableReporting && (
                <Button
                  onClick={this.handleReportError}
                  variant="ghost"
                  className={cn(focusRing, motionClasses)}
                  aria-label="Report error"
                >
                  Report Error
                </Button>
              )}
            </div>

            {/* Additional Help Text */}
            <p className={cn(captionClasses, mutedText, 'mt-4')}>
              If this problem persists, please clear your browser cache and try again.
            </p>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}
