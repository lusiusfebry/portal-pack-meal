/**
 * Type definitions untuk domain User & Master Data di frontend.
 * Diselaraskan dengan schema Prisma dan kontrak backend.
 *
 * Referensi backend:
 * - RoleAccess enum: backend/prisma/schema.prisma (RoleAccess)
 * - Model Karyawan, Department, Shift, User: backend/prisma/schema.prisma
 * - UsersService: backend/src/users/users.service.ts
 */

import type { Role } from './auth.types';

/**
 * Master data: Department
 */
export interface Department {
  id: number;
  namaDivisi: string;
  keterangan?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Master data: Jabatan (optional di UI; disediakan bila diperlukan)
 */
export interface Jabatan {
  id: number;
  namaJabatan: string;
  departmentId?: number | null;
  keterangan?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Master data: Shift
 */
export interface Shift {
  id: number;
  namaShift: string;
  jamMulai: string; // HH:mm:ss atau ISO dari backend (db.Time)
  jamSelesai: string; // HH:mm:ss atau ISO dari backend (db.Time)
  keterangan?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Model User (backend/users), direferensikan oleh Karyawan.user
 * Catatan: passwordHash TIDAK PERNAH dikirim ke frontend.
 */
export interface UserAccount {
  id: number;
  username: string;
  role: Role;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Model Karyawan (profil utama user operasional).
 * Mengikat ke UserAccount dan master data.
 */
export interface KaryawanProfile {
  id: number;
  userId?: number | null;
  nomorIndukKaryawan: string; // NIK
  namaLengkap: string;
  departmentId?: number | null;
  jabatanId?: number | null;
  roleAccess: Role;
  isActive: boolean;
  keterangan?: string | null;
  createdAt?: string;
  updatedAt?: string;

  // Relations (opsional, bergantung pada API select/include)
  department?: Department | null;
  jabatan?: Jabatan | null;
  user?: UserAccount | null;
}

/**
 * Representasi profil user di UI (ringkas), sejalan dengan AuthState.user.
 * Dipakai di header/topbar, context, dan otorisasi halaman.
 */
export interface UserProfile {
  id: number; // UserAccount.id
  karyawanId: number;
  nik: string;
  nama: string;
  role: Role;
  departmentId?: number;
  departmentName?: string;
}

/**
 * Status pengguna untuk administrasi (sinkron dengan UsersService.updateStatus).
 */
export type UserStatus = 'active' | 'inactive';

/**
 * Payload administrasi untuk perubahan status pengguna.
 * Note: userId sebenarnya adalah karyawanId untuk API backend.
 */
export interface UpdateUserStatusPayload {
  userId: number; // Sebenarnya karyawanId di backend
  status: UserStatus;
}

/**
 * Payload administrasi untuk perubahan role pengguna.
 * Note: userId sebenarnya adalah karyawanId untuk API backend.
 */
export interface UpdateUserRolePayload {
  userId: number; // Sebenarnya karyawanId di backend
  role: Role;
}
/**
 * Payload administrasi untuk update profil karyawan.
 * Digunakan oleh endpoint PATCH /api/users/:id/profile.
 */
export interface UpdateUserProfilePayload {
  userId: number; // Sebenarnya karyawanId di backend
  namaLengkap: string;
  departmentId?: number | null;
  jabatanId?: number | null;
}
/**
 * Master data: Lokasi
 * Diselaraskan dengan backend/prisma schema (master_lokasi).
 */
export interface Lokasi {
  id: number;
  namaLokasi: string;
  alamat: string;
  keterangan?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}