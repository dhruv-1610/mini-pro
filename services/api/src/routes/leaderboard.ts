import { Router, Request, Response, NextFunction } from 'express';
import * as leaderboardService from '../services/leaderboard.service';
import { leaderboardPeriodSchema } from '../validation/leaderboard.validation';

const router = Router();

function parsePeriod(req: Request): 'all-time' | 'monthly' {
  const parsed = leaderboardPeriodSchema.safeParse(req.query);
  if (!parsed.success) return 'all-time';
  return parsed.data.period;
}

/** GET /api/leaderboard/donors */
router.get('/donors', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = parsePeriod(req);
    const donors = await leaderboardService.getDonorLeaderboard(period);
    res.json({ donors });
  } catch (error) {
    next(error);
  }
});

/** GET /api/leaderboard/volunteers */
router.get('/volunteers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = parsePeriod(req);
    const volunteers = await leaderboardService.getVolunteerLeaderboard(period);
    res.json({ volunteers });
  } catch (error) {
    next(error);
  }
});

export default router;
