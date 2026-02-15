import 'dotenv/config';
import './types';
import { app } from './app';
import { env } from './config/env';
import { connectDatabase } from './config/database';
import { logger } from './config/logger';

/**
 * Bootstrap the API server:
 * 1. Connect to MongoDB (with retry).
 * 2. Start the HTTP listener.
 */
async function bootstrap(): Promise<void> {
  await connectDatabase();

  app.listen(env.PORT, env.API_HOST, () => {
    logger.info(`Server running on http://${env.API_HOST}:${env.PORT}`);
    logger.info(`Environment: ${env.NODE_ENV}`);
  });
}

bootstrap().catch((error: unknown) => {
  logger.error('Failed to start server', { error: String(error) });
  process.exit(1);
});
