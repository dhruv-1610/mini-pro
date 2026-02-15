import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

/** Extended Error with optional HTTP status code and operational flag. */
export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

/** Redact token-like strings from messages so they are never logged. */
function sanitizeForLog(msg: string): string {
  return msg
    .replace(/\bBearer\s+[^\s]+/gi, 'Bearer [REDACTED]')
    .replace(/\bsk_[^\s]+/g, 'sk_[REDACTED]')
    .replace(/\bwhsec_[^\s]+/g, 'whsec_[REDACTED]')
    .replace(/\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[JWT]');
}

/**
 * Global Express error-handling middleware.
 *
 * - Production: no stack in response; logged message sanitized (no JWT/Stripe).
 * - Development: stack in response and in logs.
 * - Must be registered LAST in the middleware chain (4-arg signature).
 */
export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const statusCode = err.statusCode ?? 500;
  const message = err.isOperational ? err.message : 'Internal Server Error';
  const isProduction = process.env.NODE_ENV === 'production';

  const logPayload: Record<string, unknown> = {
    message: isProduction ? sanitizeForLog(err.message) : err.message,
    statusCode,
    ...(req.requestId && { requestId: req.requestId }),
  };
  if (!isProduction && err.stack) {
    logPayload.stack = err.stack;
  }
  logger.error(logPayload);

  res.status(statusCode).json({
    error: {
      message,
      ...(!isProduction && err.stack && { stack: err.stack }),
    },
  });
}
