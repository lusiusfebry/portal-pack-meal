import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ConsumptionReportQueryDto,
  DepartmentReportQueryDto,
  PerformanceReportQueryDto,
  RejectionReportQueryDto,
  ConsumptionGroupBy,
} from '../dto';
import { Prisma, StatusPesanan, ApprovalStatus } from '@prisma/client';

type ConsumptionResult = {
  period: string;
  totalOrders: number;
  totalMeals: number;
};

type DepartmentResult = {
  departmentId: number;
  departmentName: string;
  totalOrders: number;
  totalMeals: number;
  percentage: number;
};

type PerformanceMetrics = {
  count: number;
  avgTotalDurationMinutes: number | null;
  avgProcessingTimeMinutes: number | null;
  avgPreparationTimeMinutes: number | null;
  avgDeliveryTimeMinutes: number | null;
};

type PerformanceBreakdownDepartment = PerformanceMetrics & {
  departmentId: number;
  departmentName: string;
};

type PerformanceBreakdownShift = PerformanceMetrics & {
  shiftId: number;
  shiftName: string;
};

type PerformanceReportResult = {
  overall: PerformanceMetrics;
  byDepartment: PerformanceBreakdownDepartment[];
  byShift: PerformanceBreakdownShift[];
};

type RejectionItem = {
  id: number;
  kodePesanan: string;
  departmentId: number;
  departmentName: string;
  karyawanPemesanId: number;
  shiftId: number;
  shiftName: string;
  jumlahPesanan: number;
  jumlahPesananAwal: number | null;
  statusPesanan: StatusPesanan;
  requiresApproval: boolean;
  approvalStatus: ApprovalStatus | null;
  catatanDapur: string | null;
  catatanAdmin: string | null;
  waktuDibuat: Date;
  requestType: 'EDIT' | 'REJECT';
};

