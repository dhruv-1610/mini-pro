import express from 'express';
import { applySecurity } from './middleware/security';
import { requestLogger } from './middleware/requestLogger';
import { rateLimiter } from './middleware/rateLimiter';
import { errorHandler } from './middleware/errorHandler';
import routes from './routes';

/**
 * Express application instance.
 *
 * Exported separately from the server so that tests (Supertest)
 * can import the app without starting the HTTP listener.
 */
const app = express();

// ── Security ────────────────────────────────────────────────────────────────
applySecurity(app);

// ── Body parsing ────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Request logging ─────────────────────────────────────────────────────────
app.use(requestLogger);

// ── Rate limiting ───────────────────────────────────────────────────────────
app.use(rateLimiter);

// ── Routes ──────────────────────────────────────────────────────────────────
app.use(routes);

// ── Global error handler (must be last) ─────────────────────────────────────
app.use(errorHandler);

export { app };
