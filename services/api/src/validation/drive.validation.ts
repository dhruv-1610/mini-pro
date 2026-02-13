import { z } from 'zod';
import { DRIVE_ROLES } from '../models/drive.model';

/** Required role sub-schema for drive creation. */
const requiredRoleSchema = z.object({
  role: z.enum(DRIVE_ROLES, {
    message: 'Role must be Cleaner, Coordinator, Photographer, or LogisticsHelper',
  }),
  capacity: z.number().int().min(1, 'Capacity must be at least 1'),
});

/** Create drive request body. maxVolunteers must equal sum of role capacities. */
export const createDriveSchema = z
  .object({
    title: z.string().min(1, 'Title is required').trim(),
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
    date: z.coerce.date(),
    maxVolunteers: z.number().int().min(1),
    fundingGoal: z.number().int().min(0),
    reportId: z.string().min(1, 'Report ID is required'),
    requiredRoles: z
      .array(requiredRoleSchema)
      .min(1, 'At least one required role must be defined'),
  })
  .refine(
    (data) => {
      const sum = data.requiredRoles.reduce((acc, r) => acc + r.capacity, 0);
      return data.maxVolunteers === sum;
    },
    { message: 'maxVolunteers must equal sum of role capacities', path: ['maxVolunteers'] },
  );
