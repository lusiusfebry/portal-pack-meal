// tests/e2e/employee-workflow.spec.ts
import { test, expect, request, APIRequestContext, Page } from '@playwright/test';
import {
  loginAsRole,
  apiLogin,
  setAuthSession,
  expectAuthenticated,
  logout,
  apiCreateOrder,
  apiUpdateOrderStatus,
  apiGetOrders,
  StatusPesanan,
} from '../helpers';

// Reusable: login as employee and setup browser session
async function loginAsEmployee(page: Page) {
  await loginAsRole(page, 'employee');
  await expectAuthenticated(page);
}

// Helper: create API context pointing to backend
async function createApiContext(): Promise<APIRequestContext> {
  const apiBaseURL = process.env.API_BASE_URL ?? 'http://localhost:3000/api';
  return await request.newContext({
    baseURL: apiBaseURL,
    extraHTTPHeaders: { 'Content-Type': 'application/json' },
  });
}

test.describe('Employee Workflow', () => {
  test.afterEach(async ({ page }) => {
    // Isolasi antar test
    await page.evaluate(() => window.localStorage.clear());
    await page.goto('/login');
  });

  test('should create new order successfully', async ({ page }) => {
    await loginAsEmployee(page);

    // Navigate ke form pembuatan pesanan
    await page.goto('/orders/new');

    // Heading toleran terhadap variasi teks ("Buat Pesanan" saat ini)
    await expect(page.getByRole('heading', { name: /Buat Pesanan/i })).toBeVisible();

    // Tunggu dropdown Shift tersedia lalu pilih shiftId=1
    // Jika masih loading, spinner akan terlihat; tunggu hingga select muncul
    const shiftSelect = page.getByLabel('Shift');
    await shiftSelect.waitFor({ state: 'visible', timeout: 15000 });
    await shiftSelect.selectOption('1');

    // Isi jumlah pesanan
    await page.getByLabel('Jumlah Pesanan').fill('10');

    // Isi tanggal hari ini (yyyy-MM-dd)
    const todayIso = new Date().toISOString().slice(0, 10);
    const tanggalInput = page.getByLabel('Tanggal Pesanan');
    await tanggalInput.fill(todayIso);

    // Intercept POST /api/orders untuk menangkap payload order (kodePesanan, id)
    const createOrderRespPromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/orders') &&
        resp.request().method() === 'POST' &&
        resp.status() >= 200 &&
        resp.status() < 300,
      { timeout: 15000 },
    );

    // Submit form (tombol saat ini "Simpan"; toleran terhadap "Buat Pesanan")
    await page.getByRole('button', { name: /(Simpan|Buat Pesanan)/i }).click();

    const createResp = await createOrderRespPromise;
    expect(createResp.ok()).toBeTruthy();
    let createdOrder: any;
    try {
      createdOrder = await createResp.json();
    } catch {
      const bodyText = await createResp.text();
      throw new Error(`Response bukan JSON: ${bodyText}`);
    }
    const createdKode: string | undefined = createdOrder?.kodePesanan;
    const createdId: number | undefined = createdOrder?.id;

    // Expect success toast
    await expect(page.getByText(/Pesanan berhasil dibuat/i)).toBeVisible({ timeout: 10000 });

    // Navigasi ke daftar pesanan sesuai implementasi (navigate('/orders'))
    await expect(page).toHaveURL(/\/orders$/);

    // Gunakan pencarian kode untuk memverifikasi entry baru muncul di daftar
    if (createdKode) {
      await page.getByLabel('Cari Kode Pesanan').fill(createdKode);
    }

    // Status awal seharusnya "Menunggu"
    await expect(page.getByText(/Menunggu\b/i)).toBeVisible({ timeout: 15000 });

    // Verifikasi kode pesanan terlihat (jika tersedia)
    if (createdKode) {
      await expect(page.getByText(createdKode)).toBeVisible();
    }

    // Opsional: klik baris untuk memastikan detail dapat dibuka
    if (typeof createdId === 'number') {
      await page.getByText(createdKode ?? String(createdId)).click();
      await expect(page).toHaveURL(new RegExp(`/orders/${createdId}$`));
      await expect(page.getByRole('heading', { name: 'Detail Pesanan' })).toBeVisible();
    }
  });

  test('should view order history', async ({ page }) => {
    // Siapkan satu pesanan untuk EMP001 dan satu pesanan untuk EMP002 agar verifikasi "own orders" bermakna
    const ctx = await createApiContext();
    const emp1 = await apiLogin(ctx, 'EMP001', 'emp123');
    const emp2 = await apiLogin(ctx, 'EMP002', 'emp123');

    const todayIso = new Date().toISOString().slice(0, 10);
    const orderEmp1 = await apiCreateOrder(ctx, emp1.accessToken, {
      shiftId: 1,
      jumlahPesanan: 2,
      tanggalPesanan: todayIso,
    });
    const orderEmp2 = await apiCreateOrder(ctx, emp2.accessToken, {
      shiftId: 1,
      jumlahPesanan: 3,
      tanggalPesanan: todayIso,
    });

    // Login sebagai employee (EMP001)
    await setAuthSession(page, emp1.user, emp1.accessToken);
    await page.goto('/dashboard');
    await expectAuthenticated(page);

    // Navigate ke daftar pesanan
    await page.goto('/orders');

    // Heading dan subtitle sesuai peran employee
    await expect(page.getByRole('heading', { name: 'Pesanan' })).toBeVisible();
    await expect(page.getByText(/Pesanan Anda\s*\(peran:\s*Employee\)/i)).toBeVisible();

    // Pastikan tabel/kolom kunci terlihat
    await expect(page.getByText('Kode')).toBeVisible();
    await expect(page.getByText('Status')).toBeVisible();

    // Verifikasi hanya pesanan milik EMP001 yang ditampilkan:
    // 1) Cari pesanan EMP002 → seharusnya tidak tampil (EmptyState "Tidak ada hasil")
    await page.getByLabel('Cari Kode Pesanan').fill(orderEmp2?.kodePesanan ?? '');
    // Jika pencarian menghasilkan tidak ada item, komponen menampilkan "Tidak ada hasil"
    await expect(page.getByText(/Tidak ada hasil/i)).toBeVisible({ timeout: 10000 });

    // 2) Cari pesanan EMP001 → seharusnya tampil
    await page.getByLabel('Cari Kode Pesanan').fill(orderEmp1?.kodePesanan ?? '');
    await expect(page.getByText(orderEmp1?.kodePesanan ?? '')).toBeVisible({ timeout: 10000 });

    // Klik baris untuk masuk ke detail
    await page.getByText(orderEmp1?.kodePesanan ?? '').click();
    await expect(page.getByRole('heading', { name: 'Detail Pesanan' })).toBeVisible({ timeout: 15000 });

    // Verifikasi beberapa informasi detail ditampilkan
    await expect(page.getByText(/Informasi Utama/i)).toBeVisible();
    await expect(page.getByText(/Approval/i)).toBeVisible();
    await expect(page.getByText(/Timestamps/i)).toBeVisible();
  });

  test('should see real-time status updates (via WebSocket)', async ({ page }) => {
    const ctx = await createApiContext();

    // Login EMP001 via API, create order
    const emp = await apiLogin(ctx, 'EMP001', 'emp123');
    const todayIso = new Date().toISOString().slice(0, 10);
    const created = await apiCreateOrder(ctx, emp.accessToken, {
      shiftId: 1,
      jumlahPesanan: 1,
      tanggalPesanan: todayIso,
    });

    // Setup session di browser untuk EMP001 dan buka detail
    await setAuthSession(page, emp.user, emp.accessToken);
    await page.goto(`/orders/${created.id}`);
    await expect(page.getByRole('heading', { name: 'Detail Pesanan' })).toBeVisible({ timeout: 30000 });

    // Login sebagai dapur dan update status ke IN_PROGRESS
    const kit = await apiLogin(ctx, 'KIT001', 'kitchen123');
    const updated = await apiUpdateOrderStatus(ctx, kit.accessToken, created.id as number, 'IN_PROGRESS');
    expect(updated?.statusPesanan).toBe('IN_PROGRESS');

    // Tunggu update real-time tanpa refresh:
    // Toast info akan menampilkan "berubah menjadi Diproses"
    await expect(page.getByText(/berubah menjadi\s*Diproses/i)).toBeVisible({ timeout: 15000 });

    // Badge status harus berubah menjadi "Diproses"
    await expect(page.getByText(/\bDiproses\b/i)).toBeVisible({ timeout: 15000 });
  });

  test('should filter orders by status', async ({ page }) => {
    // Login sebagai employee
    await loginAsEmployee(page);

    // Navigate ke daftar pesanan
    await page.goto('/orders');
    await expect(page.getByRole('heading', { name: 'Pesanan' })).toBeVisible();

    // Buka dropdown Status dan pilih "Selesai"
    const statusSelect = page.getByLabel('Status');
    await statusSelect.selectOption('COMPLETE');

    // Terapkan filter
    await page.getByRole('button', { name: /Terapkan Filter/i }).click();

    // Verifikasi bahwa tabel menampilkan hanya pesanan selesai
    // Strategi: pastikan teks status lain tidak muncul, dan "Selesai" muncul (kecuali data kosong)
    // Jika kosong, EmptyState "Belum ada pesanan" atau "Tidak ada hasil" dapat muncul — ini tetap valid.
    const emptyState1 = page.getByText(/Belum ada pesanan/i);
    const emptyState2 = page.getByText(/Tidak ada hasil/i);

    // Jika tidak empty, harus ada "Selesai" terlihat
    try {
      await expect.soft(emptyState1.or(emptyState2)).toBeVisible({ timeout: 5000 });
      // Jika empty state terlihat, anggap filter berfungsi walau tanpa data selesai
    } catch {
      // Non-empty: pastikan ada label "Selesai"
      await expect(page.getByText(/\bSelesai\b/i)).toBeVisible({ timeout: 15000 });

      // Pastikan tidak ada label status lain yang muncul di daftar
      const otherStatuses = ['Menunggu', 'Diproses', 'Siap', 'Diantar', 'Ditolak', 'Menunggu Persetujuan'];
      for (const label of otherStatuses) {
        const locator = page.getByText(new RegExp(`\\b${label}\\b`, 'i'));
        await expect.soft(locator).toHaveCount(0);
      }
    }
  });

  test('should not access admin pages', async ({ page }) => {
    await loginAsEmployee(page);

    // Akses halaman admin-only
    await page.goto('/users');

    // Redirect ke /unauthorized
    await expect(page).toHaveURL(/\/unauthorized$/);

    // Pesan akses ditolak
    await expect(page.getByRole('heading', { name: 'Akses Ditolak' })).toBeVisible();
    await expect(page.getByText(/tidak memiliki izin/i)).toBeVisible();
  });
});