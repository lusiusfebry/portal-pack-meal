// tests/e2e/auth.spec.ts
import { test, expect, Page } from '@playwright/test';
import { loginAsRole, logout, expectAuthenticated, expectUnauthenticated } from '../helpers';

const STORAGE_KEY = 'bebang-auth-storage';

async function getPersistedAuth(page: Page): Promise<{ user: any; accessToken: string } | null> {
  const raw = await page.evaluate((key) => window.localStorage.getItem(key), STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return parsed?.state ?? null;
  } catch {
    return null;
  }
}

test.describe('Authentication Flow', () => {
  test.afterEach(async ({ page }) => {
    // Bersihkan storage dan kembali ke login agar tiap test terisolasi
    await page.evaluate(() => window.localStorage.clear());
    // Kembali ke halaman login (tidak fatal bila baseURL tidak aktif)
    await page.goto('/login');
  });

  test('should login successfully with valid credentials (Employee)', async ({ page }) => {
    // Navigate ke /login
    await page.goto('/login');

    // Isi form login
    await page.getByLabel('NIK').fill('EMP001');
    await page.getByLabel('Password').fill('emp123');

    // Submit
    await page.getByRole('button', { name: 'Masuk' }).click();

    // Tunggu redirect ke dashboard
    await expect(page).toHaveURL(/\/dashboard$/);

    // Verifikasi heading dashboard employee
    await expect(page.getByRole('heading', { name: 'Dashboard Karyawan' })).toBeVisible();

    // Verifikasi greeting yang memuat nama user di halaman dashboard
    await expect(page.getByText(/Halo,\s+.+\s+—/i)).toBeVisible();

    // Verifikasi localStorage memiliki auth data (Zustand persist)
    const state = await getPersistedAuth(page);
    expect(state).toBeTruthy();
    expect(typeof state?.accessToken).toBe('string');
    expect(state?.accessToken?.length ?? 0).toBeGreaterThan(0);
    expect(state?.user).toBeTruthy();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.getByLabel('NIK').fill('INVALID');
    await page.getByLabel('Password').fill('wrong');

    await page.getByRole('button', { name: 'Masuk' }).click();

    // Error message berasal dari store: e?.response?.data?.message || e?.message || 'Login gagal'
    // Gunakan regex yang toleran
    const errorPattern =
      /(Invalid credentials|Login gagal|Unauthorized|nik.*password.*salah|Gagal login)/i;
    await expect(page.getByRole('alert')).toHaveText(errorPattern);

    // Tetap di halaman login
    await expect(page).toHaveURL(/\/login$/);
    await expectUnauthenticated(page);
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    // Pastikan storage kosong
    await page.evaluate(() => window.localStorage.clear());

    // Akses protected route langsung
    await page.goto('/dashboard');

    // Seharusnya redirect ke login
    await expect(page).toHaveURL(/\/login$/);
    await expectUnauthenticated(page);
  });

  test('should logout successfully', async ({ page }) => {
    // Login sebagai employee via helper (set session di localStorage + goto /dashboard)
    await loginAsRole(page, 'employee');

    // Pastikan terautentikasi
    await expectAuthenticated(page);
    await expect(page.getByRole('heading', { name: 'Dashboard Karyawan' })).toBeVisible();

    // Klik tombol Logout di Sidebar (visible secara default)
    await page.getByRole('button', { name: 'Logout' }).click();

    // Redirect ke login
    await expect(page).toHaveURL(/\/login$/);
    await expectUnauthenticated(page);

    // Verifikasi storage: boleh kosong ATAU berisi state dengan token & user null
    const state = await getPersistedAuth(page);
    if (state === null) {
      // localStorage key dihapus
      expect(state).toBeNull();
    } else {
      // key masih ada namun state bersih
      expect(state.user).toBeNull();
      expect(state.accessToken).toBeNull();
    }
  });

  test('should restore session on page refresh', async ({ page }) => {
    // Login sebagai employee
    await loginAsRole(page, 'employee');
    await expectAuthenticated(page);

    // Reload halaman
    await page.reload();

    // Tetap di /dashboard
    await expect(page).toHaveURL(/\/dashboard$/);

    // Greeting dengan nama user tetap terlihat
    await expect(page.getByText(/Halo,\s+.+\s+—/i)).toBeVisible();

    // Persisted state tetap ada
    const state = await getPersistedAuth(page);
    expect(state).toBeTruthy();
    expect(typeof state?.accessToken).toBe('string');
    expect(state?.user).toBeTruthy();
  });

  test('should login with different roles (Admin, Dapur, Delivery)', async ({ page }) => {
    // Admin
    await loginAsRole(page, 'admin');
    await expectAuthenticated(page);
    await expect(page.getByRole('heading', { name: 'Dashboard Admin' })).toBeVisible();
    // Sidebar menu items spesifik admin
    await expect(page.getByRole('link', { name: 'Users' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Approval Center' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Reports' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Audit Trail' })).toBeVisible();
    await logout(page);

    // Dapur
    await loginAsRole(page, 'dapur');
    await expectAuthenticated(page);
    await expect(page.getByRole('heading', { name: 'Dashboard Dapur' })).toBeVisible();
    // Sidebar menu items spesifik dapur
    await expect(page.getByRole('link', { name: 'Order Queue' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Pending Approvals' })).toBeVisible();
    await logout(page);

    // Delivery
    await loginAsRole(page, 'delivery');
    await expectAuthenticated(page);
    await expect(page.getByRole('heading', { name: 'Dashboard Delivery' })).toBeVisible();
    // Sidebar menu items spesifik delivery
    await expect(page.getByRole('link', { name: 'Ready Orders' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'My Deliveries' })).toBeVisible();
    await logout(page);
  });
});