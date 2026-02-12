import { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from '../config/env';

/**
 * Apply security middleware to the Express app.
 *
 * - Helmet: sets various HTTP headers for security.
 * - CORS: restricts cross-origin requests to CORS_ORIGIN.
 */
export function applySecurity(app: Express): void {
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
}
