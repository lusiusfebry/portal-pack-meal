// frontend/src/services/api/master.api.ts
import apiClient from '@/lib/axios';
import type { AxiosError } from 'axios';
import type { Department, Shift, Jabatan } from '@/types/user.types';

// Error extraction helper (konsisten dengan layanan lain)
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

// TODO: Saat endpoint backend tersedia, ganti stub dengan panggilan API langsung.
// Catatan: Backend master-data belum tersedia; kita sediakan fallback hardcoded
// berbasis seed agar UI bisa berjalan selama pengembangan.

// Stub: Departments (sinkron dengan backend/prisma/seed.ts)
const DEPARTMENT_STUB: Department[] = [
  { id: 1, namaDivisi: 'IT Department', keterangan: null },
  { id: 2, namaDivisi: 'Human Resources', keterangan: null },
  { id: 3, namaDivisi: 'Operations', keterangan: null },
];

// Stub: Shifts (sinkron dengan backend/prisma/seed.ts)
const SHIFT_STUB: Shift[] = [
  { id: 1, namaShift: 'Shift 1', jamMulai: '07:00:00', jamSelesai: '15:00:00', keterangan: null },
  { id: 2, namaShift: 'Shift 2', jamMulai: '15:00:00', jamSelesai: '23:00:00', keterangan: null },
  { id: 3, namaShift: 'Shift 3', jamMulai: '23:00:00', jamSelesai: '07:00:00', keterangan: null },
];

// Stub: Jabatans (sinkron dengan backend/prisma/seed.ts)
const JABATAN_STUB: Jabatan[] = [
  { id: 1, namaJabatan: 'Manager', departmentId: 1, keterangan: null },
  { id: 2, namaJabatan: 'Staff', departmentId: 2, keterangan: null },
  { id: 3, namaJabatan: 'Supervisor', departmentId: 3, keterangan: null },
];

// ========= READ (fallback ke stub bila endpoint belum tersedia) =========

export async function getDepartments(): Promise<Department[]> {
  try {
    const res = await apiClient.get('/master-data/departments');
    return res.data as Department[];
  } catch (error) {
    console.warn('getDepartments fallback to stub:', extractErrorMessage(error));
    return DEPARTMENT_STUB;
  }
}

export async function getShifts(): Promise<Shift[]> {
  try {
    const res = await apiClient.get('/master-data/shifts');
    return res.data as Shift[];
  } catch (error) {
    console.warn('getShifts fallback to stub:', extractErrorMessage(error));
    return SHIFT_STUB;
  }
}

export async function getJabatan(): Promise<Jabatan[]> {
  try {
    try {
      const res1 = await apiClient.get('/master-data/jabatan');
      return res1.data as Jabatan[];
    } catch {
      const res2 = await apiClient.get('/master-data/jabatans'); // alias
      return res2.data as Jabatan[];
    }
  } catch (error) {
    console.warn('getJabatan fallback to stub:', extractErrorMessage(error));
    return JABATAN_STUB;
  }
}

// ========= Payload Types (frontend) =========

// Departments
export interface CreateDepartmentPayload {
  namaDivisi: string;
  keterangan?: string | null;
}
export interface UpdateDepartmentPayload {
  namaDivisi?: string;
  keterangan?: string | null;
}

// Jabatan (Positions)
export interface CreateJabatanPayload {
  namaJabatan: string;
  departmentId?: number | null;
  keterangan?: string | null;
}
export interface UpdateJabatanPayload {
  namaJabatan?: string;
  departmentId?: number | null;
  keterangan?: string | null;
}

// Shifts
export interface CreateShiftPayload {
  namaShift: string;
  jamMulai: string; // HH:mm:ss
  jamSelesai: string; // HH:mm:ss
  keterangan?: string | null;
}
export interface UpdateShiftPayload {
  namaShift?: string;
  jamMulai?: string; // HH:mm:ss
  jamSelesai?: string; // HH:mm:ss
  keterangan?: string | null;
}

// ========= CRUD (Admin only endpoints) =========
// Departments
export async function createDepartment(
  payload: CreateDepartmentPayload,
): Promise<Department> {
  try {
    const res = await apiClient.post('/master-data/departments', payload);
    return res.data as Department;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export async function updateDepartment(
  id: number,
  payload: UpdateDepartmentPayload,
): Promise<Department> {
  try {
    const res = await apiClient.patch(`/master-data/departments/${id}`, payload);
    return res.data as Department;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export async function deleteDepartment(
  id: number,
): Promise<{ success: boolean } | void> {
  try {
    const res = await apiClient.delete(`/master-data/departments/${id}`);
    return res.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

// Jabatan
export async function createJabatan(
  payload: CreateJabatanPayload,
): Promise<Jabatan> {
  try {
    const res = await apiClient.post('/master-data/jabatan', payload);
    return res.data as Jabatan;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export async function updateJabatan(
  id: number,
  payload: UpdateJabatanPayload,
): Promise<Jabatan> {
  try {
    const res = await apiClient.patch(`/master-data/jabatan/${id}`, payload);
    return res.data as Jabatan;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export async function deleteJabatan(
  id: number,
): Promise<{ success: boolean } | void> {
  try {
    const res = await apiClient.delete(`/master-data/jabatan/${id}`);
    return res.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

// Shifts
export async function createShift(
  payload: CreateShiftPayload,
): Promise<Shift> {
  try {
    const res = await apiClient.post('/master-data/shifts', payload);
    return res.data as Shift;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export async function updateShift(
  id: number,
  payload: UpdateShiftPayload,
): Promise<Shift> {
  try {
    const res = await apiClient.patch(`/master-data/shifts/${id}`, payload);
    return res.data as Shift;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export async function deleteShift(
  id: number,
): Promise<{ success: boolean } | void> {
  try {
    const res = await apiClient.delete(`/master-data/shifts/${id}`);
    return res.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}
// Lokasi — types & API
import type { Lokasi } from '@/types/user.types';

export interface CreateLokasiPayload {
  namaLokasi: string;
  alamat: string;
  keterangan?: string | null;
  isActive?: boolean;
}

export interface UpdateLokasiPayload {
  namaLokasi?: string;
  alamat?: string;
  keterangan?: string | null;
  isActive?: boolean;
}

export async function getLokasi(): Promise<Lokasi[]> {
  try {
    const res = await apiClient.get('/master-data/lokasi');
    return res.data as Lokasi[];
  } catch (error) {
    console.warn('getLokasi fallback to empty:', extractErrorMessage(error));
    return [];
  }
}

export async function createLokasi(
  payload: CreateLokasiPayload,
): Promise<Lokasi> {
  try {
    const res = await apiClient.post('/master-data/lokasi', payload);
    return res.data as Lokasi;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export async function updateLokasi(
  id: number,
  payload: UpdateLokasiPayload,
): Promise<Lokasi> {
  try {
    const res = await apiClient.patch(`/master-data/lokasi/${id}`, payload);
    return res.data as Lokasi;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export async function deleteLokasi(
  id: number,
): Promise<{ success: boolean } | void> {
  try {
    const res = await apiClient.delete(`/master-data/lokasi/${id}`);
    return res.data;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}