/**
 * UsersService — Dokumentasi Operasi Manajemen User/Karyawan
 *
 * Lingkup Tanggung Jawab:
 * - Penciptaan akun (User + Karyawan) secara transaksi atomik dengan validasi konflik
 * - Pembacaan data karyawan (list/detail) termasuk relasi (user, department, jabatan)
 * - Perubahan status aktif/non-aktif karyawan disertai audit log
 * - Perubahan role akses (User.role + Karyawan.roleAccess) dalam transaksi yang konsisten
 * - Reset password user dengan password sementara (dikembalikan ke admin), disertai audit
 *
 * Prinsip Keamanan & Konsistensi:
 * - Password selalu di-hash (bcrypt) sebelum disimpan
 * - Transaksi Prisma memastikan perubahan cross-table tetap konsisten
 * - AuditTrail mencatat aksi-aksi penting termasuk siapa pelakunya (adminKaryawanId)
 *
 * Pola Penggunaan di Controller:
 * - Inject service: constructor(private readonly usersService: UsersService) {}
 * - Panggil method sesuai operasi mis. createUser, updateStatus, updateRole, resetPassword
 * - Pastikan guard & authorization controller sudah sesuai role yang diizinkan
 *
 * Integrasi AuditTrail:
 * - logUserCreated, logUserStatusChanged, logPasswordReset dipanggil otomatis
 * - Untuk perubahan role, gunakan auditTrail.log(...) dengan aksi 'USER_ROLE_CHANGED'
 */
import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditTrailService } from '../common/services/audit-trail.service';
import bcrypt from 'bcrypt';
import { CreateUserDto, UpdateUserStatusDto, UpdateUserRoleDto, UpdateUserProfileDto } from './dto';
import type { Prisma } from '@prisma/client';

