/**
 * Authentication Middleware
 *
 * Validates user authentication and extracts user information from request.
 * Uses proper JWT validation with jsonwebtoken library.
 */

import type { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { UnauthorizedError } from '../utils/errors.js';
import { createLogger } from '../utils/logger.js';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt.js';

const logger = createLogger('AuthMiddleware');
const prisma = new PrismaClient();

/**
 * Authentication middleware
 * Requires valid JWT authentication via Bearer token
 */
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      throw new UnauthorizedError('Authentication required');
    }

    // Verify JWT token
    const payload = verifyToken(token);

    if (payload.type !== 'access') {
      throw new UnauthorizedError('Invalid token type');
    }

    // Verify user exists in database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        emailVerified: true,
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    // Attach user info to request
    (req as any).userId = user.id;
    (req as any).user = {
      id: user.id,
      email: user.email,
      emailVerified: user.emailVerified,
    };

    next();
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    logger.error('Authentication failed', err, {
      path: req.path,
      method: req.method,
    });
    next(error);
  }
}

/**
 * Optional authentication middleware
 * Allows requests with or without authentication
 */
export async function optionalAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = extractTokenFromHeader(authHeader);

    if (token) {
      try {
        const payload = verifyToken(token);

        if (payload.type === 'access') {
          const user = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: {
              id: true,
              email: true,
              emailVerified: true,
            },
          });

          if (user) {
            (req as any).userId = user.id;
            (req as any).user = {
              id: user.id,
              email: user.email,
              emailVerified: user.emailVerified,
            };
          }
        }
      } catch {
        // Token invalid, continue without authentication
      }
    }

    next();
  } catch (error) {
    // Log error but continue without authentication (optional auth)
    const err = error instanceof Error ? error : new Error(String(error));
    logger.debug('Optional auth error (continuing)', err, {
      path: req.path,
      method: req.method,
    });
    next();
  }
}
