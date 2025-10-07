// frontend/src/services/api/reports.api.ts
import apiClient from '@/lib/axios';
import type { AxiosError } from 'axios';
import type {
  ConsumptionReportQuery,
  ConsumptionReportItem,
  DepartmentReportQuery,
  DepartmentReportItem,
  PerformanceReportQuery,
  PerformanceReportResult,
  RejectionReportQuery,
  RejectionReportPage,
  AuditTrailQuery,
  AuditTrailPage,
  AuditTrailEntry,
} from '@/types/report.types';

// Error extraction helper
function extractErrorMessage(error: unknown): string {
  const err = error as AxiosError<any>;
  const data = err?.response?.data as any;
  if (data) {
    if (typeof data === 'string') return data;
    if (typeof data.message === 'string') return data.message;
    if (Array.isArray(data.message)) return data.message.join(', ');
  }
  return err?.message ?? 'Unknown error';
}

// GET /api/reports/consumption
export async function getConsumptionReport(
  query: ConsumptionReportQuery = {},
): Promise<ConsumptionReportItem[]> {
  try {
    const res = await apiClient.get('/reports/consumption', { params: query });
    return res.data as ConsumptionReportItem[];
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

// GET /api/reports/department
export async function getDepartmentReport(
  query: DepartmentReportQuery = {},
): Promise<DepartmentReportItem[]> {
  try {
    const res = await apiClient.get('/reports/department', { params: query });
    return res.data as DepartmentReportItem[];
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

// GET /api/reports/performance
export async function getPerformanceReport(
  query: PerformanceReportQuery = {},
): Promise<PerformanceReportResult> {
  try {
    const res = await apiClient.get('/reports/performance', { params: query });
    return res.data as PerformanceReportResult;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

// GET /api/reports/rejections
export async function getRejectionReport(
  query: RejectionReportQuery = {},
): Promise<RejectionReportPage> {
  try {
    const res = await apiClient.get('/reports/rejections', { params: query });
    return res.data as RejectionReportPage;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

// GET /api/reports/audit-trail
export async function getAuditTrail(
  query: AuditTrailQuery = {},
): Promise<AuditTrailPage> {
  try {
    const res = await apiClient.get('/reports/audit-trail', { params: query });
    return res.data as AuditTrailPage;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

// GET /api/reports/audit-trail/order/:kodePesanan
export async function getAuditTrailByOrder(
  kodePesanan: string,
): Promise<AuditTrailEntry[]> {
  try {
    const res = await apiClient.get(`/reports/audit-trail/order/${encodeURIComponent(kodePesanan)}`);
    return res.data as AuditTrailEntry[];
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

// GET /api/reports/audit-trail/action-types
export async function getAuditTrailActionTypes(): Promise<string[]> {
  try {
    const res = await apiClient.get('/reports/audit-trail/action-types');
    return res.data as string[];
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}