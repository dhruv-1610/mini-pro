import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { Donation } from '../models/donation.model';
import * as badgeService from '../services/badge.service';
import { ForbiddenError } from '../utils/errors';

const router = Router();

/** GET /api/users/me/donations — Returns authenticated user's donations (must be before /:userId). */
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

/** GET /api/users/:userId/badges — Badge levels for a user. */
router.get('/:userId/badges', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
    const badges = await badgeService.getUserBadges(userId);
    res.json(badges);
  } catch (error) {
    next(error);
  }
});

/** GET /api/users/:userId/certificate — PDF certificate (own or admin). */
router.get(
  '/:userId/certificate',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId;
      const isAdmin = req.user!.role === 'admin';
      const isOwn = req.user!.userId === userId;

      if (!isAdmin && !isOwn) {
        throw new ForbiddenError('You can only request your own certificate');
      }

      const { generateCertificate } = await import('../services/certificate.service');
      const pdf = await generateCertificate(userId);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline; filename="certificate.pdf"');
      res.send(pdf);
    } catch (error) {
      next(error);
    }
  },
);

export default router;
