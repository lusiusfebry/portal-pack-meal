// tests/helpers/auth.helper.ts
import { APIRequestContext, request, Page, expect } from '@playwright/test';

type LoginResult = { accessToken: string; user: any };
type TestRole = 'admin' | 'employee' | 'dapur' | 'delivery';

const STORAGE_KEY = 'bebang-auth-storage';

const ROLE_CREDENTIALS: Record<TestRole, { nik: string; password: string }> = {
  admin: { nik: 'ADM001', password: 'admin123' },
  employee: { nik: 'EMP001', password: 'emp123' },
  dapur: { nik: 'KIT001', password: 'kitchen123' },
  delivery: { nik: 'DEL001', password: 'delivery123' },
};

/**
 * Login melalui API backend dan mengembalikan token & user.
 * Backend menggunakan field 'nik' (bukan 'username').
 */
export async function apiLogin(ctx: APIRequestContext, nik: string, password: string): Promise<LoginResult> {
  try {
// Normalisasi base URL agar path login selalu ke /api/auth/login
const apiBaseURLRaw = process.env.API_BASE_URL ?? 'http://localhost:3000/api';
const apiBaseURL = apiBaseURLRaw.endsWith('/') ? apiBaseURLRaw : apiBaseURLRaw + '/';
const loginPath = new URL('auth/login', apiBaseURL).toString();
    const response = await ctx.post('auth/login', {
      data: { nik, password },
    });

    // Assert OK
    expect(response.ok(), `Login API gagal: status=${response.status()} url=${response.url()}`).toBeTruthy();

    const json = (await response.json()) as any;
    const accessToken = json?.accessToken;
    const user = json?.user;

    if (!accessToken || !user) {
      const bodyText = await response.text();
      throw new Error(
        `Login API berhasil tetapi payload tidak lengkap. accessToken=${String(accessToken)} user=${typeof user}. Body: ${bodyText}`,
      );
    }

    return { accessToken, user };
  } catch (err: any) {
    const status = err?.status ?? 'unknown';
    const message =
      err?.message ??
      (typeof err === 'string' ? err : 'Kesalahan tidak diketahui saat memanggil auth/login');
    throw new Error(`Gagal login via API (nik=${nik}) [status=${status}]: ${message}`);
  }
}

/**
 * Setel session auth di localStorage (Zustand persist format).
 * Gunakan addInitScript agar storage terisi sebelum app scripts berjalan.
 */
export async function setAuthSession(page: Page, user: any, accessToken: string): Promise<void> {
  await page.addInitScript(
    ({ key, user, accessToken }) => {
      try {
        const value = JSON.stringify({ state: { user, accessToken }, version: 0 });
        window.localStorage.setItem(key, value);
      } catch {
        // ignore
      }
    },
    { key: STORAGE_KEY, user, accessToken },
  );
}

/**
 * One-step login untuk E2E: buat API context, login, isi session, lalu (opsional) navigasi.
 */
export async function loginAsRole(page: Page, role: TestRole): Promise<LoginResult> {
  const creds = ROLE_CREDENTIALS[role];
  if (!creds) {
    throw new Error(`Role tidak dikenali: ${role as string}`);
  }

  const apiBaseURL = process.env.API_BASE_URL ?? 'http://localhost:3000/api/';
  const api = await request.newContext({
    baseURL: apiBaseURL,
    extraHTTPHeaders: { 'Content-Type': 'application/json' },
  });

  const { user, accessToken } = await apiLogin(api, creds.nik, creds.password);
  await setAuthSession(page, user, accessToken);

  // Pastikan init script diterapkan dengan memuat halaman terlindungi.
  await page.goto('/dashboard');

  return { user, accessToken };
}

/**
 * Logout bersih untuk isolasi test: hapus storage & kembali ke halaman login.
 */
export async function logout(page: Page): Promise<void> {
  await page.evaluate(() => window.localStorage.clear());
  await page.goto('/login');
}

/**
 * Assert bahwa user terautentikasi: tidak berada di /login dan topbar muncul.
 */
export async function expectAuthenticated(page: Page): Promise<void> {
  await expect(page).not.toHaveURL(/\/login$/);
  // Topbar memiliki role="banner"
  await expect(page.getByRole('banner')).toBeVisible();
  // Tombol Notifications di topbar
  await expect(page.getByRole('button', { name: 'Notifications' })).toBeVisible();
}

/**
 * Assert bahwa user tidak terautentikasi: berada di /login dan form login terlihat.
 */
export async function expectUnauthenticated(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByLabel('NIK')).toBeVisible();
  await expect(page.getByLabel('Password')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Masuk' })).toBeVisible();
}