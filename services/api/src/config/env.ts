import { z } from 'zod';

/**
 * Parse comma-separated ALLOWED_ORIGINS into trimmed non-empty array.
 * Required at startup for strict CORS.
 */
function parseAllowedOrigins(val: string): string[] {
  return val
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

/**
 * Zod schema for required environment variables.
 * Validated at boot — app crashes if any required variable is missing or invalid.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  API_HOST: z.string().min(1).default('0.0.0.0'),

  MONGO_URI: z.string().refine(
    (val) => val.startsWith('mongodb://') || val.startsWith('mongodb+srv://'),
    { message: 'MONGO_URI must start with mongodb:// or mongodb+srv://' },
  ),

  JWT_SECRET: z.string().min(8, 'JWT_SECRET must be at least 8 characters'),
  JWT_EXPIRES_IN: z.string().default('15m'),

  JWT_REFRESH_SECRET: z.string().min(8, 'JWT_REFRESH_SECRET must be at least 8 characters'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET is required'),

  ALLOWED_ORIGINS: z
    .string()
    .min(1, 'ALLOWED_ORIGINS is required (comma-separated list of origins)')
    .transform(parseAllowedOrigins),

  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),

  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.coerce.number().int().positive().default(5_242_880),

  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

/** Inferred TypeScript type for validated environment. */
export type Env = z.infer<typeof envSchema>;

/**
 * Parse and validate process.env against the schema.
 * Exits the process with code 1 on validation failure.
 */
function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    // eslint-disable-next-line no-console
    console.error('Invalid environment variables:', JSON.stringify(result.error.format(), null, 2));
    process.exit(1);
  }

  return result.data;
}

/** Validated environment variables — safe to use throughout the application. */
export const env: Env = validateEnv();
