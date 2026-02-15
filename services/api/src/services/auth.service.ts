import bcrypt from 'bcrypt';
import { User, IUser } from '../models/user.model';
import {
  signAccessToken,
  signRefreshToken,
  signVerificationToken,
  verifyRefreshToken,
  verifyVerificationToken,
} from '../config/jwt';
import {
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
} from '../utils/errors';
import { sendVerificationEmail } from './email.service';

/** bcrypt cost factor — 12 rounds as required by specification. */
const BCRYPT_ROUNDS = 12;

// ── Register ───────────────────────────────────────────────────────────────

export interface RegisterResult {
  user: IUser;
  verificationToken: string;
}

/**
 * Register a new user.
 *
 * 1. Check for duplicate email.
 * 2. Hash password with bcrypt (12 rounds).
 * 3. Create user with emailVerified: false.
 * 4. Generate email-verification token.
 *
 * @throws ConflictError if email already exists.
 */
export async function registerUser(
  email: string,
  password: string,
  name: string,
): Promise<RegisterResult> {
  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    throw new ConflictError('Email already registered');
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  const user = await User.create({
    email,
    passwordHash,
    role: 'user',
    profile: { name },
    emailVerified: false,
  });

  const verificationToken = signVerificationToken(user._id.toString());

  try {
    await sendVerificationEmail(user.email, user.profile.name, verificationToken);
  } catch (err) {
    // User is already created; don't fail registration. Log so admin can see why email failed.
    const logger = (await import('../config/logger')).logger;
    logger.warn('Verification email could not be sent (registration still succeeded)', {
      email: user.email,
      error: err instanceof Error ? err.message : String(err),
    });
  }

  return { user, verificationToken };
}

// ── Verify email ───────────────────────────────────────────────────────────

/**
 * Verify a user's email using the token from registration.
 *
 * @throws BadRequestError if the token is invalid or the user doesn't exist.
 */
export async function verifyEmail(token: string): Promise<void> {
  const { userId } = verifyVerificationToken(token);

  const user = await User.findById(userId);
  if (!user) {
    throw new BadRequestError('Invalid verification token');
  }

  user.emailVerified = true;
  await user.save();
}

// ── Login ──────────────────────────────────────────────────────────────────

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
}

/**
 * Authenticate a user by email + password.
 *
 * 1. Find user by email.
 * 2. Block unverified accounts.
 * 3. Compare password hash.
 * 4. Issue access + refresh tokens.
 *
 * @throws UnauthorizedError on bad credentials.
 * @throws ForbiddenError if email is not verified.
 */
export async function loginUser(
  email: string,
  password: string,
): Promise<LoginResult> {
  const user = await User.findOne({ email: email.toLowerCase().trim() });
  if (!user) {
    throw new UnauthorizedError('Invalid credentials');
  }

  if (!user.emailVerified) {
    throw new ForbiddenError('Email not verified. Please verify your email before logging in.');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new UnauthorizedError('Invalid credentials');
  }

  const accessToken = signAccessToken({
    userId: user._id.toString(),
    role: user.role,
  });

  const refreshToken = signRefreshToken({
    userId: user._id.toString(),
  });

  return { accessToken, refreshToken };
}

// ── Refresh ────────────────────────────────────────────────────────────────

/**
 * Issue a new access token from a valid refresh token.
 *
 * @throws UnauthorizedError if the refresh token is invalid or user not found.
 */
export async function refreshAccessToken(token: string): Promise<{ accessToken: string }> {
  let userId: string;

  try {
    const decoded = verifyRefreshToken(token);
    userId = decoded.userId;
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new UnauthorizedError('User not found');
  }

  const accessToken = signAccessToken({
    userId: user._id.toString(),
    role: user.role,
  });

  return { accessToken };
}
