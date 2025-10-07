// tests/e2e/users-edit.spec.ts
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const ADMIN_NIK = process.env.ADMIN_NIK || 'ADM001';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

async function loginAsAdmin(page: import('@playwright/test').Page) {
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => window.localStorage.clear());
  await expect(page.getByRole('button', { name: /Masuk|Login/i })).toBeVisible({ timeout: 60000 });
  await page.locator('input[name="nik"]').fill(ADMIN_NIK);
  await page.locator('input[name="password"]').fill(ADMIN_PASSWORD);
  const loginButton = page.getByRole('button', { name: /Masuk|Login/i });
  await loginButton.click();
  await page.waitForLoadState('networkidle');
}

async function ensureOnUsersPage(page: import('@playwright/test').Page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await loginAsAdmin(page);
  await page.goto(`${BASE_URL}/users`);
  await page.waitForLoadState('networkidle');
  if (page.url().includes('/login')) {
    await loginAsAdmin(page);
    await page.goto(`${BASE_URL}/users`);
    await page.waitForLoadState('networkidle');
  }
  if (page.url().includes('/unauthorized')) {
    throw new Error('Unauthorized to access /users. Use admin credentials.');
  }
  if (page.url().includes('/offline')) {
    await page.goto(`${BASE_URL}/users`);
    await page.waitForLoadState('networkidle');
  }
  await expect(
    page.getByRole('heading', { name: /Manajemen Pengguna/i })
  ).toBeVisible({ timeout: 30000 });
}

test.describe('Users Management - Edit profile', () => {
  test('edit "Teguh" name to "Teguh Suwarno"', async ({ page }) => {
    await ensureOnUsersPage(page);

    // Pastikan viewport desktop agar tombol aksi terlihat
    await page.setViewportSize({ width: 1440, height: 900 });

    const searchInput = page.getByLabel(/Cari \(NIK atau Nama\)/i);

    // Helper: cari baris di tbody yang mengandung teks tertentu
    const findRowByText = (text: string) =>
      page.locator('tbody tr', { hasText: text }).first();

    // Filter ke "Teguh"
    await searchInput.fill('Teguh');
    await page.waitForTimeout(400);

    let row = findRowByText('Teguh');

    // Jika baris tidak ada/terlihat, buat user "Teguh" terlebih dahulu
    if (!(await row.isVisible().catch(() => false))) {
      await page.getByRole('button', { name: /Buat Pengguna Baru/i }).click();

      // Isi form pembuatan pengguna
      await page.getByLabel(/^NIK$/i).fill('TEG001');
      await page.getByLabel(/^Nama Lengkap$/i).fill('Teguh');
      await page.getByLabel(/^Password$/i).fill('teguhtest1');
      // Select native untuk Role
      await page.getByLabel(/^Role$/i).selectOption('employee');

      await page.getByRole('button', { name: /^Simpan$/i }).click();
      await expect(
        page.getByText(/Pengguna baru berhasil dibuat/i)
      ).toBeVisible({ timeout: 10000 });

      // Re-filter untuk memastikan baris muncul
      await searchInput.fill('');
      await page.waitForTimeout(200);
      await searchInput.fill('Teguh');
      await page.waitForTimeout(400);
      row = findRowByText('Teguh');
    }

    await expect(row).toBeVisible();

    // Pastikan kolom Aksi terlihat: scroll container tabel ke kanan
    const tableRegion = page.getByRole('region', { name: /Tabel Pengguna/i });
    await tableRegion.evaluate((el) => {
      (el as HTMLElement).scrollLeft = el.scrollWidth;
    });

    // Pastikan baris target berada dalam viewport
    await row.scrollIntoViewIfNeeded();

    // Temukan tombol Edit
    let editBtn = row.getByRole('button', { name: /^Edit$/i }).first();

    // Fallback selector jika role tidak terbaca
    if (!(await editBtn.isVisible().catch(() => false))) {
      const editBtnAlt = row.locator('button:has-text("Edit")').first();
      if ((await editBtnAlt.count()) > 0) {
        editBtn = editBtnAlt;
      } else {
        // Fallback terakhir: cari global lalu batasi ke baris "Teguh"
        const globalEdit = page
          .locator('tbody tr', { hasText: 'Teguh' })
          .locator('button:has-text("Edit")')
          .first();
        if ((await globalEdit.count()) > 0) {
          editBtn = globalEdit;
        }
      }
    }

    await expect(editBtn).toBeVisible({ timeout: 15000 });
    await editBtn.click();

    // Modal Edit terbuka, isi nama baru
    const nameInput = page.getByLabel(/Nama Lengkap/i);
    await expect(nameInput).toBeVisible();
    await nameInput.fill('Teguh Suwarno');

    // Simpan perubahan
    await page.getByRole('button', { name: /^Simpan$/i }).click();

    // Verifikasi toast sukses
    await expect(
      page.getByText(/Profil pengguna berhasil diperbarui/i)
    ).toBeVisible({ timeout: 10000 });

    // Verifikasi data terbarui
    await searchInput.fill('');
    await page.waitForTimeout(200);
    await searchInput.fill('Teguh Suwarno');
    await page.waitForTimeout(400);
    const updatedRow = page
      .locator('tbody tr', { hasText: 'Teguh Suwarno' })
      .first();
    await expect(updatedRow).toBeVisible();
  });
});
