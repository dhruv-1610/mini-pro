import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

/**
 * Logs every incoming HTTP request with method, URL, status, and duration.
 * Attaches a `finish` listener so the log entry includes the response status.
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
    });
  });

  next();
}
