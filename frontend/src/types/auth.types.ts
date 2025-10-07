/**
 * Types autentikasi untuk frontend.
 * Ikuti kontrak sederhana agar sinkron dengan backend JwtPayload dan profil karyawan.
 */

export type Role = 'administrator' | 'employee' | 'dapur' | 'delivery';

/**
 * Representasi user yang dipakai di sisi frontend.
 * Catatan: departmentId dan departmentName opsional karena profil bisa saja
 * tidak memiliki department.
 */
export interface User {
  id: number;
  karyawanId: number;
  nik: string;
  nama: string;
  role: Role;
  departmentId?: number;
  departmentName?: string;
  jabatanId?: number;
  jabatanName?: string;
}

/**
 * Kredensial login berbasis NIK.
 */
export interface LoginCredentials {
  nik: string;
  password: string;
}

/**
 * Response login minimal untuk client.
 * Backend juga memiliki refreshToken, namun tidak diwajibkan di kontrak ini.
 */
export interface LoginResponse {
  accessToken: string;
  user: User;
}

/**
 * State otentikasi global untuk store (Zustand/Context).
 */
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}