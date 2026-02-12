import mongoose from 'mongoose';
import { Expense } from '../../src/models/expense.model';

/** Factory: returns minimal valid Expense data. */
function validExpenseData(): Record<string, unknown> {
  return {
    driveId: new mongoose.Types.ObjectId(),
    category: 'equipment' as const,
    amount: 1500, // in cents ($15.00)
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
    const { driveId: _, ...data } = validExpenseData();
    const err = new Expense(data).validateSync();
    expect(err?.errors.driveId).toBeDefined();
  });

  it('should require category', () => {
    const { category: _, ...data } = validExpenseData();
    const err = new Expense(data).validateSync();
    expect(err?.errors.category).toBeDefined();
  });

  it('should require amount', () => {
    const { amount: _, ...data } = validExpenseData();
    const err = new Expense(data).validateSync();
    expect(err?.errors.amount).toBeDefined();
  });

  it('should require proofUrl', () => {
    const { proofUrl: _, ...data } = validExpenseData();
    const err = new Expense(data).validateSync();
    expect(err?.errors.proofUrl).toBeDefined();
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
  it('should reject amount less than 1 (cent)', () => {
    const data = { ...validExpenseData(), amount: 0 };
    const err = new Expense(data).validateSync();
    expect(err?.errors.amount).toBeDefined();
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
