import { z } from 'zod';

/** Query params for leaderboard. */
export const leaderboardPeriodSchema = z.object({
  period: z.enum(['all-time', 'monthly']).optional().default('all-time'),
});
