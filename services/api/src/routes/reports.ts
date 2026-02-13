import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import multer from 'multer';
import { upload } from '../config/upload';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { createReportSchema, updateStatusSchema } from '../validation/report.validation';
import { mergeSchema } from '../validation/merge.validation';
import * as reportService from '../services/report.service';
import { BadRequestError } from '../utils/errors';
import { env } from '../config/env';
import { ReportStatus } from '../models/report.model';

const router = Router();

// ── Rate limiter for public report submissions ─────────────────────────────
const reportLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'test' ? 1000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many report submissions, please try again later' } },
});

// ── Multer wrapper ─────────────────────────────────────────────────────────

/**
 * Wraps multer upload.single() in a manual callback so that Multer
 * errors (file type, file size) are converted to BadRequestErrors
 * and the multipart stream is fully consumed — preventing ECONNRESET.
 */
function uploadPhoto(req: Request, res: Response, next: NextFunction): void {
  const single = upload.single('photo');
  single(req, res, (err: unknown) => {
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

// ── POST /api/reports — Submit a new report ────────────────────────────────

router.post(
  '/',
  authenticate,
  reportLimiter,
  uploadPhoto,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate text fields
      const parsed = createReportSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new BadRequestError(parsed.error.issues[0]?.message ?? 'Invalid input');
      }

      // Check file validation (set by multer's fileFilter via cb(null, false))
      const fileError = (req as Request & { fileValidationError?: string }).fileValidationError;
      if (fileError) {
        throw new BadRequestError(fileError);
      }

      // Require at least one photo
      if (!req.file) {
        throw new BadRequestError('Photo is required');
      }

      const { lat, lng, description, severity } = parsed.data;
      const photoUrl = `/uploads/${req.file.filename}`;

      const result = await reportService.submitReport({
        photoUrls: [photoUrl],
        lng,
        lat,
        description,
        severity,
        createdBy: req.user!.userId,
      });

      if (result.duplicate) {
        res.status(200).json({
          duplicate: true,
          message: 'A report already exists within 50 meters with the same severity.',
          existingReportId: result.existingReportId,
        });
      } else {
        res.status(201).json({ report: result.report });
      }
    } catch (error) {
      next(error);
    }
  },
);

// ── PATCH /api/reports/:id/verify — Admin verifies a report ────────────────

router.patch(
  '/:id/verify',
  authenticate,
  authorize(['admin']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reportId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const report = await reportService.verifyReport(reportId, req.user!.userId);
      res.json({ report });
    } catch (error) {
      next(error);
    }
  },
);

// ── POST /api/reports/:reportId/merge — Admin merges duplicate into primary ─

router.post(
  '/:reportId/merge',
  authenticate,
  authorize(['admin']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = mergeSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new BadRequestError(parsed.error.issues[0]?.message ?? 'Invalid input');
      }

      const reportId = Array.isArray(req.params.reportId)
        ? req.params.reportId[0]
        : req.params.reportId;

      const report = await reportService.mergeReports(
        reportId,
        parsed.data.duplicateReportId,
        req.user!.userId,
      );
      res.json({ report });
    } catch (error) {
      next(error);
    }
  },
);

// ── GET /api/reports/:reportId/timeline — Chronological activity for report ─

router.get(
  '/:reportId/timeline',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const reportId = Array.isArray(req.params.reportId)
        ? req.params.reportId[0]
        : req.params.reportId;

      const timeline = await reportService.getReportTimeline(reportId);
      res.json({ timeline });
    } catch (error) {
      next(error);
    }
  },
);

// ── PATCH /api/reports/:id/status — Admin transitions status ───────────────

router.patch(
  '/:id/status',
  authenticate,
  authorize(['admin']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = updateStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        throw new BadRequestError(parsed.error.issues[0]?.message ?? 'Invalid status');
      }

      const reportId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const report = await reportService.transitionStatus(
        reportId,
        parsed.data.status as ReportStatus,
      );

      res.json({ report });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