type PaginatedRejectionReport = {
  data: RejectionItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Helper: getDateRange
   * - Default start = 30 days ago (start of day)
   * - Default end = today (end of day)
   * - Parse & validate provided strings
   */
  private getDateRange(
    tanggalMulai?: string,
    tanggalAkhir?: string,
  ): { startDate: Date; endDate: Date } {
    let startDate: Date;
    let endDate: Date;

    const now = new Date();

    if (tanggalMulai) {
      const parsedStart = new Date(tanggalMulai);
      if (isNaN(parsedStart.getTime())) {
        throw new BadRequestException('Invalid tanggalMulai');
      }
      startDate = new Date(parsedStart);
    } else {
      startDate = new Date(now);
      startDate.setDate(startDate.getDate() - 30);
    }
    // normalize start to start of day
    startDate.setHours(0, 0, 0, 0);

    if (tanggalAkhir) {
      const parsedEnd = new Date(tanggalAkhir);
      if (isNaN(parsedEnd.getTime())) {
        throw new BadRequestException('Invalid tanggalAkhir');
      }
      endDate = new Date(parsedEnd);
    } else {
      endDate = new Date(now);
    }
    // normalize end to end of day
    endDate.setHours(23, 59, 59, 999);

    if (startDate.getTime() > endDate.getTime()) {
      throw new BadRequestException(
        'Tanggal mulai harus sebelum atau sama dengan tanggal akhir',
      );
    }

    return { startDate, endDate };
  }

  // Normalize date to local midnight (useful for @db.Date fields)
  private normalizeDateOnly(date: Date): Date {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  private formatDateYYYYMMDD(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private formatYearMonth(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${yyyy}-${mm}`;
  }

  /**
   * Consumption Report
   * - Group by DAILY via Prisma groupBy on tanggalPesanan
   * - Group by WEEKLY/MONTHLY via raw SQL using date_trunc
   * - Exclude DITOLAK
   * - Optional filter: shiftId
   */
  async getConsumptionReport(
    queryDto: ConsumptionReportQueryDto,
  ): Promise<ConsumptionResult[]> {
    const {
      tanggalMulai,
      tanggalAkhir,
      groupBy = ConsumptionGroupBy.DAILY,
      shiftId,
    } = queryDto;
    const { startDate, endDate } = this.getDateRange(
      tanggalMulai,
      tanggalAkhir,
    );

    // Build base where clause for Prisma (DAILY only)
    const whereDaily: any = {
      statusPesanan: { not: 'DITOLAK' as any },
      tanggalPesanan: {
        gte: this.normalizeDateOnly(startDate),
        lte: this.normalizeDateOnly(endDate),
      },
    };
    if (typeof shiftId === 'number') {
      whereDaily.shiftId = shiftId;
    }

    if (groupBy === ConsumptionGroupBy.DAILY) {
      const grouped = await this.prisma.pesanan.groupBy({
        by: ['tanggalPesanan'],
        where: whereDaily,
        _sum: { jumlahPesanan: true },
        _count: { id: true },
        orderBy: { tanggalPesanan: 'asc' },
      });

      const results: ConsumptionResult[] = grouped.map((row) => {
        const date = new Date(row.tanggalPesanan);
        const period = this.formatDateYYYYMMDD(date);
        const totalOrders = row._count.id ?? 0;
        const totalMeals = row._sum.jumlahPesanan ?? 0;
        return { period, totalOrders, totalMeals };
      });

      // Already ordered by date asc
      return results;
    }

    // WEEKLY or MONTHLY via raw SQL
    const truncUnit = groupBy === ConsumptionGroupBy.WEEKLY ? 'week' : 'month';
    const startDateParam = this.normalizeDateOnly(startDate);
    const endDateParam = this.normalizeDateOnly(endDate);

    const dynamicShiftFilter =
      typeof shiftId === 'number'
        ? Prisma.sql` AND shift_id = ${shiftId} `
        : Prisma.empty;

    const rows: Array<{
      period: Date;
      total_orders: bigint | number | null;
      total_meals: bigint | number | null;
    }> = await this.prisma.$queryRaw<
      Array<{
        period: Date;
        total_orders: bigint | number | null;
        total_meals: bigint | number | null;
      }>
    >(Prisma.sql`
      SELECT
        date_trunc(${Prisma.sql`'${truncUnit}'`}, tanggal_pesanan) AS period,
        COUNT(id) AS total_orders,
        SUM(jumlah_pesanan) AS total_meals
      FROM transaction_pesanan
      WHERE status_pesanan <> 'DITOLAK'
        AND tanggal_pesanan BETWEEN ${startDateParam} AND ${endDateParam}
        ${dynamicShiftFilter}
      GROUP BY period
      ORDER BY period ASC
    `);

    const results: ConsumptionResult[] = rows.map((r) => {
      const periodDate = new Date(r.period);
      const period =
        groupBy === ConsumptionGroupBy.WEEKLY
          ? this.formatDateYYYYMMDD(periodDate)
          : this.formatYearMonth(periodDate);
      const totalOrders = Number(r.total_orders ?? 0);
      const totalMeals = Number(r.total_meals ?? 0);
      return { period, totalOrders, totalMeals };
    });

    return results;
  }

  /**
   * Department Report
   * - Group by departmentPemesanId
   * - Optional filters: departmentId, status, shiftId
   * - Date range based on tanggalPesanan
   */
  async getDepartmentReport(
    queryDto: DepartmentReportQueryDto,
  ): Promise<DepartmentResult[]> {
    const { tanggalMulai, tanggalAkhir, departmentId, status, shiftId } =
      queryDto;
    const { startDate, endDate } = this.getDateRange(
      tanggalMulai,
      tanggalAkhir,
    );

    const where: any = {
      tanggalPesanan: {
        gte: this.normalizeDateOnly(startDate),
        lte: this.normalizeDateOnly(endDate),
      },
    };

    if (typeof departmentId === 'number') {
      where.departmentPemesanId = departmentId;
    }
    if (typeof shiftId === 'number') {
      where.shiftId = shiftId;
    }
    if (status) {
      // Allow status filter; if needed exclude DITOLAK externally
      where.statusPesanan = status as any;
    }

    const grouped = await this.prisma.pesanan.groupBy({
      by: ['departmentPemesanId'],
      where,
      _sum: { jumlahPesanan: true },
      _count: { id: true },
    });

    const departmentIds = grouped
      .map((g) => g.departmentPemesanId)
      .filter((id) => typeof id === 'number');

    const departments = departmentIds.length
      ? await this.prisma.department.findMany({
          where: { id: { in: departmentIds } },
          select: { id: true, namaDivisi: true },
        })
      : [];

    const nameMap = new Map<number, string>(
      departments.map((d) => [d.id, d.namaDivisi]),
    );

    const totalMealsSum = grouped.reduce(
      (acc, g) => acc + (g._sum.jumlahPesanan ?? 0),
      0,
    );

    const results: DepartmentResult[] = grouped.map((g) => {
      const meals = g._sum.jumlahPesanan ?? 0;
      const orders = g._count.id ?? 0;
      const deptId = g.departmentPemesanId;
      const deptName = nameMap.get(deptId) ?? 'Unknown Department';
      const percentage =
        totalMealsSum > 0
          ? Number(((meals / totalMealsSum) * 100).toFixed(2))
          : 0;

      return {
        departmentId: deptId,
        departmentName: deptName,
        totalOrders: orders,
        totalMeals: meals,
        percentage,
      };
    });

    // Sort by totalMeals desc
    results.sort((a, b) => b.totalMeals - a.totalMeals);

    return results;
  }

  /**
   * Performance Report
   * - Where: status COMPLETE
   * - Date range applied on waktuDibuat (gte) & waktuSelesai (lte)
   * - Optional filters: departmentId, shiftId
   * - Compute avg durations in minutes across all orders
   * - Provide breakdown by department and by shift
   */
  async getPerformanceReport(
    queryDto: PerformanceReportQueryDto,
  ): Promise<PerformanceReportResult> {
    const { tanggalMulai, tanggalAkhir, departmentId, shiftId } = queryDto;
    const { startDate, endDate } = this.getDateRange(
      tanggalMulai,
      tanggalAkhir,
    );

    const where: any = {
      statusPesanan: 'COMPLETE' as any,
      waktuDibuat: { gte: startDate },
      waktuSelesai: { lte: endDate },
    };

    if (typeof departmentId === 'number') {
      where.departmentPemesanId = departmentId;
    }
    if (typeof shiftId === 'number') {
      where.shiftId = shiftId;
    }

    const orders = await this.prisma.pesanan.findMany({
      where,
      select: {
        id: true,
        departmentPemesanId: true,
        shiftId: true,
        waktuDibuat: true,
        waktuDiproses: true,
        waktuSiap: true,
        waktuDiantar: true,
        waktuSelesai: true,
      },
      orderBy: { waktuSelesai: 'asc' },
    });

    const diffMinutes = (a?: Date | null, b?: Date | null): number | null => {
      if (!a || !b) return null;
      const ms = a.getTime() - b.getTime();
      if (!isFinite(ms)) return null;
      return Math.max(0, Math.round(ms / 60000));
    };

    // Overall aggregation counters
    const count = orders.length;
    let totalDurationSum = 0;
    let totalDurationCount = 0;

    let processingTimeSum = 0;
    let processingTimeCount = 0;

    let preparationTimeSum = 0;
    let preparationTimeCount = 0;

    let deliveryTimeSum = 0;
    let deliveryTimeCount = 0;

    // For breakdowns
    const deptAgg = new Map<
      number,
      {
        count: number;
        totalDurationSum: number;
        totalDurationCount: number;
        processingTimeSum: number;
        processingTimeCount: number;
        preparationTimeSum: number;
        preparationTimeCount: number;
        deliveryTimeSum: number;
        deliveryTimeCount: number;
      }
    >();

    const shiftAgg = new Map<
      number,
      {
        count: number;
        totalDurationSum: number;
        totalDurationCount: number;
        processingTimeSum: number;
        processingTimeCount: number;
        preparationTimeSum: number;
        preparationTimeCount: number;
        deliveryTimeSum: number;
        deliveryTimeCount: number;
      }
    >();

    for (const o of orders) {
      const totalDuration = diffMinutes(o.waktuSelesai, o.waktuDibuat);
      const processingTime = diffMinutes(o.waktuDiproses, o.waktuDibuat);
      const preparationTime = diffMinutes(o.waktuSiap, o.waktuDiproses);
      const deliveryTime = diffMinutes(o.waktuSelesai, o.waktuDiantar);

      if (totalDuration != null) {
        totalDurationSum += totalDuration;
        totalDurationCount += 1;
      }
      if (processingTime != null) {
        processingTimeSum += processingTime;
        processingTimeCount += 1;
      }
      if (preparationTime != null) {
        preparationTimeSum += preparationTime;
        preparationTimeCount += 1;
      }
      if (deliveryTime != null) {
        deliveryTimeSum += deliveryTime;
        deliveryTimeCount += 1;
      }

      // Department aggregation
      if (typeof o.departmentPemesanId === 'number') {
        const d = deptAgg.get(o.departmentPemesanId) ?? {
          count: 0,
          totalDurationSum: 0,
          totalDurationCount: 0,
          processingTimeSum: 0,
          processingTimeCount: 0,
          preparationTimeSum: 0,
          preparationTimeCount: 0,
          deliveryTimeSum: 0,
          deliveryTimeCount: 0,
        };
        d.count += 1;
        if (totalDuration != null) {
          d.totalDurationSum += totalDuration;
          d.totalDurationCount += 1;
        }
        if (processingTime != null) {
          d.processingTimeSum += processingTime;
          d.processingTimeCount += 1;
        }
        if (preparationTime != null) {
          d.preparationTimeSum += preparationTime;
          d.preparationTimeCount += 1;
        }
        if (deliveryTime != null) {
          d.deliveryTimeSum += deliveryTime;
          d.deliveryTimeCount += 1;
        }
        deptAgg.set(o.departmentPemesanId, d);
      }

      // Shift aggregation
      if (typeof o.shiftId === 'number') {
        const s = shiftAgg.get(o.shiftId) ?? {
          count: 0,
          totalDurationSum: 0,
          totalDurationCount: 0,
          processingTimeSum: 0,
          processingTimeCount: 0,
          preparationTimeSum: 0,
          preparationTimeCount: 0,
          deliveryTimeSum: 0,
          deliveryTimeCount: 0,
        };
        s.count += 1;
        if (totalDuration != null) {
          s.totalDurationSum += totalDuration;
          s.totalDurationCount += 1;
        }
        if (processingTime != null) {
          s.processingTimeSum += processingTime;
          s.processingTimeCount += 1;
        }
        if (preparationTime != null) {
          s.preparationTimeSum += preparationTime;
          s.preparationTimeCount += 1;
        }
        if (deliveryTime != null) {
          s.deliveryTimeSum += deliveryTime;
          s.deliveryTimeCount += 1;
        }
        shiftAgg.set(o.shiftId, s);
      }
    }

    const safeAvg = (sum: number, cnt: number): number | null =>
      cnt > 0 ? Number((sum / cnt).toFixed(2)) : null;

    const overall: PerformanceMetrics = {
      count,
      avgTotalDurationMinutes: safeAvg(totalDurationSum, totalDurationCount),
      avgProcessingTimeMinutes: safeAvg(processingTimeSum, processingTimeCount),
      avgPreparationTimeMinutes: safeAvg(
        preparationTimeSum,
        preparationTimeCount,
      ),
      avgDeliveryTimeMinutes: safeAvg(deliveryTimeSum, deliveryTimeCount),
    };

    // Resolve names
    const deptIds = Array.from(deptAgg.keys());
    const shiftIds = Array.from(shiftAgg.keys());

    const [deptRows, shiftRows] = await Promise.all([
      deptIds.length
        ? this.prisma.department.findMany({
            where: { id: { in: deptIds } },
            select: { id: true, namaDivisi: true },
          })
        : Promise.resolve([]),
      shiftIds.length
        ? this.prisma.shift.findMany({
            where: { id: { in: shiftIds } },
            select: { id: true, namaShift: true },
          })
        : Promise.resolve([]),
    ]);

    const deptNameMap = new Map<number, string>(
      deptRows.map((d) => [d.id, d.namaDivisi]),
    );
    const shiftNameMap = new Map<number, string>(
      shiftRows.map((s) => [s.id, s.namaShift]),
    );

    const byDepartment: PerformanceBreakdownDepartment[] = deptIds.map((id) => {
      const agg = deptAgg.get(id)!;
      return {
        departmentId: id,
        departmentName: deptNameMap.get(id) ?? 'Unknown Department',
        count: agg.count,
        avgTotalDurationMinutes: safeAvg(
          agg.totalDurationSum,
          agg.totalDurationCount,
        ),
        avgProcessingTimeMinutes: safeAvg(
          agg.processingTimeSum,
          agg.processingTimeCount,
        ),
        avgPreparationTimeMinutes: safeAvg(
          agg.preparationTimeSum,
          agg.preparationTimeCount,
        ),
        avgDeliveryTimeMinutes: safeAvg(
          agg.deliveryTimeSum,
          agg.deliveryTimeCount,
        ),
      };
    });

    const byShift: PerformanceBreakdownShift[] = shiftIds.map((id) => {
      const agg = shiftAgg.get(id)!;
      return {
        shiftId: id,
        shiftName: shiftNameMap.get(id) ?? 'Unknown Shift',
        count: agg.count,
        avgTotalDurationMinutes: safeAvg(
          agg.totalDurationSum,
          agg.totalDurationCount,
        ),
        avgProcessingTimeMinutes: safeAvg(
          agg.processingTimeSum,
          agg.processingTimeCount,
        ),
        avgPreparationTimeMinutes: safeAvg(
          agg.preparationTimeSum,
          agg.preparationTimeCount,
        ),
        avgDeliveryTimeMinutes: safeAvg(
          agg.deliveryTimeSum,
          agg.deliveryTimeCount,
        ),
      };
    });

    // Sort breakdowns for readability
    byDepartment.sort((a, b) => (a.departmentName > b.departmentName ? 1 : -1));
    byShift.sort((a, b) => (a.shiftName > b.shiftName ? 1 : -1));

    return { overall, byDepartment, byShift };
  }

  /**
   * Rejection/Edit Requests Report
   * - Where: requiresApproval = true
   * - Date range
   * - Optional filters: departmentId, approvalStatus
   * - Pagination
   * - Include relations
   * - Determine request type
   */
  async getRejectionReport(
    queryDto: RejectionReportQueryDto,
  ): Promise<PaginatedRejectionReport> {
    const {
      tanggalMulai,
      tanggalAkhir,
      departmentId,
      approvalStatus,
      page = 1,
      limit = 50,
    } = queryDto;
    const { startDate, endDate } = this.getDateRange(
      tanggalMulai,
      tanggalAkhir,
    );

    const where: any = {
      requiresApproval: true,
      waktuDibuat: { gte: startDate },
      // Some historical approvals may be decided later; include up to endDate for dibuka
      // and rely on waktuDibuat to represent when the request was initiated.
      waktuSelesai: { lte: endDate },
    };

    // transaksi yang masih pending atau sudah diputuskan
    if (approvalStatus) {
      where.approvalStatus = approvalStatus as any;
    }
    if (typeof departmentId === 'number') {
      where.departmentPemesanId = departmentId;
    }

    const skip = (page - 1) * limit;
    const take = limit;

    const [dataRows, total] = await Promise.all([
      this.prisma.pesanan.findMany({
        where,
        orderBy: { waktuDibuat: 'desc' },
        skip,
        take,
        include: {
          pemesan: true,
          departemen: true,
          shift: true,
        },
      }),
      this.prisma.pesanan.count({ where }),
    ]);

    const determineRequestType = (row: {
      jumlahPesananAwal: number | null;
      jumlahPesanan: number;
      catatanDapur: string | null;
    }): 'EDIT' | 'REJECT' => {
      if (
        row.jumlahPesananAwal != null &&
        row.jumlahPesananAwal !== row.jumlahPesanan
      ) {
        return 'EDIT';
      }
      const note = (row.catatanDapur ?? '').toLowerCase();
      if (note.includes('edit') || note.includes('ubah')) {
        return 'EDIT';
      }
      if (
        note.includes('reject') ||
        note.includes('tolak') ||
        note.includes('rejek')
      ) {
        return 'REJECT';
      }
      // Default to REJECT when ambiguous (matches service heuristic)
      return 'REJECT';
    };

    const items: RejectionItem[] = dataRows.map((r) => ({
      id: r.id,
      kodePesanan: r.kodePesanan,
      departmentId: r.departmentPemesanId,
      departmentName: r.departemen?.namaDivisi ?? 'Unknown Department',
      karyawanPemesanId: r.karyawanPemesanId,
      shiftId: r.shiftId,
      shiftName: r.shift?.namaShift ?? 'Unknown Shift',
      jumlahPesanan: r.jumlahPesanan,
      jumlahPesananAwal: r.jumlahPesananAwal ?? null,
      statusPesanan: r.statusPesanan,
      requiresApproval: r.requiresApproval,
      approvalStatus: r.approvalStatus ?? null,
      catatanDapur: r.catatanDapur ?? null,
      catatanAdmin: r.catatanAdmin ?? null,
      waktuDibuat: r.waktuDibuat,
      requestType: determineRequestType(r),
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      data: items,
      total,
      page,
      limit,
      totalPages,
    };
  }
}
