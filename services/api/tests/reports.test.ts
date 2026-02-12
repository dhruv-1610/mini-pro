import request from 'supertest';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { app } from '../src/app';
import { User } from '../src/models/user.model';
import { Report } from '../src/models/report.model';

// ── Helpers ────────────────────────────────────────────────────────────────

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? './uploads-test';

/** Tiny 1×1 red PNG (68 bytes). */
const PIXEL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

/** Ensure test fixture files exist before the suite runs. */
function ensureFixtures(): { pngPath: string; txtPath: string } {
  const fixtureDir = path.resolve(__dirname, 'fixtures');
  if (!fs.existsSync(fixtureDir)) fs.mkdirSync(fixtureDir, { recursive: true });

  const pngPath = path.join(fixtureDir, 'test-photo.png');
  if (!fs.existsSync(pngPath)) fs.writeFileSync(pngPath, PIXEL_PNG);

  const txtPath = path.join(fixtureDir, 'malware.txt');
  if (!fs.existsSync(txtPath)) fs.writeFileSync(txtPath, 'not an image');

  return { pngPath, txtPath };
}

/**
 * Register + verify + login a user and return the access token.
 * Optionally promote to admin.
 */
async function getToken(role: 'user' | 'admin' = 'user'): Promise<string> {
  const email = role === 'admin' ? 'admin-report@example.com' : 'reporter@example.com';
  const regRes = await request(app)
    .post('/auth/register')
    .send({ email, password: 'StrongP@ss1', name: `${role} tester` });

  const { verificationToken } = regRes.body as { verificationToken: string };
  await request(app).get(`/auth/verify-email?token=${verificationToken}`);

  if (role === 'admin') {
    await User.updateOne({ email }, { role: 'admin' });
  }

  const loginRes = await request(app)
    .post('/auth/login')
    .send({ email, password: 'StrongP@ss1' });

  // For admin, re-login to get a token with the admin role
  if (role === 'admin') {
    const reLogin = await request(app)
      .post('/auth/login')
      .send({ email, password: 'StrongP@ss1' });
    return reLogin.body.accessToken as string;
  }

  return loginRes.body.accessToken as string;
}

// ── Suite ──────────────────────────────────────────────────────────────────

