/**
 * Augment the Express Request interface to include authenticated user data.
 * Populated by the `authenticate` middleware.
 */
declare namespace Express {
  interface Request {
    user?: {
      userId: string;
      role: string;
    };
  }
}
