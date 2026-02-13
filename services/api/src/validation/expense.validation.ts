import { z } from 'zod';
import { EXPENSE_CATEGORIES } from '../models/expense.model';

/** POST /api/drives/:driveId/expenses request body (multipart). */
export const createExpenseSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES, {
    message: 'Category must be equipment, transport, refreshments, or misc',
  }),
  amount: z.coerce.number().min(0, 'Amount cannot be negative'),
});
