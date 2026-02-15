import { Router, Request, Response, NextFunction } from 'express';
import * as mapService from '../services/map.service';
import { boundingBoxSchema } from '../validation/map.validation';
import { BadRequestError } from '../utils/errors';

const router = Router();

function parseBbox(req: Request): mapService.BoundingBox | null {
  const parsed = boundingBoxSchema.safeParse(req.query);
  if (!parsed.success) {
    throw new BadRequestError(parsed.error.issues[0]?.message ?? 'Invalid bounding box');
  }
  const { lngMin, lngMax, latMin, latMax } = parsed.data;
  const hasAll =
    lngMin != null && lngMax != null && latMin != null && latMax != null;
  if (!hasAll) return null;
  return { lngMin: lngMin!, lngMax: lngMax!, latMin: latMin!, latMax: latMax! };
}

/** GET /api/map/reports — Reported spots (status = reported). */
router.get('/reports', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bbox = parseBbox(req);
    const reports = await mapService.getReportedSpots(bbox);
    res.json({ reports });
  } catch (error) {
    next(error);
  }
});

/** GET /api/map/drives — Active drives (status = planned or active). */
router.get('/drives', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bbox = parseBbox(req);
    const drives = await mapService.getActiveDrives(bbox);
    res.json({ drives });
  } catch (error) {
    next(error);
  }
});

/** GET /api/map/verified — Verified spots (status = verified or drive_created). */
router.get('/verified', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bbox = parseBbox(req);
    const reports = await mapService.getVerifiedSpots(bbox);
    res.json({ reports });
  } catch (error) {
    next(error);
  }
});

/** GET /api/map/cleaned — Cleaned locations (status = completed). */
router.get('/cleaned', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bbox = parseBbox(req);
    const locations = await mapService.getCleanedLocations(bbox);
    res.json({ locations });
  } catch (error) {
    next(error);
  }
});

export default router;
