import mongoose from 'mongoose';
import { Drive } from '../../src/models/drive.model';

/** Factory: returns minimal valid Drive data. */
function validDriveData(): Record<string, unknown> {
  return {
    title: 'Lake Shore Cleanup Drive',
    location: {
      type: 'Point' as const,
      coordinates: [77.5946, 12.9716],
    },
    date: new Date('2026-04-15T09:00:00Z'),
    maxVolunteers: 30,
    fundingGoal: 50000, // in cents ($500)
    requiredRoles: [
      { role: 'picker', slots: 20 },
      { role: 'sorter', slots: 10 },
    ],
    reportId: new mongoose.Types.ObjectId(),
  };
}

describe('Drive Model — Validation', () => {
  // ── Happy path ──────────────────────────────────────────────────────────
  it('should validate a complete valid drive', () => {
    const drive = new Drive(validDriveData());
    const err = drive.validateSync();
    expect(err).toBeUndefined();
  });

  // ── Required fields ─────────────────────────────────────────────────────
  it('should require title', () => {
    const { title: _, ...data } = validDriveData();
    const err = new Drive(data).validateSync();
    expect(err?.errors.title).toBeDefined();
  });

  it('should require date', () => {
    const { date: _, ...data } = validDriveData();
    const err = new Drive(data).validateSync();
    expect(err?.errors.date).toBeDefined();
  });

  it('should require maxVolunteers', () => {
    const { maxVolunteers: _, ...data } = validDriveData();
    const err = new Drive(data).validateSync();
    expect(err?.errors.maxVolunteers).toBeDefined();
  });

  it('should require fundingGoal', () => {
    const { fundingGoal: _, ...data } = validDriveData();
    const err = new Drive(data).validateSync();
    expect(err?.errors.fundingGoal).toBeDefined();
  });

  it('should require reportId', () => {
    const { reportId: _, ...data } = validDriveData();
    const err = new Drive(data).validateSync();
    expect(err?.errors.reportId).toBeDefined();
  });

  // ── GeoJSON location ───────────────────────────────────────────────────
  it('should require location with valid Point', () => {
    const data = {
      ...validDriveData(),
      location: { type: 'Point', coordinates: [999, 12] },
    };
    const err = new Drive(data).validateSync();
    expect(err?.errors['location.coordinates']).toBeDefined();
  });

  // ── Numeric constraints ────────────────────────────────────────────────
  it('should reject maxVolunteers less than 1', () => {
    const data = { ...validDriveData(), maxVolunteers: 0 };
    const err = new Drive(data).validateSync();
    expect(err?.errors.maxVolunteers).toBeDefined();
  });

  it('should reject negative fundingGoal', () => {
    const data = { ...validDriveData(), fundingGoal: -100 };
    const err = new Drive(data).validateSync();
    expect(err?.errors.fundingGoal).toBeDefined();
  });

  // ── Defaults ────────────────────────────────────────────────────────────
  it('should default fundingRaised to 0', () => {
    const drive = new Drive(validDriveData());
    expect(drive.fundingRaised).toBe(0);
  });

  it('should default status to "planned"', () => {
    const drive = new Drive(validDriveData());
    expect(drive.status).toBe('planned');
  });

  // ── Status enum ─────────────────────────────────────────────────────────
  it('should accept valid status values', () => {
    for (const status of ['planned', 'active', 'completed', 'cancelled'] as const) {
      const drive = new Drive({ ...validDriveData(), status });
      expect(drive.validateSync()).toBeUndefined();
    }
  });

  it('should reject an invalid status', () => {
    const data = { ...validDriveData(), status: 'draft' };
    const err = new Drive(data).validateSync();
    expect(err?.errors.status).toBeDefined();
  });

  // ── Required roles sub-document ─────────────────────────────────────────
  it('should require role name in requiredRoles', () => {
    const data = { ...validDriveData(), requiredRoles: [{ slots: 5 }] };
    const err = new Drive(data).validateSync();
    expect(err?.errors['requiredRoles.0.role']).toBeDefined();
  });

  it('should require slots >= 1 in requiredRoles', () => {
    const data = { ...validDriveData(), requiredRoles: [{ role: 'picker', slots: 0 }] };
    const err = new Drive(data).validateSync();
    expect(err?.errors['requiredRoles.0.slots']).toBeDefined();
  });

  it('should default filled to 0 in requiredRoles', () => {
    const drive = new Drive(validDriveData());
    expect(drive.requiredRoles[0].filled).toBe(0);
  });
});
