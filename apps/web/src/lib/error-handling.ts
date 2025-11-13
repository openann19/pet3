/**
 * Standardized Error Handling Utilities
 * Provides consistent error handling patterns across the application
 */

import { createLogger } from './logger';

const logger = createLogger('ErrorHandling');

/**
 * Error categories for better error handling and recovery
 */
export type ErrorCategory = 'network' | 'render' | 'state' | 'validation' | 'permission' | 'unknown';

/**
 * Standardized error structure
 */
export interface StandardError {
  readonly message: string;
  readonly category: ErrorCategory;
  readonly code?: string;
  readonly details?: Record<string, unknown>;
  readonly timestamp: string;
  readonly errorId: string;
}

/**
 * Determine error category from error message/type
 */
export function categorizeError(error: Error | unknown): ErrorCategory {
  if (!(error instanceof Error)) {
    return 'unknown';
  }

  const message = error.message.toLowerCase();
  const name = error.name.toLowerCase();

  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('request') ||
    message.includes('timeout') ||
    message.includes('connection') ||
    message.includes('failed to fetch') ||
    name.includes('network')
  ) {
    return 'network';
  }

  if (
    message.includes('render') ||
    message.includes('jsx') ||
    message.includes('component') ||
    message.includes('cannot read') ||
    name.includes('render')
  ) {
    return 'render';
  }

  if (
    message.includes('state') ||
    message.includes('undefined') ||
    message.includes('null') ||
    message.includes('cannot access') ||
    name.includes('type')
  ) {
    return 'state';
  }

  if (
    message.includes('validation') ||
    message.includes('invalid') ||
    message.includes('required') ||
    message.includes('format')
  ) {
    return 'validation';
  }

  if (
    message.includes('permission') ||
    message.includes('unauthorized') ||
    message.includes('forbidden') ||
    message.includes('access denied') ||
    name.includes('permission')
  ) {
    return 'permission';
  }

  return 'unknown';
}

/**
 * Create a standardized error object
 */
export function createStandardError(
  error: Error | unknown,
  context?: string,
  additionalDetails?: Record<string, unknown>
): StandardError {
  const errorId = `error-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  const category = categorizeError(error);
  
  let message = 'An unexpected error occurred';
  let code: string | undefined;
  let details: Record<string, unknown> = {};

  if (error instanceof Error) {
    message = error.message || message;
    code = error.name;
    details = {
      stack: error.stack,
      ...additionalDetails,
    };
  } else if (typeof error === 'string') {
    message = error;
  } else if (error && typeof error === 'object') {
    details = { ...error as Record<string, unknown>, ...additionalDetails };
  }

  if (context) {
    details.context = context;
  }

  return {
    message,
    category,
    code,
    details,
    timestamp: new Date().toISOString(),
    errorId,
  };
}

/**
 * Log error with standardized format
 */
export function logError(
  error: Error | unknown,
  context?: string,
  additionalDetails?: Record<string, unknown>
): StandardError {
  const standardError = createStandardError(error, context, additionalDetails);
  
  logger.error('Error occurred', {
    errorId: standardError.errorId,
    category: standardError.category,
    message: standardError.message,
    code: standardError.code,
    context,
    ...standardError.details,
  });

  return standardError;
}

/**
 * Get user-friendly error message based on category
 */
export function getUserFriendlyMessage(
  error: StandardError,
  context?: string
): { title: string; description: string; action?: string } {
  const contextText = context ? ` in ${context}` : '';

  switch (error.category) {
    case 'network':
      return {
        title: 'Connection Error',
        description: `We're having trouble connecting to the server${contextText}. Please check your internet connection and try again.`,
        action: 'Retry',
      };
    case 'render':
      return {
        title: 'Display Error',
        description: `Something went wrong while rendering${contextText}. This might be a temporary issue.`,
        action: 'Refresh',
      };
    case 'state':
      return {
        title: 'Application Error',
        description: `An unexpected error occurred${contextText}. Your data is safe, but you may need to refresh.`,
        action: 'Refresh',
      };
    case 'validation':
      return {
        title: 'Validation Error',
        description: error.message || `Please check your input${contextText} and try again.`,
        action: 'Fix Input',
      };
    case 'permission':
      return {
        title: 'Access Denied',
        description: `You don't have permission to perform this action${contextText}.`,
        action: 'Go Back',
      };
    default:
      return {
        title: 'Oops! Something went wrong',
        description: error.message || `We encountered an unexpected error${contextText}. Please try refreshing the page or going back.`,
        action: 'Try Again',
      };
  }
}

/**
 * Safe error handler wrapper for async functions
 */
export async function safeAsync<T>(
  fn: () => Promise<T>,
  context?: string,
  fallback?: T
): Promise<T | undefined> {
  try {
    return await fn();
  } catch (error) {
    logError(error, context);
    return fallback;
  }
}

/**
 * Safe error handler wrapper for sync functions
 */
export function safeSync<T>(
  fn: () => T,
  context?: string,
  fallback?: T
): T | undefined {
  try {
    return fn();
  } catch (error) {
    logError(error, context);
    return fallback;
  }
}

/**
 * Error recovery strategies
 */
export const ErrorRecovery = {
  retry: async <T>(
    fn: () => Promise<T>,
    maxRetries = 3,
    delay = 1000
  ): Promise<T> => {
    let lastError: Error | unknown;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries) {
          await new Promise((resolve) => setTimeout(resolve, delay * attempt));
        }
      }
    }
    
    throw lastError;
  },
  
  withFallback: async <T>(
    fn: () => Promise<T>,
    fallback: T,
    context?: string
  ): Promise<T> => {
    try {
      return await fn();
    } catch (error) {
      logError(error, context);
      return fallback;
    }
  },
} as const;

