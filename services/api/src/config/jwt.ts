import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from './env';

// ── Payload types ──────────────────────────────────────────────────────────

/** Claims embedded in the short-lived access token. */
export interface AccessTokenPayload {
  userId: string;
  role: string;
}

/** Claims embedded in the long-lived refresh token. */
export interface RefreshTokenPayload {
  userId: string;
}

/** Claims embedded in the email-verification token. */
export interface VerificationTokenPayload {
  userId: string;
  purpose: 'email-verification';
}

// ── Signing ────────────────────────────────────────────────────────────────

/** Sign a short-lived access token (default 15 min). */
export function signAccessToken(payload: AccessTokenPayload): string {
  const opts: SignOptions = { expiresIn: env.JWT_EXPIRES_IN } as SignOptions;
  return jwt.sign(payload, env.JWT_SECRET, opts);
}

/** Sign a long-lived refresh token (default 7 days). */
export function signRefreshToken(payload: RefreshTokenPayload): string {
  const opts: SignOptions = { expiresIn: env.JWT_REFRESH_EXPIRES_IN } as SignOptions;
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, opts);
}

/** Sign a one-time email verification token (24 h). */
export function signVerificationToken(userId: string): string {
  const payload: VerificationTokenPayload = { userId, purpose: 'email-verification' };
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '24h' });
}

// ── Verification ───────────────────────────────────────────────────────────

/** Verify and decode an access token. Throws on invalid/expired. */
export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_SECRET) as AccessTokenPayload;
}

/** Verify and decode a refresh token. Throws on invalid/expired. */
export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}

/** Verify and decode an email verification token. Throws on invalid/expired. */
export function verifyVerificationToken(token: string): VerificationTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET) as VerificationTokenPayload;
  if (decoded.purpose !== 'email-verification') {
    throw new Error('Token is not an email-verification token');
  }
  return decoded;
}
