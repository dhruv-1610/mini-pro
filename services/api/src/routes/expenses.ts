import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import * as expenseService from '../services/expense.service';

const router = Router();

/** PATCH /api/expenses/:expenseId/verify — Admin marks expense as verified. */
router.patch(
  '/:expenseId/verify',
  authenticate,
  authorize(['admin']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const expenseId = Array.isArray(req.params.expenseId)
        ? req.params.expenseId[0]
        : req.params.expenseId;

      const expense = await expenseService.verifyExpense(expenseId, req.user!.userId);
      res.json({ expense });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
