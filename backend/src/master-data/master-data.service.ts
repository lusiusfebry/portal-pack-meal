import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditTrailService } from '../common/services/audit-trail.service';
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
  CreateJabatanDto,
  UpdateJabatanDto,
  CreateShiftDto,
  UpdateShiftDto,
  CreateLokasiDto,
  UpdateLokasiDto,
} from './dto';

@Injectable()
export class MasterDataService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditTrail: AuditTrailService,
  ) {}

  // ========== READ ONLY (Accessible to all roles) ==========
  async getDepartments() {
    return this.prisma.department.findMany({
      orderBy: { namaDivisi: 'asc' },
    });
  }

  async getJabatan() {
    return this.prisma.jabatan.findMany({
      include: {
        department: {
          select: {
            id: true,
            namaDivisi: true,
          },
        },
      },
      orderBy: { namaJabatan: 'asc' },
    });
  }

  async getShifts() {
    return this.prisma.shift.findMany({
      orderBy: { namaShift: 'asc' },
    });
  }

  // ========== DEPARTMENT CRUD (Administrator only) ==========
  async createDepartment(adminKaryawanId: number, dto: CreateDepartmentDto) {
    const nama = dto.namaDivisi.trim();

    // Cek duplikasi nama divisi menggunakan query aman (WhereInput)
    const exists = await this.prisma.department.findFirst({
      where: { namaDivisi: nama },
      select: { id: true },
    });
    if (exists) {
      throw new ConflictException('Nama divisi sudah digunakan');
    }

    const created = await this.prisma.department.create({
      data: {
        namaDivisi: nama,
        keterangan: dto.keterangan ?? null,
      },
    });

    await this.auditTrail.log({
      userId: adminKaryawanId,
      aksi: 'MASTER_DEPARTMENT_CREATED',
      detail: `Department "${created.namaDivisi}" (id=${created.id}) created`,
    });

    return created;
  }

  async updateDepartment(
    adminKaryawanId: number,
    id: number,
    dto: UpdateDepartmentDto,
  ) {
    const target = await this.prisma.department.findUnique({ where: { id } });
    if (!target) {
      throw new NotFoundException('Department tidak ditemukan');
    }

    const patch: any = {};
    if (typeof dto.namaDivisi !== 'undefined') {
      const newNama = dto.namaDivisi.trim();
      // Cek duplikat nama selain record saat ini
      const conflict = await this.prisma.department.findFirst({
        where: { namaDivisi: newNama, NOT: { id } },
      });
      if (conflict) {
        throw new ConflictException('Nama divisi sudah digunakan');
      }
      patch.namaDivisi = newNama;
    }
    if (typeof dto.keterangan !== 'undefined') {
      patch.keterangan = dto.keterangan ?? null;
    }

    if (Object.keys(patch).length === 0) {
      return target; // tidak ada perubahan
    }

    const updated = await this.prisma.department.update({
      where: { id },
      data: patch,
    });

    await this.auditTrail.log({
      userId: adminKaryawanId,
      aksi: 'MASTER_DEPARTMENT_UPDATED',
      detail: `Department id=${id} updated: nama="${target.namaDivisi}" -> "${updated.namaDivisi}", ket=${target.keterangan ?? 'null'} -> ${updated.keterangan ?? 'null'}`,
    });

    return updated;
  }

  async deleteDepartment(adminKaryawanId: number, id: number) {
    const target = await this.prisma.department.findUnique({ where: { id } });
    if (!target) {
      throw new NotFoundException('Department tidak ditemukan');
    }

    // Validasi dependency sebelum delete
    const [cntJabatan, cntKaryawan, cntPesanan] = await Promise.all([
      this.prisma.jabatan.count({ where: { departmentId: id } }),
      this.prisma.karyawan.count({ where: { departmentId: id } }),
      this.prisma.pesanan.count({ where: { departmentPemesanId: id } }),
    ]);

    if (cntJabatan + cntKaryawan + cntPesanan > 0) {
      throw new BadRequestException(
        `Tidak dapat menghapus department karena memiliki relasi: jabatans=${cntJabatan}, karyawans=${cntKaryawan}, pesanan=${cntPesanan}`,
      );
    }

    await this.prisma.department.delete({ where: { id } });

    await this.auditTrail.log({
      userId: adminKaryawanId,
      aksi: 'MASTER_DEPARTMENT_DELETED',
      detail: `Department "${target.namaDivisi}" (id=${target.id}) deleted`,
    });

    return { message: 'Department deleted' };
  }

  // ========== JABATAN CRUD (Administrator only) ==========
  async createJabatan(adminKaryawanId: number, dto: CreateJabatanDto) {
    const nama = dto.namaJabatan.trim();

    // Validasi department jika disediakan
    let departmentId: number | null = null;
    if (typeof dto.departmentId !== 'undefined') {
      if (dto.departmentId === null) {
        departmentId = null;
      } else {
        const dept = await this.prisma.department.findUnique({
          where: { id: dto.departmentId },
        });
        if (!dept) {
          throw new BadRequestException('Department tidak ditemukan');
        }
        departmentId = dto.departmentId;
      }
    }

    // Cek uniqueness kombinasi (namaJabatan, departmentId) — per schema unique compound
    const conflict = await this.prisma.jabatan.findFirst({
      where: {
        namaJabatan: nama,
        departmentId: departmentId,
      },
    });
    if (conflict) {
      throw new ConflictException(
        'Kombinasi nama jabatan dan department sudah digunakan',
      );
    }

    const created = await this.prisma.jabatan.create({
      data: {
        namaJabatan: nama,
        departmentId,
        keterangan: dto.keterangan ?? null,
      },
      include: {
        department: {
          select: { id: true, namaDivisi: true },
        },
      },
    });

    await this.auditTrail.log({
      userId: adminKaryawanId,
      aksi: 'MASTER_JABATAN_CREATED',
      detail: `Jabatan "${created.namaJabatan}" (id=${created.id}) created; dept=${created.department ? `${created.department.namaDivisi}(${created.department.id})` : 'null'}`,
    });

    return created;
  }

  async updateJabatan(
    adminKaryawanId: number,
    id: number,
    dto: UpdateJabatanDto,
  ) {
    const target = await this.prisma.jabatan.findUnique({
      where: { id },
      include: {
        department: { select: { id: true, namaDivisi: true } },
      },
    });
    if (!target) {
      throw new NotFoundException('Jabatan tidak ditemukan');
    }

    // Resolve calon nilai akhir untuk cek konflik
    const finalNama = (dto.namaJabatan ?? target.namaJabatan).trim();
    let finalDeptId: number | null =
      typeof dto.departmentId !== 'undefined'
        ? dto.departmentId ?? null
        : target.departmentId ?? null;

    if (typeof dto.departmentId !== 'undefined' && dto.departmentId !== null) {
      const dept = await this.prisma.department.findUnique({
        where: { id: dto.departmentId },
      });
      if (!dept) {
        throw new BadRequestException('Department tidak ditemukan');
      }
    }

    // Cek conflict unique compound kecuali dirinya sendiri
    const dup = await this.prisma.jabatan.findFirst({
      where: {
        namaJabatan: finalNama,
        departmentId: finalDeptId,
        id: { not: id },
      },
    });
    if (dup) {
      throw new ConflictException(
        'Kombinasi nama jabatan dan department sudah digunakan',
      );
    }

    const patch: any = {};
    if (typeof dto.namaJabatan !== 'undefined') {
      patch.namaJabatan = finalNama;
    }
    if (typeof dto.departmentId !== 'undefined') {
      patch.departmentId = finalDeptId;
    }
    if (typeof dto.keterangan !== 'undefined') {
      patch.keterangan = dto.keterangan ?? null;
    }

    if (Object.keys(patch).length === 0) {
      return target;
    }

    const updated = await this.prisma.jabatan.update({
      where: { id },
      data: patch,
      include: {
        department: { select: { id: true, namaDivisi: true } },
      },
    });

    await this.auditTrail.log({
      userId: adminKaryawanId,
      aksi: 'MASTER_JABATAN_UPDATED',
      detail: `Jabatan id=${id} updated: nama="${target.namaJabatan}" -> "${updated.namaJabatan}", dept=${
        target.department ? `${target.department.namaDivisi}(${target.department.id})` : 'null'
      } -> ${
        updated.department ? `${updated.department.namaDivisi}(${updated.department.id})` : 'null'
      }`,
    });

    return updated;
  }

  async deleteJabatan(adminKaryawanId: number, id: number) {
    const target = await this.prisma.jabatan.findUnique({ where: { id } });
    if (!target) {
      throw new NotFoundException('Jabatan tidak ditemukan');
    }

    // Validasi dependency: Karyawan
    const cntKaryawan = await this.prisma.karyawan.count({
      where: { jabatanId: id },
    });
    if (cntKaryawan > 0) {
      throw new BadRequestException(
        `Tidak dapat menghapus jabatan karena memiliki relasi karyawan=${cntKaryawan}`,
      );
    }

    await this.prisma.jabatan.delete({ where: { id } });

    await this.auditTrail.log({
      userId: adminKaryawanId,
      aksi: 'MASTER_JABATAN_DELETED',
      detail: `Jabatan "${target.namaJabatan}" (id=${target.id}) deleted`,
    });

    return { message: 'Jabatan deleted' };
  }

  // ========== SHIFT CRUD (Administrator only) ==========

  private parseTimeStringToDate(time: string): Date {
    // Supports HH:mm or HH:mm:ss (24h), create UTC time on epoch date
    const normalized = time.includes(':')
      ? time.split(':').length === 2
        ? `${time}:00`
        : time
      : `${time}:00:00`;
    const [hh, mm, ss] = normalized.split(':').map((t) => parseInt(t, 10));
    if (
      Number.isNaN(hh) ||
      Number.isNaN(mm) ||
      Number.isNaN(ss) ||
      hh < 0 ||
      hh > 23 ||
      mm < 0 ||
      mm > 59 ||
      ss < 0 ||
      ss > 59
    ) {
      throw new BadRequestException(
        'Format waktu tidak valid. Gunakan HH:mm atau HH:mm:ss',
      );
    }
    return new Date(Date.UTC(1970, 0, 1, hh, mm, ss));
  }

  private ensureShiftTimeOrder(jamMulai: Date, jamSelesai: Date) {
    // Optional: enforce jamMulai < jamSelesai in the same day
    if (jamMulai.getTime() >= jamSelesai.getTime()) {
      throw new BadRequestException(
        'jamMulai harus lebih kecil dari jamSelesai',
      );
    }
  }

  async createShift(adminKaryawanId: number, dto: CreateShiftDto) {
    const nama = dto.namaShift.trim();

    // Cek duplikasi berdasarkan unique alias pada Prisma schema:
    // @@unique([namaShift], name: "uq_master_shift_nama_shift")
    const exists = await this.prisma.shift.findFirst({
      where: { namaShift: nama },
    });
    if (exists) {
      throw new ConflictException('Nama shift sudah digunakan');
    }

    const jamMulai = this.parseTimeStringToDate(dto.jamMulai);
    const jamSelesai = this.parseTimeStringToDate(dto.jamSelesai);
    this.ensureShiftTimeOrder(jamMulai, jamSelesai);

    const created = await this.prisma.shift.create({
      data: {
        namaShift: nama,
        jamMulai,
        jamSelesai,
        keterangan: dto.keterangan ?? null,
      },
    });

    await this.auditTrail.log({
      userId: adminKaryawanId,
      aksi: 'MASTER_SHIFT_CREATED',
      detail: `Shift "${created.namaShift}" (id=${created.id}) created: ${dto.jamMulai} - ${dto.jamSelesai}`,
    });

    return created;
  }

  async updateShift(
    adminKaryawanId: number,
    id: number,
    dto: UpdateShiftDto,
  ) {
    const target = await this.prisma.shift.findUnique({ where: { id } });
    if (!target) {
      throw new NotFoundException('Shift tidak ditemukan');
    }

    // Cek duplikasi nama jika diubah
    if (typeof dto.namaShift !== 'undefined') {
      const newNama = dto.namaShift.trim();
      const conflict = await this.prisma.shift.findFirst({
        where: { namaShift: newNama, id: { not: id } },
      });
      if (conflict) {
        throw new ConflictException('Nama shift sudah digunakan');
      }
    }

    const patch: any = {};
    if (typeof dto.namaShift !== 'undefined') {
      patch.namaShift = dto.namaShift.trim();
    }

    let jamMulaiDate: Date | undefined;
    let jamSelesaiDate: Date | undefined;

    if (typeof dto.jamMulai !== 'undefined') {
      jamMulaiDate = this.parseTimeStringToDate(dto.jamMulai);
      patch.jamMulai = jamMulaiDate;
    }
    if (typeof dto.jamSelesai !== 'undefined') {
      jamSelesaiDate = this.parseTimeStringToDate(dto.jamSelesai);
      patch.jamSelesai = jamSelesaiDate;
    }

    // Validasi urutan waktu jika salah satunya berubah
    if (jamMulaiDate || jamSelesaiDate) {
      const finalMulai = jamMulaiDate ?? (target.jamMulai as unknown as Date);
      const finalSelesai =
        jamSelesaiDate ?? (target.jamSelesai as unknown as Date);
      this.ensureShiftTimeOrder(finalMulai, finalSelesai);
    }

    if (typeof dto.keterangan !== 'undefined') {
      patch.keterangan = dto.keterangan ?? null;
    }

    if (Object.keys(patch).length === 0) {
      return target;
    }

    const updated = await this.prisma.shift.update({
      where: { id },
      data: patch,
    });

    await this.auditTrail.log({
      userId: adminKaryawanId,
      aksi: 'MASTER_SHIFT_UPDATED',
      detail: `Shift id=${id} updated: nama="${target.namaShift}" -> "${updated.namaShift}", jam=${target.jamMulai?.toISOString?.() ?? target.jamMulai} - ${target.jamSelesai?.toISOString?.() ?? target.jamSelesai} -> ${updated.jamMulai?.toISOString?.() ?? updated.jamMulai} - ${updated.jamSelesai?.toISOString?.() ?? updated.jamSelesai}`,
    });

    return updated;
  }

  async deleteShift(adminKaryawanId: number, id: number) {
    const target = await this.prisma.shift.findUnique({ where: { id } });
    if (!target) {
      throw new NotFoundException('Shift tidak ditemukan');
    }

    const cntPesanan = await this.prisma.pesanan.count({
      where: { shiftId: id },
    });
    if (cntPesanan > 0) {
      throw new BadRequestException(
        `Tidak dapat menghapus shift karena memiliki relasi pesanan=${cntPesanan}`,
      );
    }

    await this.prisma.shift.delete({ where: { id } });

    await this.auditTrail.log({
      userId: adminKaryawanId,
      aksi: 'MASTER_SHIFT_DELETED',
      detail: `Shift "${target.namaShift}" (id=${target.id}) deleted`,
    });

    return { message: 'Shift deleted' };
  }

  // ========== LOKASI CRUD (Administrator only untuk write) ==========
  async getLokasi() {
    return this.prisma.lokasi.findMany({
      orderBy: { namaLokasi: 'asc' },
    });
  }

  async createLokasi(adminKaryawanId: number, dto: CreateLokasiDto) {
    const nama = dto.namaLokasi.trim();

    const exists = await this.prisma.lokasi.findFirst({
      where: { namaLokasi: nama },
      select: { id: true },
    });
    if (exists) {
      throw new ConflictException('Nama lokasi sudah digunakan');
    }

    const created = await this.prisma.lokasi.create({
      data: {
        namaLokasi: nama,
        alamat: dto.alamat,
        keterangan: dto.keterangan ?? null,
        isActive: dto.isActive ?? true,
      },
    });

    await this.auditTrail.log({
      userId: adminKaryawanId,
      aksi: 'MASTER_LOKASI_CREATED',
      detail: `Lokasi "${created.namaLokasi}" (id=${created.id}) created`,
    });

    return created;
  }

  async updateLokasi(
    adminKaryawanId: number,
    id: number,
    dto: UpdateLokasiDto,
  ) {
    const target = await this.prisma.lokasi.findUnique({ where: { id } });
    if (!target) {
      throw new NotFoundException('Lokasi tidak ditemukan');
    }

    const patch: Record<string, any> = {};

    if (typeof dto.namaLokasi !== 'undefined') {
      const newNama = dto.namaLokasi.trim();
      const conflict = await this.prisma.lokasi.findFirst({
        where: { namaLokasi: newNama, id: { not: id } },
        select: { id: true },
      });
      if (conflict) {
        throw new ConflictException('Nama lokasi sudah digunakan');
      }
      patch.namaLokasi = newNama;
    }

    if (typeof dto.alamat !== 'undefined') {
      patch.alamat = dto.alamat;
    }

    if (typeof dto.keterangan !== 'undefined') {
      patch.keterangan = dto.keterangan ?? null;
    }

    if (typeof dto.isActive !== 'undefined') {
      patch.isActive = dto.isActive;
    }

    if (Object.keys(patch).length === 0) {
      return target;
    }

    const updated = await this.prisma.lokasi.update({
      where: { id },
      data: patch,
    });

    await this.auditTrail.log({
      userId: adminKaryawanId,
      aksi: 'MASTER_LOKASI_UPDATED',
      detail: `Lokasi id=${id} updated: nama="${target.namaLokasi}" -> "${updated.namaLokasi}", alamat="${target.alamat}" -> "${updated.alamat}", aktif=${target.isActive} -> ${updated.isActive}`,
    });

    return updated;
  }

  async deleteLokasi(adminKaryawanId: number, id: number) {
    const target = await this.prisma.lokasi.findUnique({ where: { id } });
    if (!target) {
      throw new NotFoundException('Lokasi tidak ditemukan');
    }

    // Validasi dependency (jika di masa depan Lokasi direlasikan dengan entity lain,
    // tambahkan pengecekan count() di sini untuk mencegah penghapusan yang melanggar FK).

    await this.prisma.lokasi.delete({ where: { id } });

    await this.auditTrail.log({
      userId: adminKaryawanId,
      aksi: 'MASTER_LOKASI_DELETED',
      detail: `Lokasi "${target.namaLokasi}" (id=${target.id}) deleted`,
    });

    return { message: 'Lokasi deleted' };
  }
}