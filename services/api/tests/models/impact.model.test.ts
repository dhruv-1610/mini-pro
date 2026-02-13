import mongoose from 'mongoose';
import { Impact } from '../../src/models/impact.model';

/** Factory: returns minimal valid Impact data. */
function validImpactData(): Record<string, unknown> {
  return {
    driveId: new mongoose.Types.ObjectId(),
    wasteCollected: 50, // kg
    areaCleaned: 200, // sq m
    workHours: 8,
  };
}

describe('Impact Model — Validation', () => {
  it('should validate a complete valid impact record', () => {
    const impact = new Impact(validImpactData());
    const err = impact.validateSync();
    expect(err).toBeUndefined();
  });

  it('should require driveId', () => {
    const { driveId: _d, ...data } = validImpactData();
    const err = new Impact(data).validateSync();
    expect(err?.errors.driveId).toBeDefined();
  });

  it('should require wasteCollected', () => {
    const { wasteCollected: _w, ...data } = validImpactData();
    const err = new Impact(data).validateSync();
    expect(err?.errors.wasteCollected).toBeDefined();
  });

  it('should require areaCleaned', () => {
    const { areaCleaned: _a, ...data } = validImpactData();
    const err = new Impact(data).validateSync();
    expect(err?.errors.areaCleaned).toBeDefined();
  });

  it('should require workHours', () => {
    const { workHours: _h, ...data } = validImpactData();
    const err = new Impact(data).validateSync();
    expect(err?.errors.workHours).toBeDefined();
  });

  it('should reject negative wasteCollected', () => {
    const data = { ...validImpactData(), wasteCollected: -1 };
    const err = new Impact(data).validateSync();
    expect(err?.errors.wasteCollected).toBeDefined();
  });

  it('should reject negative areaCleaned', () => {
    const data = { ...validImpactData(), areaCleaned: -10 };
    const err = new Impact(data).validateSync();
    expect(err?.errors.areaCleaned).toBeDefined();
  });

  it('should reject negative workHours', () => {
    const data = { ...validImpactData(), workHours: -1 };
    const err = new Impact(data).validateSync();
    expect(err?.errors.workHours).toBeDefined();
  });

  it('should default adminOverride to false', () => {
    const impact = new Impact(validImpactData());
    expect(impact.adminOverride).toBe(false);
  });
});
