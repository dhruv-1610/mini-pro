import { z } from 'zod';

/** Bounding box query params for geo filtering. */
export const boundingBoxSchema = z.object({
  lngMin: z.coerce.number().optional(),
  lngMax: z.coerce.number().optional(),
  latMin: z.coerce.number().optional(),
  latMax: z.coerce.number().optional(),
}).refine(
  (data) => {
    const hasAny = data.lngMin != null || data.lngMax != null || data.latMin != null || data.latMax != null;
    if (!hasAny) return true;
    return (
      data.lngMin != null &&
      data.lngMax != null &&
      data.latMin != null &&
      data.latMax != null &&
      data.lngMin <= data.lngMax &&
      data.latMin <= data.latMax
    );
  },
  { message: 'When using bounding box, all of lngMin, lngMax, latMin, latMax are required and must be valid' },
);

export type BoundingBoxParams = z.infer<typeof boundingBoxSchema>;
