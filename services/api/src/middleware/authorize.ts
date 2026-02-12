import { Request, Response, NextFunction } from 'express';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

/**
 * Role-based authorization middleware factory.
 *
 * Must be placed AFTER `authenticate` in the middleware chain so
 * that `req.user` is populated.
 *
 * @param roles - List of roles allowed to access the route.
 * @returns Express middleware that checks the user's role.
 *
 * @example
 *   router.get('/admin/stats', authenticate, authorize(['admin']), handler);
 */
export function authorize(roles: string[]): (req: Request, res: Response, next: NextFunction) => void {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient permissions'));
    }

    next();
  };
}
