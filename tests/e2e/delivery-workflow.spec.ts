// tests/e2e/delivery-workflow.spec.ts
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

// Helper: login as delivery and setup browser session
async function loginAsDelivery(page: Page) {
  await loginAsRole(page, 'delivery');
  await expectAuthenticated(page);
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

// Helper: locate order card element by kodePesanan text
function getOrderCard(page: Page, kodePesanan: string) {
  // Each card renders kodePesanan prominently; narrow to first match
  return page.locator(`div:has-text("${kodePesanan}")`).first();
}

// Helper: locate delivery tabs
function getDeliveryTabButton(page: Page, tab: 'READY' | 'ON_DELIVERY') {
  if (tab === 'READY') {
    return page.getByRole('button', { name: /Siap Diambil/i });
  }
  return page.getByRole('button', { name: /Sedang Diantar/i });
}

test.describe('Delivery Workflow', () => {
  test.afterEach(async ({ page }) => {
    // Isolasi antar test
    await page.evaluate(() => window.localStorage.clear());
    await page.goto('/login');
  });

  test('should view ready orders in delivery list', async ({ page }) => {
    const ctx = await createApiContext();

    // Prepare sample order: create as employee and set READY as kitchen
    const emp = await apiLogin(ctx, 'EMP001', 'emp123');
    const kit = await apiLogin(ctx, 'KIT001', 'kitchen123');
    const todayIso = new Date().toISOString().slice(0, 10);

    const orderBase = await apiCreateOrder(ctx, emp.accessToken, {
      shiftId: 1,
      jumlahPesanan: 2,
      tanggalPesanan: todayIso,
    });

    const orderReady = await apiUpdateOrderStatus(
      ctx,
      kit.accessToken,
      orderBase.id as number,
      'READY',
    );

    // Login as delivery and open Delivery List
    await loginAsDelivery(page);
    await page.goto('/orders');

    // Heading (tolerant: Pengantaran vs Pengiriman)
    await expect(
      page.getByRole('heading', { name: /Daftar Pengantaran|Daftar Pengiriman/i }),
    ).toBeVisible();

    // Tabs visible
    await expect(page.getByRole('button', { name: /Siap Diambil/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Sedang Diantar/i })).toBeVisible();

    // Verify order appears in READY tab
    // Ensure READY tab is active
    await getDeliveryTabButton(page, 'READY').click();
    await expect(getOrderCard(page, orderReady?.kodePesanan ?? '')).toBeVisible({ timeout: 20000 });

    // Verify large Pickup button visible (label tolerant)
    const pickupBtn = getOrderCard(page, orderReady?.kodePesanan ?? '')
      .locator('button')
      .filter({ hasText: /Pickup(\s+Pesanan)?/i })
      .first();
    await expect(pickupBtn).toBeVisible();
  });

  test('should pickup order (READY → ON_DELIVERY)', async ({ page }) => {
    const ctx = await createApiContext();

    // Prepare order READY
    const emp = await apiLogin(ctx, 'EMP001', 'emp123');
    const kit = await apiLogin(ctx, 'KIT001', 'kitchen123');
    const orderBase = await apiCreateOrder(ctx, emp.accessToken, {
      shiftId: 1,
      jumlahPesanan: 1,
      tanggalPesanan: new Date().toISOString().slice(0, 10),
    });
    const orderReady = await apiUpdateOrderStatus(
      ctx,
      kit.accessToken,
      orderBase.id as number,
      'READY',
    );
    const orderId = orderReady.id as number;

    // Login delivery and open list
    await loginAsDelivery(page);
    await page.goto('/orders');
    await getDeliveryTabButton(page, 'READY').click();

    // Ensure card is present
    const card = getOrderCard(page, orderReady?.kodePesanan ?? '');
    await expect(card).toBeVisible({ timeout: 20000 });

    // Intercept PATCH /api/orders/:id/status (READY -> ON_DELIVERY)
    const patchRespPromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/orders/') &&
        resp.url().includes('/status') &&
        resp.request().method() === 'PATCH' &&
        resp.status() >= 200 &&
        resp.status() < 300,
      { timeout: 15000 },
    );

    // Click "Pickup" (tolerant label)
    await card.getByRole('button', { name: /Pickup(\s+Pesanan)?/i }).click();

    const patchResp = await patchRespPromise;
    expect(patchResp.ok()).toBeTruthy();

    // Expect success toast
    await expect(page.getByText(/Pickup:/i)).toBeVisible({ timeout: 10000 });

    // Switch to ON_DELIVERY tab and verify card moved
    await getDeliveryTabButton(page, 'ON_DELIVERY').click();
    await expect(getOrderCard(page, orderReady?.kodePesanan ?? '')).toBeVisible({ timeout: 20000 });

    // Verify backend status and waktuDiantar set
    const del = await apiLogin(ctx, 'DEL001', 'delivery123');
    const fetched = await apiGetOrderById(ctx, del.accessToken, orderId);
    expect(fetched?.statusPesanan).toBe('ON_DELIVERY');
    expect(fetched?.waktuDiantar ?? null).not.toBeNull();
  });

  test('should complete delivery (ON_DELIVERY → COMPLETE)', async ({ page }) => {
    const ctx = await createApiContext();

    // Prepare order ON_DELIVERY
    const emp = await apiLogin(ctx, 'EMP001', 'emp123');
    const kit = await apiLogin(ctx, 'KIT001', 'kitchen123');
    const orderBase = await apiCreateOrder(ctx, emp.accessToken, {
      shiftId: 1,
      jumlahPesanan: 3,
      tanggalPesanan: new Date().toISOString().slice(0, 10),
    });
    const orderReady = await apiUpdateOrderStatus(
      ctx,
      kit.accessToken,
      orderBase.id as number,
      'READY',
    );

    // Move to ON_DELIVERY via API to set up state
    const orderOnDelivery = await apiUpdateOrderStatus(
      ctx,
      (await apiLogin(ctx, 'DEL001', 'delivery123')).accessToken,
      orderReady.id as number,
      'ON_DELIVERY',
    );
    const orderId = orderOnDelivery.id as number;

    // Login delivery and open ON_DELIVERY tab
    await loginAsDelivery(page);
    await page.goto('/orders');
    await getDeliveryTabButton(page, 'ON_DELIVERY').click();

    // Ensure card is present
    const card = getOrderCard(page, orderOnDelivery?.kodePesanan ?? '');
    await expect(card).toBeVisible({ timeout: 20000 });

    // Intercept PATCH /api/orders/:id/status (ON_DELIVERY -> COMPLETE)
    const patchRespPromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/orders/') &&
        resp.url().includes('/status') &&
        resp.request().method() === 'PATCH' &&
        resp.status() >= 200 &&
        resp.status() < 300,
      { timeout: 15000 },
    );

    // Click "Complete" (tolerant label)
    await card.getByRole('button', { name: /Complete|Tandai Selesai/i }).click();

    const patchResp = await patchRespPromise;
    expect(patchResp.ok()).toBeTruthy();

    // Success toast
    await expect(page.getByText(/Selesai:/i)).toBeVisible({ timeout: 10000 });

    // Verify card disappears from ON_DELIVERY list (moved to COMPLETE)
    await expect(getOrderCard(page, orderOnDelivery?.kodePesanan ?? '')).toBeHidden({ timeout: 20000 });

    // Verify backend waktuSelesai set
    const del = await apiLogin(ctx, 'DEL001', 'delivery123');
    const fetched = await apiGetOrderById(ctx, del.accessToken, orderId);
    expect(fetched?.statusPesanan).toBe('COMPLETE');
    expect(fetched?.waktuSelesai ?? null).not.toBeNull();
  });

  test('should see mobile-optimized UI on small screen', async ({ page }) => {
    const ctx = await createApiContext();

    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });

    // Prepare multiple READY orders to have multiple cards
    const emp = await apiLogin(ctx, 'EMP001', 'emp123');
    const kit = await apiLogin(ctx, 'KIT001', 'kitchen123');
    const todayIso = new Date().toISOString().slice(0, 10);
    const o1 = await apiCreateOrder(ctx, emp.accessToken, {
      shiftId: 1,
      jumlahPesanan: 1,
      tanggalPesanan: todayIso,
    });
    const o2 = await apiCreateOrder(ctx, emp.accessToken, {
      shiftId: 1,
      jumlahPesanan: 2,
      tanggalPesanan: todayIso,
    });
    const r1 = await apiUpdateOrderStatus(ctx, kit.accessToken, o1.id as number, 'READY');
    const r2 = await apiUpdateOrderStatus(ctx, kit.accessToken, o2.id as number, 'READY');

    // Login delivery and open list (READY tab)
    await loginAsDelivery(page);
    await page.goto('/orders');
    await getDeliveryTabButton(page, 'READY').click();

    // Verify action buttons are large (min 48px height)
    const pickupBtn1 = getOrderCard(page, r1?.kodePesanan ?? '')
      .getByRole('button', { name: /Pickup(\s+Pesanan)?/i })
      .first();
    const pickupBox1 = await pickupBtn1.boundingBox();
    expect(pickupBox1?.height ?? 0).toBeGreaterThanOrEqual(48);

    // Verify readable text (min 16px) — check heading font size
    const heading = page.getByRole('heading', { name: /Daftar Pengantaran|Daftar Pengiriman/i });
    const fontSize = await heading.evaluate((el) => {
      const cs = window.getComputedStyle(el as HTMLElement);
      return parseFloat(cs.fontSize || '0');
    });
    expect(fontSize).toBeGreaterThanOrEqual(16);

    // Verify cards have adequate spacing — distance between two cards' top positions >= 8px
    const card1 = getOrderCard(page, r1?.kodePesanan ?? '');
    const card2 = getOrderCard(page, r2?.kodePesanan ?? '');
    const box1 = await card1.boundingBox();
    const box2 = await card2.boundingBox();
    // Ensure both cards are rendered
    expect(Boolean(box1 && box2)).toBeTruthy();
    const topDelta = Math.abs((box2?.y ?? 0) - (box1?.y ?? 0));
    expect(topDelta).toBeGreaterThanOrEqual(8);

    // Verify tabs are touch-friendly (height >= 36px and toggling works)
    const readyTab = getDeliveryTabButton(page, 'READY');
    const onDelTab = getDeliveryTabButton(page, 'ON_DELIVERY');
    const readyBox = await readyTab.boundingBox();
    const onDelBox = await onDelTab.boundingBox();
    expect(readyBox?.height ?? 0).toBeGreaterThanOrEqual(36);
    expect(onDelBox?.height ?? 0).toBeGreaterThanOrEqual(36);

    // Toggle and assert aria-pressed reflects state for accessibility
    await onDelTab.click();
    await expect(onDelTab).toHaveAttribute('aria-pressed', 'true');
    await expect(readyTab).toHaveAttribute('aria-pressed', 'false');

    await readyTab.click();
    await expect(readyTab).toHaveAttribute('aria-pressed', 'true');
    await expect(onDelTab).toHaveAttribute('aria-pressed', 'false');
  });

  test('should complete full delivery workflow', async ({ page }) => {
    const ctx = await createApiContext();

    // Create order as employee (MENUNGGU)
    const emp = await apiLogin(ctx, 'EMP001', 'emp123');
    const created = await apiCreateOrder(ctx, emp.accessToken, {
      shiftId: 1,
      jumlahPesanan: 4,
      tanggalPesanan: new Date().toISOString().slice(0, 10),
    });
    const orderId = created.id as number;

    // Update to READY as kitchen
    const kit = await apiLogin(ctx, 'KIT001', 'kitchen123');
    const ready = await apiUpdateOrderStatus(ctx, kit.accessToken, orderId, 'READY');

    // Login as delivery
    await loginAsDelivery(page);
    await page.goto('/orders');
    await getDeliveryTabButton(page, 'READY').click();

    // Pickup (READY → ON_DELIVERY)
    const cardReady = getOrderCard(page, ready?.kodePesanan ?? '');
    await expect(cardReady).toBeVisible({ timeout: 20000 });
    const pickupRespPromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/orders/') &&
        resp.url().includes('/status') &&
        resp.request().method() === 'PATCH' &&
        resp.status() >= 200 &&
        resp.status() < 300,
      { timeout: 15000 },
    );
    await cardReady.getByRole('button', { name: /Pickup(\s+Pesanan)?/i }).click();
    await pickupRespPromise;
    await expect(page.getByText(/Pickup:/i)).toBeVisible({ timeout: 10000 });

    // Complete (ON_DELIVERY → COMPLETE)
    await getDeliveryTabButton(page, 'ON_DELIVERY').click();
    const cardOnDelivery = getOrderCard(page, ready?.kodePesanan ?? '');
    await expect(cardOnDelivery).toBeVisible({ timeout: 20000 });
    const completeRespPromise = page.waitForResponse(
      (resp) =>
        resp.url().includes('/api/orders/') &&
        resp.url().includes('/status') &&
        resp.request().method() === 'PATCH' &&
        resp.status() >= 200 &&
        resp.status() < 300,
      { timeout: 15000 },
    );
    await cardOnDelivery.getByRole('button', { name: /Complete|Tandai Selesai/i }).click();
    await completeRespPromise;
    await expect(page.getByText(/Selesai:/i)).toBeVisible({ timeout: 10000 });

    // Verify complete order has all timestamps set
    const del = await apiLogin(ctx, 'DEL001', 'delivery123');
    const fetched = await apiGetOrderById(ctx, del.accessToken, orderId);
    expect(fetched?.statusPesanan).toBe('COMPLETE');
    expect(fetched?.waktuSiap ?? null).not.toBeNull();
    expect(fetched?.waktuDiantar ?? null).not.toBeNull();
    expect(fetched?.waktuSelesai ?? null).not.toBeNull();

    // Verify employee receives notification (soft check via UI toast after connecting)
    // Connect as employee and open dashboard to initialize WS subscriptions, then expect a status-change toast.
    const empPage = page; // reuse same page session by switching auth storage
    // Clear and set employee session
    await empPage.evaluate(() => window.localStorage.clear());
    const { user: empUser, accessToken: empToken } = await apiLogin(ctx, 'EMP001', 'emp123');
    await (async () => {
      // mimic setAuthSession to persist session for employee
      await empPage.addInitScript(
        ({ key, user, accessToken }) => {
          try {
            const value = JSON.stringify({ state: { user, accessToken }, version: 0 });
            window.localStorage.setItem(key, value);
          } catch {
            // ignore
          }
        },
        { key: 'bebang-auth-storage', user: empUser, accessToken: empToken },
      );
    })();
    await empPage.goto('/dashboard');
    // Soft expectation to avoid flakiness: look for generic status changed info toast or any order-related toast
    await expect
      .soft(empPage.getByText(/Status .* berubah|order.*status.*changed|Selesai:/i))
      .toBeVisible({ timeout: 15000 });
  });
});