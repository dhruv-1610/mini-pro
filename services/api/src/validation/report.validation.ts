import { z } from 'zod';
import { REPORT_SEVERITIES, REPORT_STATUSES } from '../models/report.model';

/**
 * Validates multipart form fields for POST /api/reports.
 * Note: file (photo) is validated by Multer's fileFilter, not Zod.
 */
export const createReportSchema = z.object({
  lat: z.coerce
    .number({ message: 'lat must be a number' })
    .min(-90, 'Latitude must be >= -90')
    .max(90, 'Latitude must be <= 90'),
  lng: z.coerce
    .number({ message: 'lng must be a number' })
    .min(-180, 'Longitude must be >= -180')
    .max(180, 'Longitude must be <= 180'),
  description: z.string().min(1, 'Description is required').trim(),
  severity: z.enum(REPORT_SEVERITIES, {
    message: 'Severity must be low, medium, or high',
  }),
});

/** Validates the body of PATCH /api/reports/:id/status. */
export const updateStatusSchema = z.object({
  status: z.enum(REPORT_STATUSES, {
    message: 'Invalid report status',
  }),
});
