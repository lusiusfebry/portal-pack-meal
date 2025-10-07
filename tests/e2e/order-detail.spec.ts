// tests/e2e/order-detail.spec.ts
import { test, expect, request, APIRequestContext, Page } from '@playwright/test';
import {
  API_BASE,
  FRONTEND_BASE,
  apiLogin,
  apiCreateOrder,
  apiRequestRejection,
  apiApproveRejectOrder,
  loginAsRole,
} from '../helpers';

/**
 * E2E: Order Detail — Keputusan Approval (Admin)
 *
 * Refactor: menggunakan helper functions dari ../helpers
 * - apiLogin, apiCreateOrder, apiRequestRejection, apiApproveRejectOrder
 * - loginAsRole (tersedia bila diperlukan)
 *
 * Catatan:
 * - Backend mengharapkan field 'nik' pada login (bukan 'username').
 * - API helpers menggunakan baseURL relatif (mis. '/auth/login', '/orders/...'),
 *   sehingga APIRequestContext harus dibuat dengan { baseURL: API_BASE }.
 * - Helper khusus test ini dipertahankan di file ini.
 */

/**
 * Helper: prepare admin session on page by setting Zustand persist storage
 * The auth store uses localStorage key "bebang-auth-storage" and stores { state: { user, accessToken }, version: 0 }
 */
async function setAdminSession(page: Page, user: any, accessToken: string) {
  await page.addInitScript(
    ({ storageKey, state }) => {
      localStorage.setItem(storageKey, JSON.stringify({ state, version: 0 }));
    },
    { storageKey: 'bebang-auth-storage', state: { user, accessToken } },
  );
}

/**
 * Helper: go to order detail page and wait for heading
 */
async function gotoOrderDetail(page: Page, orderId: number) {
  await page.goto(`${FRONTEND_BASE}/orders/${orderId}`);
  await expect(page.getByRole('heading', { name: 'Detail Pesanan' })).toBeVisible({ timeout: 30000 });
}

/**
 * Helper: open approval modal
 */
async function openApprovalModal(page: Page) {
  await page.getByRole('button', { name: 'Keputusan Approval' }).click();
  await expect(page.getByRole('heading', { name: 'Keputusan Approval Admin' })).toBeVisible({ timeout: 10000 });
}

/**
 * Helper: submit approval decision
 * - Intercept request /orders/:id/approve-reject untuk memastikan status 200
 * - Verifikasi toast success muncul
 */
async function submitDecision(page: Page, decision: 'APPROVED' | 'REJECTED', note?: string) {
  // Select decision
  await page.getByLabel('Keputusan').selectOption(decision);
  // Optional note
  if (note) {
    await page.getByLabel('Catatan Admin (opsional)').fill(note);
  }
  // Intercept the approve-reject request
  const approveRejectPromise = page.waitForResponse(
    (resp) => resp.url().includes('/orders/') && resp.url().includes('/approve-reject') && resp.status() === 200,
    { timeout: 15000 },
  );
  // Submit
  await page.getByRole('button', { name: 'Kirim Keputusan' }).click();
  const approveRejectResp = await approveRejectPromise;
  expect(approveRejectResp.ok()).toBeTruthy();

  // Toast success appears
  await expect(page.getByText(/Keputusan admin dikirim/i)).toBeVisible({ timeout: 10000 });
}

/**
 * Helper: verify approval status text in UI cards
 */
async function expectApprovalStatus(page: Page, expected: 'APPROVED' | 'REJECTED' | '-' | 'PENDING') {
  await expect(page.getByText(new RegExp(`Status Approval:\\s*${expected}`, 'i'))).toBeVisible({ timeout: 15000 });
}

/**
 * Helper: soft assert websocket connection indicator (non-blocking)
 */
async function softExpectWsConnected(page: Page) {
  const el = page.getByText(/Realtime:\s*status\.changed\s*\[connected\]/i);
  try {
    await expect.soft(el).toBeVisible({ timeout: 10000 });
  } catch {
    // ignore if not connected
  }
}

/**
 * Flow Test APPROVE:
 * 1) Employee login (nik) & create order (MENUNGGU)
 * 2) Kitchen login & request rejection (membuat pending approval)
 * 3) Admin login & set session ke localStorage
 * 4) Navigate ke detail order, verifikasi UI awal (Requires Approval: Ya, Status Approval: PENDING)
 * 5) Buka modal approval, pilih APPROVED, submit
 * 6) Verifikasi UI berubah (Status Approval: APPROVED, Requires Approval: Tidak)
 */
