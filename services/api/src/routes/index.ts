import { Router } from 'express';
import healthRouter from './health';
import authRouter from './auth';
import reportsRouter from './reports';
import drivesRouter from './drives';
import usersRouter from './users';
import transparencyRouter from './transparency';
import expensesRouter from './expenses';
import mapRouter from './map';

const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/api/reports', reportsRouter);
router.use('/api/drives', drivesRouter);
router.use('/api/users', usersRouter);
router.use('/api/transparency', transparencyRouter);
router.use('/api/expenses', expensesRouter);
router.use('/api/map', mapRouter);

export default router;
