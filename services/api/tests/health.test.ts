import request from 'supertest';
import { app } from '../src/app';

/**
 * Integration tests for GET /health.
 *
 * Acceptance criteria:
 *   - 200 status code
 *   - JSON body `{ ok: true }`
 *   - Content-Type application/json
 *   - Sub-second response time
 */
describe('GET /health', () => {
  it('should return 200 status code', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  it('should return { ok: true } in the response body', async () => {
    const res = await request(app).get('/health');
    expect(res.body).toEqual({ ok: true });
  });

  it('should return application/json content-type', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['content-type']).toMatch(/application\/json/);
  });

  it('should respond within 1 second', async () => {
    const start = Date.now();
    await request(app).get('/health');
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(1000);
  });
});
