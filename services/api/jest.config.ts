import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  setupFiles: ['<rootDir>/tests/setup.ts'],
  testMatch: ['**/*.test.ts'],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  detectOpenHandles: true,
};

export default config;
