import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { Donation } from '../models/donation.model';

const router = Router();

/** GET /api/users/me/donations — Returns authenticated user's donations. */
router.get(
  '/me/donations',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const donations = await Donation.find({ userId: req.user!.userId })
        .sort({ createdAt: -1 })
        .lean();

      res.json({ donations });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
