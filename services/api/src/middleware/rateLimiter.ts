import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

/**
 * Global rate limiter.
 * Configured via RATE_LIMIT_WINDOW_MS and RATE_LIMIT_MAX env vars.
 */
export const rateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many requests, please try again later' } },
});
