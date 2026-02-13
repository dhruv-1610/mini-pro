/**
 * Migration script: Ensure all MongoDB indexes are created.
 *
 * Usage:
 *   npx ts-node src/scripts/ensure-indexes.ts
 *   npm run db:ensure-indexes
 *
 * This script connects to MongoDB, calls `syncIndexes()` on every
 * model to create missing indexes and remove stale ones, then exits.
 */

import mongoose from 'mongoose';
import { env } from '../config/env';
import { logger } from '../config/logger';

// Import all models so their schemas (and index definitions) are registered.
import { User } from '../models/user.model';
import { Report } from '../models/report.model';
import { Drive } from '../models/drive.model';
import { Donation } from '../models/donation.model';
import { Attendance } from '../models/attendance.model';
import { Expense } from '../models/expense.model';
import { Impact } from '../models/impact.model';
import { ActivityLog } from '../models/activityLog.model';

const models = [
  { name: 'User', model: User },
  { name: 'Report', model: Report },
  { name: 'Drive', model: Drive },
  { name: 'Donation', model: Donation },
  { name: 'Attendance', model: Attendance },
  { name: 'Expense', model: Expense },
  { name: 'Impact', model: Impact },
  { name: 'ActivityLog', model: ActivityLog },
];

async function ensureIndexes(): Promise<void> {
  logger.info('Connecting to MongoDB…');
  await mongoose.connect(env.MONGO_URI);
  logger.info('Connected. Syncing indexes…');

  for (const { name, model } of models) {
    await model.syncIndexes();
    const indexes = await model.collection.indexes();
    logger.info(`  ${name}: ${indexes.length} indexes synced`);
  }

  logger.info('All indexes ensured.');
  await mongoose.disconnect();
}

ensureIndexes().catch((error: unknown) => {
  logger.error('Index migration failed', { error: String(error) });
  process.exit(1);
});
