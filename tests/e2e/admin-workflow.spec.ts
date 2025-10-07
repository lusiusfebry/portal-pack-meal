// tests/e2e/admin-workflow.spec.ts
import { test, expect, request, APIRequestContext, Page, Download } from '@playwright/test';
import {
  loginAsRole,
  expectAuthenticated,
  apiLogin,
  apiCreateOrder,
  apiUpdateOrderStatus,
  apiGetOrders,
  StatusPesanan,
} from '../helpers';

// Helper: create API context pointing to backend
async function createApiContext(): Promise<APIRequestContext> {
  const apiBaseURL = process.env.API_BASE_URL ?? 'http://localhost:3000/api';
  return await request.newContext({
    baseURL: apiBaseURL,
    extraHTTPHeaders: { 'Content-Type': 'application/json' },
  });
}

// Helper: login as admin and setup browser session
async function loginAsAdmin(page: Page) {
  await loginAsRole(page, 'admin');
  await expectAuthenticated(page);
}

// Helper: locate user row in users table by NIK text
function getUserRowByNik(page: Page, nik: string) {
  return page.locator('tr', { hasText: nik }).first();
}

// Helper: robust locator for action menu within a row
function getRowActionMenu(page: Page, row: ReturnType<typeof page.locator>) {
  // Assume an action button with icon or label like "Aksi", "Actions", "...", or kebab menu
  return row.locator('button, [role="button"]').filter({
    hasText: /Aksi|Actions|\.\.\.|Menu|Opsi/i,
  }).first().or(row.locator('button[aria-label="Actions"]').first());
}

// Helper: request rejection via API (kitchen initiates)
async function apiRequestRejection(
  ctx: APIRequestContext,
  accessToken: string,
  orderId: number,
  notes: string,
): Promise<any> {
  const resp = await ctx.post(`/orders/${orderId}/request-rejection`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    data: { catatanDapur: notes },
  });
  expect(resp.ok(), `POST /orders/${orderId}/request-rejection failed: ${resp.status()} ${resp.url()}`).toBeTruthy();
  try {
    return await resp.json();
  } catch {
    const txt = await resp.text();
    throw new Error(`request-rejection response not JSON: ${txt}`);
  }
}

// Helper: select date range inputs with tolerant labels/placeholders
async function fillReportsDateRange(page: Page, startIso: string, endIso: string) {
  // Try labeled inputs first
  const startLabel = page.getByLabel(/Tanggal Mulai|Dari Tanggal|Start Date/i);
  const endLabel = page.getByLabel(/Tanggal Akhir|Sampai Tanggal|End Date/i);
  try {
    await startLabel.fill(startIso);
    await endLabel.fill(endIso);
    return;
  } catch {
    // Fallback: pick first two date inputs
    const dateInputs = page.locator('input[type="date"]');
    const count = await dateInputs.count();
    if (count >= 2) {
      await dateInputs.nth(0).fill(startIso);
      await dateInputs.nth(1).fill(endIso);
      return;
    }
  }
  // Last resort: use any textboxes with date-like behavior
  const textboxes = page.getByRole('textbox');
  await textboxes.nth(0).fill(startIso);
  await textboxes.nth(1).fill(endIso);
}

// Helper: select GroupBy option (DAILY/WEEKLY/MONTHLY) with tolerant selector
async function selectGroupBy(page: Page, value: 'DAILY' | 'WEEKLY' | 'MONTHLY') {
  // Prefer native select
  const select = page.getByLabel(/Group\s*By|Pengelompokan|Kelompok/i);
  try {
    await select.selectOption(value);
    return;
  } catch {
    // Fallback: use a custom select button and listbox
    const trigger = page.getByRole('button', { name: /Group\s*By|Pengelompokan|Kelompok/i }).first();
    await trigger.click();
    const option = page.getByRole('option', { name: new RegExp(value, 'i') }).first();
    await option.click();
  }
}

// Helper: click "Terapkan" apply button for filters with tolerant labels
async function clickApply(page: Page) {
  await page.getByRole('button', { name: /Terapkan|Apply|Submit|Filter/i }).click();
}

