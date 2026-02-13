import mongoose from 'mongoose';
import { Drive } from '../../src/models/drive.model';

/** Factory: returns minimal valid Drive data with required_roles matching maxVolunteers. */
function validDriveData(): Record<string, unknown> {
  return {
    title: 'Lake Shore Cleanup Drive',
    location: {
      type: 'Point' as const,
      coordinates: [77.5946, 12.9716],
    },
    date: new Date('2026-04-15T09:00:00Z'),
    maxVolunteers: 30,
    fundingGoal: 50000,
    requiredRoles: [
      { role: 'Cleaner', capacity: 20, booked: 0, waitlist: 0 },
      { role: 'Coordinator', capacity: 5, booked: 0, waitlist: 0 },
      { role: 'Photographer', capacity: 5, booked: 0, waitlist: 0 },
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
    const { title: _t, ...data } = validDriveData();
    const err = new Drive(data).validateSync();
    expect(err?.errors.title).toBeDefined();
  });

  it('should require date', () => {
    const { date: _d, ...data } = validDriveData();
    const err = new Drive(data).validateSync();
    expect(err?.errors.date).toBeDefined();
  });

  it('should require maxVolunteers', () => {
    const { maxVolunteers: _m, ...data } = validDriveData();
    const err = new Drive(data).validateSync();
    expect(err?.errors.maxVolunteers).toBeDefined();
  });

  it('should require fundingGoal', () => {
    const { fundingGoal: _f, ...data } = validDriveData();
    const err = new Drive(data).validateSync();
    expect(err?.errors.fundingGoal).toBeDefined();
  });

  it('should require reportId', () => {
    const { reportId: _r, ...data } = validDriveData();
    const err = new Drive(data).validateSync();
    expect(err?.errors.reportId).toBeDefined();
  });

  it('should require requiredRoles', () => {
    const data = { ...validDriveData(), requiredRoles: [] };
    const drive = new Drive(data);
    const err = drive.validateSync();
    expect(err?.errors.requiredRoles).toBeDefined();
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
    const roles = [{ role: 'Cleaner', capacity: 1 }];
    const data = { ...validDriveData(), maxVolunteers: 0, requiredRoles: roles };
    const err = new Drive(data).validateSync();
    expect(err?.errors.maxVolunteers).toBeDefined();
  });

  it('should reject negative fundingGoal', () => {
    const data = { ...validDriveData(), fundingGoal: -100 };
    const err = new Drive(data).validateSync();
    expect(err?.errors.fundingGoal).toBeDefined();
  });

  // ── maxVolunteers must equal sum of role capacities ─────────────────────
  it('should reject maxVolunteers mismatch with sum of capacities', () => {
    const data = {
      ...validDriveData(),
      maxVolunteers: 50,
      requiredRoles: [
        { role: 'Cleaner', capacity: 20 },
        { role: 'Coordinator', capacity: 10 },
      ],
    };
    const drive = new Drive(data);
    const err = drive.validateSync();
    expect(err).toBeDefined();
    expect(err?.errors.requiredRoles?.message).toMatch(/maxVolunteers.*sum/);
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

  it('should default booked and waitlist to 0 in requiredRoles', () => {
    const drive = new Drive({
      ...validDriveData(),
      requiredRoles: [
        { role: 'Cleaner', capacity: 10 },
        { role: 'Coordinator', capacity: 5 },
      ],
      maxVolunteers: 15,
    });
    expect(drive.requiredRoles[0].booked).toBe(0);
    expect(drive.requiredRoles[0].waitlist).toBe(0);
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

  // ── DriveRole enum ──────────────────────────────────────────────────────
  it('should require valid DriveRole in requiredRoles', () => {
    const data = {
      ...validDriveData(),
      requiredRoles: [{ role: 'picker', capacity: 10 }],
      maxVolunteers: 10,
    };
    const err = new Drive(data).validateSync();
    expect(err?.errors['requiredRoles.0.role']).toBeDefined();
  });

  it('should accept valid DriveRole values', () => {
    for (const role of ['Cleaner', 'Coordinator', 'Photographer', 'LogisticsHelper'] as const) {
      const drive = new Drive({
        ...validDriveData(),
        requiredRoles: [{ role, capacity: 5 }],
        maxVolunteers: 5,
      });
      expect(drive.validateSync()).toBeUndefined();
    }
  });

  it('should require capacity >= 1 in requiredRoles', () => {
    const data = {
      ...validDriveData(),
      requiredRoles: [{ role: 'Cleaner', capacity: 0 }],
      maxVolunteers: 0,
    };
    const err = new Drive(data).validateSync();
    expect(err?.errors['requiredRoles.0.capacity']).toBeDefined();
  });

  // ── Overbooking prevention (booked <= capacity) ───────────────────────────
  it('should reject booked exceeding capacity for any role', () => {
    const data = {
      ...validDriveData(),
      maxVolunteers: 10,
      requiredRoles: [
        { role: 'Cleaner', capacity: 5, booked: 6, waitlist: 0 },
        { role: 'Coordinator', capacity: 5, booked: 0, waitlist: 0 },
      ],
    };
    const drive = new Drive(data);
    const err = drive.validateSync();
    expect(err).toBeDefined();
    expect(err?.errors.requiredRoles?.message).toMatch(/booked.*capacity/);
  });

  it('should accept booked equal to capacity (role full)', () => {
    const validData = {
      ...validDriveData(),
      maxVolunteers: 15,
      requiredRoles: [
        { role: 'Cleaner', capacity: 10, booked: 10, waitlist: 2 },
        { role: 'Coordinator', capacity: 5, booked: 3, waitlist: 0 },
      ],
    };
    const drive = new Drive(validData);
    expect(drive.validateSync()).toBeUndefined();
  });
});
