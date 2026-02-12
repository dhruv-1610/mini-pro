import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../config/jwt';
import { UnauthorizedError } from '../utils/errors';

/**
 * JWT authentication middleware.
 *
 * Extracts the Bearer token from the Authorization header,
 * verifies it, and attaches `req.user` with { userId, role }.
 * Passes UnauthorizedError to the error handler on failure.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('No token provided'));
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = verifyAccessToken(token);
    req.user = { userId: payload.userId, role: payload.role };
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}
