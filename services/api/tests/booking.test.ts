import request from 'supertest';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { app } from '../src/app';
import { User } from '../src/models/user.model';
import { Report } from '../src/models/report.model';
import { Drive } from '../src/models/drive.model';
import { Attendance } from '../src/models/attendance.model';

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
  const suffix = role === 'admin' ? 'admin-bk' : 'user-bk';
  const email = `${suffix}@example.com`;
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

function futureDate(daysFromNow: number): string {
  return new Date(Date.now() + daysFromNow * 86400000).toISOString().split('T')[0]!;
}

// ── Suite ──────────────────────────────────────────────────────────────────

describe('Slot Booking System', () => {
  let userToken: string;
  let adminToken: string;
  let fixtures: { pngPath: string };
  let driveId: string;
  let verifiedReportId: string;

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI!);
    fixtures = ensureFixtures();

    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

    userToken = await getToken('user');
    adminToken = await getToken('admin');
  }, 30_000);

  beforeEach(async () => {
    await Attendance.deleteMany({});
    await Drive.deleteMany({});
    await Report.deleteMany({});

    // Create verified report
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

    // Create drive: Cleaner capacity 2, Coordinator capacity 1
    const driveRes = await request(app)
      .post('/api/drives')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        reportId: verifiedReportId,
        title: 'Lake Shore Cleanup',
        date: futureDate(7),
        fundingGoal: 50000,
        requiredRoles: [
          { role: 'Cleaner', capacity: 2 },
          { role: 'Coordinator', capacity: 1 },
        ],
      });

    driveId = driveRes.body.drive._id as string;
  });

  afterAll(async () => {
    if (fs.existsSync(path.resolve(__dirname, 'fixtures'))) {
      fs.rmSync(path.resolve(__dirname, 'fixtures'), { recursive: true, force: true });
    }
    if (fs.existsSync(UPLOAD_DIR)) {
      fs.rmSync(UPLOAD_DIR, { recursive: true, force: true });
    }
    await User.deleteMany({});
    await Attendance.deleteMany({});
    await Drive.deleteMany({});
    await Report.deleteMany({});
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  // Need unique emails for user2 - fix getToken to support multiple users
  async function getUniqueUserToken(): Promise<string> {
    const id = new mongoose.Types.ObjectId().toString().slice(-6);
    const email = `user-${id}@example.com`;
    const regRes = await request(app)
      .post('/auth/register')
      .send({ email, password: 'StrongP@ss1', name: 'User Two' });
    const { verificationToken } = regRes.body as { verificationToken: string };
    await request(app).get(`/auth/verify-email?token=${verificationToken}`);
    const loginRes = await request(app)
      .post('/auth/login')
      .send({ email, password: 'StrongP@ss1' });
    return loginRes.body.accessToken as string;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /api/drives/:driveId/book
  // ═══════════════════════════════════════════════════════════════════════════

  describe('POST /api/drives/:driveId/book', () => {
    it('should book success when capacity available', async () => {
      const res = await request(app)
        .post(`/api/drives/${driveId}/book`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: 'Cleaner' });

      expect(res.status).toBe(201);
      expect(res.body.attendance).toHaveProperty('_id');
      expect(res.body.attendance.status).toBe('booked');
      expect(res.body.attendance.role).toBe('Cleaner');
      expect(res.body.attendance.qrCode).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('should go to waitlist when role capacity full', async () => {
      // Coordinator has capacity 1
      await request(app)
        .post(`/api/drives/${driveId}/book`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: 'Coordinator' });

      const user2Tkn = await getUniqueUserToken();
      const res = await request(app)
        .post(`/api/drives/${driveId}/book`)
        .set('Authorization', `Bearer ${user2Tkn}`)
        .send({ role: 'Coordinator' });

      expect(res.status).toBe(201);
      expect(res.body.attendance.status).toBe('waitlisted');
      expect(res.body.attendance.role).toBe('Coordinator');
    });

    it('should block double booking for same user + drive', async () => {
      await request(app)
        .post(`/api/drives/${driveId}/book`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: 'Cleaner' });

      const res = await request(app)
        .post(`/api/drives/${driveId}/book`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: 'Coordinator' });

      expect(res.status).toBe(409);
      expect(res.body.error.message).toMatch(/already|one.*per.*drive/i);
    });

    it('should block booking when drive status is completed', async () => {
      await Drive.updateOne({ _id: driveId }, { status: 'completed' });

      const res = await request(app)
        .post(`/api/drives/${driveId}/book`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: 'Cleaner' });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/planned|status/i);
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post(`/api/drives/${driveId}/book`)
        .send({ role: 'Cleaner' });

      expect(res.status).toBe(401);
    });

    it('should block public user from booking (only role=user)', async () => {
      const publicEmail = 'public-bk@example.com';
      const regRes = await request(app)
        .post('/auth/register')
        .send({ email: publicEmail, password: 'StrongP@ss1', name: 'Public' });
      const { verificationToken } = regRes.body as { verificationToken: string };
      await request(app).get(`/auth/verify-email?token=${verificationToken}`);
      await User.updateOne({ email: publicEmail }, { role: 'public' });
      const loginRes = await request(app)
        .post('/auth/login')
        .send({ email: publicEmail, password: 'StrongP@ss1' });
      const pubToken = loginRes.body.accessToken as string;

      const res = await request(app)
        .post(`/api/drives/${driveId}/book`)
        .set('Authorization', `Bearer ${pubToken}`)
        .send({ role: 'Cleaner' });

      expect(res.status).toBe(403);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /api/drives/:driveId/cancel
  // ═══════════════════════════════════════════════════════════════════════════

  describe('POST /api/drives/:driveId/cancel', () => {
    it('should cancel before 24hr works', async () => {
      await request(app)
        .post(`/api/drives/${driveId}/book`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: 'Cleaner' });

      const res = await request(app)
        .post(`/api/drives/${driveId}/cancel`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.attendance.status).toBe('cancelled');

      const att = await Attendance.findOne({ driveId }).sort({ createdAt: -1 });
      expect(att?.status).toBe('cancelled');
    });

    it('should reject cancellation within 24hr of drive date', async () => {
      await request(app)
        .post(`/api/drives/${driveId}/book`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: 'Cleaner' });

      // Set drive date to 12 hours from now (within 24hr window)
      const nearFuture = new Date(Date.now() + 12 * 3600000);
      await Drive.updateOne({ _id: driveId }, { $set: { date: nearFuture } });

      const res = await request(app)
        .post(`/api/drives/${driveId}/cancel`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/24|hour|cancel/i);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /api/drives/:driveId/checkin
  // ═══════════════════════════════════════════════════════════════════════════

  describe('POST /api/drives/:driveId/checkin', () => {
    it('should allow admin to check in with valid QR on drive date', async () => {
      const bookRes = await request(app)
        .post(`/api/drives/${driveId}/book`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: 'Cleaner' });

      const qrCode = bookRes.body.attendance.qrCode as string;

      // Set drive date to today (mock "drive date")
      const today = new Date().toISOString().split('T')[0]!;
      await Drive.updateOne({ _id: driveId }, { date: today, status: 'active' });

      const res = await request(app)
        .post(`/api/drives/${driveId}/checkin`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ qrCode });

      expect(res.status).toBe(200);
      expect(res.body.attendance.status).toBe('checked_in');
      expect(res.body.attendance.checkedInAt).toBeDefined();
    });

    it('should reject QR reuse (cannot check in twice)', async () => {
      const bookRes = await request(app)
        .post(`/api/drives/${driveId}/book`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: 'Cleaner' });

      const qrCode = bookRes.body.attendance.qrCode as string;
      const today = new Date().toISOString().split('T')[0]!;
      await Drive.updateOne({ _id: driveId }, { date: today, status: 'active' });

      await request(app)
        .post(`/api/drives/${driveId}/checkin`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ qrCode });

      const res = await request(app)
        .post(`/api/drives/${driveId}/checkin`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ qrCode });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/already|checked|twice/i);
    });

    it('should deny non-admin non-organizer from check-in', async () => {
      const bookRes = await request(app)
        .post(`/api/drives/${driveId}/book`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: 'Cleaner' });

      const qrCode = bookRes.body.attendance.qrCode as string;
      const today = new Date().toISOString().split('T')[0]!;
      await Drive.updateOne({ _id: driveId }, { date: today, status: 'active' });

      const res = await request(app)
        .post(`/api/drives/${driveId}/checkin`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ qrCode });

      expect(res.status).toBe(403);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Concurrent overbooking prevention
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Concurrent booking', () => {
    it('should prevent overbooking under parallel requests', async () => {
      // Drive has Coordinator capacity 1
      const tokens: string[] = [userToken];
      for (let i = 0; i < 4; i++) {
        tokens.push(await getUniqueUserToken());
      }

      const results = await Promise.all(
        tokens.map((token) =>
          request(app)
            .post(`/api/drives/${driveId}/book`)
            .set('Authorization', `Bearer ${token}`)
            .send({ role: 'Coordinator' }),
        ),
      );

      const withBooked = results.filter((r) => r.body.attendance?.status === 'booked');
      const withWaitlisted = results.filter((r) => r.body.attendance?.status === 'waitlisted');
      const failed = results.filter((r) => r.status !== 201);

      expect(withBooked.length).toBe(1);
      expect(withWaitlisted.length).toBe(4);
      expect(failed.length).toBe(0);

      const drive = await Drive.findById(driveId);
      const coordRole = drive?.requiredRoles.find((r) => r.role === 'Coordinator');
      expect(coordRole?.booked).toBe(1);
      expect(coordRole?.waitlist).toBe(4);
    });
  });
});
