import { z } from 'zod';

/** POST /api/reports/:reportId/merge request body. */
export const mergeSchema = z.object({
  duplicateReportId: z.string().min(1, 'duplicateReportId is required'),
});
