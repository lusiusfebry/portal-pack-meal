import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditTrailQueryDto } from '../../reports/dto/audit-trail-query.dto';

/**
 * AuditTrailService
 *
 * Layanan terpusat untuk mencatat aktivitas penting aplikasi ke tabel auditTrail.
 * Service ini digunakan lintas modul (Auth, Users, Orders, dll) untuk menyimpan
 * jejak aksi (audit log) seperti keberhasilan/kegagalan login, pembuatan user,
 * perubahan status/role user, reset password, dan kejadian bisnis lainnya.
 *
 * Karakteristik:
 * - Abstraksi method spesifik (logLoginSuccess, logLoginFailure, dll) guna
 *   menyederhanakan pemanggilan dari service lain.
 * - Method generic (log) tersedia untuk fleksibilitas kebutuhan logging baru.
 *
 * Konvensi Kolom:
 * - userId: number | null — ID karyawan pelaku aksi (null untuk kegagalan login / anonymous).
 * - aksi: string — Kode aksi ringkas berbasis UPPER_SNAKE_CASE (misal: LOGIN_SUCCESS).
 * - detail: string | null — Keterangan naratif yang mengandung konteks tambahan.
 *
 * Contoh Penggunaan (di service lain):
 *   constructor(private readonly auditTrail: AuditTrailService) {}
 *
 *   // Auth & Users
 *   await this.auditTrail.logLoginSuccess(karyawanId, nik);
 *   await this.auditTrail.logLoginFailure(nik, 'Invalid credentials');
 *   await this.auditTrail.logUserCreated(adminId, createdNik);
 *   await this.auditTrail.logUserStatusChanged(adminId, targetNik, true);
 *   await this.auditTrail.logPasswordReset(adminId, targetNik);
 *
 *   // Orders (contoh baru)
 *   await this.auditTrail.logOrderCreated(karyawanId, kodePesanan, jumlahPesanan, shiftName);
 *   await this.auditTrail.logOrderStatusChanged(karyawanId, kodePesanan, 'MENUNGGU', 'IN_PROGRESS');
 *   await this.auditTrail.logOrderRejectionRequested(dapurKaryawanId, kodePesanan, 'Alasan penolakan...');
 *   await this.auditTrail.logOrderEditRequested(dapurKaryawanId, kodePesanan, 3, 5, 'Perubahan jumlah karena stok');
 *   await this.auditTrail.logApprovalDecision(adminId, kodePesanan, 'APPROVED', 'REJECTION_REQUEST', 'Catatan opsional');
 *   await this.auditTrail.logOrderOverride(adminId, kodePesanan, 'FORCE_COMPLETE', 'Menandai pesanan selesai karena alasan tertentu');
 *
 *   // Generic/ad-hoc
 *   await this.auditTrail.log({ userId: adminId, aksi: 'SOME_ACTION', detail: 'extra info' });
 *
 *   // Query Methods (baru)
 *   const page1 = await this.auditTrail.query({ search: 'ORDER', page: 1, limit: 50 });
 *   const history = await this.auditTrail.getByOrderCode('PM-20251001-001');
 *   const actionTypes = await this.auditTrail.getActionTypes();
 */
