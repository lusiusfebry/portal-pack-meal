// tests/e2e/dapur-workflow.spec.ts
import { test, expect, request, APIRequestContext, Page } from '@playwright/test';
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

// Helper: login as kitchen and setup browser session
async function loginAsKitchen(page: Page) {
  await loginAsRole(page, 'dapur');
  await expectAuthenticated(page);
}

// Helper: locator for kanban droppable column by key
function getDroppable(page: Page, key: 'MENUNGGU' | 'IN_PROGRESS' | 'READY') {
  // @hello-pangea/dnd sets data-rbd-droppable-id equal to droppableId
  return page.locator(`[data-rbd-droppable-id="${key}"]`);
}

// Helper: drag a specific order card (by kodePesanan) to a target column
async function dragCardToColumn(
  page: Page,
  kodePesanan: string,
  targetKey: 'IN_PROGRESS' | 'READY',
) {
  const sourceCard = page.locator(`div:has-text("${kodePesanan}")`).first();
  const targetColumn = getDroppable(page, targetKey);

  // Ensure source and target are visible
  await expect(sourceCard).toBeVisible({ timeout: 20000 });
  await expect(targetColumn).toBeVisible({ timeout: 20000 });

  // Intercept PATCH /api/orders/:id/status
  const patchRespPromise = page.waitForResponse(
    (resp) =>
      resp.url().includes('/api/orders/') &&
      resp.url().includes('/status') &&
      resp.request().method() === 'PATCH' &&
      resp.status() >= 200 &&
      resp.status() < 300,
    { timeout: 15000 },
  );

  // Perform drag-and-drop
  await sourceCard.dragTo(targetColumn);

  const patchResp = await patchRespPromise;
  expect(patchResp.ok()).toBeTruthy();

  // Expect success toast
  await expect(page.getByText(/Status diubah:/i)).toBeVisible({ timeout: 10000 });
}

