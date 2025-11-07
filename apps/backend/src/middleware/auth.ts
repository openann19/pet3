import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Express request with authenticated user
 */
export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
}

/**
 * JWT authentication middleware
 * Validates JWT token and attaches user info to request
 */
export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No token provided',
        code: 'AUTH_001',
      });
      return;
    }

    const payload = verifyToken(token);
    
    // Ensure it's an access token
    if (payload.type !== 'access') {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid token type',
        code: 'AUTH_002',
      });
      return;
    }

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, emailVerified: true },
    });

    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'User not found',
        code: 'AUTH_003',
      });
      return;
    }

    // Attach user info to request
    req.userId = payload.userId;
    req.userEmail = payload.email;

    next();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid token';
    res.status(401).json({
      error: 'Unauthorized',
      message,
      code: 'AUTH_004',
    });
  }
}

/**
 * Optional authentication middleware
 * Attaches user info if token is valid, but doesn't fail if missing
 */
export async function optionalAuthenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);
    
    if (token) {
      const payload = verifyToken(token);
      if (payload.type === 'access') {
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          select: { id: true, email: true },
        });
        
        if (user) {
          req.userId = payload.userId;
          req.userEmail = payload.email;
        }
      }
    }
  } catch {
    // Ignore errors for optional auth
  }
  
  next();
}

