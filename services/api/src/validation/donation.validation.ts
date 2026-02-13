import { z } from 'zod';
import { DONATION_MIN_AMOUNT_PAISE } from '../models/donation.model';

/** POST /api/drives/:driveId/donate request body. */
export const donateSchema = z.object({
  amount: z
    .number()
    .int()
    .min(DONATION_MIN_AMOUNT_PAISE, `Minimum donation is ₹10 (${DONATION_MIN_AMOUNT_PAISE} paise)`),
});
