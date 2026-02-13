import request from 'supertest';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { app } from '../src/app';
import { User } from '../src/models/user.model';
import { Report } from '../src/models/report.model';
import { Drive } from '../src/models/drive.model';

// ── Helpers ────────────────────────────────────────────────────────────────

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? './uploads-test';

const PIXEL_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

function ensureFixtures(): { pngPath: string } {
  const fixtureDir = path.resolve(__dirname, 'fixtures');
  if (!fs.existsSync(fixtureDir)) fs.mkdirSync(fixtureDir, { recursive: true });
  const pngPath = path.join(fixtureDir, 'test-photo.png');
  if (!fs.existsSync(pngPath)) fs.writeFileSync(pngPath, PIXEL_PNG);
  return { pngPath };
}

async function getToken(role: 'user' | 'admin' = 'user'): Promise<string> {
  const email = role === 'admin' ? 'admin-drive@example.com' : 'user-drive@example.com';
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

  if (role === 'admin') {
    const reLogin = await request(app)
      .post('/auth/login')
      .send({ email, password: 'StrongP@ss1' });
    return reLogin.body.accessToken as string;
  }

  return loginRes.body.accessToken as string;
}

/** Future date (7 days from now) for drive creation. */
function futureDate(): string {
  return new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]!;
}

// ── Suite ──────────────────────────────────────────────────────────────────

