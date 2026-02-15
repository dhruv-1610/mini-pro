import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

/**
 * Global rate limiter. Uses fixed window; stricter limits apply to
 * /auth, /api/drives/:id/donate, and POST /api/reports via route-level limiters.
 */
export const rateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many requests. Please try again later.' } },
});
