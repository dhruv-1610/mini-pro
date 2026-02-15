/**
 * Augment the Express Request interface. Populated by authenticate (user)
 * and requestLogger (requestId).
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
      };
      requestId?: string;
    }
  }
}

export {};
