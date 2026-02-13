import mongoose from 'mongoose';
import { ActivityLog } from '../../src/models/activityLog.model';

/** Factory: returns minimal valid ActivityLog data. */
function validActivityLogData(): Record<string, unknown> {
  return {
    entityType: 'Report' as const,
    entityId: new mongoose.Types.ObjectId(),
    action: 'report_created' as const,
    performedBy: new mongoose.Types.ObjectId(),
  };
}

describe('ActivityLog Model — Validation', () => {
  it('should validate a complete valid activity log', () => {
    const log = new ActivityLog(validActivityLogData());
    const err = log.validateSync();
    expect(err).toBeUndefined();
  });

  it('should require entityType', () => {
    const { entityType: _e, ...data } = validActivityLogData();
    const err = new ActivityLog(data).validateSync();
    expect(err?.errors.entityType).toBeDefined();
  });

  it('should require entityId', () => {
    const { entityId: _e, ...data } = validActivityLogData();
    const err = new ActivityLog(data).validateSync();
    expect(err?.errors.entityId).toBeDefined();
  });

  it('should require action', () => {
    const { action: _a, ...data } = validActivityLogData();
    const err = new ActivityLog(data).validateSync();
    expect(err?.errors.action).toBeDefined();
  });

  it('should require performedBy', () => {
    const { performedBy: _p, ...data } = validActivityLogData();
    const err = new ActivityLog(data).validateSync();
    expect(err?.errors.performedBy).toBeDefined();
  });

  it('should accept valid entity types', () => {
    for (const entityType of ['Report', 'Drive', 'Booking', 'Donation', 'Impact'] as const) {
      const log = new ActivityLog({
        ...validActivityLogData(),
        entityType,
        entityId: new mongoose.Types.ObjectId(),
      });
      expect(log.validateSync()).toBeUndefined();
    }
  });

  it('should accept valid actions', () => {
    const actions = [
      'report_created',
      'report_verified',
      'drive_created',
      'booking_created',
      'donation_completed',
      'impact_submitted',
      'report_merged',
    ] as const;
    for (const action of actions) {
      const log = new ActivityLog({
        ...validActivityLogData(),
        action,
        entityId: new mongoose.Types.ObjectId(),
      });
      expect(log.validateSync()).toBeUndefined();
    }
  });

  it('should default timestamp to now', () => {
    const log = new ActivityLog(validActivityLogData());
    expect(log.timestamp).toBeDefined();
  });
});
