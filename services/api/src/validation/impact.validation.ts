import { z } from 'zod';

/** POST /api/drives/:driveId/impact request body (multipart). */
export const impactSubmitSchema = z.object({
  wasteCollected: z.coerce.number().min(0, 'Waste collected cannot be negative'),
  areaCleaned: z.coerce.number().min(0, 'Area cleaned cannot be negative'),
  workHours: z.coerce.number().min(0, 'Work hours cannot be negative'),
});
