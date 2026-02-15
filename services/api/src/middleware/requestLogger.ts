import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { logger } from '../config/logger';
import { env } from '../config/env';

/**
 * Logs every incoming HTTP request.
 * In production: structured JSON with requestId, method, path, statusCode, responseTime (no query string).
 * In development: method, url, status, duration, ip.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const requestId = (req.headers['x-request-id'] as string) || randomUUID();
  req.requestId = requestId;
  const start = Date.now();

  res.on('finish', () => {
    const responseTime = Date.now() - start;
    if (env.NODE_ENV === 'production') {
      logger.info({
        requestId,
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        responseTime,
      });
    } else {
      logger.info({
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        duration: `${responseTime}ms`,
        ip: req.ip,
      });
    }
  });

  next();
}
