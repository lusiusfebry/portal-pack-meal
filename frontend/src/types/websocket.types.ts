/**
 * WebSocket (Socket.IO) types untuk frontend.
 * Diselaraskan dengan gateway dan event backend:
 * - Gateway: backend/src/websocket/websocket.gateway.ts
 *   Listeners: 'order.created', 'order.status.changed', 'order.approval.requested', 'order.approval.decided'
 * - Events:
 *   - OrderStatusChangedEvent: backend/src/common/events/order-status-changed.event.ts
 *   - OrderApprovalRequestedEvent: backend/src/common/events/order-approval-requested.event.ts
 *   - OrderApprovalDecidedEvent: backend/src/common/events/order-approval-decided.event.ts
 */

import type { Role } from './auth.types';
import type { OrderStatusChangedEventPayload, ApprovalDecision, OrderRequestType } from './order.types';

/**
 * Nama event yang di-broadcast oleh server.
 */
export type WebSocketEventName =
  | 'order.created'
  | 'order.status.changed'
  | 'order.approval.requested'
  | 'order.approval.decided';

/**
 * Opsi koneksi Socket.IO untuk namespace /notifications.
 * Klien harus mengirimkan token JWT dan (opsional) departmentId melalui `auth`.
 */
export interface SocketAuth {
  token: string;
  departmentId?: number;
}

export interface SocketConnectOptions {
  url: string; // e.g., http://localhost:3001/notifications
  auth: SocketAuth;
  transports?: Array<'websocket'>; // default ['websocket']
}

/**
 * Payload untuk event 'order.created'.
 * Catatan: backend menggunakan `any` dan minimal mengandung departmentId/deptId dan orderId.
 * Tambahkan field lainnya sesuai kebutuhan UI (dari service-emitted payload).
 */
export interface OrderCreatedEventPayload {
  orderId: number;
  kodePesanan?: string;
  departmentId?: number; // prefer departmentId
  deptId?: number; // fallback compatibility
  karyawanPemesanId?: number;
  jumlahPesanan?: number;
  shiftId?: number;
  timestamp?: string; // ISO
}

/**
 * Payload untuk event 'order.status.changed' (menggunakan tipe dari order.types).
 * Referensi: OrderStatusChangedEvent di backend.
 */
export type OrderStatusChangedWS = OrderStatusChangedEventPayload;

/**
 * Payload untuk event 'order.approval.requested'.
 * Referensi: OrderApprovalRequestedEvent di backend.
 */
export interface OrderApprovalRequestedEventPayload {
  orderId: number;
  kodePesanan: string;
  requestType: OrderRequestType; // 'REJECT' | 'EDIT'
  requestedBy: number;
  requestedByNik: string;
  catatanDapur: string;
  jumlahPesananAwal: number;
  departmentId: number;
  karyawanPemesanId: number;
  jumlahPesananBaru?: number;
  timestamp: string; // ISO
}

/**
 * Payload untuk event 'order.approval.decided'.
 * Referensi: OrderApprovalDecidedEvent di backend.
 */
export interface OrderApprovalDecidedEventPayload {
  orderId: number;
  kodePesanan: string;
  decision: ApprovalDecision; // 'PENDING' | 'APPROVED' | 'REJECTED'
  decidedBy: number;
  decidedByNik: string;
  catatanAdmin: string | null;
  originalRequest: OrderRequestType; // 'REJECT' | 'EDIT'
  departmentId: number;
  requestedBy: number;
  timestamp: string; // ISO
}

/**
 * Pemetaan event → payload untuk type-safe listener.
 */
export interface NotificationsEventMap {
  'order.created': OrderCreatedEventPayload;
  'order.status.changed': OrderStatusChangedWS;
  'order.approval.requested': OrderApprovalRequestedEventPayload;
  'order.approval.decided': OrderApprovalDecidedEventPayload;
}

/**
 * Type helper untuk mendaftarkan listener yang aman secara tipe.
 */
export type NotificationEventHandler<K extends keyof NotificationsEventMap> = (
  payload: NotificationsEventMap[K],
) => void;

/**
 * Deskripsi room konvensi (untuk dokumentasi dan util internal).
 * Gateway melakukan join:
 * - role:<role>
 * - user:<userId> (sub)
 * - karyawan:<karyawanId>
 * - dept:<departmentId>
 * - dept:<departmentId>:role:<role>
 */
export interface SocketRoomsDescriptor {
  role: Role;
  userId: number;
  karyawanId: number;
  departmentId?: number;
}