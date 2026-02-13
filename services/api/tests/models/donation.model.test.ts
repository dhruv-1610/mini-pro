import mongoose from 'mongoose';
import { Donation, DONATION_MIN_AMOUNT_PAISE } from '../../src/models/donation.model';

/** Factory: returns minimal valid Donation data. */
function validDonationData(): Record<string, unknown> {
  return {
    userId: new mongoose.Types.ObjectId(),
    driveId: new mongoose.Types.ObjectId(),
    amount: 2500, // in paise (₹25.00), above min ₹10
    stripePaymentId: 'pi_3abc123def456',
  };
}

describe('Donation Model — Validation', () => {
  // ── Happy path ──────────────────────────────────────────────────────────
  it('should validate a complete valid donation', () => {
    const donation = new Donation(validDonationData());
    const err = donation.validateSync();
    expect(err).toBeUndefined();
  });

  // ── Required fields ─────────────────────────────────────────────────────
  it('should require userId', () => {
    const { userId: _u, ...data } = validDonationData();
    const err = new Donation(data).validateSync();
    expect(err?.errors.userId).toBeDefined();
  });

  it('should require driveId', () => {
    const { driveId: _d, ...data } = validDonationData();
    const err = new Donation(data).validateSync();
    expect(err?.errors.driveId).toBeDefined();
  });

  it('should require amount', () => {
    const { amount: _a, ...data } = validDonationData();
    const err = new Donation(data).validateSync();
    expect(err?.errors.amount).toBeDefined();
  });

  it('should require stripePaymentId', () => {
    const { stripePaymentId: _s, ...data } = validDonationData();
    const err = new Donation(data).validateSync();
    expect(err?.errors.stripePaymentId).toBeDefined();
  });

  // ── Amount constraints (min ₹10 = 1000 paise) ───────────────────────────
  it('should reject amount less than ₹10 (1000 paise)', () => {
    const data = { ...validDonationData(), amount: 999 };
    const err = new Donation(data).validateSync();
    expect(err?.errors.amount).toBeDefined();
  });

  it('should accept amount exactly ₹10 (1000 paise)', () => {
    const data = { ...validDonationData(), amount: DONATION_MIN_AMOUNT_PAISE };
    const donation = new Donation(data);
    expect(donation.validateSync()).toBeUndefined();
  });

  it('should reject negative amount', () => {
    const data = { ...validDonationData(), amount: -500 };
    const err = new Donation(data).validateSync();
    expect(err?.errors.amount).toBeDefined();
  });

  it('should reject zero amount', () => {
    const data = { ...validDonationData(), amount: 0 };
    const err = new Donation(data).validateSync();
    expect(err?.errors.amount).toBeDefined();
  });

  // ── Status enum (pending, completed, refunded) ───────────────────────────
  it('should default status to "pending"', () => {
    const donation = new Donation(validDonationData());
    expect(donation.status).toBe('pending');
  });

  it('should accept valid status values', () => {
    for (const status of ['pending', 'completed', 'refunded'] as const) {
      const donation = new Donation({ ...validDonationData(), status });
      expect(donation.validateSync()).toBeUndefined();
    }
  });

  it('should reject an invalid status', () => {
    const data = { ...validDonationData(), status: 'failed' };
    const err = new Donation(data).validateSync();
    expect(err?.errors.status).toBeDefined();
  });

  // ── Optional fields ─────────────────────────────────────────────────────
  it('should accept a receiptUrl', () => {
    const data = { ...validDonationData(), receiptUrl: 'https://stripe.com/receipt/xyz' };
    const donation = new Donation(data);
    expect(donation.validateSync()).toBeUndefined();
    expect(donation.receiptUrl).toBe('https://stripe.com/receipt/xyz');
  });
});
