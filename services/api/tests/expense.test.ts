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
  const suffix = role === 'admin' ? 'admin-exp' : 'user-exp';
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

describe('Expense & Transparency Portal', () => {
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
    await Expense.deleteMany({});
    await Impact.deleteMany({});
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
        title: 'Expense Drive',
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
    await Expense.deleteMany({});
    await Impact.deleteMany({});
    await Attendance.deleteMany({});
    await Drive.deleteMany({});
    await Report.deleteMany({});
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /api/drives/:driveId/expenses
  // ═══════════════════════════════════════════════════════════════════════════

  describe('POST /api/drives/:driveId/expenses', () => {
    it('should allow admin to create expense successfully', async () => {
      const res = await request(app)
        .post(`/api/drives/${driveId}/expenses`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('category', 'equipment')
        .field('amount', '5000')
        .attach('proof', fixtures.pngPath);

      expect(res.status).toBe(201);
      expect(res.body.expense).toHaveProperty('_id');
      expect(res.body.expense.category).toBe('equipment');
      expect(res.body.expense.amount).toBe(5000);
      expect(res.body.expense.proofUrl).toMatch(/^\/uploads\//);
      expect(res.body.expense.isVerified).toBe(false);
    });

    it('should reject non-admin with 403', async () => {
      const res = await request(app)
        .post(`/api/drives/${driveId}/expenses`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ category: 'equipment', amount: 5000 });

      expect(res.status).toBe(403);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // PATCH /api/expenses/:expenseId/verify
  // ═══════════════════════════════════════════════════════════════════════════

  describe('PATCH /api/expenses/:expenseId/verify', () => {
    it('should allow admin to verify expense successfully', async () => {
      const createRes = await request(app)
        .post(`/api/drives/${driveId}/expenses`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('category', 'transport')
        .field('amount', '3000')
        .attach('proof', fixtures.pngPath);

      const expenseId = createRes.body.expense._id as string;

      const res = await request(app)
        .patch(`/api/expenses/${expenseId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.expense.isVerified).toBe(true);
      expect(res.body.expense.verifiedAt).toBeDefined();
    });

    it('should reject non-admin verification with 403', async () => {
      const createRes = await request(app)
        .post(`/api/drives/${driveId}/expenses`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('category', 'equipment')
        .field('amount', '2000')
        .attach('proof', fixtures.pngPath);

      const expenseId = createRes.body.expense._id as string;

      const res = await request(app)
        .patch(`/api/expenses/${expenseId}/verify`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GET /api/transparency/:driveId
  // ═══════════════════════════════════════════════════════════════════════════

  describe('GET /api/transparency/:driveId', () => {
    it('should exclude unverified expenses from aggregation', async () => {
      await request(app)
        .post(`/api/drives/${driveId}/impact`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('wasteCollected', '50')
        .field('areaCleaned', '200')
        .field('workHours', '8')
        .attach('beforePhotos', fixtures.pngPath)
        .attach('afterPhotos', fixtures.pngPath);

      await request(app)
        .post(`/api/drives/${driveId}/expenses`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('category', 'equipment')
        .field('amount', '5000')
        .attach('proof', fixtures.pngPath);

      const createRes = await request(app)
        .post(`/api/drives/${driveId}/expenses`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('category', 'transport')
        .field('amount', '3000')
        .attach('proof', fixtures.pngPath);

      await request(app)
        .patch(`/api/expenses/${createRes.body.expense._id}/verify`)
        .set('Authorization', `Bearer ${adminToken}`);

      const res = await request(app).get(`/api/transparency/${driveId}`);

      expect(res.status).toBe(200);
      expect(res.body.categoryBreakdown).toBeDefined();
      expect(res.body.categoryBreakdown.transport).toBe(3000);
      expect(res.body.categoryBreakdown.equipment).toBeUndefined();
      expect(res.body.totalVerifiedExpenses).toBe(3000);
    });

    it('should return correct aggregation totals', async () => {
      await Drive.updateOne({ _id: driveId }, { fundingRaised: 25000 });

      await request(app)
        .post(`/api/drives/${driveId}/impact`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('wasteCollected', '50')
        .field('areaCleaned', '200')
        .field('workHours', '8')
        .attach('beforePhotos', fixtures.pngPath)
        .attach('afterPhotos', fixtures.pngPath);

      const exp1 = await request(app)
        .post(`/api/drives/${driveId}/expenses`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('category', 'equipment')
        .field('amount', '10000')
        .attach('proof', fixtures.pngPath);

      const exp2 = await request(app)
        .post(`/api/drives/${driveId}/expenses`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('category', 'refreshments')
        .field('amount', '5000')
        .attach('proof', fixtures.pngPath);

      await request(app)
        .patch(`/api/expenses/${exp1.body.expense._id}/verify`)
        .set('Authorization', `Bearer ${adminToken}`);
      await request(app)
        .patch(`/api/expenses/${exp2.body.expense._id}/verify`)
        .set('Authorization', `Bearer ${adminToken}`);

      const res = await request(app).get(`/api/transparency/${driveId}`);

      expect(res.status).toBe(200);
      expect(res.body.moneyCollected).toBe(25000);
      expect(res.body.totalVerifiedExpenses).toBe(15000);
      expect(res.body.categoryBreakdown.equipment).toBe(10000);
      expect(res.body.categoryBreakdown.refreshments).toBe(5000);
    });

    it('should return accurate category breakdown', async () => {
      await request(app)
        .post(`/api/drives/${driveId}/impact`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('wasteCollected', '50')
        .field('areaCleaned', '200')
        .field('workHours', '8')
        .attach('beforePhotos', fixtures.pngPath)
        .attach('afterPhotos', fixtures.pngPath);

      const exp1 = await request(app)
        .post(`/api/drives/${driveId}/expenses`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('category', 'misc')
        .field('amount', '2500')
        .attach('proof', fixtures.pngPath);

      const exp2 = await request(app)
        .post(`/api/drives/${driveId}/expenses`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('category', 'misc')
        .field('amount', '3500')
        .attach('proof', fixtures.pngPath);

      await request(app)
        .patch(`/api/expenses/${exp1.body.expense._id}/verify`)
        .set('Authorization', `Bearer ${adminToken}`);
      await request(app)
        .patch(`/api/expenses/${exp2.body.expense._id}/verify`)
        .set('Authorization', `Bearer ${adminToken}`);

      const res = await request(app).get(`/api/transparency/${driveId}`);

      expect(res.status).toBe(200);
      expect(res.body.categoryBreakdown.misc).toBe(6000);
    });
  });
});
