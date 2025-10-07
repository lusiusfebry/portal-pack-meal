// tests/helpers/api.helper.ts
import { APIRequestContext, expect } from '@playwright/test';

// Constants for base URLs used in E2E tests
export const API_BASE = process.env.API_BASE_URL ?? 'http://localhost:3000/api';
export const FRONTEND_BASE = process.env.FRONTEND_BASE_URL ?? 'http://localhost:5173';

// Domain types (mirrored from backend DTOs/enums untuk typing test tanpa runtime dependencies)
export type StatusPesanan =
  | 'MENUNGGU'
  | 'IN_PROGRESS'
  | 'READY'
  | 'ON_DELIVERY'
  | 'COMPLETE'
  | 'DITOLAK'
  | 'MENUNGGU_PERSETUJUAN';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type RoleAccess = 'administrator' | 'employee' | 'dapur' | 'delivery';

export interface CreateOrderDto {
  shiftId: number;
  jumlahPesanan: number;
  tanggalPesanan?: string;
}

export interface CreateUserDto {
  nik: string;
  namaLengkap: string;
  password: string;
  roleAccess: RoleAccess;
  departmentId?: number;
  jabatanId?: number;
  keterangan?: string;
}

export interface QueryOrdersDto {
  status?: StatusPesanan;
  departmentId?: number;
  shiftId?: number;
  tanggalMulai?: string;
  tanggalAkhir?: string;
  requiresApproval?: boolean;
  page?: number;
  limit?: number;
}

function authHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

async function assertOkAndParse(response: any, action: string): Promise<any> {
  // response adalah APIResponse; gunakan tipe longgar untuk kompatibilitas
  expect(
    response.ok(),
    `${action} gagal: status=${response.status()} url=${response.url()}`,
  ).toBeTruthy();
  try {
    return await response.json();
  } catch {
    const text = await response.text();
    throw new Error(`${action} response bukan JSON. status=${response.status()} body=${text}`);
  }
}

function buildQueryString(params?: QueryOrdersDto): string {
  if (!params) return '';
  const qp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (typeof value === 'boolean') {
      qp.set(key, value ? 'true' : 'false');
    } else {
      qp.set(key, String(value));
    }
  });
  const s = qp.toString();
  return s ? `?${s}` : '';
}

// 1. Create Order
export async function apiCreateOrder(
  ctx: APIRequestContext,
  accessToken: string,
  payload: CreateOrderDto,
): Promise<any> {
  try {
    const response = await ctx.post('orders', {
      data: payload,
      headers: authHeaders(accessToken),
    });
    return await assertOkAndParse(response, 'Create Order');
  } catch (err: any) {
    const message = err?.message ?? 'Kesalahan tidak diketahui saat create order';
    throw new Error(`apiCreateOrder error: ${message}`);
  }
}

// 2. Update Order Status
export async function apiUpdateOrderStatus(
  ctx: APIRequestContext,
  accessToken: string,
  orderId: number,
  status: StatusPesanan,
): Promise<any> {
  const response = await ctx.patch(`orders/${orderId}/status`, {
    data: { status },
    headers: authHeaders(accessToken),
  });
  return await assertOkAndParse(response, 'Update Order Status');
}

// 3. Request Rejection
export async function apiRequestRejection(
  ctx: APIRequestContext,
  accessToken: string,
  orderId: number,
  catatanDapur: string,
): Promise<any> {
  const response = await ctx.post(`orders/${orderId}/request-rejection`, {
    data: { catatanDapur },
    headers: authHeaders(accessToken),
  });
  const json = await assertOkAndParse(response, 'Request Rejection');
  // Pastikan requiresApproval bernilai true jika properti tersedia
  if (Object.prototype.hasOwnProperty.call(json, 'requiresApproval')) {
    expect(
      Boolean(json.requiresApproval),
      'requiresApproval harus true setelah request-rejection',
    ).toBeTruthy();
  }
  return json;
}

// 4. Request Edit
export async function apiRequestEdit(
  ctx: APIRequestContext,
  accessToken: string,
  orderId: number,
  jumlahPesananBaru: number,
  catatanDapur: string,
): Promise<any> {
  const response = await ctx.post(`orders/${orderId}/request-edit`, {
    data: { jumlahPesananBaru, catatanDapur },
    headers: authHeaders(accessToken),
  });
  return await assertOkAndParse(response, 'Request Edit');
}

// 5. Approve/Reject Order
export async function apiApproveRejectOrder(
  ctx: APIRequestContext,
  accessToken: string,
  orderId: number,
  decision: ApprovalStatus,
  catatanAdmin?: string,
): Promise<any> {
  const response = await ctx.post(`orders/${orderId}/approve-reject`, {
    data: { decision, catatanAdmin },
    headers: authHeaders(accessToken),
  });
  return await assertOkAndParse(response, 'Approve/Reject Order');
}

// 6. Create User (Admin)
export async function apiCreateUser(
  ctx: APIRequestContext,
  accessToken: string,
  userData: CreateUserDto,
): Promise<any> {
  const response = await ctx.post('users', {
    data: userData,
    headers: authHeaders(accessToken),
  });
  return await assertOkAndParse(response, 'Create User');
}

// 7. Get Orders (list)
export async function apiGetOrders(
  ctx: APIRequestContext,
  accessToken: string,
  params?: QueryOrdersDto,
): Promise<any[]> {
  const qs = buildQueryString(params);
  const response = await ctx.get(`orders${qs}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  const json = await assertOkAndParse(response, 'Get Orders');
  // Ensure array return when service returns list
  return Array.isArray(json) ? json : (json?.items ?? json?.data ?? []);
}