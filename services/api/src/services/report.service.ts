import mongoose from 'mongoose';
import { Report, IReport, ReportStatus } from '../models/report.model';
import { Drive } from '../models/drive.model';
import { Impact } from '../models/impact.model';
import { ActivityLog } from '../models/activityLog.model';
import { BadRequestError, NotFoundError } from '../utils/errors';

// ── Status lifecycle ───────────────────────────────────────────────────────

/**
 * Valid forward transitions for the report status lifecycle.
 *   reported → verified → drive_created → cleaned
 */
const VALID_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  reported: ['verified'],
  verified: ['drive_created'],
  drive_created: ['cleaned'],
  cleaned: [], // terminal state
  merged: [], // terminal state for merged duplicates
};

// ── Duplicate detection ────────────────────────────────────────────────────

/** Radius in meters for duplicate spot detection. */
const DUPLICATE_RADIUS_METERS = 50;

/**
 * Find an existing report within 50 m of the given coordinates
 * that has the same severity.
 *
 * Uses MongoDB's $nearSphere on the 2dsphere-indexed `location` field.
 * Returns `null` if no duplicate is found.
 */
export async function findDuplicate(
  lng: number,
  lat: number,
  severity: string,
): Promise<IReport | null> {
  return Report.findOne({
    location: {
      $nearSphere: {
        $geometry: { type: 'Point', coordinates: [lng, lat] },
        $maxDistance: DUPLICATE_RADIUS_METERS,
      },
    },
    severity,
  });
}

// ── Submit report ──────────────────────────────────────────────────────────

export interface SubmitReportInput {
  photoUrls: string[];
  lng: number;
  lat: number;
  description: string;
  severity: string;
  createdBy: string;
}

export interface SubmitReportResult {
  duplicate: boolean;
  report?: IReport;
  existingReportId?: string;
}

/**
 * Submit a new spot report.
 *
 * 1. Check for an existing report within 50 m with the same severity.
 * 2. If duplicate found — append new report id to existing report's duplicates.
 * 3. Otherwise — create a new report with status "reported".
 */
export async function submitReport(input: SubmitReportInput): Promise<SubmitReportResult> {
  const { photoUrls, lng, lat, description, severity, createdBy } = input;

  // Step 1: duplicate detection
  const existing = await findDuplicate(lng, lat, severity);

  if (existing) {
    // Create the new report but flag it as duplicate
    const dupReport = await Report.create({
      photoUrls,
      location: { type: 'Point', coordinates: [lng, lat] },
      description,
      severity,
      status: 'reported',
      createdBy,
    });

    // Append to the original report's duplicates array
    existing.duplicates.push(dupReport._id);
    await existing.save();

    await ActivityLog.create({
      entityType: 'Report',
      entityId: dupReport._id,
      action: 'report_created',
      performedBy: new mongoose.Types.ObjectId(createdBy),
    });

    return {
      duplicate: true,
      existingReportId: existing._id.toString(),
    };
  }

  // Step 2: fresh report
  const report = await Report.create({
    photoUrls,
    location: { type: 'Point', coordinates: [lng, lat] },
    description,
    severity,
    status: 'reported',
    createdBy,
  });

  await ActivityLog.create({
    entityType: 'Report',
    entityId: report._id,
    action: 'report_created',
    performedBy: new mongoose.Types.ObjectId(createdBy),
  });

  return { duplicate: false, report };
}

// ── Admin verification ─────────────────────────────────────────────────────

/**
 * Admin verifies a report — transitions status from "reported" to "verified".
 *
 * @throws NotFoundError if the report does not exist.
 * @throws BadRequestError if the report is not in "reported" status.
 */
