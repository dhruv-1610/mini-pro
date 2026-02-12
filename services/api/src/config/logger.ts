import winston from 'winston';
import { env } from './env';

/**
 * Application-wide Winston logger.
 *
 * - JSON format in production for structured log ingestion.
 * - Colorized simple format in development for readability.
 * - Silent in test to keep test output clean (override via LOG_LEVEL).
 */
export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  silent: env.NODE_ENV === 'test',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    env.NODE_ENV === 'production'
      ? winston.format.json()
      : winston.format.combine(winston.format.colorize(), winston.format.simple()),
  ),
  defaultMeta: { service: 'cleanupcrew-api' },
  transports: [new winston.transports.Console()],
});
