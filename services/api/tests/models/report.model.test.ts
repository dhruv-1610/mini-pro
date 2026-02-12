import mongoose from 'mongoose';
import { Report } from '../../src/models/report.model';

/** Factory: returns minimal valid Report data. */
function validReportData(): Record<string, unknown> {
  return {
    photoUrls: ['https://cdn.example.com/photo1.jpg'],
    location: {
      type: 'Point' as const,
      coordinates: [77.5946, 12.9716], // [lng, lat] — Bangalore
    },
    description: 'Illegal dumping near the lake shore.',
    severity: 'medium' as const,
    createdBy: new mongoose.Types.ObjectId(),
  };
}

describe('Report Model — Validation', () => {
  // ── Happy path ──────────────────────────────────────────────────────────
  it('should validate a complete valid report', () => {
    const report = new Report(validReportData());
    const err = report.validateSync();
    expect(err).toBeUndefined();
  });

  // ── Required fields ─────────────────────────────────────────────────────
  it('should require at least one photoUrl', () => {
    const data = { ...validReportData(), photoUrls: [] };
    const err = new Report(data).validateSync();
    expect(err?.errors.photoUrls).toBeDefined();
  });

  it('should require description', () => {
    const { description: _, ...data } = validReportData();
    const err = new Report(data).validateSync();
    expect(err?.errors.description).toBeDefined();
  });

  it('should require severity', () => {
    const { severity: _, ...data } = validReportData();
    const err = new Report(data).validateSync();
    expect(err?.errors.severity).toBeDefined();
  });

  it('should require createdBy', () => {
    const { createdBy: _, ...data } = validReportData();
    const err = new Report(data).validateSync();
    expect(err?.errors.createdBy).toBeDefined();
  });

  // ── GeoJSON location ───────────────────────────────────────────────────
  it('should require location.type to be "Point"', () => {
    const data = {
      ...validReportData(),
      location: { type: 'Polygon', coordinates: [77.5946, 12.9716] },
    };
    const err = new Report(data).validateSync();
    expect(err?.errors['location.type']).toBeDefined();
  });

  it('should require exactly 2 coordinates [lng, lat]', () => {
    const data = {
      ...validReportData(),
      location: { type: 'Point', coordinates: [77.5946] },
    };
    const err = new Report(data).validateSync();
    expect(err?.errors['location.coordinates']).toBeDefined();
  });

  it('should reject longitude outside -180..180', () => {
    const data = {
      ...validReportData(),
      location: { type: 'Point', coordinates: [200, 12.9716] },
    };
    const err = new Report(data).validateSync();
    expect(err?.errors['location.coordinates']).toBeDefined();
  });

  it('should reject latitude outside -90..90', () => {
    const data = {
      ...validReportData(),
      location: { type: 'Point', coordinates: [77.5946, 100] },
    };
    const err = new Report(data).validateSync();
    expect(err?.errors['location.coordinates']).toBeDefined();
  });

  // ── Severity enum ──────────────────────────────────────────────────────
  it('should accept valid severity values', () => {
    for (const severity of ['low', 'medium', 'high'] as const) {
      const report = new Report({ ...validReportData(), severity });
      expect(report.validateSync()).toBeUndefined();
    }
  });

  it('should reject an invalid severity', () => {
    const data = { ...validReportData(), severity: 'critical' };
    const err = new Report(data).validateSync();
    expect(err?.errors.severity).toBeDefined();
  });

  // ── Status lifecycle ───────────────────────────────────────────────────
  it('should default status to "reported"', () => {
    const report = new Report(validReportData());
    expect(report.status).toBe('reported');
  });

  it('should accept valid status values', () => {
    for (const status of ['reported', 'verified', 'drive_created', 'cleaned'] as const) {
      const report = new Report({ ...validReportData(), status });
      expect(report.validateSync()).toBeUndefined();
    }
  });

  it('should reject an invalid status', () => {
    const data = { ...validReportData(), status: 'pending' };
    const err = new Report(data).validateSync();
    expect(err?.errors.status).toBeDefined();
  });

  // ── Duplicates ─────────────────────────────────────────────────────────
  it('should default duplicates to an empty array', () => {
    const report = new Report(validReportData());
    expect(report.duplicates).toEqual([]);
  });
});
