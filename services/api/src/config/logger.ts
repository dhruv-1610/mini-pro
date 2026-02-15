import winston from 'winston';
import { env } from './env';

/**
 * Application-wide Winston logger.
 *
 * - Production: JSON format for structured log ingestion; stack traces omitted (set in error handler).
 * - Development: colorized simple format; stack included for errors.
 * - Silent in test to keep test output clean (override via LOG_LEVEL).
 * - Never log JWT or Stripe secrets (sanitized in error handler).
 */
export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  silent: env.NODE_ENV === 'test',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: env.NODE_ENV !== 'production' }),
    env.NODE_ENV === 'production'
      ? winston.format.json()
      : winston.format.combine(winston.format.colorize(), winston.format.simple()),
  ),
  defaultMeta: { service: 'cleanupcrew-api' },
  transports: [new winston.transports.Console()],
});