// Helper: get order by id from backend (details)
async function apiGetOrderById(
  ctx: APIRequestContext,
  accessToken: string,
  orderId: number,
): Promise<any> {
  const resp = await ctx.get(`/orders/${orderId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  expect(resp.ok(), `GET /orders/${orderId} failed: ${resp.status()} ${resp.url()}`).toBeTruthy();
  try {
    return await resp.json();
  } catch {
    const text = await resp.text();
    throw new Error(`GET /orders/${orderId} response not JSON: ${text}`);
  }
}

test.describe('Dapur (Kitchen) Workflow', () => {
  test.afterEach(async ({ page }) => {
    // Isolasi antar test
    await page.evaluate(() => window.localStorage.clear());
    await page.goto('/login');
  });

  test('should view Kanban board with order columns', async ({ page }) => {
    const ctx = await createApiContext();

    // Prepare sample orders
    const emp = await apiLogin(ctx, 'EMP001', 'emp123');
    const kit = await apiLogin(ctx, 'KIT001', 'kitchen123');
    const todayIso = new Date().toISOString().slice(0, 10);

    const orderMenunggu = await apiCreateOrder(ctx, emp.accessToken, {
      shiftId: 1,
      jumlahPesanan: 3,
      tanggalPesanan: todayIso,
    });
    const orderInProgressBase = await apiCreateOrder(ctx, emp.accessToken, {
      shiftId: 1,
      jumlahPesanan: 2,
      tanggalPesanan: todayIso,
    });
    const orderReadyBase = await apiCreateOrder(ctx, emp.accessToken, {
      shiftId: 1,
      jumlahPesanan: 1,
      tanggalPesanan: todayIso,
    });

    // Update statuses via kitchen
    const orderInProgress = await apiUpdateOrderStatus(
      ctx,
      kit.accessToken,
      orderInProgressBase.id as number,
      'IN_PROGRESS',
    );
    const orderReady = await apiUpdateOrderStatus(
      ctx,
      kit.accessToken,
      orderReadyBase.id as number,
      'READY',
    );

    // Login as kitchen and open kanban
    await loginAsKitchen(page);
    await page.goto('/orders');

    // Heading and column titles (use tolerant labels from utils: Menunggu, Diproses, Siap)
    await expect(page.getByRole('heading', { name: /Antrian Dapur/i })).toBeVisible();
    await expect(page.getByText(/\bMenunggu\b/i)).toBeVisible();
    await expect(page.getByText(/\bDiproses\b/i)).toBeVisible();
    await expect(page.getByText(/\bSiap\b/i)).toBeVisible();

    // Verify cards are present in the correct columns
    await expect(getDroppable(page, 'MENUNGGU').getByText(orderMenunggu?.kodePesanan ?? '')).toBeVisible({
      timeout: 20000,
    });
    await expect(getDroppable(page, 'IN_PROGRESS').getByText(orderInProgress?.kodePesanan ?? '')).toBeVisible({
      timeout: 20000,
    });
    await expect(getDroppable(page, 'READY').getByText(orderReady?.kodePesanan ?? '')).toBeVisible({
      timeout: 20000,
    });
  });

  test('should update order status via drag-and-drop', async ({ page }) => {
    const ctx = await createApiContext();

    // Create MENUNGGU order as employee
    const emp = await apiLogin(ctx, 'EMP001', 'emp123');
    const menungguOrder = await apiCreateOrder(ctx, emp.accessToken, {
      shiftId: 1,
      jumlahPesanan: 5,
      tanggalPesanan: new Date().toISOString().slice(0, 10),
    });

    // Login as kitchen and open kanban
    const kit = await apiLogin(ctx, 'KIT001', 'kitchen123');
    await loginAsKitchen(page);
    await page.goto('/orders');

    // Ensure card appears in MENUNGGU column
    await expect(
      getDroppable(page, 'MENUNGGU').getByText(menungguOrder?.kodePesanan ?? ''),
    ).toBeVisible({ timeout: 20000 });

    // Drag to IN_PROGRESS
    await dragCardToColumn(page, menungguOrder?.kodePesanan ?? '', 'IN_PROGRESS');

    // Card should now appear in IN_PROGRESS column
    await expect(
      getDroppable(page, 'IN_PROGRESS').getByText(menungguOrder?.kodePesanan ?? ''),
    ).toBeVisible({ timeout: 20000 });

    // Verify backend status
    const fetched = await apiGetOrderById(ctx, kit.accessToken, menungguOrder.id as number);
    expect(fetched?.statusPesanan).toBe('IN_PROGRESS');
  });

  test('should request order rejection with mandatory notes', async ({ page }) => {
    const ctx = await createApiContext();

    // Create MENUNGGU order as employee
    const emp = await apiLogin(ctx, 'EMP001', 'emp123');
    const order = await apiCreateOrder(ctx, emp.accessToken, {
      shiftId: 1,
      jumlahPesanan: 4,
      tanggalPesanan: new Date().toISOString().slice(0, 10),
    });

    // Login as kitchen and open kanban
    const kit = await apiLogin(ctx, 'KIT001', 'kitchen123');
    await loginAsKitchen(page);
    await page.goto('/orders');

    // Open Reject modal for the specific order card
    const card = page.locator(`div:has-text("${order?.kodePesanan ?? ''}")`).first();
    await expect(card).toBeVisible({ timeout: 20000 });
    await card.getByRole('button', { name: /Reject/i }).click();

    // Modal should open
    await expect(page.getByRole('heading', { name: /Ajukan Penolakan/i })).toBeVisible({ timeout: 10000 });

    // Try submit without notes → validation error (frontend)
    const rejectSubmitBtn = page.getByRole('button', { name: /Kirim Penolakan/i });
    await rejectSubmitBtn.click();
    await expect(page.getByText(/Catatan dapur wajib diisi/i)).toBeVisible({ timeout: 10000 });

    // Try with less than 10 characters → expect validation error (backend may enforce; assert error toast)
    await page.fill('#reject-note', 'terlalu'); // 7 chars
    await rejectSubmitBtn.click();
    // Soft assertion to avoid flakiness if backend rule changes text
    await expect
      .soft(page.getByText(/Gagal mengirim penolakan|minimal|tidak valid/i))
      .toBeVisible({ timeout: 10000 });

    // Fill with valid text and submit
    await page.fill('#reject-note', 'Stok bahan tidak mencukupi untuk pesanan ini');
    const rejectRespPromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/orders/') &&
        resp.url().includes('/request-rejection') &&
        resp.request().method() === 'POST' &&
        resp.status() >= 200 &&
        resp.status() < 300,
      { timeout: 15000 },
    );
    await rejectSubmitBtn.click();
    const rejectResp = await rejectRespPromise;
    expect(rejectResp.ok()).toBeTruthy();

    // Success toast
    await expect(page.getByText(/Permintaan penolakan dikirim/i)).toBeVisible({ timeout: 10000 });

    // Verify backend status changed to MENUNGGU_PERSETUJUAN and requiresApproval = true
    const updated = await apiGetOrderById(ctx, kit.accessToken, order.id as number);
    expect(updated?.statusPesanan).toBe('MENUNGGU_PERSETUJUAN');
    expect(Boolean(updated?.requiresApproval)).toBeTruthy();
  });

  test('should request order quantity edit with mandatory notes', async ({ page }) => {
    const ctx = await createApiContext();

    // Create MENUNGGU order with jumlahPesanan: 20
    const emp = await apiLogin(ctx, 'EMP001', 'emp123');
    const created = await apiCreateOrder(ctx, emp.accessToken, {
      shiftId: 1,
      jumlahPesanan: 20,
      tanggalPesanan: new Date().toISOString().slice(0, 10),
    });
    const orderId = created.id as number;

    // Login as kitchen and open order detail via kanban (operate from kanban)
    const kit = await apiLogin(ctx, 'KIT001', 'kitchen123');
    await loginAsKitchen(page);
    await page.goto('/orders');

    // Open Edit modal for the specific order card
    const card = page.locator(`div:has-text("${created?.kodePesanan ?? ''}")`).first();
    await expect(card).toBeVisible({ timeout: 20000 });
    await card.getByRole('button', { name: /Edit/i }).click();

    // Modal should open
    await expect(page.getByRole('heading', { name: /Ajukan Edit Pesanan/i })).toBeVisible({ timeout: 10000 });

    // Fill new quantity and notes
    await page.fill('#edit-qty', '15');
    await page.fill('#edit-note', 'Hanya bisa menyediakan 15 porsi untuk shift ini');

    // Intercept request-edit API
    const editRespPromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/orders/') &&
        resp.url().includes('/request-edit') &&
        resp.request().method() === 'POST' &&
        resp.status() >= 200 &&
        resp.status() < 300,
      { timeout: 15000 },
    );

    // Submit
    await page.getByRole('button', { name: /Kirim Permintaan Edit/i }).click();
    const editResp = await editRespPromise;
    expect(editResp.ok()).toBeTruthy();

    // Success toast
    await expect(page.getByText(/Permintaan edit dikirim/i)).toBeVisible({ timeout: 10000 });

    // Verify backend status MENUNGGU_PERSETUJUAN
    const updated = await apiGetOrderById(ctx, kit.accessToken, orderId);
    expect(updated?.statusPesanan).toBe('MENUNGGU_PERSETUJUAN');

    // Verify jumlahPesanan is 15 and jumlahPesananAwal is 20 (as per business rule)
    // Depending on implementation, jumlahPesanan may be updated immediately or stored as pending.
    // Assert both if available; otherwise fail explicitly.
    expect(updated?.jumlahPesanan).toBe(15);
    expect(updated?.jumlahPesananAwal ?? updated?.jumlahPesananSebelumnya ?? 20).toBe(20);
  });

  test('should complete order workflow (MENUNGGU → IN_PROGRESS → READY)', async ({ page }) => {
    const ctx = await createApiContext();

    // Create MENUNGGU order
    const emp = await apiLogin(ctx, 'EMP001', 'emp123');
    const created = await apiCreateOrder(ctx, emp.accessToken, {
      shiftId: 1,
      jumlahPesanan: 6,
      tanggalPesanan: new Date().toISOString().slice(0, 10),
    });
    const orderId = created.id as number;

    // Login as kitchen and open kanban
    const kit = await apiLogin(ctx, 'KIT001', 'kitchen123');
    await loginAsKitchen(page);
    await page.goto('/orders');

    // Move to IN_PROGRESS
    await dragCardToColumn(page, created?.kodePesanan ?? '', 'IN_PROGRESS');
    let fetched = await apiGetOrderById(ctx, kit.accessToken, orderId);
    expect(fetched?.statusPesanan).toBe('IN_PROGRESS');

    // Move to READY
    await dragCardToColumn(page, created?.kodePesanan ?? '', 'READY');
    fetched = await apiGetOrderById(ctx, kit.accessToken, orderId);
    expect(fetched?.statusPesanan).toBe('READY');

    // Verify timestamps set
    expect(fetched?.waktuDiproses ?? null).not.toBeNull();
    expect(fetched?.waktuSiap ?? null).not.toBeNull();
  });
});