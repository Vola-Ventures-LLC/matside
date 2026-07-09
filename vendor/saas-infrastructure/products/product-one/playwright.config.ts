import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';

// Load environment variables from .env.test
dotenv.config({ path: '.env.test' });

export default defineConfig({
  testDir: './e2e',

  // Ignore non-test files
  testIgnore: ['**/page-objects/**', '**/fixtures/**', '**/utils/**', '**/test-data/**'],

  // Maximum time one test can run
  timeout: 60 * 1000, // 60s per test

  // Test execution settings
  fullyParallel: true,
  forbidOnly: !!process.env.CI, // Prevent .only in CI
  retries: process.env.CI ? 2 : 0, // Retry twice in CI
  workers: process.env.CI ? 2 : undefined, // Limit parallelism in CI

  // Reporters
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'], // Console output
    ...(process.env.CI ? [['github'] as const] : []), // GitHub Actions annotations
  ],

  // Global setup/teardown
  globalSetup: './e2e/utils/global-setup.ts',

  use: {
    // Base URL
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',

    // Browser context options
    trace: process.env.CI ? 'retain-on-failure' : 'on-first-retry',
    screenshot: 'only-on-failure',
    video: process.env.CI ? 'retain-on-failure' : 'off',

    // Navigation timeout
    navigationTimeout: 15 * 1000,

    // Action timeout
    actionTimeout: 10 * 1000,
  },

  projects: [
    // Setup project - runs first to create auth states
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // Authenticated user tests
    {
      name: 'chromium-user',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/user.json',
      },
      dependencies: ['setup'],
      testIgnore: [/.*\/(admin|owner|auth)\/.*/, /.*\/public\/.*/], // Skip admin/owner/auth/public tests
    },

    // Admin user tests
    {
      name: 'chromium-admin',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/admin.json',
      },
      dependencies: ['setup'],
      testMatch: /.*\/admin\/.*/, // Only admin tests
    },

    // Unauthenticated tests (login, signup, public pages)
    {
      name: 'chromium-guest',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      testMatch: /.*\/(auth|public)\/.*/, // Only auth/public tests
    },
  ],

  // Web server (starts Vite preview server)
  webServer: {
    command: 'pnpm preview --port 5173',
    port: 5173,
    timeout: 120 * 1000, // 2 minutes to start
    reuseExistingServer: !process.env.CI,
    env: {
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL_TEST || '',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY_TEST || '',
    },
  },
});