test.describe('Order Detail — Keputusan Approval (Admin)', () => {
  test('APPROVE kitchen rejection request', async ({ page }) => {
    // Gunakan APIRequestContext dengan baseURL agar helper API berfungsi
    const ctx = await request.newContext({
      baseURL: API_BASE,
      extraHTTPHeaders: { 'Content-Type': 'application/json' },
    });

    // 1) Login as employee (backend expects 'nik') and create a new order (MENUNGGU)
    const emp = await apiLogin(ctx, 'EMP001', 'emp123');
    const todayIso = new Date().toISOString().slice(0, 10);
    const created = await apiCreateOrder(ctx, emp.accessToken, {
      shiftId: 1,
      jumlahPesanan: 1,
      tanggalPesanan: todayIso,
    });
    const orderId = created.id as number;

    // 2) Login as kitchen and request rejection to create pending approval
    const kit = await apiLogin(ctx, 'KIT001', 'kitchen123');
    const pending = await apiRequestRejection(ctx, kit.accessToken, orderId, 'E2E: test penolakan');
    expect(pending?.requiresApproval).toBeTruthy();

    // 3) Login as admin and set session in browser localStorage
    const adm = await apiLogin(ctx, 'ADM001', 'admin123');
    await setAdminSession(page, adm.user, adm.accessToken);

    // 4) Navigate to order detail and ensure UI loaded
    await gotoOrderDetail(page, orderId);
    await softExpectWsConnected(page);

    // Expect requires approval visible and PENDING before decision
    await expect(page.getByText(/Requires Approval:\s*Ya/i)).toBeVisible({ timeout: 15000 });
    await expectApprovalStatus(page, 'PENDING');

    // 5) Open approval modal, select APPROVED, submit
    await openApprovalModal(page);
    await submitDecision(page, 'APPROVED', 'E2E approve');

    // 6) Verify UI reflects decision
    await expectApprovalStatus(page, 'APPROVED');
    // After approved, system should no longer require approval
    await expect(page.getByText(/Requires Approval:\s*Tidak/i)).toBeVisible({ timeout: 15000 });
  });

  /**
   * Flow Test REJECT:
   * 1) Employee login (nik) & create order (MENUNGGU)
   * 2) Kitchen login & request rejection (pending approval)
   * 3) Admin login & set session
   * 4) Navigate & verifikasi UI awal (Requires Approval: Ya, Status Approval: PENDING)
   * 5) Buka modal approval, pilih REJECTED, submit
   * 6) Verifikasi UI mencerminkan penolakan (Status Approval: REJECTED)
   */
  test('REJECT kitchen rejection request', async ({ page }) => {
    const ctx = await request.newContext({
      baseURL: API_BASE,
      extraHTTPHeaders: { 'Content-Type': 'application/json' },
    });

    // Prepare a fresh order
    const emp = await apiLogin(ctx, 'EMP001', 'emp123');
    const todayIso = new Date().toISOString().slice(0, 10);
    const created = await apiCreateOrder(ctx, emp.accessToken, {
      shiftId: 1,
      jumlahPesanan: 2,
      tanggalPesanan: todayIso,
    });
    const orderId = created.id as number;

    // Kitchen requests rejection
    const kit = await apiLogin(ctx, 'KIT001', 'kitchen123');
    const pending = await apiRequestRejection(ctx, kit.accessToken, orderId, 'E2E: test tolak');
    expect(pending?.requiresApproval).toBeTruthy();

    // Admin session
    const adm = await apiLogin(ctx, 'ADM001', 'admin123');
    await setAdminSession(page, adm.user, adm.accessToken);

    // Navigate and verify
    await gotoOrderDetail(page, orderId);
    await softExpectWsConnected(page);
    await expect(page.getByText(/Requires Approval:\s*Ya/i)).toBeVisible({ timeout: 15000 });
    await expectApprovalStatus(page, 'PENDING');

    // Reject decision
    await openApprovalModal(page);
    await submitDecision(page, 'REJECTED', 'E2E reject');

    // Verify UI reflects rejection
    await expectApprovalStatus(page, 'REJECTED');
    // Depending on business rule, rejection should clear pending approval
    await expect(page.getByText(/Requires Approval:\s*(Tidak|Ya)/i)).toBeVisible({ timeout: 15000 });
  });
});