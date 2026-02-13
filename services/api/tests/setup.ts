/**
 * Jest test environment setup.
 *
 * Loaded via `setupFiles` in jest.config.ts — runs BEFORE any
 * module imports in test files, ensuring env vars are available
 * when config/env.ts validates at import time.
 */

process.env.NODE_ENV = 'test';
process.env.PORT = '4001';
process.env.API_HOST = '127.0.0.1';
process.env.MONGO_URI = 'mongodb://localhost:27017/cleanupcrew_test';
process.env.JWT_SECRET = 'test-jwt-secret-key-minimum-8';
process.env.JWT_EXPIRES_IN = '1h';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-min-8';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.CORS_ORIGIN = 'http://localhost:5173';
process.env.RATE_LIMIT_WINDOW_MS = '900000';
process.env.RATE_LIMIT_MAX = '1000';
process.env.UPLOAD_DIR = './uploads-test';
process.env.MAX_FILE_SIZE = '5242880';
process.env.LOG_LEVEL = 'error';
process.env.STRIPE_SECRET_KEY = 'sk_test_mock';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_mock';
