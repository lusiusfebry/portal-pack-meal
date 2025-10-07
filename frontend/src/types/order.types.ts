/**
 * TypeScript definitions untuk domain Pesanan (Orders) sesuai kontrak backend DTO/Response.
 * Menyediakan type safety untuk seluruh operasi dan komponen UI terkait pesanan.
 */

import type { Role } from './auth.types'

/**
 * Enum status pesanan sesuai backend.
 */
export const StatusPesanan = {
  MENUNGGU: 'MENUNGGU',
  IN_PROGRESS: 'IN_PROGRESS',
  READY: 'READY',
  ON_DELIVERY: 'ON_DELIVERY',
  COMPLETE: 'COMPLETE',
  DITOLAK: 'DITOLAK',
  MENUNGGU_PERSETUJUAN: 'MENUNGGU_PERSETUJUAN',
} as const

export type StatusPesanan = typeof StatusPesanan[keyof typeof StatusPesanan]
  | 'MENUNGGU'
  | 'IN_PROGRESS'
  | 'READY'
  | 'ON_DELIVERY'
  | 'COMPLETE'
  | 'DITOLAK'
  | 'MENUNGGU_PERSETUJUAN'

/**
 * Enum status persetujuan admin untuk workflow approval.
 */
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

/**
 * Master data: Department (Divisi)
 */
export interface Department {
  id: number
  namaDivisi: string
  keterangan?: string
}

/**
 * Master data: Shift
 */
export interface Shift {
  id: number
  namaShift: string
  jamMulai: string // format waktu (HH:mm) sebagai string
  jamSelesai: string // format waktu (HH:mm) sebagai string
  keterangan?: string
}

/**
 * Data karyawan (pemesan/approver) yang relevan untuk Order.
 */
export interface Karyawan {
  id: number
  nomorIndukKaryawan: string
  namaLengkap: string
  roleAccess: Role
  departmentId?: number
  department?: Department
  isActive: boolean
}

/**
 * Objek utama Order sesuai kontrak backend.
 */
export interface Order {
  id: number
  kodePesanan: string
  karyawanPemesanId: number
  departmentPemesanId: number
  shiftId: number
  jumlahPesanan: number
  jumlahPesananAwal?: number
  statusPesanan: StatusPesanan
  tanggalPesanan: string // ISO date (YYYY-MM-DD atau ISO string)
  requiresApproval: boolean
  approvalStatus?: ApprovalStatus
  catatanDapur?: string
  catatanAdmin?: string
  approvedById?: number
  waktuDibuat: string // ISO datetime
  waktuDiproses?: string
  waktuSiap?: string
  waktuDiantar?: string
  waktuSelesai?: string

  // Relasi terpopulasi (opsional tergantung endpoint)
  pemesan?: Karyawan
  departemen?: Department
  shift?: Shift
  approver?: Karyawan
}

/**
 * Response list/order pagination standar.
 */
export interface OrdersListResponse {
  data: Order[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/**
 * DTO untuk membuat pesanan baru.
 */
export interface CreateOrderDto {
  shiftId: number
  jumlahPesanan: number
  tanggalPesanan?: string // ISO date; default bisa hari ini
}

/**
 * DTO untuk update status pesanan.
 */
export interface UpdateOrderStatusDto {
  status: StatusPesanan
}

/**
 * DTO untuk request penolakan pesanan oleh Dapur.
 */
export interface RejectOrderDto {
  catatanDapur: string // min 10 karakter
}

/**
 * DTO untuk request edit jumlah pesanan oleh Dapur.
 */
export interface EditOrderDto {
  jumlahPesananBaru: number
  catatanDapur: string // min 10 karakter
}

/**
 * DTO untuk keputusan admin (approve/reject) atas request Dapur.
 */
export interface ApproveRejectOrderDto {
  decision: ApprovalStatus
  catatanAdmin?: string
}

/**
 * DTO query untuk listing/filter pesanan.
 * Catatan: Sesuaikan dengan backend; gunakan string ISO untuk tanggal.
 */
export interface QueryOrdersDto {
  status?: StatusPesanan
  departmentId?: number
  shiftId?: number
  tanggalMulai?: string
  tanggalAkhir?: string
  requiresApproval?: boolean
  page?: number
  limit?: number
}

/**
 * Alias type untuk kompatibilitas dengan impor UI yang menggunakan QueryOrdersParams.
 * QueryOrdersParams identik dengan QueryOrdersDto.
 */
export type QueryOrdersParams = QueryOrdersDto

// ===== Compatibility exports for UI imports (types and runtime values) =====

/**
 * Alias type untuk kompatibilitas dengan impor UI yang menggunakan OrderStatus.
 * OrderStatus identik dengan StatusPesanan.
 */
export type OrderStatus = StatusPesanan

/**
 * Alias type untuk kompatibilitas dengan impor UI yang menggunakan ApprovalDecision.
 * ApprovalDecision identik dengan ApprovalStatus.
 */
export type ApprovalDecision = ApprovalStatus

/**
 * Runtime value namespace untuk ApprovalStatus agar dapat diimport sebagai nilai:
 * import { ApprovalStatus } from '@/types/order.types'
 * Lalu digunakan: ApprovalStatus.APPROVED, ApprovalStatus.REJECTED, dst.
 */
export const ApprovalStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const

/**
 * WebSocket-related types untuk integrasi event dan notifikasi.
 */
export type OrderRequestType = 'REJECT' | 'EDIT'

export interface OrderStatusChangedEventPayload {
  orderId: number
  kodePesanan: string
  oldStatus?: StatusPesanan
  newStatus: StatusPesanan
  changedBy: string // NIK pengubah status
  changedByRole: Role
  karyawanPemesanId: number
  departmentId?: number
  timestamp: string // ISO datetime
}
