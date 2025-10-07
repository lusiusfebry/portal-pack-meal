import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { AuditTrailService } from '../common/services/audit-trail.service';
import * as bcrypt from 'bcrypt';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { LoginDto } from './dto';

/**
 * AuthService — Layanan Autentikasi & Token Management
 *
 * Tanggung jawab utama:
 * - Validasi kredensial user (NIK + password) terhadap data pada tabel User/Karyawan
 * - Menghasilkan pasangan token (access + refresh) berbasis JWT dengan payload aman
 * - Mencatat aktivitas login (sukses/gagal) ke AuditTrail untuk kebutuhan compliance
 * - Menyediakan akses profil user terautentikasi (dengan relasi yang diperlukan)
 * - Melakukan refresh token (mengeluarkan pasangan token baru) jika masih valid
 *
 * Alur Autentikasi (high-level):
 * 1) Client mengirim NIK + password → [login()]
 * 2) Service memanggil [validateUser()] untuk cek user aktif & verifikasi password
 * 3) Jika gagal, catat AuditTrail (LOGIN_FAILURE) dan lempar UnauthorizedException
 * 4) Jika sukses, generate access/refresh token via [generateTokens()]
 * 5) Catat AuditTrail (LOGIN_SUCCESS) dan load profil user (include relasi)
 * 6) Kembalikan { accessToken, refreshToken, user }
 *
 * Refresh Token:
 * - Endpoint refresh memanggil [refreshTokens(userId, karyawanId)] untuk verifikasi bahwa
 *   user dan karyawan masih valid & aktif, lalu mengeluarkan pasangan token baru.
 *
 * Keamanan:
 * - Payload JWT berisi hanya data minimal (sub, karyawanId, nik, role)
 * - Secret + waktu kadaluarsa diambil dari ConfigService dengan fallback default
 * - Validasi guard global: JwtAuthGuard (auth) + RolesGuard (authorization) di bootstrap
 * - Password disimpan sebagai bcrypt hash; hash TIDAK pernah keluar dari service boundary
 *   (controller tidak pernah mengembalikannya di response).
 * - API responses yang menyertakan relasi user SELALU menggunakan Prisma `select` untuk
 *   whitelisting kolom aman (id, username, role, createdAt). Hindari `include` tanpa `select`
 *   pada response agar `passwordHash` tidak pernah terserialisasi ke klien.
 *
 * AuditTrail:
 * - LOGIN_SUCCESS, LOGIN_FAILURE dibangkitkan otomatis oleh service ini, untuk visibilitas ops
 */

