// frontend/src/services/api/users.api.ts
import apiClient from '@/lib/axios';
import type { AxiosError } from 'axios';
import type {
  KaryawanProfile,
  UpdateUserStatusPayload,
  UpdateUserRolePayload,
  UpdateUserProfilePayload,
} from '@/types/user.types';
import type { Role } from '@/types/auth.types';

// Local payload type aligned with backend CreateUserDto
export interface CreateUserPayload {
  nik: string;
  namaLengkap: string;
  password: string;
  roleAccess: Role;
  departmentId?: number | null;
  jabatanId?: number | null;
  keterangan?: string | null;
}

// Error extraction helper (consistent across API layer)
function extractErrorMessage(error: unknown): string {
  const err = error as AxiosError<any>;
  const data = err?.response?.data as any;
  if (data) {
    if (typeof data === 'string') return data;
    if (typeof data.message === 'string') return data.message;
    if (Array.isArray(data.message)) return data.message.join(', ');
  }
  return err?.message ? err.message : 'Unknown error';
}

// API: Users (Administrator scope)
export async function getUsers(): Promise<KaryawanProfile[]> {
  try {
    const res = await apiClient.get('/users');
    return res.data as KaryawanProfile[];
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export async function getUserById(id: number): Promise<KaryawanProfile> {
  try {
    const res = await apiClient.get(`/users/${id}`);
    return res.data as KaryawanProfile;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export async function createUser(payload: CreateUserPayload): Promise<KaryawanProfile> {
  try {
    const res = await apiClient.post('/users', payload);
    return res.data as KaryawanProfile;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export async function updateUserStatus(payload: UpdateUserStatusPayload): Promise<KaryawanProfile> {
  try {
    const { userId: karyawanId, status } = payload;
    const isActive = status === 'active';
    const res = await apiClient.patch(`/users/${karyawanId}/status`, { isActive });
    return res.data as KaryawanProfile;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export async function updateUserRole(payload: UpdateUserRolePayload): Promise<KaryawanProfile> {
  try {
    const { userId: karyawanId, role } = payload;
    const res = await apiClient.patch(`/users/${karyawanId}/role`, { roleAccess: role });
    return res.data as KaryawanProfile;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

export async function resetUserPassword(
  karyawanId: number,
): Promise<{ message: string; tempPassword: string }> {
  try {
    const res = await apiClient.post(`/users/${karyawanId}/reset-password`);
    return res.data as { message: string; tempPassword: string };
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}

// Update profil karyawan (administrator)
export async function updateUserProfile(
  payload: UpdateUserProfilePayload,
): Promise<KaryawanProfile> {
  try {
    const { userId: karyawanId, namaLengkap, departmentId, jabatanId } = payload;

    const body: Record<string, any> = { namaLengkap };
    if (typeof departmentId !== 'undefined') body.departmentId = departmentId;
    if (typeof jabatanId !== 'undefined') body.jabatanId = jabatanId;

    const res = await apiClient.patch(`/users/${karyawanId}/profile`, body);
    return res.data as KaryawanProfile;
  } catch (error) {
    throw new Error(extractErrorMessage(error));
  }
}