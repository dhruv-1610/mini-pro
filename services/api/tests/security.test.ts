import request from 'supertest';
import { app } from '../src/app';
import { env } from '../src/config/env';

describe('Security hardening', () => {
  describe('Helmet headers', () => {
    it('should set security-related headers on responses', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.headers['x-content-type-options']).toBe('nosniff');
      expect(res.headers['x-frame-options']).toBeDefined();
      expect(res.headers['referrer-policy']).toBeDefined();
      expect(res.headers['cross-origin-resource-policy']).toBeDefined();
    });

    it('should set Content-Security-Policy when using Helmet', async () => {
      const res = await request(app).get('/health');
      expect(res.headers['content-security-policy']).toBeDefined();
    });
  });

  describe('CORS', () => {
    it('should not allow unknown origin', async () => {
      const res = await request(app)
        .get('/health')
        .set('Origin', 'https://evil.example.com');
      expect(res.status).toBe(200);
      const allowOrigin = res.headers['access-control-allow-origin'];
      expect(allowOrigin).not.toBe('https://evil.example.com');
    });

    it('should allow whitelisted origin', async () => {
      const allowed = env.ALLOWED_ORIGINS[0];
      if (!allowed) return;
      const res = await request(app)
        .get('/health')
        .set('Origin', allowed);
      expect(res.status).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe(allowed);
    });
  });

  describe('Rate limiting', () => {
    it('should send rate limit headers (standardHeaders)', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.headers['ratelimit-limit']).toBeDefined();
    });

    it('should return 429 and meaningful message when limit exceeded', async () => {
      const limit = env.RATE_LIMIT_MAX + 10;
      let lastRes: { status: number; body?: { error?: { message?: string } } } | null = null;
      for (let i = 0; i < limit; i++) {
        const r = await request(app).get('/health');
        lastRes = { status: r.status, body: r.body };
        if (r.status === 429) break;
      }
      expect(lastRes?.status).toBe(429);
      expect(lastRes?.body?.error?.message).toBeDefined();
    }, 20000);
  });

  describe('Environment validation', () => {
    it('should have required env vars after setup', () => {
      expect(env.NODE_ENV).toBeDefined();
      expect(env.JWT_SECRET).toBeDefined();
      expect(env.MONGO_URI).toBeDefined();
      expect(env.ALLOWED_ORIGINS).toBeDefined();
      expect(Array.isArray(env.ALLOWED_ORIGINS)).toBe(true);
      expect(env.STRIPE_SECRET_KEY).toBeDefined();
      expect(env.STRIPE_WEBHOOK_SECRET).toBeDefined();
    });
  });
});
