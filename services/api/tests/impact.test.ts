import request from 'supertest';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { app } from '../src/app';
import { User } from '../src/models/user.model';
import { Report } from '../src/models/report.model';
import { Drive } from '../src/models/drive.model';
import { Attendance } from '../src/models/attendance.model';
import { Impact } from '../src/models/impact.model';
import { Expense } from '../src/models/expense.model';

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
  const suffix = role === 'admin' ? 'admin-imp' : 'user-imp';
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

describe('Impact Measurement', () => {
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
    await Impact.deleteMany({});
    await Expense.deleteMany({});
    await Attendance.deleteMany({});
    await Drive.deleteMany({});
    await Report.deleteMany({});

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

    const driveRes = await request(app)
      .post('/api/drives')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        reportId: verifiedReportId,
        title: 'Impact Drive',
        date: futureDate(7),
        fundingGoal: 50000,
        requiredRoles: [{ role: 'Cleaner', capacity: 5 }],
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
    await Impact.deleteMany({});
    await Expense.deleteMany({});
    await Attendance.deleteMany({});
    await Drive.deleteMany({});
    await Report.deleteMany({});
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /api/drives/:driveId/impact
  // ═══════════════════════════════════════════════════════════════════════════

  describe('POST /api/drives/:driveId/impact', () => {
    it('should allow admin to submit impact successfully', async () => {
      const res = await request(app)
        .post(`/api/drives/${driveId}/impact`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('wasteCollected', '50')
        .field('areaCleaned', '200')
        .field('workHours', '8')
        .field('beforePhotos', '[]')
        .field('afterPhotos', '[]')
        .attach('beforePhotos', fixtures.pngPath)
        .attach('afterPhotos', fixtures.pngPath);

      expect(res.status).toBe(201);
      expect(res.body.impact).toHaveProperty('_id');
      expect(res.body.impact.wasteCollected).toBe(50);
      expect(res.body.impact.areaCleaned).toBe(200);
      expect(res.body.impact.workHours).toBe(8);
      expect(res.body.impact.beforePhotos).toHaveLength(1);
      expect(res.body.impact.afterPhotos).toHaveLength(1);
    });

    it('should reject non-admin with 403', async () => {
      const res = await request(app)
        .post(`/api/drives/${driveId}/impact`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          wasteCollected: 50,
          areaCleaned: 200,
          workHours: 8,
        });

      expect(res.status).toBe(403);
    });

    it('should update drive status to completed and report status to cleaned', async () => {
      await request(app)
        .post(`/api/drives/${driveId}/impact`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('wasteCollected', '50')
        .field('areaCleaned', '200')
        .field('workHours', '8')
        .attach('beforePhotos', fixtures.pngPath)
        .attach('afterPhotos', fixtures.pngPath);

      const drive = await Drive.findById(driveId);
      expect(drive?.status).toBe('completed');

      const report = await Report.findById(verifiedReportId);
      expect(report?.status).toBe('cleaned');
    });

    it('should reject duplicate impact submission', async () => {
      await request(app)
        .post(`/api/drives/${driveId}/impact`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('wasteCollected', '50')
        .field('areaCleaned', '200')
        .field('workHours', '8')
        .attach('beforePhotos', fixtures.pngPath)
        .attach('afterPhotos', fixtures.pngPath);

      const res = await request(app)
        .post(`/api/drives/${driveId}/impact`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('wasteCollected', '60')
        .field('areaCleaned', '250')
        .field('workHours', '9')
        .attach('beforePhotos', fixtures.pngPath)
        .attach('afterPhotos', fixtures.pngPath);

      expect(res.status).toBe(409);
      expect(res.body.error.message).toMatch(/already|impact/i);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GET /api/transparency/:driveId
  // ═══════════════════════════════════════════════════════════════════════════

  describe('GET /api/transparency/:driveId', () => {
    it('should return correct totals for transparency endpoint', async () => {
      await Drive.updateOne({ _id: driveId }, { fundingRaised: 25000 });

      await request(app)
        .post(`/api/drives/${driveId}/impact`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('wasteCollected', '50')
        .field('areaCleaned', '200')
        .field('workHours', '8')
        .attach('beforePhotos', fixtures.pngPath)
        .attach('afterPhotos', fixtures.pngPath);

      const res = await request(app).get(`/api/transparency/${driveId}`);

      expect(res.status).toBe(200);
      expect(res.body.driveId).toBe(driveId);
      expect(res.body.totalFunds).toBe(25000);
      expect(res.body.metrics).toEqual({
        wasteCollected: 50,
        areaCleaned: 200,
        workHours: 8,
      });
      expect(res.body.photos).toBeDefined();
      expect(Array.isArray(res.body.photos.before)).toBe(true);
      expect(Array.isArray(res.body.photos.after)).toBe(true);
      expect(res.body.volunteerCount).toBe(0);
    });

    it('should exclude unverified expenses from expenseBreakdown', async () => {
      await request(app)
        .post(`/api/drives/${driveId}/impact`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('wasteCollected', '50')
        .field('areaCleaned', '200')
        .field('workHours', '8')
        .attach('beforePhotos', fixtures.pngPath)
        .attach('afterPhotos', fixtures.pngPath);

      await Expense.create({
        driveId,
        category: 'equipment',
        amount: 5000,
        proofUrl: '/uploads/test1.jpg',
        isVerified: false,
      });
      await Expense.create({
        driveId,
        category: 'transport',
        amount: 3000,
        proofUrl: '/uploads/test2.jpg',
        isVerified: true,
      });

      const res = await request(app).get(`/api/transparency/${driveId}`);

      expect(res.status).toBe(200);
      expect(res.body.expenseBreakdown).toBeDefined();
      expect(res.body.expenseBreakdown.transport).toBe(3000);
      expect(res.body.expenseBreakdown.equipment).toBeUndefined();
    });

    it('should return correct volunteer count (checked_in attendance)', async () => {
      const bookRes = await request(app)
        .post(`/api/drives/${driveId}/book`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ role: 'Cleaner' });

      const today = new Date().toISOString().split('T')[0]!;
      await Drive.updateOne({ _id: driveId }, { date: today, status: 'active' });

      await request(app)
        .post(`/api/drives/${driveId}/checkin`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ qrCode: bookRes.body.attendance.qrCode });

      await request(app)
        .post(`/api/drives/${driveId}/impact`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('wasteCollected', '50')
        .field('areaCleaned', '200')
        .field('workHours', '8')
        .attach('beforePhotos', fixtures.pngPath)
        .attach('afterPhotos', fixtures.pngPath);

      const res = await request(app).get(`/api/transparency/${driveId}`);

      expect(res.status).toBe(200);
      expect(res.body.volunteerCount).toBe(1);
    });

    it('should return 404 for non-existent drive', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/transparency/${fakeId}`);
      expect(res.status).toBe(404);
    });
  });
});
