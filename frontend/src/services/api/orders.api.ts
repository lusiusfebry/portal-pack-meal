// frontend/src/services/api/orders.api.ts
import apiClient from '@/lib/axios';
import type { AxiosError } from 'axios';
import type {
  Order,
  CreateOrderDto,
  QueryOrdersDto,
  UpdateOrderStatusDto,
  RejectOrderDto,
  EditOrderDto,
  ApproveRejectOrderDto,
  ApprovalDecision,
  StatusPesanan,
  OrdersListResponse,
} from '@/types/order.types';

// Error extraction helper
function extractErrorMessage(error: unknown): string {
  const err = error as AxiosError<any>;
  const data = err?.response?.data as any;
  if (data) {
    if (typeof data === 'string') return data;
    if (typeof data.message === 'string') return data.message;
    if (Array.isArray(data.message)) return data.message.join(', ');
  }
  return err && err.message ? err.message : 'Unknown error';
}

// ===================== Orders API =====================

// List orders (paginated)
export async function getOrders(
  params: QueryOrdersDto = {},
): Promise<OrdersListResponse> {
  try {
    const res = await apiClient.get('/orders', { params });
    return res.data as OrdersListResponse;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

// Get order by id
export async function getOrderById(id: number): Promise<Order> {
  try {
    const res = await apiClient.get(`/orders/${id}`);
    return res.data as Order;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

// Create order
export async function createOrder(payload: CreateOrderDto): Promise<Order> {
  try {
    const res = await apiClient.post('/orders', payload);
    return res.data as Order;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

// Update order status — overloads for backward compatibility
export function updateOrderStatus(id: number, data: UpdateOrderStatusDto): Promise<Order>;
export function updateOrderStatus(id: number, status: StatusPesanan): Promise<Order>;
export async function updateOrderStatus(
  id: number,
  arg: UpdateOrderStatusDto | StatusPesanan,
): Promise<Order> {
  try {
    const payload: UpdateOrderStatusDto =
      typeof arg === 'string' ? { status: arg } : arg;
    const res = await apiClient.patch(`/orders/${id}/status`, payload);
    return res.data as Order;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

// Request rejection — overloads for backward compatibility
export function requestRejection(id: number, payload: RejectOrderDto): Promise<Order>;
export function requestRejection(id: number, catatanDapur: string): Promise<Order>;
export async function requestRejection(
  id: number,
  arg: RejectOrderDto | string,
): Promise<Order> {
  try {
    const payload: RejectOrderDto =
      typeof arg === 'string' ? { catatanDapur: arg } : arg;
    const res = await apiClient.post(`/orders/${id}/request-rejection`, payload);
    return res.data as Order;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

// Request edit — overloads for backward compatibility
export function requestEdit(id: number, payload: EditOrderDto): Promise<Order>;
export function requestEdit(
  id: number,
  jumlahPesananBaru: number,
  catatanDapur?: string,
): Promise<Order>;
export async function requestEdit(
  id: number,
  arg1: EditOrderDto | number,
  arg2?: string,
): Promise<Order> {
  try {
    const payload: EditOrderDto =
      typeof arg1 === 'number'
        ? {
            jumlahPesananBaru: arg1,
            catatanDapur: arg2 ?? '',
          }
        : arg1;
    const res = await apiClient.post(`/orders/${id}/request-edit`, payload);
    return res.data as Order;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

// Approve/Reject — overloads for backward compatibility
export function approveRejectOrder(
  id: number,
  payload: ApproveRejectOrderDto,
): Promise<Order>;
export function approveRejectOrder(
  id: number,
  decision: ApprovalDecision,
  catatanAdmin?: string,
): Promise<Order>;
export async function approveRejectOrder(
  id: number,
  arg1: ApproveRejectOrderDto | ApprovalDecision,
  arg2?: string,
): Promise<Order> {
  try {
    const payload: ApproveRejectOrderDto =
      typeof arg1 === 'string'
        ? {
            decision: arg1,
            ...(arg2 ? { catatanAdmin: arg2 } : {}),
          }
        : arg1;
    const res = await apiClient.post(`/orders/${id}/approve-reject`, payload);
    return res.data as Order;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

// Pending approvals
export async function getPendingApprovals(): Promise<Order[]> {
  try {
    const res = await apiClient.get('/orders/pending-approvals');
    return res.data as Order[];
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}