interface KaryawanWithUser {
  id: number;
  nomorIndukKaryawan: string;
  roleAccess: JwtPayload['role'];
  isActive: boolean;
  user: { id: number; passwordHash: string } | null;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditTrail: AuditTrailService,
  ) {}

  /**
   * validateUser
   * Memvalidasi kredensial berdasarkan NIK dan password.
   *
   * Parameter:
   * - nik: Nomor Induk Karyawan (digunakan sebagai username)
   * - password: Password plaintext dari client
   *
   * Proses:
   * - Cari karyawan (beserta user) berdasarkan NIK
   * - Pastikan karyawan aktif dan punya akun user
   * - Bandingkan password plaintext vs passwordHash (bcrypt.compare)
   *
   * Return:
   * - KaryawanWithUser jika valid; null jika tidak valid
   *
   * Catatan:
   * - Tidak melempar exception di sini; penanganan dilakukan oleh [login()]
   */
  async validateUser(
    nik: string,
    password: string,
  ): Promise<KaryawanWithUser | null> {
    /**
     * INTERNAL ONLY:
     * Query ini menggunakan include: { user: true } untuk mengambil passwordHash
     * dengan tujuan verifikasi yang aman via bcrypt.compare().
     * Objek yang memuat passwordHash TIDAK pernah di-return oleh controller; hanya digunakan
     * di dalam service ini untuk keperluan autentikasi.
     */
    const karyawan = await this.prisma.karyawan.findUnique({
      where: { nomorIndukKaryawan: nik },
      include: { user: true },
    });

    if (!karyawan || !karyawan.isActive || !karyawan.user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      karyawan.user.passwordHash,
    );
    if (!isPasswordValid) {
      return null;
    }

    return karyawan as unknown as KaryawanWithUser;
  }

  /**
   * login
   * Entry-point autentikasi: menerima NIK+password, verifikasi, audit, dan keluarkan token.
   *
   * Parameter:
   * - loginDto: { nik, password }
   *
   * Langkah:
   * 1) validateUser() → jika null, audit LOGIN_FAILURE dan lempar UnauthorizedException
   * 2) generateTokens() → keluarkan pasangan access/refresh token
   * 3) audit LOGIN_SUCCESS
   * 4) load profil user lengkap (include user/department/jabatan) untuk UI
   *
   * Return:
   * - { accessToken: string; refreshToken: string; user: any }
   */
  async login(
    loginDto: LoginDto,
  ): Promise<{ accessToken: string; refreshToken: string; user: any }> {
    const { nik, password } = loginDto;
    const karyawan = await this.validateUser(nik, password);

    if (!karyawan) {
      await this.auditTrail.logLoginFailure(
        nik,
        'Invalid credentials or inactive user',
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    const { accessToken, refreshToken } = await this.generateTokens(karyawan);
    await this.auditTrail.logLoginSuccess(
      karyawan.id,
      karyawan.nomorIndukKaryawan,
    );

    // Penting (Security): gunakan select pada relasi user agar passwordHash tidak terserialisasi.
    // Relasi non-sensitif lain (department, jabatan) dapat menggunakan include apa adanya.
    const userProfile = await this.prisma.karyawan.findUnique({
      where: { id: karyawan.id },
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

    return { accessToken, refreshToken, user: userProfile };
  }

  /**
   * generateTokens
   * Menghasilkan access token dan refresh token berbasis payload JWT.
   *
   * Parameter:
   * - karyawan: hasil validasi berisi id, nik, roleAccess, dan user.id
   *
   * Payload JWT:
   * - sub: id user (bukan id karyawan), dipakai oleh guard/passport
   * - karyawanId: id karyawan (authorization/ops)
   * - nik: NIK (identifikasi)
   * - role: role akses (authorization)
   *
   * Konfigurasi:
   * - Secret & expiresIn diambil dari ConfigService dengan fallback default
   *
   * Return:
   * - { accessToken: string; refreshToken: string }
   */
  async generateTokens(
    karyawan: KaryawanWithUser,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const payload: JwtPayload = {
      sub: karyawan.user!.id,
      karyawanId: karyawan.id,
      nik: karyawan.nomorIndukKaryawan,
      role: karyawan.roleAccess,
    };

    const accessSecret =
      this.configService.get<string>('JWT_SECRET') ?? 'supersecretjwt';
    const accessExpiresIn =
      this.configService.get<string>('JWT_EXPIRES_IN') ?? '15m';

    const refreshSecret =
      this.configService.get<string>('JWT_REFRESH_SECRET') ??
      'supersecretrefresh';
    const refreshExpiresIn =
      this.configService.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '7d';

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: accessSecret,
      expiresIn: accessExpiresIn,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: refreshSecret,
      expiresIn: refreshExpiresIn,
    });

    return { accessToken, refreshToken };
  }

  /**
   * refreshTokens
   * Mengeluarkan pasangan token baru (access+refresh) setelah verifikasi user/karyawan.
   *
   * Parameter:
   * - userId: id user (sub dari JWT)
   * - karyawanId: id karyawan terkait
   *
   * Validasi:
   * - Karyawan harus aktif dan memiliki user yang sesuai (user.id === userId)
   *
   * Return:
   * - Pasangan token baru via generateTokens()
   *
   * Error:
   * - UnauthorizedException jika tidak valid atau tidak aktif
   */
  async refreshTokens(
    userId: number,
    karyawanId: number,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // INTERNAL ONLY: include { user: true } aman digunakan di sini karena objek tidak di-return,
    // hanya untuk verifikasi konsistensi userId ↔ karyawan.user.id.
    const karyawan = await this.prisma.karyawan.findUnique({
      where: { id: karyawanId },
      include: { user: true },
    });

    if (
      !karyawan ||
      !karyawan.isActive ||
      !karyawan.user ||
      karyawan.user.id !== userId
    ) {
      throw new UnauthorizedException('User no longer valid or inactive');
    }

    return this.generateTokens(karyawan as unknown as KaryawanWithUser);
  }

  /**
   * getUserProfile
   * Mengambil profil karyawan beserta relasinya, dengan verifikasi kecocokan userId.
   *
   * Parameter:
   * - userId: id user dari JWT (sub)
   * - karyawanId: id karyawan yang diminta profilnya
   *
   * Return:
   * - Objek karyawan lengkap beserta relasi: user, department, jabatan
   *
   * Error:
   * - UnauthorizedException jika data tidak ditemukan atau tidak cocok
   */
  async getUserProfile(userId: number, karyawanId: number): Promise<any> {
    // Penting (Security): gunakan select pada relasi user agar passwordHash tidak ikut keluar.
    // Pastikan hanya kolom aman (id, username, role, createdAt) yang di-whitelist.
    const karyawan = await this.prisma.karyawan.findUnique({
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

    if (!karyawan || !karyawan.user || karyawan.user.id !== userId) {
      throw new UnauthorizedException('User not found or mismatched');
    }

    return karyawan;
  }
}
