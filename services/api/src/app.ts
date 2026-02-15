import path from 'path';
import express from 'express';
import mongoSanitize from 'express-mongo-sanitize';
import { applySecurity } from './middleware/security';
import { env } from './config/env';

/** Sanitize only req.body to avoid Mongo injection; skip req.query (Express 5 getter). */
const sanitizeBodyOnly = (req: express.Request, _res: express.Response, next: express.NextFunction): void => {
  if (req.body && typeof req.body === 'object') {
    req.body = mongoSanitize.sanitize(req.body);
  }
  next();
};
import { requestLogger } from './middleware/requestLogger';
import { rateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';
import stripeWebhookRouter from './routes/webhooks';

/**
 * Express application instance.
 *
 * Exported separately from the server so that tests (Supertest)
 * can import the app without starting the HTTP listener.
 */
const app = express();

// ── Security ────────────────────────────────────────────────────────────────
applySecurity(app);

// ── Stripe webhook (raw body required for signature verification) ───────────
app.use(
  '/api/webhooks/stripe',
  express.raw({ type: 'application/json' }),
  stripeWebhookRouter,
);

// ── Serve uploaded files (report photos, etc.) ──────────────────────────────
app.use('/uploads', express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)));

// ── Body parsing ────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Input sanitization: prevent Mongo injection ($ and . in body) ───────────
app.use(sanitizeBodyOnly);

// ── Request logging ─────────────────────────────────────────────────────────
app.use(requestLogger);

// ── Global rate limiting (stricter limits on /auth, donate, reports in routers) ─
app.use(rateLimiter);

// ── Routes ──────────────────────────────────────────────────────────────────
app.use(routes);

// ── Global error handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

export { app };
