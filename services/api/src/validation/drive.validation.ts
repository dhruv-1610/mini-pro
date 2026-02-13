import { z } from 'zod';
import { DRIVE_ROLES } from '../models/drive.model';

/** Required role input for drive creation. */
const requiredRoleSchema = z.object({
  role: z.enum(DRIVE_ROLES, {
    message: 'Role must be Cleaner, Coordinator, Photographer, or LogisticsHelper',
  }),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
});

/**
 * POST /api/drives request body.
 * maxVolunteers is derived from sum(requiredRoles.capacity).
 */
export const createDriveSchema = z
  .object({
    reportId: z.string().min(1, 'reportId is required'),
    title: z.string().min(1, 'Title is required').trim(),
    date: z.coerce
      .date({ message: 'Date is required' })
      .refine((d) => d > new Date(), 'Drive date must be in the future'),
    fundingGoal: z.number().int().min(0, 'Funding goal cannot be negative'),
    requiredRoles: z
      .array(requiredRoleSchema)
      .min(1, 'At least one required role is required')
      .refine((roles) => {
        const unique = new Set(roles.map((r) => r.role));
        return unique.size === roles.length;
      }, 'Duplicate roles are not allowed'),
    maxVolunteers: z.number().int().min(1).optional(),
  })
  .refine(
    (data) => {
      const sum = data.requiredRoles.reduce((a, r) => a + r.capacity, 0);
      if (data.maxVolunteers !== undefined) {
        return data.maxVolunteers === sum;
      }
      return true;
    },
    { message: 'maxVolunteers must equal sum of role capacities', path: ['maxVolunteers'] },
  );
