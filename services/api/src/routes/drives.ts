import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { upload } from '../config/upload';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { createDriveSchema } from '../validation/drive.validation';
import { bookSchema, checkinSchema } from '../validation/booking.validation';
import { donateSchema } from '../validation/donation.validation';
import { impactSubmitSchema } from '../validation/impact.validation';
import * as driveService from '../services/drive.service';
import * as bookingService from '../services/booking.service';
import * as donationService from '../services/donation.service';
import * as impactService from '../services/impact.service';
import { BadRequestError } from '../utils/errors';
import { env } from '../config/env';

const router = Router();

const donationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'test' ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many donation attempts, please try again later' } },
});

function uploadImpactPhotos(req: Request, res: Response, next: NextFunction): void {
  const fields = upload.fields([
    { name: 'beforePhotos', maxCount: 20 },
    { name: 'afterPhotos', maxCount: 20 },
  ]);
  fields(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') return next(new BadRequestError('File too large'));
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return next(new BadRequestError('Only image files (JPEG, PNG, GIF, WebP) are allowed'));
      }
      return next(new BadRequestError(err.message));
    }
    if (err) return next(err);
    next();
  });
}

// ── POST /api/drives — Admin creates drive ──────────────────────────────────

router.post(
  '/',
  authenticate,
  authorize(['admin']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = createDriveSchema.safeParse(req.body);
      if (!parsed.success) {
        const firstIssue = parsed.error.issues[0];
        const message = firstIssue?.message ?? 'Invalid input';
        throw new BadRequestError(message);
      }

      const { reportId, title, date, fundingGoal, requiredRoles } = parsed.data;

      const drive = await driveService.createDrive({
        reportId,
        title,
        date,
        fundingGoal,
        requiredRoles,
        createdBy: req.user!.userId,
      });

      res.status(201).json({ drive });
    } catch (error) {
      next(error);
    }
  },
);

// ── POST /api/drives/:driveId/book — User books ONE role ────────────────────

router.post(
  '/:driveId/book',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = bookSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new BadRequestError(parsed.error.issues[0]?.message ?? 'Invalid input');
      }

      const driveId = Array.isArray(req.params.driveId)
        ? req.params.driveId[0]
        : req.params.driveId;

      const { attendance } = await bookingService.bookSlot(
        driveId,
        req.user!.userId,
        parsed.data.role,
      );

      res.status(201).json({ attendance });
    } catch (error) {
      next(error);
    }
  },
);

// ── POST /api/drives/:driveId/cancel — User cancels own booking ─────────────

router.post(
  '/:driveId/cancel',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const driveId = Array.isArray(req.params.driveId)
        ? req.params.driveId[0]
        : req.params.driveId;

      const { attendance } = await bookingService.cancelBooking(
        driveId,
        req.user!.userId,
      );

      res.json({ attendance });
    } catch (error) {
      next(error);
    }
  },
);

// ── POST /api/drives/:driveId/checkin — Admin/organizer checks in by QR ──────

router.post(
  '/:driveId/checkin',
  authenticate,
  authorize(['admin', 'organizer']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = checkinSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new BadRequestError(parsed.error.issues[0]?.message ?? 'Invalid input');
      }

      const driveId = Array.isArray(req.params.driveId)
        ? req.params.driveId[0]
        : req.params.driveId;

      const { attendance } = await bookingService.checkIn(
        driveId,
        parsed.data.qrCode,
        req.user!.userId,
      );

      res.json({ attendance });
    } catch (error) {
      next(error);
    }
  },
);

// ── POST /api/drives/:driveId/donate — Create PaymentIntent for donation ────

router.post(
  '/:driveId/donate',
  authenticate,
  donationLimiter,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = donateSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new BadRequestError(parsed.error.issues[0]?.message ?? 'Invalid input');
      }

      const driveId = Array.isArray(req.params.driveId)
        ? req.params.driveId[0]
        : req.params.driveId;

      const { clientSecret } = await donationService.createDonation({
        driveId,
        userId: req.user!.userId,
        amount: parsed.data.amount,
      });

      res.status(200).json({ clientSecret });
    } catch (error) {
      next(error);
    }
  },
);

// ── POST /api/drives/:driveId/impact — Admin submits impact ──────────────────

router.post(
  '/:driveId/impact',
  authenticate,
  authorize(['admin']),
  uploadImpactPhotos,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = impactSubmitSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new BadRequestError(parsed.error.issues[0]?.message ?? 'Invalid input');
      }

      const fileError = (req as Request & { fileValidationError?: string }).fileValidationError;
      if (fileError) {
        throw new BadRequestError(fileError);
      }

      const driveId = Array.isArray(req.params.driveId)
        ? req.params.driveId[0]
        : req.params.driveId;

      const beforeFiles = (req.files as { beforePhotos?: Express.Multer.File[] })?.beforePhotos ?? [];
      const afterFiles = (req.files as { afterPhotos?: Express.Multer.File[] })?.afterPhotos ?? [];
      const beforePhotoUrls = beforeFiles.map((f) => `/uploads/${f.filename}`);
      const afterPhotoUrls = afterFiles.map((f) => `/uploads/${f.filename}`);

      const impact = await impactService.submitImpact({
        driveId,
        wasteCollected: parsed.data.wasteCollected,
        areaCleaned: parsed.data.areaCleaned,
        workHours: parsed.data.workHours,
        beforePhotoUrls,
        afterPhotoUrls,
        submittedBy: req.user!.userId,
      });

      res.status(201).json({ impact });
    } catch (error) {
      next(error);
    }
  },
);

// ── GET /api/drives/active — Must be before /:id ────────────────────────────

router.get('/active', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const drives = await driveService.getActiveDrives();
    res.json({ drives });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/drives/:driveId/funding-progress — Must be before /:id ─────────

router.get('/:driveId/funding-progress', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const driveId = Array.isArray(req.params.driveId)
      ? req.params.driveId[0]
      : req.params.driveId;
    const drive = await driveService.getDriveById(driveId);
    res.json({
      fundingGoal: drive.fundingGoal,
      fundingRaised: drive.fundingRaised,
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /api/drives/:id ────────────────────────────────────────────────────

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const driveId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const drive = await driveService.getDriveById(driveId);
    res.json({ drive });
  } catch (error) {
    next(error);
  }
});

export default router;