describe('Drive Management', () => {
  let userToken: string;
  let adminToken: string;
  let fixtures: { pngPath: string };
  let verifiedReportId: string;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI!);
    fixtures = ensureFixtures();

    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

    userToken = await getToken('user');
    adminToken = await getToken('admin');
  }, 30_000);

  beforeEach(async () => {
    await Drive.deleteMany({});
    await Report.deleteMany({});

    // Create and verify a report for drive creation
    const createRes = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${userToken}`)
      .field('lat', '12.9716')
      .field('lng', '77.5946')
      .field('description', 'Spot for drive')
      .field('severity', 'high')
      .attach('photo', fixtures.pngPath);

    verifiedReportId = createRes.body.report._id as string;
    await request(app)
      .patch(`/api/reports/${verifiedReportId}/verify`)
      .set('Authorization', `Bearer ${adminToken}`);
  });

  afterAll(async () => {
    if (fs.existsSync(path.resolve(__dirname, 'fixtures'))) {
      fs.rmSync(path.resolve(__dirname, 'fixtures'), { recursive: true, force: true });
    }
    if (fs.existsSync(UPLOAD_DIR)) {
      fs.rmSync(UPLOAD_DIR, { recursive: true, force: true });
    }
    await User.deleteMany({});
    await Report.deleteMany({});
    await Drive.deleteMany({});
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /api/drives
  // ═══════════════════════════════════════════════════════════════════════════

  describe('POST /api/drives', () => {
    it('should create a drive when admin and report is verified', async () => {
      const res = await request(app)
        .post('/api/drives')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reportId: verifiedReportId,
          title: 'Lake Shore Cleanup',
          date: futureDate(),
          fundingGoal: 50000,
          requiredRoles: [
            { role: 'Cleaner', capacity: 10 },
            { role: 'Coordinator', capacity: 5 },
          ],
        });

      expect(res.status).toBe(201);
      expect(res.body.drive).toHaveProperty('_id');
      expect(res.body.drive.title).toBe('Lake Shore Cleanup');
      expect(res.body.drive.status).toBe('planned');
      expect(res.body.drive.reportId).toBe(verifiedReportId);
      expect(res.body.drive.maxVolunteers).toBe(15);
    });

    it('should reject non-admin with 403', async () => {
      const res = await request(app)
        .post('/api/drives')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          reportId: verifiedReportId,
          title: 'Lake Shore Cleanup',
          date: futureDate(),
          fundingGoal: 50000,
          requiredRoles: [{ role: 'Cleaner', capacity: 10 }],
        });

      expect(res.status).toBe(403);
    });

    it('should reject unverified report with 400', async () => {
      // Create a fresh report without verifying
      const createRes = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .field('lat', '13.0')
        .field('lng', '78.0')
        .field('description', 'Unverified spot')
        .field('severity', 'low')
        .attach('photo', fixtures.pngPath);

      const unverifiedReportId = createRes.body.report._id as string;

      const res = await request(app)
        .post('/api/drives')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reportId: unverifiedReportId,
          title: 'Unverified Drive',
          date: futureDate(),
          fundingGoal: 10000,
          requiredRoles: [{ role: 'Cleaner', capacity: 5 }],
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/verified/i);
    });

    it('should reject duplicate drive per report with 409', async () => {
      await request(app)
        .post('/api/drives')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reportId: verifiedReportId,
          title: 'First Drive',
          date: futureDate(),
          fundingGoal: 50000,
          requiredRoles: [{ role: 'Cleaner', capacity: 10 }],
        });

      const res = await request(app)
        .post('/api/drives')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reportId: verifiedReportId,
          title: 'Second Drive Same Report',
          date: futureDate(),
          fundingGoal: 50000,
          requiredRoles: [{ role: 'Cleaner', capacity: 5 }],
        });

      expect(res.status).toBe(409);
      expect(res.body.error.message).toMatch(/already|duplicate/i);
    });

    it('should reject invalid role with 400', async () => {
      const res = await request(app)
        .post('/api/drives')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reportId: verifiedReportId,
          title: 'Bad Role Drive',
          date: futureDate(),
          fundingGoal: 50000,
          requiredRoles: [{ role: 'Picker', capacity: 10 }],
        });

      expect(res.status).toBe(400);
    });

    it('should reject role capacity mismatch (maxVolunteers != sum) with 400', async () => {
      const res = await request(app)
        .post('/api/drives')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reportId: verifiedReportId,
          title: 'Mismatch Drive',
          date: futureDate(),
          fundingGoal: 50000,
          requiredRoles: [
            { role: 'Cleaner', capacity: 10 },
            { role: 'Coordinator', capacity: 5 },
          ],
          maxVolunteers: 20,
        });

      // Our API expects maxVolunteers to be derived from sum; if client sends mismatch, reject
      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/capacity|maxVolunteers/i);
    });

    it('should transition report status to drive_created', async () => {
      await request(app)
        .post('/api/drives')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reportId: verifiedReportId,
          title: 'Status Transition Drive',
          date: futureDate(),
          fundingGoal: 50000,
          requiredRoles: [{ role: 'Cleaner', capacity: 10 }],
        });

      const report = await Report.findById(verifiedReportId);
      expect(report?.status).toBe('drive_created');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GET /api/drives/:id
  // ═══════════════════════════════════════════════════════════════════════════

  describe('GET /api/drives/:id', () => {
    it('should return drive by id', async () => {
      const createRes = await request(app)
        .post('/api/drives')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reportId: verifiedReportId,
          title: 'Get Me Drive',
          date: futureDate(),
          fundingGoal: 50000,
          requiredRoles: [{ role: 'Cleaner', capacity: 10 }],
        });

      const driveId = createRes.body.drive._id as string;

      const res = await request(app).get(`/api/drives/${driveId}`);

      expect(res.status).toBe(200);
      expect(res.body.drive._id).toBe(driveId);
      expect(res.body.drive.title).toBe('Get Me Drive');
    });

    it('should return 404 for non-existent drive', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/drives/${fakeId}`);
      expect(res.status).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GET /api/drives/active
  // ═══════════════════════════════════════════════════════════════════════════

  describe('GET /api/drives/active', () => {
    it('should return drives with status planned or active', async () => {
      await request(app)
        .post('/api/drives')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reportId: verifiedReportId,
          title: 'Active Drive',
          date: futureDate(),
          fundingGoal: 50000,
          requiredRoles: [{ role: 'Cleaner', capacity: 10 }],
        });

      const res = await request(app).get('/api/drives/active');

      expect(res.status).toBe(200);
      expect(res.body.drives).toBeInstanceOf(Array);
      expect(res.body.drives.length).toBeGreaterThanOrEqual(1);
      const planned = res.body.drives.find((d: { status: string }) => d.status === 'planned');
      expect(planned).toBeDefined();
    });
  });
});