const SALT_ROUNDS = 10;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditTrail: AuditTrailService,
  ) {}

  /**
   * Create a new User and Karyawan entry in a transaction.
   * - Checks for existing NIK and username conflicts
   * - Hashes password with bcrypt
   * - Creates User then Karyawan in a transaction
   * - Logs audit trail
   */
  async createUser(adminKaryawanId: number, createUserDto: CreateUserDto) {
    const {
      nik,
      namaLengkap,
      password,
      roleAccess,
      departmentId,
      jabatanId,
      keterangan,
    } = createUserDto;

    // Check if NIK already exists on Karyawan
    const existingKaryawan = await this.prisma.karyawan.findUnique({
      where: { nomorIndukKaryawan: nik },
    });
    if (existingKaryawan) {
      throw new ConflictException('NIK already exists');
    }

    // Check if username already exists on User (we use nik as username)
    const existingUser = await this.prisma.user.findUnique({
      where: { username: nik },
    });
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Create User and Karyawan in a transaction
    const createdKaryawan = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const user = await tx.user.create({
          data: {
            username: nik,
            passwordHash,
            // Use fallback cast to enum to avoid TS type friction if Prisma enum export differs
            role: roleAccess as any,
          },
        });

        const karyawan = await tx.karyawan.create({
          data: {
            userId: user.id,
            nomorIndukKaryawan: nik,
            namaLengkap,
            departmentId: departmentId ?? null,
            jabatanId: jabatanId ?? null,
            roleAccess: roleAccess as any,
            isActive: true,
            keterangan: keterangan ?? null,
          },
        });

        return karyawan;
      },
    );

    await this.auditTrail.logUserCreated(adminKaryawanId, nik);

    // Return with relations
    return this.prisma.karyawan.findUnique({
      where: { id: createdKaryawan.id },
      include: { user: true, department: true, jabatan: true },
    });
  }

  /**
   * Get all karyawan including relations
   */
  async findAll() {
    return this.prisma.karyawan.findMany({
      include: { user: true, department: true, jabatan: true },
    });
  }

  /**
   * Get a single karyawan by id including relations
   */
  async findOne(id: number) {
    const karyawan = await this.prisma.karyawan.findUnique({
      where: { id },
      include: { user: true, department: true, jabatan: true },
    });

    if (!karyawan) {
      throw new NotFoundException('Karyawan not found');
    }

    return karyawan;
  }

  /**
   * Update active status of karyawan
   * - Finds karyawan
   * - Updates status
   * - Logs audit trail
   */
  async updateStatus(
    adminKaryawanId: number,
    id: number,
    updateStatusDto: UpdateUserStatusDto,
  ) {
    const target = await this.prisma.karyawan.findUnique({
      where: { id },
    });

    if (!target) {
      throw new NotFoundException('Karyawan not found');
    }

    await this.prisma.karyawan.update({
      where: { id },
      data: { isActive: updateStatusDto.isActive },
    });

    await this.auditTrail.logUserStatusChanged(
      adminKaryawanId,
      target.nomorIndukKaryawan,
      updateStatusDto.isActive,
    );

    return this.prisma.karyawan.findUnique({
      where: { id },
      include: { user: true, department: true, jabatan: true },
    });
  }

  /**
   * Update role on both User and Karyawan within a transaction
   * - Validates target karyawan and associated user
   * - Updates user.role and karyawan.roleAccess
   * - Logs audit trail
   */
  async updateRole(
    adminKaryawanId: number,
    id: number,
    updateRoleDto: UpdateUserRoleDto,
  ) {
    const target = await this.prisma.karyawan.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!target) {
      throw new NotFoundException('Karyawan not found');
    }

    if (!target.user) {
      throw new BadRequestException('Associated user account not found');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: target.user.id },
        data: { role: updateRoleDto.roleAccess as any },
      }),
      this.prisma.karyawan.update({
        where: { id },
        data: { roleAccess: updateRoleDto.roleAccess as any },
      }),
    ]);

    // Specific log for role change using generic logger
    await this.auditTrail.log({
      userId: adminKaryawanId,
      aksi: 'USER_ROLE_CHANGED',
      detail: `Admin changed role of user ${target.nomorIndukKaryawan} to ${updateRoleDto.roleAccess}`,
    });

    return this.prisma.karyawan.findUnique({
      where: { id },
      include: { user: true, department: true, jabatan: true },
    });
  }

  /**
   * Reset user password to a temporary value
   * - Generates a temporary password
   * - Hashes and updates the user's password
   * - Logs audit trail
   */
  async resetPassword(adminKaryawanId: number, id: number) {
    const target = await this.prisma.karyawan.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!target) {
      throw new NotFoundException('Karyawan not found');
    }

    if (!target.user) {
      throw new BadRequestException('Associated user account not found');
    }

    const tempPassword = this.generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(tempPassword, SALT_ROUNDS);

    await this.prisma.user.update({
      where: { id: target.user.id },
      data: { passwordHash },
    });

    await this.auditTrail.logPasswordReset(
      adminKaryawanId,
      target.nomorIndukKaryawan,
    );

    return {
      message: 'Temporary password generated and set successfully',
      tempPassword,
    };
  }

  private generateTemporaryPassword(): string {
    // Example: TEMP-<6 random alphanumeric>
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = 'TEMP-';
    for (let i = 0; i < 6; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  }
  /**
   * Update karyawan profile (namaLengkap, departmentId, jabatanId)
   * - Validates target karyawan
   * - Validates department/jabatan existence when provided
   * - Allows clearing department/jabatan with null
   * - Logs audit trail
   */
  async updateProfile(
    adminKaryawanId: number,
    id: number,
    dto: UpdateUserProfileDto,
  ) {
    const { namaLengkap, departmentId, jabatanId } = dto;

    const target = await this.prisma.karyawan.findUnique({
      where: { id },
    });

    if (!target) {
      throw new NotFoundException('Karyawan not found');
    }

    // Resolve department target when provided (supports null to clear)
    let resolvedDepartmentId: number | null | undefined = undefined;
    if (typeof departmentId !== 'undefined') {
      if (departmentId === null) {
        resolvedDepartmentId = null;
      } else {
        const dept = await this.prisma.department.findUnique({
          where: { id: departmentId },
        });
        if (!dept) {
          throw new BadRequestException('Department not found');
        }
        resolvedDepartmentId = departmentId;
      }
    }

    // Resolve jabatan target when provided (supports null to clear)
    let resolvedJabatanId: number | null | undefined = undefined;
    if (typeof jabatanId !== 'undefined') {
      if (jabatanId === null) {
        resolvedJabatanId = null;
      } else {
        const jab = await this.prisma.jabatan.findUnique({
          where: { id: jabatanId },
        });
        if (!jab) {
          throw new BadRequestException('Jabatan not found');
        }
        resolvedJabatanId = jabatanId;
      }
    }

    // Build patch data conditionally to avoid overwriting when not provided
    const data: any = {
      namaLengkap,
    };
    if (typeof resolvedDepartmentId !== 'undefined') {
      data.departmentId = resolvedDepartmentId;
    }
    if (typeof resolvedJabatanId !== 'undefined') {
      data.jabatanId = resolvedJabatanId;
    }

    await this.prisma.karyawan.update({
      where: { id },
      data,
    });

    // Audit trail with before/after context summary
    const deptBefore = target.departmentId ?? 'null';
    const deptAfter =
      typeof resolvedDepartmentId === 'undefined'
        ? '(unchanged)'
        : (resolvedDepartmentId ?? 'null');
    const jabBefore = target.jabatanId ?? 'null';
    const jabAfter =
      typeof resolvedJabatanId === 'undefined'
        ? '(unchanged)'
        : (resolvedJabatanId ?? 'null');

    await this.auditTrail.log({
      userId: adminKaryawanId,
      aksi: 'USER_PROFILE_UPDATED',
      detail: `Admin updated profile of user ${target.nomorIndukKaryawan}: nama="${target.namaLengkap}" -> "${namaLengkap}", dept=${deptBefore} -> ${deptAfter}, jabatan=${jabBefore} -> ${jabAfter}`,
    });

    return this.prisma.karyawan.findUnique({
      where: { id },
      include: { user: true, department: true, jabatan: true },
    });
  }
  /**
   * getUserProfile
   * Mengambil profil karyawan beserta relasi master data (department, jabatan).
   * - Gunakan select pada relasi user untuk memastikan passwordHash tidak pernah keluar.
   * - Opsi verifyUserId: jika disediakan, akan diverifikasi kecocokan terhadap profile.user.id.
   *
   * Digunakan untuk konsistensi payload profil di luar AuthService (mis. admin fetch profil).
   */
  async getUserProfile(
    karyawanId: number,
    verifyUserId?: number,
  ): Promise<any> {
    const profile = await this.prisma.karyawan.findUnique({
      where: { id: karyawanId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            role: true,
            createdAt: true,
          },
        },
        department: true,
        jabatan: true,
      },
    });

    if (!profile) {
      throw new NotFoundException('Karyawan not found');
    }
    if (
      typeof verifyUserId === 'number' &&
      (!profile.user || profile.user.id !== verifyUserId)
    ) {
      throw new BadRequestException('User mismatch for requested profile');
    }

    return profile;
  }
}