describe('Reports Module', () => {
  let userToken: string;
  let adminToken: string;
  let fixtures: { pngPath: string; txtPath: string };

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI!);
    fixtures = ensureFixtures();

    // Ensure upload dir exists
    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

    userToken = await getToken('user');
    adminToken = await getToken('admin');
  }, 30_000); // bcrypt 12 rounds × multiple registrations needs time

  afterEach(async () => {
    await Report.deleteMany({});
  });

  afterAll(async () => {
    // Clean up fixture files
    if (fs.existsSync(path.resolve(__dirname, 'fixtures'))) {
      fs.rmSync(path.resolve(__dirname, 'fixtures'), { recursive: true, force: true });
    }
    // Clean up uploaded files
    if (fs.existsSync(UPLOAD_DIR)) {
      fs.rmSync(UPLOAD_DIR, { recursive: true, force: true });
    }
    await User.deleteMany({});
    await Report.deleteMany({});
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /api/reports — Submit Report
  // ═══════════════════════════════════════════════════════════════════════════

  describe('POST /api/reports', () => {
    it('should submit a report with photo and return 201', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .field('lat', '12.9716')
        .field('lng', '77.5946')
        .field('description', 'Trash pile near the park entrance')
        .field('severity', 'medium')
        .attach('photo', fixtures.pngPath);

      expect(res.status).toBe(201);
      expect(res.body.report).toHaveProperty('_id');
      expect(res.body.report.status).toBe('reported');
      expect(res.body.report.location.type).toBe('Point');
      expect(res.body.report.location.coordinates).toEqual([77.5946, 12.9716]);
      expect(res.body.report.photoUrls.length).toBeGreaterThanOrEqual(1);
    });

    it('should detect a duplicate within 50 meters with same severity', async () => {
      // First report
      await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .field('lat', '12.9716')
        .field('lng', '77.5946')
        .field('description', 'Original report')
        .field('severity', 'high')
        .attach('photo', fixtures.pngPath);

      // Second report — ~10 m away, same severity
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .field('lat', '12.97165')
        .field('lng', '77.59465')
        .field('description', 'Near-duplicate')
        .field('severity', 'high')
        .attach('photo', fixtures.pngPath);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('duplicate', true);
      expect(res.body).toHaveProperty('existingReportId');
    });

    it('should NOT flag as duplicate if severity differs', async () => {
      // First report — severity low
      await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .field('lat', '12.9716')
        .field('lng', '77.5946')
        .field('description', 'Low severity')
        .field('severity', 'low')
        .attach('photo', fixtures.pngPath);

      // Second report — same location, severity high
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .field('lat', '12.97161')
        .field('lng', '77.59461')
        .field('description', 'High severity')
        .field('severity', 'high')
        .attach('photo', fixtures.pngPath);

      expect(res.status).toBe(201);
      expect(res.body.report).toHaveProperty('_id');
    });

    it('should reject an invalid severity with 400', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .field('lat', '12.9716')
        .field('lng', '77.5946')
        .field('description', 'Bad severity')
        .field('severity', 'critical')
        .attach('photo', fixtures.pngPath);

      expect(res.status).toBe(400);
    });

    it('should reject a non-image file with 400', async () => {
      const res = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .field('lat', '12.9716')
        .field('lng', '77.5946')
        .field('description', 'Text file upload')
        .field('severity', 'low')
        .attach('photo', fixtures.txtPath);

      expect(res.status).toBe(400);
    });

    it('should require authentication', async () => {
      // Send JSON (not multipart) — avoids stream reset on early rejection
      const res = await request(app)
        .post('/api/reports')
        .send({ lat: 12.9716, lng: 77.5946, description: 'No auth', severity: 'low' });

      expect(res.status).toBe(401);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PATCH /api/reports/:id/verify — Admin verification
  // ═══════════════════════════════════════════════════════════════════════════

  describe('PATCH /api/reports/:id/verify', () => {
    it('should allow admin to verify a report', async () => {
      // Create a report
      const createRes = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .field('lat', '13.0')
        .field('lng', '77.0')
        .field('description', 'Needs verification')
        .field('severity', 'medium')
        .attach('photo', fixtures.pngPath);

      const reportId = createRes.body.report._id as string;

      // Admin verifies
      const res = await request(app)
        .patch(`/api/reports/${reportId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.report.status).toBe('verified');
    });

    it('should deny non-admin from verifying', async () => {
      const createRes = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .field('lat', '13.0')
        .field('lng', '77.0')
        .field('description', 'User tries to verify')
        .field('severity', 'low')
        .attach('photo', fixtures.pngPath);

      const reportId = createRes.body.report._id as string;

      const res = await request(app)
        .patch(`/api/reports/${reportId}/verify`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PATCH /api/reports/:id/status — Status lifecycle transitions
  // ═══════════════════════════════════════════════════════════════════════════

  describe('PATCH /api/reports/:id/status', () => {
    it('should transition verified -> drive_created', async () => {
      // Create + verify
      const createRes = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .field('lat', '13.0')
        .field('lng', '77.0')
        .field('description', 'For drive')
        .field('severity', 'high')
        .attach('photo', fixtures.pngPath);

      const reportId = createRes.body.report._id as string;
      await request(app)
        .patch(`/api/reports/${reportId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Transition to drive_created
      const res = await request(app)
        .patch(`/api/reports/${reportId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'drive_created' });

      expect(res.status).toBe(200);
      expect(res.body.report.status).toBe('drive_created');
    });

    it('should reject an invalid transition (reported -> cleaned)', async () => {
      const createRes = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .field('lat', '13.0')
        .field('lng', '77.0')
        .field('description', 'Bad transition')
        .field('severity', 'low')
        .attach('photo', fixtures.pngPath);

      const reportId = createRes.body.report._id as string;

      const res = await request(app)
        .patch(`/api/reports/${reportId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'cleaned' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/transition/i);
    });
  });
});
