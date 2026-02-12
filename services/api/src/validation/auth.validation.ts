import { z } from 'zod';

/** POST /auth/register request body. */
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').trim(),
});

/** POST /auth/login request body. */
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

/** POST /auth/refresh request body. */
export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});
