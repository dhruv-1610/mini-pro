import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { registerSchema, loginSchema, refreshSchema } from '../validation/auth.validation';
import * as authService from '../services/auth.service';
import { authenticate } from '../middleware/authenticate';
import { authorize } from '../middleware/authorize';
import { User } from '../models/user.model';
import { BadRequestError } from '../utils/errors';
import { env } from '../config/env';

const router = Router();

// ── Auth-specific rate limiter (stricter than global) ──────────────────────
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'test' ? 1000 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: { message: 'Too many auth attempts, please try again later' } },
});

router.use(authLimiter);

// ── POST /auth/register ────────────────────────────────────────────────────

router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new BadRequestError(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    const { email, password, name } = parsed.data;
    const { verificationToken } = await authService.registerUser(email, password, name);

    res.status(201).json({
      message: 'Registration successful. Please verify your email.',
      verificationToken,
    });
  } catch (error) {
    next(error);
  }
});

// ── GET /auth/verify-email?token=xxx ───────────────────────────────────────

router.get('/verify-email', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.query.token;
    if (typeof token !== 'string' || !token) {
      throw new BadRequestError('Verification token is required');
    }

    await authService.verifyEmail(token);

    res.json({ message: 'Email verified successfully.' });
  } catch (error) {
    next(error);
  }
});

// ── POST /auth/login ───────────────────────────────────────────────────────

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new BadRequestError(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    const { email, password } = parsed.data;
    const tokens = await authService.loginUser(email, password);

    res.json(tokens);
  } catch (error) {
    next(error);
  }
});

// ── POST /auth/refresh ─────────────────────────────────────────────────────

router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = refreshSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new BadRequestError(parsed.error.issues[0]?.message ?? 'Invalid input');
    }

    const result = await authService.refreshAccessToken(parsed.data.refreshToken);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// ── GET /auth/me (protected) ───────────────────────────────────────────────

router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.user!.userId).select('-passwordHash');
    if (!user) {
      throw new BadRequestError('User not found');
    }

    res.json({ user });
  } catch (error) {
    next(error);
  }
});

// ── GET /auth/admin/stats (admin only) ─────────────────────────────────────

router.get(
  '/admin/stats',
  authenticate,
  authorize(['admin']),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const userCount = await User.countDocuments();
      res.json({ userCount });
    } catch (error) {
      next(error);
    }
  },
);

export default router;
