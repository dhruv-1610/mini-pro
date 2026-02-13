import { z } from 'zod';
import { DRIVE_ROLES } from '../models/drive.model';

/** POST /api/drives/:driveId/book body. */
export const bookSchema = z.object({
  role: z.enum(DRIVE_ROLES, {
    message: 'Role must be Cleaner, Coordinator, Photographer, or LogisticsHelper',
  }),
});

/** POST /api/drives/:driveId/checkin body. */
export const checkinSchema = z.object({
  qrCode: z.string().min(1, 'QR code is required'),
});
