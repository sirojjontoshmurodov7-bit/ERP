// Playwright e2e: ishlab turgan stack'ga qarshi (web + API + baza). Ma'lumotni global-setup API orqali o'zi yaratadi.
// O'zgaruvchilar: E2E_BASE_URL (web), E2E_API_URL (API), E2E_ROOT_LOGIN, E2E_ROOT_PASSWORD (super admin),
// E2E_CHANNEL (masalan msedge: lokal o'rnatilgan brauzer, yuklab olish shart emas). Batafsil: e2e/README.md.
import { defineConfig, devices } from '@playwright/test';

const channel = process.env.E2E_CHANNEL || undefined;

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  timeout: 60_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1, // oqimlar bitta sinov markazini bo'lishadi
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3000',
    locale: 'uz-UZ',
    timezoneId: 'Asia/Tashkent',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], channel, viewport: { width: 1440, height: 900 } }, grepInvert: /@mobile/ },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel }, grep: /@mobile/ },
  ],
});