test.describe('Administrator Workflow', () => {
  test.afterEach(async ({ page }) => {
    // Isolasi antar test
    await page.evaluate(() => window.localStorage.clear());
    await page.goto('/login');
  });

  test('should view admin dashboard with KPIs and charts', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/dashboard');

    // Heading: toleran terhadap variasi "Dashboard Admin" vs "Dashboard Administrator"
    await expect(page.getByRole('heading', { name: /Dashboard (Admin(istrator)?)/i })).toBeVisible();

    // KPI cards are visible
    await expect(page.getByText(/\bTotal Pesanan\b/i)).toBeVisible();
    await expect(page.getByText(/\bDalam Proses\b/i)).toBeVisible();
    await expect(page.getByText(/\bSelesai\b/i)).toBeVisible();
    await expect(page.getByText(/\bMenunggu Persetujuan\b/i)).toBeVisible();

    // Charts are rendered (Recharts renders <svg>)
    const chartsSvg = page.locator('svg');
    await expect(chartsSvg.first()).toBeVisible();

    // Recent activity section visible
    await expect(page.getByText(/Aktivitas Terkini|Recent Activity/i)).toBeVisible();
  });

  test('should create new user account', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/users');

    // Open create user modal
    await page.getByRole('button', { name: /Buat Pengguna Baru|Tambah Pengguna|Create User/i }).click();

    // Modal opened
    await expect(page.getByRole('heading', { name: /Buat Pengguna|Create User/i })).toBeVisible();

    // Fill form
    await page.getByLabel(/NIK/i).fill('TEST001');
    await page.getByLabel(/Nama Lengkap|Nama/i).fill('Test User');
    await page.getByLabel(/Password/i).fill('test123');
    // Role select
    const roleSelect = page.getByLabel(/Role|Peran/i);
    try {
      await roleSelect.selectOption('employee');
    } catch {
      // Fallback for custom select components
      await roleSelect.click();
      await page.getByRole('option', { name: /employee|karyawan/i }).click();
    }

    // Intercept POST /api/users
    const createRespPromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/users') &&
        resp.request().method() === 'POST' &&
        resp.status() >= 200 &&
        resp.status() < 300,
      { timeout: 15000 },
    );

    // Submit
    await page.getByRole('button', { name: /Buat Pengguna|Simpan|Create/i }).click();

    const createResp = await createRespPromise;
    expect(createResp.ok()).toBeTruthy();

    // Expect success toast
    await expect(page.getByText(/Pengguna berhasil dibuat|Berhasil membuat pengguna|User created/i)).toBeVisible({
      timeout: 10000,
    });

    // Verify new user appears in table
    const row = getUserRowByNik(page, 'TEST001');
    await expect(row).toBeVisible({ timeout: 20000 });
    await expect(row.getByText(/Test User/i)).toBeVisible();
  });

  test('should activate/deactivate user', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/users');

    // Ensure at least one row is present; prefer the one we created if exists
    const targetRow =
      (await getUserRowByNik(page, 'TEST001').count()) > 0
        ? getUserRowByNik(page, 'TEST001')
        : page.locator('tbody tr').first();
    await expect(targetRow).toBeVisible({ timeout: 20000 });

    // Open action menu
    const menuBtn = getRowActionMenu(page, targetRow);
    await menuBtn.click();

    // Determine toggle action label based on current status badge
    const isInactive = (await targetRow.getByText(/\bNonaktif\b/i).count()) > 0;
    const toggleLabel = isInactive ? /Aktifkan|Activate/i : /Nonaktifkan|Deactivate/i;

    // Intercept PATCH /api/users/:id/status
    const patchRespPromise = page.waitForResponse(
      (resp) =>
        /\/api\/users\/\d+\/status/.test(resp.url()) &&
        resp.request().method() === 'PATCH' &&
        resp.status() >= 200 &&
        resp.status() < 300,
      { timeout: 15000 },
    );

    // Click toggle
    await page.getByRole('menuitem').filter({ hasText: toggleLabel }).first().click().catch(async () => {
      // Fallback if menuitem role not used
      await page.getByRole('button', { name: toggleLabel }).click();
    });

    const patchResp = await patchRespPromise;
    expect(patchResp.ok()).toBeTruthy();

    // Expect success toast
    await expect(
      page.getByText(/status pengguna.*(diubah|berhasil)|User status updated|Berhasil mengubah status/i),
    ).toBeVisible({
      timeout: 10000,
    });

    // Verify status badge updates in table
    if (isInactive) {
      await expect(targetRow.getByText(/\bAktif\b/i)).toBeVisible({ timeout: 20000 });
    } else {
      await expect(targetRow.getByText(/\bNonaktif\b/i)).toBeVisible({ timeout: 20000 });
    }
  });

  test('should reset user password', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/users');

    // Find a user row (prefer TEST001)
    const row =
      (await getUserRowByNik(page, 'TEST001').count()) > 0
        ? getUserRowByNik(page, 'TEST001')
        : page.locator('tbody tr').first();
    await expect(row).toBeVisible({ timeout: 20000 });

    // Open action menu
    const menuBtn = getRowActionMenu(page, row);
    await menuBtn.click();

    // Click "Reset Password"
    const resetBtn = page.getByRole('menuitem').filter({ hasText: /Reset Password/i }).first();
    await resetBtn.click().catch(async () => {
      await page.getByRole('button', { name: /Reset Password/i }).click();
    });

    // Expect confirmation dialog
    await expect(page.getByRole('dialog').getByText(/Konfirmasi|Yakin|Confirm/i)).toBeVisible({ timeout: 10000 });

    // Intercept POST /api/users/:id/reset-password
    const postRespPromise = page.waitForResponse(
      (resp) =>
        /\/api\/users\/\d+\/reset-password/.test(resp.url()) &&
        resp.request().method() === 'POST' &&
        resp.status() >= 200 &&
        resp.status() < 300,
      { timeout: 15000 },
    );

    // Confirm
    await page.getByRole('button', { name: /Reset|Ya|Confirm/i }).click();

    const postResp = await postRespPromise;
    expect(postResp.ok()).toBeTruthy();

    // Expect success toast with temp password
    await expect(
      page.getByText(/Password sementara|Temporary password|password.*sementara/i),
    ).toBeVisible({ timeout: 10000 });

    // Verify temp password displayed (stub implementation)
    await expect(
      page.getByText(/pwd-|temp-|sementara:|password:\s+[A-Za-z0-9]+/i),
    ).toBeVisible({ timeout: 10000 });
  });

  test('should view and approve pending approval requests', async ({ page }) => {
    const ctx = await createApiContext();

    // 1) Create order as employee
    const emp = await apiLogin(ctx, 'EMP001', 'emp123');
    const todayIso = new Date().toISOString().slice(0, 10);
    const created = await apiCreateOrder(ctx, emp.accessToken, {
      shiftId: 1,
      jumlahPesanan: 2,
      tanggalPesanan: todayIso,
    });
    const orderId = created.id as number;

    // 2) Kitchen requests rejection
    const kit = await apiLogin(ctx, 'KIT001', 'kitchen123');
    const pending = await apiRequestRejection(ctx, kit.accessToken, orderId, 'E2E: alasan uji penolakan');
    expect(pending?.requiresApproval ?? false).toBeTruthy();

    // 3) Admin approves
    await loginAsAdmin(page);
    await page.goto('/approvals');

    // Heading
    await expect(page.getByRole('heading', { name: /Pusat Persetujuan/i })).toBeVisible();

    // Pending approval appears
    await expect(page.getByText(created?.kodePesanan ?? '')).toBeVisible({ timeout: 20000 });

    // Click "Tinjau"
    await page.getByRole('button', { name: /Tinjau|Review/i }).click();

    // Approval modal open
    await expect(page.getByRole('dialog').getByText(/Keputusan|Approval|Persetujuan/i)).toBeVisible({ timeout: 10000 });

    // Select "Setujui Permintaan"
    const approveRadio = page.getByLabel(/Setujui Permintaan|Approve Request/i);
    await approveRadio.check().catch(async () => {
      await page.getByRole('radio', { name: /Setujui|Approve/i }).first().check();
    });

    // Notes optional
    const notes = page.getByLabel(/Catatan Admin|Notes/i).first();
    await notes.fill('Disetujui oleh admin E2E');

    // Intercept decision API
    const decisionRespPromise = page.waitForResponse(
      (resp) =>
        /\/api\/orders\/\d+\/approve-reject/.test(resp.url()) &&
        resp.request().method() === 'POST' &&
        resp.status() >= 200 &&
        resp.status() < 300,
      { timeout: 15000 },
    );

    // Click "Kirim Keputusan"
    await page.getByRole('button', { name: /Kirim Keputusan|Submit Decision/i }).click();

    const decisionResp = await decisionRespPromise;
    expect(decisionResp.ok()).toBeTruthy();

    // Success toast
    await expect(
      page.getByText(/Keputusan dikirim|Approval berhasil|Berhasil memproses persetujuan/i),
    ).toBeVisible({ timeout: 10000 });

    // Verify order disappears from pending list
    await expect(page.getByText(created?.kodePesanan ?? '')).toBeHidden({ timeout: 20000 });
  });

  test('should view consumption report and export CSV', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/reports');

    // Heading
    await expect(page.getByRole('heading', { name: /Laporan & Analitik|Reports & Analytics/i })).toBeVisible();

    // Click "Konsumsi" tab
    await page.getByRole('tab', { name: /Konsumsi|Consumption/i }).click().catch(async () => {
      await page.getByRole('button', { name: /Konsumsi|Consumption/i }).click();
    });

    // Select date range
    const startIso = new Date().toISOString().slice(0, 10);
    const endIso = startIso;
    await fillReportsDateRange(page, startIso, endIso);

    // Select groupBy: DAILY
    await selectGroupBy(page, 'DAILY');

    // Intercept GET /api/reports/consumption
    const dataRespPromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/reports/consumption') &&
        resp.request().method() === 'GET' &&
        resp.status() >= 200 &&
        resp.status() < 300,
      { timeout: 15000 },
    );

    // Apply
    await clickApply(page);

    const dataResp = await dataRespPromise;
    expect(dataResp.ok()).toBeTruthy();

    // Verify chart rendered with data (svg visible)
    await expect(page.locator('svg').first()).toBeVisible();

    // Export CSV
    const downloadPromise: Promise<Download> = page.waitForEvent('download', { timeout: 15000 }).catch(async () => {
      // If app uses blob + a tag, intercept network as fallback
      return Promise.reject(new Error('No download event captured'));
    });

    // Also intercept CSV network call
    const csvRespPromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/reports/consumption') &&
        resp.url().includes('format=csv') &&
        resp.request().method() === 'GET' &&
        resp.status() >= 200 &&
        resp.status() < 300,
      { timeout: 15000 },
    );

    await page.getByRole('button', { name: /Unduh CSV|Download CSV/i }).click();

    // Verify either download event or CSV response
    try {
      const download = await downloadPromise;
      const suggested = await download.suggestedFilename();
      expect(suggested.toLowerCase()).toContain('csv');
    } catch {
      const csvResp = await csvRespPromise;
      expect(csvResp.ok()).toBeTruthy();
    }
  });

  test('should search audit trail logs', async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/audit');

    // Heading
    await expect(page.getByRole('heading', { name: /Audit Trail|Riwayat Audit/i })).toBeVisible();

    // Enter search query: "ORDER"
    // Prefer labeled or placeholder inputs
    const searchInput =
      (await page.getByLabel(/Pencarian|Kata Kunci|Query|Search/i).count()) > 0
        ? page.getByLabel(/Pencarian|Kata Kunci|Query|Search/i).first()
        : page.getByPlaceholder(/Cari|Search|Kata Kunci|Keyword/i).first();
    await searchInput.fill('ORDER');

    // Intercept GET /api/reports/audit-trail
    const respPromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/reports/audit-trail') &&
        resp.request().method() === 'GET' &&
        resp.status() >= 200 &&
        resp.status() < 300,
      { timeout: 15000 },
    );

    // Click "Terapkan"
    await clickApply(page);

    const resp = await respPromise;
    expect(resp.ok()).toBeTruthy();

    // Verify filtered logs displayed and contain "ORDER"
    await expect(page.getByText(/ORDER/i)).toBeVisible({ timeout: 20000 });
    // At least one log item visible
    await expect(page.locator('tbody tr').first()).toBeVisible({ timeout: 20000 });
  });

  test('should view order history in audit trail', async ({ page }) => {
    const ctx = await createApiContext();

    // Create order via API and note kodePesanan
    const emp = await apiLogin(ctx, 'EMP001', 'emp123');
    const todayIso = new Date().toISOString().slice(0, 10);
    const created = await apiCreateOrder(ctx, emp.accessToken, {
      shiftId: 1,
      jumlahPesanan: 1,
      tanggalPesanan: todayIso,
    });

    const kode = created?.kodePesanan ?? '';
    expect(kode.length).toBeGreaterThan(0);

    await loginAsAdmin(page);
    await page.goto('/audit');

    // Open order history action
    // Could be a button or link "Lihat Riwayat Pesanan"
    const historyButton = page.getByRole('button', { name: /Lihat Riwayat Pesanan|Order History/i }).first();
    if ((await historyButton.count()) === 0) {
      // Fallback: a link
      const historyLink = page.getByRole('link', { name: /Lihat Riwayat Pesanan|Order History/i }).first();
      await historyLink.click();
    } else {
      await historyButton.click();
    }

    // Enter order code
    const codeInput =
      (await page.getByLabel(/Kode Pesanan|Order Code|Kode/i).count()) > 0
        ? page.getByLabel(/Kode Pesanan|Order Code|Kode/i).first()
        : page.getByPlaceholder(/Kode Pesanan|Order Code/i).first();
    await codeInput.fill(kode);

    // Intercept GET /api/reports/audit-trail/order/:kodePesanan
    const respPromise = page.waitForResponse(
      (resp) =>
        /\/api\/reports\/audit-trail\/order\/[A-Za-z0-9\-]+/.test(resp.url()) &&
        resp.request().method() === 'GET' &&
        resp.status() >= 200 &&
        resp.status() < 300,
      { timeout: 15000 },
    );

    // Apply or submit
    await clickApply(page);

    const resp = await respPromise;
    expect(resp.ok()).toBeTruthy();

    // Verify chronological timeline is displayed
    await expect(page.getByText(/Timeline|Riwayat|Urutan Kronologis/i)).toBeVisible({ timeout: 20000 });

    // Verify order-related actions are shown
    await expect(page.getByText(new RegExp(kode))).toBeVisible({ timeout: 20000 });
    await expect(
      page.getByText(/ORDER|Pesanan|Status|Dibuat|Diproses|Siap|Diantar|Selesai|Ditolak|Menunggu Persetujuan/i),
    ).toBeVisible();
  });
});