import { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { env } from '../config/env';

/**
 * Apply security middleware: Helmet (CSP, CORP, Referrer-Policy, Frameguard)
 * and strict CORS from ALLOWED_ORIGINS whitelist.
 */
export function applySecurity(app: Express): void {
  const allowedOrigins = env.ALLOWED_ORIGINS;

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", 'https://js.stripe.com'],
          frameSrc: ["'self'", 'https://js.stripe.com', 'https://hooks.stripe.com'],
          connectSrc: ["'self'", 'https://api.stripe.com', ...allowedOrigins],
          imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
          styleSrc: ["'self'", "'unsafe-inline'", 'https://js.stripe.com'],
          fontSrc: ["'self'", 'https://js.stripe.com'],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'self'"],
          ...(env.NODE_ENV === 'production' && { upgradeInsecureRequests: [] }),
        },
      },
      crossOriginResourcePolicy: { policy: 'same-site' },
      referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
      frameguard: { action: 'deny' },
    }),
  );

  app.use(
    cors({
      origin: (origin, callback) => {
        if (origin === undefined) {
          callback(null, true);
          return;
        }
        if (allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        callback(null, false);
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Stripe-Signature'],
    }),
  );
}
