// frontend/src/types/report.types.ts

// Generic paginated response (useful for tables and list views)
export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ===================== Reports: Data Models =====================

// Konsumsi (Consumption) report item
export interface ConsumptionReportItem {
  period: string; // e.g., '2025-10-01' or '2025-W40' or '2025-10'
  totalOrders: number;
  totalMeals: number;
}

// Departemen (Department) aggregation item
export interface DepartmentReportItem {
  departmentId: number;
  departmentName: string;
  totalOrders: number;
  totalMeals: number;
  percentage: number; // 0-100
}

// Performance metrics breakdown
export interface PerformanceMetrics {
  departmentId?: number;
  departmentName?: string;
  shiftId?: number;
  shiftName?: string;
  count: number;
  avgTotalDurationMinutes?: number;
  avgProcessingTimeMinutes?: number;
  avgPreparationTimeMinutes?: number;
  avgDeliveryTimeMinutes?: number;
}

// Performance report shape
export interface PerformanceReport {
  overall: PerformanceMetrics;
  byDepartment: PerformanceMetrics[];
  byShift: PerformanceMetrics[];
}

// ===================== Rejections Report =====================

export type RejectionRequestType = 'REJECT' | 'EDIT';

export interface RejectionReportItem {
  id: number;
  kodePesanan: string;
  departmentId: number;
  departmentName: string;
  karyawanPemesanId: number;
  shiftId: number;
  shiftName: string;
  jumlahPesanan: number;
  jumlahPesananAwal?: number;
  statusPesanan: string; // backend string enum
  requiresApproval: boolean;
  approvalStatus?: string; // 'PENDING' | 'APPROVED' | 'REJECTED'
  catatanDapur?: string;
  catatanAdmin?: string;
  waktuDibuat: string; // ISO datetime
  requestType: RejectionRequestType;
}

export interface RejectionReportResponse {
  data: RejectionReportItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ===================== Audit Trail =====================

export interface AuditTrailUserSummary {
  id: number;
  namaLengkap: string;
  nomorIndukKaryawan: string;
  roleAccess: string; // 'administrator' | 'employee' | 'dapur' | 'delivery'
}

export interface AuditTrailItem {
  id: number;
  userId?: number;
  user?: AuditTrailUserSummary;
  aksi: string; // action type string (e.g., 'ORDER_STATUS_CHANGED')
  detail?: string; // optional detail payload
  timestamp: string; // ISO datetime
}

export interface AuditTrailResponse {
  data: AuditTrailItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ===================== Query DTOs (Request Params) =====================

export type GroupBy = 'DAILY' | 'WEEKLY' | 'MONTHLY';

export interface ConsumptionReportQueryDto {
  tanggalMulai?: string; // ISO date
  tanggalAkhir?: string; // ISO date
  groupBy?: GroupBy;
  shiftId?: number;
}

export interface DepartmentReportQueryDto {
  tanggalMulai?: string;
  tanggalAkhir?: string;
  departmentId?: number;
  status?: string; // backend status string
  shiftId?: number;
}

export interface PerformanceReportQueryDto {
  tanggalMulai?: string;
  tanggalAkhir?: string;
  departmentId?: number;
  shiftId?: number;
}

export interface RejectionReportQueryDto {
  tanggalMulai?: string;
  tanggalAkhir?: string;
  departmentId?: number;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  page?: number;
  limit?: number;
}

export interface AuditTrailQueryDto {
  search?: string;
  userId?: number;
  aksi?: string;
  action?: string;
  tanggalMulai?: string;
  tanggalAkhir?: string;
  page?: number;
  limit?: number;
}

// ===================== Backward-compatibility Aliases =====================
// These aliases keep existing pages compiling without edits by mapping legacy names
// to the new DTOs and interfaces defined above.

export type AuditTrailEntry = AuditTrailItem;
export type AuditTrailPage = AuditTrailResponse;
export type AuditTrailQuery = AuditTrailQueryDto;

export type ConsumptionReportQuery = ConsumptionReportQueryDto;
export type DepartmentReportQuery = DepartmentReportQueryDto;
export type PerformanceReportQuery = PerformanceReportQueryDto;
export type PerformanceReportResult = PerformanceReport;

export type RejectionReportQuery = RejectionReportQueryDto;
export type RejectionReportPage = RejectionReportResponse;