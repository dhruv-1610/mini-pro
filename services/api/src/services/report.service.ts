import { Report, IReport, ReportStatus } from '../models/report.model';
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

  return { duplicate: false, report };
}

// ── Admin verification ─────────────────────────────────────────────────────

/**
 * Admin verifies a report — transitions status from "reported" to "verified".
 *
 * @throws NotFoundError if the report does not exist.
 * @throws BadRequestError if the report is not in "reported" status.
 */
export async function verifyReport(reportId: string): Promise<IReport> {
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
