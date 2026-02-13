import { Schema, model, Document, Types } from 'mongoose';

// ── Constants ──────────────────────────────────────────────────────────────
export const EXPENSE_CATEGORIES = ['equipment', 'transport', 'refreshments', 'misc'] as const;
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

// ── Interface ──────────────────────────────────────────────────────────────
export interface IExpense extends Document {
  driveId: Types.ObjectId;
  category: ExpenseCategory;
  /** Amount in paise (smallest INR unit). */
  amount: number;
  /** URL to uploaded proof (receipt / invoice image). */
  proofUrl: string;
  /** Canonical verification flag. Only admin can set true. Public transparency shows only isVerified=true. */
  isVerified: boolean;
  /** Admin who verified this expense. */
  verifiedBy?: Types.ObjectId;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ─────────────────────────────────────────────────────────────────
const expenseSchema = new Schema<IExpense>(
  {
    driveId: {
      type: Schema.Types.ObjectId,
      ref: 'Drive',
      required: [true, 'Drive reference is required'],
    },
    category: {
      type: String,
      enum: {
        values: EXPENSE_CATEGORIES as unknown as string[],
        message: 'Category must be equipment, transport, refreshments, or misc',
      },
      required: [true, 'Category is required'],
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative'],
    },
    proofUrl: {
      type: String,
      required: [true, 'Proof URL is required'],
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    verifiedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

// ── Indexes ────────────────────────────────────────────────────────────────
expenseSchema.index({ driveId: 1 });
expenseSchema.index({ isVerified: 1 });

// ── Model ──────────────────────────────────────────────────────────────────
export const Expense = model<IExpense>('Expense', expenseSchema);
