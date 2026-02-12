/**
 * Operational error base class.
 *
 * Operational errors are expected failures (bad input, auth failures, etc.)
 * and are safe to expose to the client. The global error handler uses
 * `isOperational` to decide whether to return `err.message` or a generic
 * "Internal Server Error".
 */
export class OperationalError extends Error {
  readonly statusCode: number;
  readonly isOperational: boolean = true;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/** 400 — Bad Request (validation failures, malformed input). */
export class BadRequestError extends OperationalError {
  constructor(message = 'Bad Request') {
    super(message, 400);
  }
}

/** 401 — Unauthorized (invalid credentials, missing/bad token). */
export class UnauthorizedError extends OperationalError {
  constructor(message = 'Unauthorized') {
    super(message, 401);
  }
}

/** 403 — Forbidden (authenticated but insufficient permissions). */
export class ForbiddenError extends OperationalError {
  constructor(message = 'Forbidden') {
    super(message, 403);
  }
}

/** 404 — Not Found. */
export class NotFoundError extends OperationalError {
  constructor(message = 'Not Found') {
    super(message, 404);
  }
}

/** 409 — Conflict (duplicate resource). */
export class ConflictError extends OperationalError {
  constructor(message = 'Conflict') {
    super(message, 409);
  }
}
