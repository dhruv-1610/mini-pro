import request from 'supertest';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { app } from '../src/app';
import { User } from '../src/models/user.model';
import { Report } from '../src/models/report.model';
import { Drive } from '../src/models/drive.model';
import { Donation } from '../src/models/donation.model';
import { ActivityLog } from '../src/models/activityLog.model';

// ── Mock Stripe (must be before imports that use it) ────────────────────────
const mockPaymentIntentsCreate = jest.fn();
const mockConstructEvent = jest.fn();

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

async function getToken(role: 'user' | 'admin' = 'user'): Promise<string> {
  const suffix = role === 'admin' ? 'admin-don' : 'user-don';
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

/** Build Stripe payment_intent.succeeded event payload. */
function paymentIntentSucceededEvent(paymentIntentId: string): string {
  return JSON.stringify({
    type: 'payment_intent.succeeded',
    data: {
      object: {
        id: paymentIntentId,
        amount: 5000,
        currency: 'inr',
      },
    },
  });
}

// ── Suite ──────────────────────────────────────────────────────────────────

describe('Donation System with Stripe', () => {
  let userToken: string;
  let adminToken: string;
  let fixtures: { pngPath: string };
  let driveId: string;
  let verifiedReportId: string;

  beforeAll(async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock';

    await mongoose.connect(process.env.MONGO_URI!);
    fixtures = ensureFixtures();

    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

    userToken = await getToken('user');
    adminToken = await getToken('admin');
  }, 30_000);

  beforeEach(async () => {
    await Donation.deleteMany({});
    await ActivityLog.deleteMany({});
    await Drive.deleteMany({});
    await Report.deleteMany({});

    mockPaymentIntentsCreate.mockReset();
    mockPaymentIntentsCreate.mockResolvedValue({
      id: 'pi_mock_' + Date.now(),
      client_secret: 'pi_mock_secret_xxx',
    });

    mockConstructEvent.mockImplementation((body: Buffer | string) => {
      const str = typeof body === 'string' ? body : body.toString();
      return JSON.parse(str);
    });

    // Create verified report and drive
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
        title: 'Donation Drive',
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
    await Donation.deleteMany({});
    await ActivityLog.deleteMany({});
    await Drive.deleteMany({});
    await Report.deleteMany({});
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /api/drives/:driveId/donate
  // ═══════════════════════════════════════════════════════════════════════════

  describe('POST /api/drives/:driveId/donate', () => {
    it('should create donation and return clientSecret when valid', async () => {
      const res = await request(app)
        .post(`/api/drives/${driveId}/donate`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amount: 5000 });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('clientSecret');
      expect(res.body.clientSecret).toBe('pi_mock_secret_xxx');

      expect(mockPaymentIntentsCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: 5000,
          currency: 'inr',
        }),
      );

      const donation = await Donation.findOne({ driveId });
      expect(donation).toBeDefined();
      expect(donation?.status).toBe('pending');
      expect(donation?.amount).toBe(5000);
      expect(donation?.stripePaymentId).toMatch(/^pi_mock_/);
    });

    it('should reject donation below minimum (₹10)', async () => {
      const res = await request(app)
        .post(`/api/drives/${driveId}/donate`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amount: 999 });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/minimum|1000|10/i);
      expect(mockPaymentIntentsCreate).not.toHaveBeenCalled();
    });

    it('should reject donation for completed drive', async () => {
      await Drive.updateOne({ _id: driveId }, { status: 'completed' });

      const res = await request(app)
        .post(`/api/drives/${driveId}/donate`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amount: 5000 });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/completed|cancelled|status/i);
      expect(mockPaymentIntentsCreate).not.toHaveBeenCalled();
    });

    it('should reject donation for cancelled drive', async () => {
      await Drive.updateOne({ _id: driveId }, { status: 'cancelled' });

      const res = await request(app)
        .post(`/api/drives/${driveId}/donate`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amount: 5000 });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/completed|cancelled|status/i);
      expect(mockPaymentIntentsCreate).not.toHaveBeenCalled();
    });

    it('should require authentication', async () => {
      const res = await request(app)
        .post(`/api/drives/${driveId}/donate`)
        .send({ amount: 5000 });

      expect(res.status).toBe(401);
    });

    it('should return 404 for non-existent drive', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .post(`/api/drives/${fakeId}/donate`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amount: 5000 });

      expect(res.status).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /api/webhooks/stripe
  // ═══════════════════════════════════════════════════════════════════════════

  describe('POST /api/webhooks/stripe', () => {
    it('should update donation.status and increment fundingRaised on payment_intent.succeeded', async () => {
      // Create donation via donate endpoint
      mockPaymentIntentsCreate.mockResolvedValue({
        id: 'pi_webhook_test_123',
        client_secret: 'pi_secret_xxx',
      });

      await request(app)
        .post(`/api/drives/${driveId}/donate`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amount: 5000 });

      const donation = await Donation.findOne({ driveId, status: 'pending' });
      expect(donation?.stripePaymentId).toBe('pi_webhook_test_123');

      const driveBefore = await Drive.findById(driveId);
      expect(driveBefore?.fundingRaised).toBe(0);

      const eventPayload = paymentIntentSucceededEvent('pi_webhook_test_123');

      const res = await request(app)
        .post('/api/webhooks/stripe')
        .set('Content-Type', 'application/json')
        .set('Stripe-Signature', 't=123,v1=valid')
        .send(eventPayload);

      expect(res.status).toBe(200);

      const donationAfter = await Donation.findById(donation?._id);
      expect(donationAfter?.status).toBe('completed');

      const driveAfter = await Drive.findById(driveId);
      expect(driveAfter?.fundingRaised).toBe(5000);

      const activityLog = await ActivityLog.findOne({
        entityType: 'Donation',
        entityId: donation?._id,
        action: 'donation_completed',
      });
      expect(activityLog).toBeDefined();
    });

    it('should NOT double increment fundingRaised on duplicate webhook (idempotent)', async () => {
      mockPaymentIntentsCreate.mockResolvedValue({
        id: 'pi_duplicate_test_456',
        client_secret: 'pi_secret_xxx',
      });

      await request(app)
        .post(`/api/drives/${driveId}/donate`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amount: 3000 });

      const donation = await Donation.findOne({ stripePaymentId: 'pi_duplicate_test_456' });
      expect(donation).toBeDefined();

      const eventPayload = paymentIntentSucceededEvent('pi_duplicate_test_456');

      // First webhook
      await request(app)
        .post('/api/webhooks/stripe')
        .set('Content-Type', 'application/json')
        .set('Stripe-Signature', 't=123,v1=valid')
        .send(eventPayload);

      const driveAfterFirst = await Drive.findById(driveId);
      expect(driveAfterFirst?.fundingRaised).toBe(3000);

      // Duplicate webhook - should be idempotent
      const res = await request(app)
        .post('/api/webhooks/stripe')
        .set('Content-Type', 'application/json')
        .set('Stripe-Signature', 't=124,v1=valid')
        .send(eventPayload);

      expect(res.status).toBe(200);

      const driveAfterSecond = await Drive.findById(driveId);
      expect(driveAfterSecond?.fundingRaised).toBe(3000);
    });

    it('should reject webhook with invalid signature', async () => {
      mockConstructEvent.mockImplementationOnce(() => {
        throw new Error('Invalid signature');
      });

      const eventPayload = paymentIntentSucceededEvent('pi_any');

      const res = await request(app)
        .post('/api/webhooks/stripe')
        .set('Content-Type', 'application/json')
        .set('Stripe-Signature', 'invalid')
        .send(eventPayload);

      expect(res.status).toBe(400);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GET /api/drives/:driveId/funding-progress
  // ═══════════════════════════════════════════════════════════════════════════

  describe('GET /api/drives/:driveId/funding-progress', () => {
    it('should return funding progress for drive', async () => {
      const res = await request(app).get(`/api/drives/${driveId}/funding-progress`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('fundingGoal');
      expect(res.body).toHaveProperty('fundingRaised');
      expect(res.body.fundingRaised).toBe(0);
      expect(res.body.fundingGoal).toBe(50000);
    });

    it('should return 404 for non-existent drive', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app).get(`/api/drives/${fakeId}/funding-progress`);
      expect(res.status).toBe(404);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GET /api/users/me/donations
  // ═══════════════════════════════════════════════════════════════════════════

  describe('GET /api/users/me/donations', () => {
    it('should return user donations when authenticated', async () => {
      mockPaymentIntentsCreate.mockResolvedValue({
        id: 'pi_me_donations_1',
        client_secret: 'pi_secret_xxx',
      });

      await request(app)
        .post(`/api/drives/${driveId}/donate`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ amount: 2000 });

      const res = await request(app)
        .get('/api/users/me/donations')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.donations).toBeInstanceOf(Array);
      expect(res.body.donations.length).toBeGreaterThanOrEqual(1);
      const d = res.body.donations.find((x: { stripePaymentId: string }) => x.stripePaymentId === 'pi_me_donations_1');
      expect(d).toBeDefined();
      expect(d.amount).toBe(2000);
    });

    it('should require authentication', async () => {
      const res = await request(app).get('/api/users/me/donations');
      expect(res.status).toBe(401);
    });
  });
});
