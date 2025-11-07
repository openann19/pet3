import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import logger from '../utils/logger.js';

export interface APIError extends Error {
  status?: number;
  code?: string;
  details?: Record<string, unknown>;
}

/**
 * Global error handler middleware
 * Must be the last middleware in the chain
 */
export function errorHandler(
  err: Error | APIError | ZodError,
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // Zod validation errors
  if (err instanceof ZodError) {
    res.status(400).json({
      error: 'Validation Error',
      message: 'Invalid request data',
      details: err.errors.map((e) => ({
        path: e.path.join('.'),
        message: e.message,
      })),
    });
    return;
  }

  // Custom API errors
  const apiError = err as APIError;
  const status = apiError.status || 500;
  const message = apiError.message || 'Internal Server Error';

  // Log error
  logger.error('Request error', {
    status,
    message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Send error response
  res.status(status).json({
    error: status >= 500 ? 'Internal Server Error' : message,
    message: status >= 500 && process.env.NODE_ENV === 'production' 
      ? 'An unexpected error occurred' 
      : message,
    ...(apiError.code && { code: apiError.code }),
    ...(apiError.details && { details: apiError.details }),
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

