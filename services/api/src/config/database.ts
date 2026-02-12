import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 5_000;

/**
 * Connect to MongoDB with exponential-backoff retry logic.
 * Throws after MAX_RETRIES consecutive failures.
 */
export async function connectDatabase(): Promise<void> {
  let retries = 0;

  while (retries < MAX_RETRIES) {
    try {
      await mongoose.connect(env.MONGO_URI);
      logger.info('Connected to MongoDB', { uri: env.MONGO_URI.replace(/\/\/.*@/, '//<credentials>@') });

      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error', { error: String(err) });
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
      });

      return;
    } catch (error) {
      retries += 1;
      logger.warn(
        `MongoDB connection attempt ${retries}/${MAX_RETRIES} failed. ` +
          `Retrying in ${RETRY_DELAY_MS / 1000}s…`,
      );

      if (retries >= MAX_RETRIES) {
        logger.error('Failed to connect to MongoDB after maximum retries');
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
}

/** Gracefully disconnect from MongoDB. */
export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
  logger.info('MongoDB disconnected gracefully');
}
