import { Router } from 'express';
import healthRouter from './health';
import authRouter from './auth';
import reportsRouter from './reports';

const router = Router();

router.use('/health', healthRouter);
router.use('/auth', authRouter);
router.use('/api/reports', reportsRouter);

export default router;
