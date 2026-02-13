import request from 'supertest';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { app } from '../src/app';
import { User } from '../src/models/user.model';
import { Report } from '../src/models/report.model';
import { Drive } from '../src/models/drive.model';
import { ActivityLog } from '../src/models/activityLog.model';
import { Impact } from '../src/models/impact.model';

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
  const suffix = role === 'admin' ? 'admin-map' : 'user-map';
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

describe('Map API', () => {
  let userToken: string;
  let adminToken: string;
  let fixtures: { pngPath: string };

  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI!);
    fixtures = ensureFixtures();

    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

    userToken = await getToken('user');
    adminToken = await getToken('admin');
  }, 30_000);

  beforeEach(async () => {
    await ActivityLog.deleteMany({});
    await Impact.deleteMany({});
    await Drive.deleteMany({});
    await Report.deleteMany({});
  });

  afterAll(async () => {
    if (fs.existsSync(path.resolve(__dirname, 'fixtures'))) {
      fs.rmSync(path.resolve(__dirname, 'fixtures'), { recursive: true, force: true });
    }
    if (fs.existsSync(UPLOAD_DIR)) {
      fs.rmSync(UPLOAD_DIR, { recursive: true, force: true });
    }
    await User.deleteMany({});
    await ActivityLog.deleteMany({});
    await Impact.deleteMany({});
    await Drive.deleteMany({});
    await Report.deleteMany({});
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GET /api/map/reports
  // ═══════════════════════════════════════════════════════════════════════════

  describe('GET /api/map/reports', () => {
    it('should fetch reported spots successfully', async () => {
      const createRes = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .field('lat', '12.9716')
        .field('lng', '77.5946')
        .field('description', 'New spot')
        .field('severity', 'high')
        .attach('photo', fixtures.pngPath);

      const reportId = createRes.body.report._id as string;

      const res = await request(app).get('/api/map/reports');

      expect(res.status).toBe(200);
      expect(res.body.reports).toBeInstanceOf(Array);
      expect(res.body.reports.length).toBe(1);
      expect(res.body.reports[0]._id).toBe(reportId);
      expect(res.body.reports[0].status).toBe('reported');
      expect(res.body.reports[0].location).toBeDefined();
      expect(res.body.reports[0].location.type).toBe('Point');
      expect(res.body.reports[0].severity).toBe('high');
      expect(res.body.reports[0].createdAt).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GET /api/map/drives
  // ═══════════════════════════════════════════════════════════════════════════

  describe('GET /api/map/drives', () => {
    it('should fetch active drives successfully', async () => {
      const reportRes = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .field('lat', '12.9716')
        .field('lng', '77.5946')
        .field('description', 'Spot')
        .field('severity', 'high')
        .attach('photo', fixtures.pngPath);

      await request(app)
        .patch(`/api/reports/${reportRes.body.report._id}/verify`)
        .set('Authorization', `Bearer ${adminToken}`);

      const driveRes = await request(app)
        .post('/api/drives')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reportId: reportRes.body.report._id,
          title: 'Active Drive',
          date: futureDate(7),
          fundingGoal: 50000,
          requiredRoles: [{ role: 'Cleaner', capacity: 5 }],
        });

      const res = await request(app).get('/api/map/drives');

      expect(res.status).toBe(200);
      expect(res.body.drives).toBeInstanceOf(Array);
      expect(res.body.drives.length).toBeGreaterThanOrEqual(1);
      const drive = res.body.drives.find((d: { _id: string }) => d._id === driveRes.body.drive._id);
      expect(drive).toBeDefined();
      expect(drive.status).toBe('planned');
      expect(drive.location).toBeDefined();
      expect(drive.title).toBe('Active Drive');
      expect(drive.date).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GET /api/map/cleaned
  // ═══════════════════════════════════════════════════════════════════════════

  describe('GET /api/map/cleaned', () => {
    it('should fetch cleaned locations successfully', async () => {
      const reportRes = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .field('lat', '12.9716')
        .field('lng', '77.5946')
        .field('description', 'Spot')
        .field('severity', 'high')
        .attach('photo', fixtures.pngPath);

      await request(app)
        .patch(`/api/reports/${reportRes.body.report._id}/verify`)
        .set('Authorization', `Bearer ${adminToken}`);

      const driveRes = await request(app)
        .post('/api/drives')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          reportId: reportRes.body.report._id,
          title: 'Completed Drive',
          date: futureDate(7),
          fundingGoal: 50000,
          requiredRoles: [{ role: 'Cleaner', capacity: 5 }],
        });

      await request(app)
        .post(`/api/drives/${driveRes.body.drive._id}/impact`)
        .set('Authorization', `Bearer ${adminToken}`)
        .field('wasteCollected', '50')
        .field('areaCleaned', '200')
        .field('workHours', '8')
        .attach('beforePhotos', fixtures.pngPath)
        .attach('afterPhotos', fixtures.pngPath);

      const res = await request(app).get('/api/map/cleaned');

      expect(res.status).toBe(200);
      expect(res.body.locations).toBeInstanceOf(Array);
      expect(res.body.locations.length).toBeGreaterThanOrEqual(1);
      const loc = res.body.locations.find(
        (l: { _id: string }) => l._id === driveRes.body.drive._id,
      );
      expect(loc).toBeDefined();
      expect(loc.status).toBe('completed');
      expect(loc.location).toBeDefined();
      expect(loc.impactSummary).toBeDefined();
      expect(loc.impactSummary.wasteCollected).toBe(50);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // POST /api/reports/:reportId/merge
  // ═══════════════════════════════════════════════════════════════════════════

  describe('POST /api/reports/:reportId/merge', () => {
    it('should allow admin to merge duplicate into primary', async () => {
      const primaryRes = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .field('lat', '12.9716')
        .field('lng', '77.5946')
        .field('description', 'Primary')
        .field('severity', 'high')
        .attach('photo', fixtures.pngPath);

      const duplicateRes = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .field('lat', '12.9720')
        .field('lng', '77.5950')
        .field('description', 'Duplicate')
        .field('severity', 'medium')
        .attach('photo', fixtures.pngPath);

      const primaryId = primaryRes.body.report._id as string;
      const duplicateId = duplicateRes.body.report._id as string;

      const res = await request(app)
        .post(`/api/reports/${primaryId}/merge`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ duplicateReportId: duplicateId });

      expect(res.status).toBe(200);
      expect(res.body.report).toBeDefined();

      const primaryReport = await Report.findById(primaryId);
      expect(primaryReport?.duplicates.map((id) => id.toString())).toContain(duplicateId);

      const duplicateReport = await Report.findById(duplicateId);
      expect(duplicateReport?.status).toBe('merged');
    });

    it('should reject non-admin merge with 403', async () => {
      const primaryRes = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .field('lat', '12.9716')
        .field('lng', '77.5946')
        .field('description', 'Primary')
        .field('severity', 'high')
        .attach('photo', fixtures.pngPath);

      const duplicateRes = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .field('lat', '12.9720')
        .field('lng', '77.5950')
        .field('description', 'Dup')
        .field('severity', 'medium')
        .attach('photo', fixtures.pngPath);

      const res = await request(app)
        .post(`/api/reports/${primaryRes.body.report._id}/merge`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ duplicateReportId: duplicateRes.body.report._id });

      expect(res.status).toBe(403);
    });

    it('should prevent merging same report into itself', async () => {
      const reportRes = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .field('lat', '12.9716')
        .field('lng', '77.5946')
        .field('description', 'Single')
        .field('severity', 'high')
        .attach('photo', fixtures.pngPath);

      const reportId = reportRes.body.report._id as string;

      const res = await request(app)
        .post(`/api/reports/${reportId}/merge`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ duplicateReportId: reportId });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toMatch(/same|self|cannot/i);
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // GET /api/reports/:reportId/timeline
  // ═══════════════════════════════════════════════════════════════════════════

  describe('GET /api/reports/:reportId/timeline', () => {
    it('should return ordered activity logs ascending by timestamp', async () => {
      const reportRes = await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .field('lat', '12.9716')
        .field('lng', '77.5946')
        .field('description', 'Spot')
        .field('severity', 'high')
        .attach('photo', fixtures.pngPath);

      const reportId = reportRes.body.report._id as string;

      await request(app)
        .patch(`/api/reports/${reportId}/verify`)
        .set('Authorization', `Bearer ${adminToken}`);

      const res = await request(app).get(`/api/reports/${reportId}/timeline`);

      expect(res.status).toBe(200);
      expect(res.body.timeline).toBeInstanceOf(Array);
      expect(res.body.timeline.length).toBeGreaterThanOrEqual(2);

      for (let i = 1; i < res.body.timeline.length; i++) {
        const prev = new Date(res.body.timeline[i - 1].timestamp).getTime();
        const curr = new Date(res.body.timeline[i].timestamp).getTime();
        expect(curr).toBeGreaterThanOrEqual(prev);
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════════════════
  // Bounding box geo query
  // ═══════════════════════════════════════════════════════════════════════════

  describe('Bounding box geo query', () => {
    it('should filter reports by bounding box when provided', async () => {
      await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .field('lat', '12.9716')
        .field('lng', '77.5946')
        .field('description', 'In box')
        .field('severity', 'high')
        .attach('photo', fixtures.pngPath);

      await request(app)
        .post('/api/reports')
        .set('Authorization', `Bearer ${userToken}`)
        .field('lat', '13.5')
        .field('lng', '78.0')
        .field('description', 'Out of box')
        .field('severity', 'low')
        .attach('photo', fixtures.pngPath);

      const res = await request(app).get(
        '/api/map/reports?lngMin=77.5&lngMax=77.7&latMin=12.9&latMax=13.0',
      );

      expect(res.status).toBe(200);
      expect(res.body.reports.length).toBe(1);
      expect(res.body.reports[0].location.coordinates[0]).toBeCloseTo(77.5946, 2);
      expect(res.body.reports[0].location.coordinates[1]).toBeCloseTo(12.9716, 2);
    });
  });
});
