// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL || 'http://localhost:5173';

export default defineConfig({
  // Directory untuk e2e tests (sesuai rencana)
  testDir: './tests/e2e',

  // Timeout global per test (cukup longgar untuk menunggu API/WS siap)
  timeout: 90000,

  // Timeout default untuk expect()
  expect: { timeout: 15000 },

  // Jalankan tidak paralel untuk stabilitas awal
  fullyParallel: false,

  // Uji ulang (retries) dimatikan untuk memudahkan debugging
  retries: 0,

  // Reporter HTML
  reporter: [['html', { open: 'never' }]],

  // Pengaturan default untuk semua test
  use: {
    baseURL,
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1280, height: 800 },
    navigationTimeout: 45000,
  },

  // Proyek browser (mulai dari Chromium; bisa tambah Firefox/WebKit jika diperlukan)
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Catatan lingkungan dev (server dikelola di luar Playwright):
  // - Backend API (NestJS): http://localhost:3000
  // - Socket.IO dedicated namespace: ws://localhost:3001/notifications
  // - Frontend (Vite): http://localhost:5173
});