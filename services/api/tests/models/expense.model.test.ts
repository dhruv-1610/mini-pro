import mongoose from 'mongoose';
import { Expense } from '../../src/models/expense.model';

/** Factory: returns minimal valid Expense data. */
function validExpenseData(): Record<string, unknown> {
  return {
    driveId: new mongoose.Types.ObjectId(),
    category: 'equipment' as const,
    amount: 1500, // in paise
    proofUrl: 'https://cdn.example.com/receipts/receipt-001.jpg',
  };
}

describe('Expense Model — Validation', () => {
  // ── Happy path ──────────────────────────────────────────────────────────
  it('should validate a complete valid expense', () => {
    const expense = new Expense(validExpenseData());
    const err = expense.validateSync();
    expect(err).toBeUndefined();
  });

  // ── Required fields ─────────────────────────────────────────────────────
  it('should require driveId', () => {
    const { driveId: _d, ...data } = validExpenseData();
    const err = new Expense(data).validateSync();
    expect(err?.errors.driveId).toBeDefined();
  });

  it('should require category', () => {
    const { category: _c, ...data } = validExpenseData();
    const err = new Expense(data).validateSync();
    expect(err?.errors.category).toBeDefined();
  });

  it('should require amount', () => {
    const { amount: _a, ...data } = validExpenseData();
    const err = new Expense(data).validateSync();
    expect(err?.errors.amount).toBeDefined();
  });

  it('should require proofUrl', () => {
    const { proofUrl: _p, ...data } = validExpenseData();
    const err = new Expense(data).validateSync();
    expect(err?.errors.proofUrl).toBeDefined();
  });

  // ── isVerified ──────────────────────────────────────────────────────────
  it('should default isVerified to false', () => {
    const expense = new Expense(validExpenseData());
    expect(expense.isVerified).toBe(false);
  });

  it('should accept isVerified true', () => {
    const expense = new Expense({
      ...validExpenseData(),
      isVerified: true,
      verifiedBy: new mongoose.Types.ObjectId(),
      verifiedAt: new Date(),
    });
    expect(expense.validateSync()).toBeUndefined();
    expect(expense.isVerified).toBe(true);
  });

  // ── Category enum ──────────────────────────────────────────────────────
  it('should accept valid category values', () => {
    for (const category of ['equipment', 'transport', 'refreshments', 'misc'] as const) {
      const expense = new Expense({ ...validExpenseData(), category });
      expect(expense.validateSync()).toBeUndefined();
    }
  });

  it('should reject an invalid category', () => {
    const data = { ...validExpenseData(), category: 'salary' };
    const err = new Expense(data).validateSync();
    expect(err?.errors.category).toBeDefined();
  });

  // ── Amount constraints ──────────────────────────────────────────────────
  it('should accept amount 0', () => {
    const data = { ...validExpenseData(), amount: 0 };
    const expense = new Expense(data);
    expect(expense.validateSync()).toBeUndefined();
  });

  it('should reject negative amount', () => {
    const data = { ...validExpenseData(), amount: -100 };
    const err = new Expense(data).validateSync();
    expect(err?.errors.amount).toBeDefined();
  });

  // ── Optional verification fields ────────────────────────────────────────
  it('should accept verifiedBy and verifiedAt', () => {
    const now = new Date();
    const expense = new Expense({
      ...validExpenseData(),
      verifiedBy: new mongoose.Types.ObjectId(),
      verifiedAt: now,
    });
    expect(expense.validateSync()).toBeUndefined();
    expect(expense.verifiedAt).toEqual(now);
  });

  it('should default verifiedBy and verifiedAt to undefined', () => {
    const expense = new Expense(validExpenseData());
    expect(expense.verifiedBy).toBeUndefined();
    expect(expense.verifiedAt).toBeUndefined();
  });
});
