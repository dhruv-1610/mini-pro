import request from 'supertest';
import mongoose from 'mongoose';
import { app } from '../src/app';
import { User } from '../src/models/user.model';

// ── Test data ──────────────────────────────────────────────────────────────

const TEST_USER = {
  email: 'volunteer@example.com',
  password: 'StrongP@ss123',
  name: 'Test Volunteer',
};

// ── Helpers ────────────────────────────────────────────────────────────────

/**
 * Register a user, verify their email, then login.
 * Returns both tokens for downstream test use.
 */
async function createVerifiedUser(
  email = TEST_USER.email,
  password = TEST_USER.password,
  name = TEST_USER.name,
): Promise<{ accessToken: string; refreshToken: string }> {
  // Register
  const regRes = await request(app)
    .post('/auth/register')
    .send({ email, password, name });

  // Verify email
  const { verificationToken } = regRes.body as { verificationToken: string };
  await request(app).get(`/auth/verify-email?token=${verificationToken}`);

  // Login
  const loginRes = await request(app)
    .post('/auth/login')
    .send({ email, password });

  return {
    accessToken: loginRes.body.accessToken as string,
    refreshToken: loginRes.body.refreshToken as string,
  };
}

// ── Suite ──────────────────────────────────────────────────────────────────

describe('Auth System', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI!);
  });

  afterEach(async () => {
    // Clean users between tests for isolation
    const collections = mongoose.connection.collections;
    for (const key of Object.keys(collections)) {
      await collections[key].deleteMany({});
    }
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /auth/register
  // ═══════════════════════════════════════════════════════════════════════════

  describe('POST /auth/register', () => {
    it('should register a new user and return 201 with verification token', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send(TEST_USER);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('verificationToken');
      expect(typeof res.body.verificationToken).toBe('string');
    });

    it('should reject duplicate email with 409', async () => {
      await request(app).post('/auth/register').send(TEST_USER);
      const res = await request(app).post('/auth/register').send(TEST_USER);

      expect(res.status).toBe(409);
      expect(res.body.error.message).toMatch(/already/i);
    });

    it('should reject missing email with 400', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ password: 'StrongP@ss123', name: 'No Email' });

      expect(res.status).toBe(400);
    });

    it('should reject password shorter than 8 chars with 400', async () => {
      const res = await request(app)
        .post('/auth/register')
        .send({ email: 'weak@example.com', password: 'short', name: 'Weak' });

      expect(res.status).toBe(400);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /auth/login
  // ═══════════════════════════════════════════════════════════════════════════

  describe('POST /auth/login', () => {
    it('should block login for unverified email with 403', async () => {
      // Register WITHOUT verifying
      await request(app).post('/auth/register').send(TEST_USER);

      const res = await request(app)
        .post('/auth/login')
        .send({ email: TEST_USER.email, password: TEST_USER.password });

      expect(res.status).toBe(403);
      expect(res.body.error.message).toMatch(/verified/i);
    });

    it('should login successfully after email verification and return tokens', async () => {
      // Register
      const regRes = await request(app).post('/auth/register').send(TEST_USER);
      const { verificationToken } = regRes.body as { verificationToken: string };

      // Verify email
      const verifyRes = await request(app).get(`/auth/verify-email?token=${verificationToken}`);
      expect(verifyRes.status).toBe(200);

      // Login
      const res = await request(app)
        .post('/auth/login')
        .send({ email: TEST_USER.email, password: TEST_USER.password });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body).toHaveProperty('refreshToken');
      expect(typeof res.body.accessToken).toBe('string');
      expect(typeof res.body.refreshToken).toBe('string');
    });

    it('should reject invalid password with 401', async () => {
      await createVerifiedUser();

      const res = await request(app)
        .post('/auth/login')
        .send({ email: TEST_USER.email, password: 'WrongPassword999!' });

      expect(res.status).toBe(401);
    });

    it('should reject non-existent email with 401', async () => {
      const res = await request(app)
        .post('/auth/login')
        .send({ email: 'ghost@example.com', password: 'SomePass123!' });

      expect(res.status).toBe(401);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /auth/refresh
  // ═══════════════════════════════════════════════════════════════════════════

  describe('POST /auth/refresh', () => {
    it('should return a new access token with valid refresh token', async () => {
      const { refreshToken } = await createVerifiedUser();

      const res = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
      expect(typeof res.body.accessToken).toBe('string');
    });

    it('should reject invalid refresh token with 401', async () => {
      const res = await request(app)
        .post('/auth/refresh')
        .send({ refreshToken: 'totally-invalid-token' });

      expect(res.status).toBe(401);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GET /auth/me  — JWT protected route
  // ═══════════════════════════════════════════════════════════════════════════

  describe('GET /auth/me', () => {
    it('should return user profile with valid access token', async () => {
      const { accessToken } = await createVerifiedUser();

      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user).toHaveProperty('email', TEST_USER.email);
      expect(res.body.user).toHaveProperty('role');
      expect(res.body.user).toHaveProperty('profile');
      // Must never leak the password hash
      expect(res.body.user).not.toHaveProperty('passwordHash');
    });

    it('should reject request without token with 401', async () => {
      const res = await request(app).get('/auth/me');
      expect(res.status).toBe(401);
    });

    it('should reject request with invalid token with 401', async () => {
      const res = await request(app)
        .get('/auth/me')
        .set('Authorization', 'Bearer this.is.bogus');

      expect(res.status).toBe(401);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Role-based authorization
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Role-based authorization', () => {
    it('should deny non-admin user access to admin route with 403', async () => {
      const { accessToken } = await createVerifiedUser();

      const res = await request(app)
        .get('/auth/admin/stats')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(res.status).toBe(403);
    });

    it('should allow admin access to admin route', async () => {
      // Create a verified user, then promote to admin
      await createVerifiedUser('admin@example.com', 'AdminP@ss123', 'Admin User');
      await User.updateOne({ email: 'admin@example.com' }, { role: 'admin' });

      // Re-login to get a token that includes the admin role
      const loginRes = await request(app)
        .post('/auth/login')
        .send({ email: 'admin@example.com', password: 'AdminP@ss123' });

      const res = await request(app)
        .get('/auth/admin/stats')
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('userCount');
    });
  });
});