export async function verifyReport(reportId: string, performedBy: string): Promise<IReport> {
  const report = await Report.findById(reportId);
  if (!report) {
    throw new NotFoundError('Report not found');
  }

  if (report.status !== 'reported') {
    throw new BadRequestError(
      `Cannot verify a report in "${report.status}" status. Only "reported" reports can be verified.`,
    );
  }

  report.status = 'verified';
  await report.save();

  await ActivityLog.create({
    entityType: 'Report',
    entityId: report._id,
    action: 'report_verified',
    performedBy: new mongoose.Types.ObjectId(performedBy),
  });

  return report;
}

// ── Status transition ──────────────────────────────────────────────────────

/**
 * Transition a report to a new status, enforcing the strict lifecycle.
 *
 *   reported → verified → drive_created → cleaned
 *
 * @throws NotFoundError if the report does not exist.
 * @throws BadRequestError if the transition is not valid.
 */
export async function transitionStatus(
  reportId: string,
  newStatus: ReportStatus,
): Promise<IReport> {
  const report = await Report.findById(reportId);
  if (!report) {
    throw new NotFoundError('Report not found');
  }

  const allowed = VALID_TRANSITIONS[report.status];
  if (!allowed.includes(newStatus)) {
    throw new BadRequestError(
      `Invalid transition: "${report.status}" → "${newStatus}". ` +
        `Allowed next states: [${allowed.join(', ')}].`,
    );
  }

  report.status = newStatus;
  await report.save();
  return report;
}

// ── Merge duplicate into primary ────────────────────────────────────────────

/**
 * Merge duplicate report into primary (admin only).
 * Appends duplicate ID to primary.duplicates, sets duplicate.status = merged.
 * Does NOT delete duplicate report.
 */
export async function mergeReports(
  primaryReportId: string,
  duplicateReportId: string,
  performedBy: string,
): Promise<IReport> {
  if (primaryReportId === duplicateReportId) {
    throw new BadRequestError('Cannot merge a report into itself');
  }

  const primaryObjectId = new mongoose.Types.ObjectId(primaryReportId);
  const duplicateObjectId = new mongoose.Types.ObjectId(duplicateReportId);

  const [primary, duplicate] = await Promise.all([
    Report.findById(primaryObjectId),
    Report.findById(duplicateObjectId),
  ]);

  if (!primary) {
    throw new NotFoundError('Primary report not found');
  }
  if (!duplicate) {
    throw new NotFoundError('Duplicate report not found');
  }

  if (primary.duplicates.some((id) => id.equals(duplicateObjectId))) {
    throw new BadRequestError('Duplicate report is already merged into primary');
  }

  primary.duplicates.push(duplicateObjectId);
  await primary.save();

  duplicate.status = 'merged';
  await duplicate.save();

  await ActivityLog.create({
    entityType: 'Report',
    entityId: primary._id,
    action: 'report_merged',
    performedBy: new mongoose.Types.ObjectId(performedBy),
  });

  return primary;
}

// ── Report timeline ────────────────────────────────────────────────────────

/**
 * Get chronological timeline for a report.
 * Aggregates ActivityLog entries: report_created, report_verified, drive_created,
 * report_merged, impact_submitted (cleaned).
 * Sort ascending by timestamp.
 */
export async function getReportTimeline(reportId: string) {
  const reportObjectId = new mongoose.Types.ObjectId(reportId);

  const report = await Report.findById(reportObjectId);
  if (!report) {
    throw new NotFoundError('Report not found');
  }

  const drive = await Drive.findOne({ reportId: reportObjectId });
  const impact = drive ? await Impact.findOne({ driveId: drive._id }) : null;

  const entityIds: { type: string; id: mongoose.Types.ObjectId }[] = [
    { type: 'Report', id: reportObjectId },
  ];
  if (drive) entityIds.push({ type: 'Drive', id: drive._id });
  if (impact) entityIds.push({ type: 'Impact', id: impact._id });

  const logs = await ActivityLog.find({
    $or: entityIds.map((e) => ({ entityType: e.type, entityId: e.id })),
  })
    .sort({ timestamp: 1 })
    .lean();

  return logs;
}
