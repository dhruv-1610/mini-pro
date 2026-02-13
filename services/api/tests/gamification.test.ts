import request from 'supertest';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { app } from '../src/app';
import { User } from '../src/models/user.model';
import { Report } from '../src/models/report.model';
import { Drive } from '../src/models/drive.model';
import { Attendance } from '../src/models/attendance.model';
import { Donation } from '../src/models/donation.model';
import { Impact } from '../src/models/impact.model';

// ── Mocks ──────────────────────────────────────────────────────────────────
const mockPaymentIntentsCreate = jest.fn();
const mockConstructEvent = jest.fn();

jest.mock('../src/services/certificate.service', () => ({
  generateCertificate: jest.fn().mockResolvedValue(Buffer.from('%PDF-1.4 mock')),
}));

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    paymentIntents: {
      create: mockPaymentIntentsCreate,
    },
    webhooks: {
      constructEvent: mockConstructEvent,
    },
  }));
});

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

async function getToken(role: 'user' | 'admin' = 'user', suffix = 'gam'): Promise<string> {
  const roleSuffix = role === 'admin' ? `admin-${suffix}` : `user-${suffix}`;
  const email = `${roleSuffix}@example.com`;
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

async function getUniqueUserToken(suffix: string): Promise<string> {
  const id = new mongoose.Types.ObjectId().toString().slice(-6);
  const email = `user-${suffix}-${id}@example.com`;
  const regRes = await request(app)
    .post('/auth/register')
    .send({ email, password: 'StrongP@ss1', name: 'User' });
  const { verificationToken } = regRes.body as { verificationToken: string };
  await request(app).get(`/auth/verify-email?token=${verificationToken}`);
  await User.updateOne({ email }, { role: 'user' });
  const loginRes = await request(app)
    .post('/auth/login')
    .send({ email, password: 'StrongP@ss1' });
  return loginRes.body.accessToken as string;
}

function futureDate(daysFromNow: number): string {
  return new Date(Date.now() + daysFromNow * 86400000).toISOString().split('T')[0]!;
}

function paymentIntentSucceededEvent(paymentIntentId: string, amount: number): string {
  return JSON.stringify({
    type: 'payment_intent.succeeded',
    data: { object: { id: paymentIntentId, amount, currency: 'inr' } },
  });
}

// ── Suite ──────────────────────────────────────────────────────────────────

describe('Gamification System', () => {
  let userToken: string;

  beforeAll(async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock';

    await mongoose.connect(process.env.MONGO_URI!);
    ensureFixtures();

    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

    userToken = await getToken('user');
  }, 30_000);

  beforeEach(() => {
    mockPaymentIntentsCreate.mockReset();
    mockConstructEvent.mockImplementation((body: Buffer | string) => {
      const str = typeof body === 'string' ? body : body.toString();
      return JSON.parse(str);
    });
  });

  afterAll(async () => {
    if (fs.existsSync(path.resolve(__dirname, 'fixtures'))) {
      fs.rmSync(path.resolve(__dirname, 'fixtures'), { recursive: true, force: true });
    }
    if (fs.existsSync(UPLOAD_DIR)) {
      fs.rmSync(UPLOAD_DIR, { recursive: true, force: true });
    }
    await User.deleteMany({});
    await Donation.deleteMany({});
    await Attendance.deleteMany({});
    await Impact.deleteMany({});
    await Drive.deleteMany({});
    await Report.deleteMany({});
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Leaderboard
  // ═══════════════════════════════════════════════════════════════════════════

  describe('GET /api/leaderboard/donors', () => {
    it('should rank donors correctly by total completed donations', async () => {
      await Donation.deleteMany({});
      await Drive.deleteMany({});
      await Report.deleteMany({});
      await User.deleteMany({});

      const [u1, u2, u3] = await Promise.all([
        User.create({
          email: 'donor1@ex.com',
          passwordHash: 'x',
          role: 'user',
          profile: { name: 'Donor1' },
          stats: { volunteerHours: 0, donations: 0 },
          createdAt: new Date('2024-01-01'),
        }),
        User.create({
          email: 'donor2@ex.com',
          passwordHash: 'x',
          role: 'user',
          profile: { name: 'Donor2' },
          stats: { volunteerHours: 0, donations: 0 },
          createdAt: new Date('2024-01-02'),
        }),
        User.create({
          email: 'donor3@ex.com',
          passwordHash: 'x',
          role: 'user',
          profile: { name: 'Donor3' },
          stats: { volunteerHours: 0, donations: 0 },
          createdAt: new Date('2024-01-03'),
        }),
      ]);

      await Donation.create([
        { userId: u1._id, driveId: new mongoose.Types.ObjectId(), amount: 5000, stripePaymentId: 'pi_1', status: 'completed' },
        { userId: u1._id, driveId: new mongoose.Types.ObjectId(), amount: 3000, stripePaymentId: 'pi_2', status: 'completed' },
        { userId: u2._id, driveId: new mongoose.Types.ObjectId(), amount: 10000, stripePaymentId: 'pi_3', status: 'completed' },
        { userId: u3._id, driveId: new mongoose.Types.ObjectId(), amount: 10000, stripePaymentId: 'pi_4', status: 'completed' },
      ]);

      const res = await request(app).get('/api/leaderboard/donors');

      expect(res.status).toBe(200);
      expect(res.body.donors.length).toBeGreaterThanOrEqual(3);
      expect(res.body.donors[0].totalAmount).toBe(10000);
      expect(res.body.donors[1].totalAmount).toBe(10000);
      expect(res.body.donors[2].totalAmount).toBe(8000);
      expect(res.body.donors[0].user.profile.name).toBe('Donor2');
      expect(res.body.donors[1].user.profile.name).toBe('Donor3');
    });
  });

  describe('GET /api/leaderboard/volunteers', () => {
    it('should rank volunteers correctly by checked_in count', async () => {
      await Attendance.deleteMany({});
      await Drive.deleteMany({});
      await Report.deleteMany({});
      await User.deleteMany({});

      const [u1, u2] = await Promise.all([
        User.create({
          email: 'vol1@ex.com',
          passwordHash: 'x',
          role: 'user',
          profile: { name: 'Vol1' },
          stats: { volunteerHours: 0, donations: 0 },
          createdAt: new Date('2024-01-01'),
        }),
        User.create({
          email: 'vol2@ex.com',
          passwordHash: 'x',
          role: 'user',
          profile: { name: 'Vol2' },
          stats: { volunteerHours: 0, donations: 0 },
          createdAt: new Date('2024-01-02'),
        }),
      ]);

      const driveId = new mongoose.Types.ObjectId();
      await Attendance.create([
        { driveId, userId: u1._id, role: 'Cleaner', qrCode: require('crypto').randomUUID(), status: 'checked_in' },
        { driveId, userId: u2._id, role: 'Coordinator', qrCode: require('crypto').randomUUID(), status: 'checked_in' },
      ]);

      const driveId2 = new mongoose.Types.ObjectId();
      await Attendance.create({
        driveId: driveId2,
        userId: u1._id,
        role: 'Cleaner',
        qrCode: require('crypto').randomUUID(),
        status: 'checked_in',
      });

      const res = await request(app).get('/api/leaderboard/volunteers');

      expect(res.status).toBe(200);
      expect(res.body.volunteers.length).toBeGreaterThanOrEqual(2);
      expect(res.body.volunteers[0].driveCount).toBe(2);
      expect(res.body.volunteers[0].user.profile.name).toBe('Vol1');
    });
  });

  describe('Monthly filter', () => {
    it('should filter leaderboard by period=monthly', async () => {
      const res = await request(app).get('/api/leaderboard/donors?period=monthly');
      expect(res.status).toBe(200);
      expect(res.body.donors).toBeInstanceOf(Array);

      const res2 = await request(app).get('/api/leaderboard/volunteers?period=monthly');
      expect(res2.status).toBe(200);
      expect(res2.body.volunteers).toBeInstanceOf(Array);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Stats auto-update
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Stats increment on donation webhook', () => {
    it('should increment user.stats.donations when donation completed', async () => {
      await Donation.deleteMany({});
      await Drive.deleteMany({});
      await Report.deleteMany({});
      await User.deleteMany({});

      const rep = await Report.create({
        photoUrls: ['/x.jpg'],
        location: { type: 'Point', coordinates: [77.5, 12.9] },
        description: 'x',
        severity: 'high',
        status: 'verified',
        createdBy: new mongoose.Types.ObjectId(),
      });

      const drv = await Drive.create({
        title: 'D',
        location: rep.location,
        date: futureDate(7),
        maxVolunteers: 5,
        fundingGoal: 50000,
        requiredRoles: [{ role: 'Cleaner', capacity: 5, booked: 0, waitlist: 0 }],
        status: 'planned',
        reportId: rep._id,
      });

      const usr = await User.create({
        email: 'statdon@ex.com',
        passwordHash: 'x',
        role: 'user',
        profile: { name: 'StatDon' },
        stats: { volunteerHours: 0, donations: 0 },
      });

      await Donation.create({
        userId: usr._id,
        driveId: drv._id,
        amount: 15000,
        stripePaymentId: 'pi_stats_1',
        status: 'pending',
      });

      await request(app)
        .post('/api/webhooks/stripe')
        .set('Content-Type', 'application/json')
        .set('Stripe-Signature', 't=1,v1=x')
        .send(paymentIntentSucceededEvent('pi_stats_1', 15000));

      const userAfter = await User.findById(usr._id);
      expect(userAfter?.stats.donations).toBe(15000);
    });
  });

  describe('Stats increment on impact submission', () => {
    it('should increment volunteerHours when impact submitted for checked-in users', async () => {
      await Attendance.deleteMany({});
      await Impact.deleteMany({});
      await Drive.deleteMany({});
      await Report.deleteMany({});
      await User.deleteMany({});

      const rep = await Report.create({
        photoUrls: ['/x.jpg'],
        location: { type: 'Point', coordinates: [77.5, 12.9] },
        description: 'x',
        severity: 'high',
        status: 'drive_created',
        createdBy: new mongoose.Types.ObjectId(),
      });

      const drv = await Drive.create({
        title: 'D',
        location: rep.location,
        date: futureDate(7),
        maxVolunteers: 5,
        fundingGoal: 50000,
        requiredRoles: [{ role: 'Cleaner', capacity: 5, booked: 0, waitlist: 0 }],
        status: 'planned',
        reportId: rep._id,
      });

      const usr = await User.create({
        email: 'statvol2@ex.com',
        passwordHash: 'x',
        role: 'user',
        profile: { name: 'StatVol2' },
        stats: { volunteerHours: 0, donations: 0 },
      });

      await Attendance.create({
        driveId: drv._id,
        userId: usr._id,
        role: 'Cleaner',
        qrCode: require('crypto').randomUUID(),
        status: 'checked_in',
      });

      const adminTkn = await getToken('admin', 'adm');
      const { pngPath } = ensureFixtures();

      await request(app)
        .post(`/api/drives/${drv._id}/impact`)
        .set('Authorization', `Bearer ${adminTkn}`)
        .field('wasteCollected', '50')
        .field('areaCleaned', '200')
        .field('workHours', '6')
        .attach('beforePhotos', pngPath)
        .attach('afterPhotos', pngPath);

      const userAfter = await User.findById(usr._id);
      expect(userAfter?.stats.volunteerHours).toBe(6);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Badges
  // ═══════════════════════════════════════════════════════════════════════════

  describe('GET /api/users/:userId/badges', () => {
    it('should return badge levels calculated from stats', async () => {
      await User.deleteMany({});
      const usr = await User.create({
        email: 'badge@ex.com',
        passwordHash: 'x',
        role: 'user',
        profile: { name: 'BadgeUser' },
        stats: { volunteerHours: 10, donations: 2500000 },
      });

      const res = await request(app).get(`/api/users/${usr._id}/badges`);

      expect(res.status).toBe(200);
      expect(res.body.volunteerBadge).toBeDefined();
      expect(res.body.donorBadge).toBeDefined();
      expect(res.body.donorBadge).toBe('Gold');
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Certificate
  // ═══════════════════════════════════════════════════════════════════════════

  describe('GET /api/users/:userId/certificate', () => {
    it('should return PDF when user has completed drives', async () => {
      const certToken = await getUniqueUserToken('cert');
      const certUser = await User.findOne({ email: { $regex: /user-cert-/ } });

      const rep = await Report.create({
        photoUrls: ['/x.jpg'],
        location: { type: 'Point', coordinates: [77.5, 12.9] },
        description: 'x',
        severity: 'high',
        status: 'verified',
        createdBy: certUser!._id,
      });

      const drv = await Drive.create({
        title: 'D',
        location: rep.location,
        date: futureDate(7),
        maxVolunteers: 5,
        fundingGoal: 50000,
        requiredRoles: [{ role: 'Cleaner', capacity: 5, booked: 0, waitlist: 0 }],
        status: 'planned',
        reportId: rep._id,
      });

      await Attendance.create({
        driveId: drv._id,
        userId: certUser!._id,
        role: 'Cleaner',
        qrCode: require('crypto').randomUUID(),
        status: 'checked_in',
      });

      await User.updateOne(
        { _id: certUser!._id },
        { $set: { 'stats.volunteerHours': 8 } },
      );

      const res = await request(app)
        .get(`/api/users/${certUser!._id}/certificate`)
        .set('Authorization', `Bearer ${certToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/pdf/);
    });

    it('should reject unauthorized certificate access', async () => {
      await getUniqueUserToken('other');
      const me = await User.findOne({ email: { $regex: /user-gam@example.com/ } });
      const other = await User.findOne({ email: { $regex: /user-other-/ } });
      if (!me || !other || me._id.toString() === other._id.toString()) return;

      const res = await request(app)
        .get(`/api/users/${other._id}/certificate`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
    });
  });
});