@Injectable()
export class AuditTrailService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * log
   * Mencatat entri audit generik ke tabel auditTrail.
   *
   * Parameter:
   * - userId: ID karyawan pelaku aksi atau null jika anonim (misal: kegagalan login)
   * - aksi: kode aksi ringkas (contoh: 'LOGIN_SUCCESS', 'USER_CREATED')
   * - detail: deskripsi tambahan untuk memperkaya konteks
   *
   * Return:
   * - Promise<any> hasil pemanggilan prisma.auditTrail.create
   *
   * Kapan Dipakai:
   * - Saat tidak ada helper khusus yang sesuai atau untuk kebutuhan logging ad-hoc.
   */
  async log(params: {
    userId?: number | null;
    aksi: string;
    detail?: string | null;
  }): Promise<any> {
    const { userId, aksi, detail } = params;
    return this.prisma.auditTrail.create({
      data: {
        userId: userId ?? null,
        aksi,
        detail: detail ?? null,
      },
    });
  }

  /**
   * logLoginSuccess
   * Mencatat keberhasilan proses login.
   *
   * Parameter:
   * - karyawanId: ID karyawan yang berhasil login
   * - nik: Nomor Induk Karyawan yang digunakan untuk login
   *
   * Contoh:
   * await auditTrail.logLoginSuccess(karyawan.id, karyawan.nomorIndukKaryawan);
   */
  async logLoginSuccess(karyawanId: number, nik: string): Promise<any> {
    return this.log({
      userId: karyawanId,
      aksi: 'LOGIN_SUCCESS',
      detail: `User ${nik} logged in successfully`,
    });
  }

  /**
   * logLoginFailure
   * Mencatat kegagalan login (misal: kredensial salah, user tidak aktif).
   *
   * Parameter:
   * - nik: NIK yang dicoba saat login
   * - reason: alasan kegagalan (contoh: 'Invalid credentials', 'User inactive')
   *
   * Catatan:
   * - userId selalu null karena belum ada konteks user yang tervalidasi.
   */
  async logLoginFailure(nik: string, reason: string): Promise<any> {
    return this.log({
      userId: null,
      aksi: 'LOGIN_FAILURE',
      detail: `Failed login attempt for NIK ${nik}: ${reason}`,
    });
  }

  /**
   * logUserCreated
   * Mencatat pembuatan akun user baru oleh admin.
   *
   * Parameter:
   * - adminId: ID karyawan admin yang membuat user
   * - createdNik: NIK user yang baru dibuat
   *
   * Dampak:
   * - Memberikan audit jejak siapa yang membuat akun tertentu dan kapan.
   */
  async logUserCreated(adminId: number, createdNik: string): Promise<any> {
    return this.log({
      userId: adminId,
      aksi: 'USER_CREATED',
      detail: `Admin created user with NIK ${createdNik}`,
    });
  }

  /**
   * logUserStatusChanged
   * Mencatat perubahan status aktif/non-aktif pada user oleh admin.
   *
   * Parameter:
   * - adminId: ID karyawan admin yang melakukan perubahan
   * - targetNik: NIK user yang statusnya diubah
   * - isActive: status baru (true=aktif, false=non-aktif)
   *
   * Contoh:
   * await auditTrail.logUserStatusChanged(adminId, targetNik, true);
   */
  async logUserStatusChanged(
    adminId: number,
    targetNik: string,
    isActive: boolean,
  ): Promise<any> {
    return this.log({
      userId: adminId,
      aksi: 'USER_STATUS_CHANGED',
      detail: `Admin ${isActive ? 'activated' : 'deactivated'} user ${targetNik}`,
    });
  }

  /**
   * logPasswordReset
   * Mencatat aksi reset password user oleh admin.
   *
   * Parameter:
   * - adminId: ID karyawan admin yang melakukan reset
   * - targetNik: NIK user yang password-nya direset
   *
   * Keamanan:
   * - Tidak menyimpan password di log. Hanya metadata aksi dan target subjek.
   */
  async logPasswordReset(adminId: number, targetNik: string): Promise<any> {
    return this.log({
      userId: adminId,
      aksi: 'PASSWORD_RESET',
      detail: `Admin reset password for user ${targetNik}`,
    });
  }

  /**
   * logOrderCreated
   * Mencatat pembuatan pesanan baru oleh karyawan.
   *
   * Parameter:
   * - karyawanId: ID karyawan pembuat pesanan
   * - kodePesanan: kode unik pesanan
   * - jumlahPesanan: jumlah pack meal yang dipesan
   * - shiftName: nama shift terkait pesanan
   *
   * Contoh:
   * await auditTrail.logOrderCreated(karyawanId, 'ORD-001', 3, 'Shift Pagi');
   */
  async logOrderCreated(
    karyawanId: number,
    kodePesanan: string,
    jumlahPesanan: number,
    shiftName: string,
  ): Promise<any> {
    return this.log({
      userId: karyawanId,
      aksi: 'ORDER_CREATED',
      detail: `Order ${kodePesanan} created: qty=${jumlahPesanan}, shift=${shiftName}`,
    });
  }

  /**
   * logOrderStatusChanged
   * Mencatat perubahan status pesanan.
   *
   * Parameter:
   * - karyawanId: ID karyawan (pelaku perubahan atau pemilik pesanan)
   * - kodePesanan: kode unik pesanan
   * - oldStatus: status lama
   * - newStatus: status baru
   *
   * Contoh:
   * await auditTrail.logOrderStatusChanged(karyawanId, 'ORD-001', 'MENUNGGU', 'IN_PROGRESS');
   */
  async logOrderStatusChanged(
    karyawanId: number,
    kodePesanan: string,
    oldStatus: string,
    newStatus: string,
  ): Promise<any> {
    return this.log({
      userId: karyawanId,
      aksi: 'ORDER_STATUS_CHANGED',
      detail: `Order ${kodePesanan} status changed: ${oldStatus} -> ${newStatus}`,
    });
  }

  /**
   * logOrderRejectionRequested
   * Dapur mengajukan penolakan terhadap pesanan (butuh persetujuan admin).
   *
   * Parameter:
   * - dapurKaryawanId: ID karyawan tim dapur pengaju
   * - kodePesanan: kode unik pesanan
   * - reason: alasan penolakan
   *
   * Contoh:
   * await auditTrail.logOrderRejectionRequested(dapurKaryawanId, 'ORD-001', 'Alasan penolakan...');
   */
  async logOrderRejectionRequested(
    dapurKaryawanId: number,
    kodePesanan: string,
    reason: string,
  ): Promise<any> {
    return this.log({
      userId: dapurKaryawanId,
      aksi: 'ORDER_REJECTION_REQUESTED',
      detail: `Kitchen requested rejection for order ${kodePesanan}: ${reason}`,
    });
  }

  /**
   * logOrderEditRequested
   * Dapur mengajukan perubahan (edit) jumlah pesanan (butuh persetujuan admin).
   *
   * Parameter:
   * - dapurKaryawanId: ID karyawan tim dapur pengaju
   * - kodePesanan: kode unik pesanan
   * - oldQty: jumlah sebelumnya
   * - newQty: jumlah yang diminta
   * - reason: alasan perubahan
   *
   * Contoh:
   * await auditTrail.logOrderEditRequested(dapurKaryawanId, 'ORD-001', 3, 5, 'Perubahan jumlah karena stok');
   */
  async logOrderEditRequested(
    dapurKaryawanId: number,
    kodePesanan: string,
    oldQty: number,
    newQty: number,
    reason: string,
  ): Promise<any> {
    return this.log({
      userId: dapurKaryawanId,
      aksi: 'ORDER_EDIT_REQUESTED',
      detail: `Kitchen requested edit for order ${kodePesanan}: qty ${oldQty} -> ${newQty}; reason: ${reason}`,
    });
  }

  /**
   * logApprovalDecision
   * Admin mengambil keputusan atas suatu permintaan approval (rejection/edit).
   *
   * Parameter:
   * - adminId: ID karyawan admin pengambil keputusan
   * - kodePesanan: kode unik pesanan
   * - decision: keputusan ('APPROVED' | 'REJECTED' | dll)
   * - requestType: jenis permintaan ('REJECTION_REQUEST' | 'EDIT_REQUEST' | dll)
   * - notes: catatan tambahan (opsional)
   *
   * Contoh:
   * await auditTrail.logApprovalDecision(adminId, 'ORD-001', 'APPROVED', 'REJECTION_REQUEST', 'Catatan opsional');
   */
  async logApprovalDecision(
    adminId: number,
    kodePesanan: string,
    decision: string,
    requestType: string,
    notes?: string,
  ): Promise<any> {
    const notesPart = notes ? `, notes=${notes}` : '';
    return this.log({
      userId: adminId,
      aksi: 'APPROVAL_DECIDED',
      detail: `Admin approval decision for order ${kodePesanan}: decision=${decision}, request=${requestType}${notesPart}`,
    });
  }

  /**
   * logOrderOverride
   * Admin melakukan override terhadap pesanan (aksi langsung tanpa workflow).
   *
   * Parameter:
   * - adminId: ID karyawan admin pelaku override
   * - kodePesanan: kode unik pesanan
   * - action: jenis override (misal: 'FORCE_COMPLETE', 'FORCE_CANCEL')
   * - detail: penjelasan singkat override
   *
   * Contoh:
   * await auditTrail.logOrderOverride(adminId, 'ORD-001', 'FORCE_COMPLETE', 'Menandai pesanan selesai karena alasan tertentu');
   */
  async logOrderOverride(
    adminId: number,
    kodePesanan: string,
    action: string,
    detail: string,
  ): Promise<any> {
    return this.log({
      userId: adminId,
      aksi: 'ORDER_OVERRIDE',
      detail: `Admin override on order ${kodePesanan}: ${action} — ${detail}`,
    });
  }

  /**
   * query
   * Melakukan pencarian audit log dengan where clause dinamis, pagination, dan include informasi user (Karyawan).
   *
   * Filter dinamis:
   * - search: OR pada aksi/detail (contains, case-insensitive)
   * - userId: filter ID karyawan pelaku
   * - aksi: filter tipe aksi spesifik
   * - tanggalMulai/tanggalAkhir: rentang waktu (timestamp gte/lte)
   *
   * Return:
   * - { data, total, page, limit, totalPages }
   */
  async query(queryDto: AuditTrailQueryDto): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      search,
      userId,
      aksi,
      tanggalMulai,
      tanggalAkhir,
      page = 1,
      limit = 50,
    } = queryDto;

    const where: any = { AND: [] };

    if (search) {
      where.AND.push({
        OR: [
          { aksi: { contains: search, mode: 'insensitive' } },
          { detail: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    if (typeof userId === 'number') {
      where.AND.push({ userId });
    }

    if (aksi) {
      where.AND.push({ aksi });
    }

    if (tanggalMulai || tanggalAkhir) {
      const range: any = {};
      if (tanggalMulai) range.gte = new Date(tanggalMulai);
      if (tanggalAkhir) range.lte = new Date(tanggalAkhir);
      where.AND.push({ timestamp: range });
    }

    if (where.AND.length === 0) {
      delete where.AND;
    }

    const skip = (page - 1) * limit;

    const [total, logs] = await Promise.all([
      this.prisma.auditTrail.count({ where }),
      this.prisma.auditTrail.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              nomorIndukKaryawan: true,
              namaLengkap: true,
              roleAccess: true,
              departmentId: true,
              jabatanId: true,
            },
          },
        },
      }),
    ]);

    return {
      data: logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit || 1),
    };
  }

  /**
   * getByOrderCode
   * Mengambil seluruh audit log yang terkait dengan satu kode pesanan tertentu.
   * Pencarian dilakukan pada kolom detail (contains, case-insensitive) dan diurutkan
   * berdasarkan timestamp ascending agar histori kronologis terbaca jelas.
   */
  async getByOrderCode(kodePesanan: string): Promise<any[]> {
    return this.prisma.auditTrail.findMany({
      where: {
        detail: { contains: kodePesanan, mode: 'insensitive' },
      },
      orderBy: { timestamp: 'asc' },
      include: {
        user: {
          select: {
            id: true,
            nomorIndukKaryawan: true,
            namaLengkap: true,
            roleAccess: true,
            departmentId: true,
            jabatanId: true,
          },
        },
      },
    });
  }

  /**
   * getActionTypes
   * Mengambil daftar unik tipe aksi (aksi) yang pernah terekam di audit trail.
   * Berguna untuk menyediakan pilihan filter di UI (dropdown action types).
   */
  async getActionTypes(): Promise<string[]> {
    const rows = await this.prisma.auditTrail.findMany({
      distinct: ['aksi'],
      select: { aksi: true },
      orderBy: { aksi: 'asc' },
    });
    return rows.map((r) => r.aksi);
  }
}
