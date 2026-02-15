import { Report } from '../models/report.model';
import { Drive } from '../models/drive.model';
import { Impact } from '../models/impact.model';

export interface BoundingBox {
  lngMin: number;
  lngMax: number;
  latMin: number;
  latMax: number;
}

function buildGeoFilter(bbox: BoundingBox | null): object {
  if (!bbox) return {};
  const [lngMin, lngMax, latMin, latMax] = [
    bbox.lngMin,
    bbox.lngMax,
    bbox.latMin,
    bbox.latMax,
  ];
  return {
    location: {
      $geoWithin: {
        $geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [lngMin, latMin],
              [lngMax, latMin],
              [lngMax, latMax],
              [lngMin, latMax],
              [lngMin, latMin],
            ],
          ],
        },
      },
    },
  };
}

/**
 * Get reported spots (status = reported).
 */
export async function getReportedSpots(bbox: BoundingBox | null) {
  const filter = { status: 'reported', ...buildGeoFilter(bbox) };
  return Report.find(filter)
    .select('location severity description createdAt status _id photoUrls')
    .lean();
}

/**
 * Get verified spots (status = verified or drive_created).
 */
export async function getVerifiedSpots(bbox: BoundingBox | null) {
  const filter = {
    status: { $in: ['verified', 'drive_created'] },
    ...buildGeoFilter(bbox),
  };
  return Report.find(filter)
    .select('location severity description createdAt status _id photoUrls')
    .lean();
}

/**
 * Get active drives (status = planned or active).
 */
export async function getActiveDrives(bbox: BoundingBox | null) {
  const filter = { status: { $in: ['planned', 'active'] }, ...buildGeoFilter(bbox) };
  return Drive.find(filter)
    .select('location title date status _id fundingGoal fundingRaised maxVolunteers requiredRoles')
    .lean();
}

/**
 * Get cleaned locations (drives with status = completed).
 * Include impact summary if exists.
 */
export async function getCleanedLocations(bbox: BoundingBox | null) {
  const filter = { status: 'completed', ...buildGeoFilter(bbox) };
  const drives = await Drive.find(filter).lean();
  const driveIds = drives.map((d) => d._id);

  const impacts = await Impact.find({ driveId: { $in: driveIds } })
    .select('driveId wasteCollected areaCleaned workHours')
    .lean();

  const impactByDrive = new Map(impacts.map((i) => [i.driveId.toString(), i]));

  return drives.map((d) => {
    const impact = impactByDrive.get(d._id.toString());
    return {
      ...d,
      impactSummary: impact
        ? {
            wasteCollected: impact.wasteCollected,
            areaCleaned: impact.areaCleaned,
            workHours: impact.workHours,
          }
        : null,
    };
  });
}
