// Alias tipe aman yang konsisten dengan enum RoleAccess di Prisma.
// Ganti ke `import type { RoleAccess } from '@prisma/client'` saat sudah tersedia.
type RoleAccessType = 'administrator' | 'employee' | 'dapur' | 'delivery';

export interface JwtPayload {
  // User ID (subject)
  sub: number;
  // Karyawan ID
  karyawanId: number;
  // Nomor Induk Karyawan
  nik: string;
  // User role
  role: RoleAccessType;
  // Issued at (opsional)
  iat?: number;
  // Expiration (opsional)
  exp?: number;
}
