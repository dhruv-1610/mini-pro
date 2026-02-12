import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

/** Extended Error with optional HTTP status code and operational flag. */
export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/**
 * Global Express error-handling middleware.
 *
 * - Logs every error via Winston.
 * - Returns a sanitised JSON payload (stack only in development).
 * - Must be registered LAST in the middleware chain (4-arg signature).
 */
export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const statusCode = err.statusCode ?? 500;
  const message = err.isOperational ? err.message : 'Internal Server Error';

  logger.error({
    message: err.message,
    stack: err.stack,
    statusCode,
  });

  res.status(statusCode).json({
    error: {
      message,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
}
