import {
  Controller,
  Get,
  Query,
  Res,
  UseGuards,
  HttpStatus,
  Header,
  Param,
} from '@nestjs/common';
import type { Response } from 'express';
import { ReportsService } from './services/reports.service';
import { ExportService } from './services/export.service';
import { AuditTrailService } from '../common/services/audit-trail.service';
import { Roles } from '../common/decorators';
import { RolesGuard } from '../common/guards';
import type { RoleAccess } from '@prisma/client';
import {
  ConsumptionReportQueryDto,
  DepartmentReportQueryDto,
  PerformanceReportQueryDto,
  RejectionReportQueryDto,
  AuditTrailQueryDto,
} from './dto';

/**
 * ReportsController
 *
 * Route prefix: /api/reports (global prefix 'api' configured in bootstrap)
 * Guarding: RolesGuard at class-level, JwtAuthGuard applied globally in bootstrap
 * Access: Administrator only for all endpoints (class-level @Roles)
 */
@Controller('reports')
@UseGuards(RolesGuard)
// NOTE: Roles decorator expects a union of string literal types; cast for compatibility
@Roles('administrator' as unknown as RoleAccess)
export class ReportsController {
  constructor(
    private readonly reportsService: ReportsService,
    private readonly exportService: ExportService,
    private readonly auditTrailService: AuditTrailService,
  ) {}

  /**
   * GET /api/reports/consumption
   * Returns consumption report (JSON) or exports as CSV/PDF based on ?format=csv|pdf
   */
  @Get('consumption')
  async getConsumptionReport(
    @Query() queryDto: ConsumptionReportQueryDto,
    @Query('format') format?: string,
    @Res({ passthrough: true }) res?: Response,
  ): Promise<any> {
    const data = await this.reportsService.getConsumptionReport(queryDto);

    const fmt = (format ?? '').toLowerCase();
    if (fmt === 'csv') {
      const csv = await this.exportService.exportToCSV(data);
      this.setExportHeaders(res!, 'consumption_report', 'csv');
      res!.status(HttpStatus.OK).send(csv);
      return;
    }
    if (fmt === 'pdf') {
      const pdf = await this.exportService.exportToPDF(
        data as any[],
        'Consumption Report',
      );
      this.setExportHeaders(res!, 'consumption_report', 'pdf');
      res!.status(HttpStatus.OK).send(pdf);
      return;
    }

    return data;
  }

  /**
   * GET /api/reports/department
   * Returns department aggregation (JSON) or CSV/PDF export
   */
  @Get('department')
  async getDepartmentReport(
    @Query() queryDto: DepartmentReportQueryDto,
    @Query('format') format?: string,
    @Res({ passthrough: true }) res?: Response,
  ): Promise<any> {
    const data = await this.reportsService.getDepartmentReport(queryDto);

    const fmt = (format ?? '').toLowerCase();
    if (fmt === 'csv') {
      const csv = await this.exportService.exportToCSV(data);
      this.setExportHeaders(res!, 'department_report', 'csv');
      res!.status(HttpStatus.OK).send(csv);
      return;
    }
    if (fmt === 'pdf') {
      const pdf = await this.exportService.exportToPDF(
        data as any[],
        'Department Report',
      );
      this.setExportHeaders(res!, 'department_report', 'pdf');
      res!.status(HttpStatus.OK).send(pdf);
      return;
    }

    return data;
  }

  /**
   * GET /api/reports/performance
   * Returns performance metrics with breakdown (JSON) or flattened CSV/PDF
   */
  @Get('performance')
  async getPerformanceReport(
    @Query() queryDto: PerformanceReportQueryDto,
    @Query('format') format?: string,
    @Res({ passthrough: true }) res?: Response,
  ): Promise<any> {
    const report = await this.reportsService.getPerformanceReport(queryDto);

    const fmt = (format ?? '').toLowerCase();
    if (fmt === 'csv' || fmt === 'pdf') {
      // Flatten nested breakdowns for export
      const rows: Array<Record<string, any>> = [];

      // Overall
      rows.push({
        section: 'overall',
        groupType: 'overall',
        groupId: '',
        groupName: '',
        count: report.overall.count,
        avgTotalDurationMinutes: report.overall.avgTotalDurationMinutes ?? '',
        avgProcessingTimeMinutes: report.overall.avgProcessingTimeMinutes ?? '',
        avgPreparationTimeMinutes:
          report.overall.avgPreparationTimeMinutes ?? '',
        avgDeliveryTimeMinutes: report.overall.avgDeliveryTimeMinutes ?? '',
      });

      // By Department
      for (const d of report.byDepartment) {
        rows.push({
          section: 'byDepartment',
          groupType: 'department',
          groupId: d.departmentId,
          groupName: d.departmentName,
          count: d.count,
          avgTotalDurationMinutes: d.avgTotalDurationMinutes ?? '',
          avgProcessingTimeMinutes: d.avgProcessingTimeMinutes ?? '',
          avgPreparationTimeMinutes: d.avgPreparationTimeMinutes ?? '',
          avgDeliveryTimeMinutes: d.avgDeliveryTimeMinutes ?? '',
        });
      }

      // By Shift
      for (const s of report.byShift) {
        rows.push({
          section: 'byShift',
          groupType: 'shift',
          groupId: s.shiftId,
          groupName: s.shiftName,
          count: s.count,
          avgTotalDurationMinutes: s.avgTotalDurationMinutes ?? '',
          avgProcessingTimeMinutes: s.avgProcessingTimeMinutes ?? '',
          avgPreparationTimeMinutes: s.avgPreparationTimeMinutes ?? '',
          avgDeliveryTimeMinutes: s.avgDeliveryTimeMinutes ?? '',
        });
      }

      if (fmt === 'csv') {
        const csv = await this.exportService.exportToCSV(rows);
        this.setExportHeaders(res!, 'performance_report', 'csv');
        res!.status(HttpStatus.OK).send(csv);
        return;
      }

      const pdf = await this.exportService.exportToPDF(
        rows,
        'Performance Report',
      );
      this.setExportHeaders(res!, 'performance_report', 'pdf');
      res!.status(HttpStatus.OK).send(pdf);
      return;
    }

    return report;
  }

  /**
   * GET /api/reports/rejections
   * Returns rejection/edit requests (paginated) or CSV/PDF of current page items
   */
  @Get('rejections')
  async getRejectionReport(
    @Query() queryDto: RejectionReportQueryDto,
    @Query('format') format?: string,
    @Res({ passthrough: true }) res?: Response,
  ): Promise<any> {
    const pageData = await this.reportsService.getRejectionReport(queryDto);

    const fmt = (format ?? '').toLowerCase();
    if (fmt === 'csv' || fmt === 'pdf') {
      const rows = pageData.data.map((r) => ({
        id: r.id,
        kodePesanan: r.kodePesanan,
        departmentId: r.departmentId,
        departmentName: r.departmentName,
        karyawanPemesanId: r.karyawanPemesanId,
        shiftId: r.shiftId,
        shiftName: r.shiftName,
        jumlahPesanan: r.jumlahPesanan,
        jumlahPesananAwal: r.jumlahPesananAwal ?? '',
        statusPesanan: r.statusPesanan,
        requiresApproval: r.requiresApproval,
        approvalStatus: r.approvalStatus ?? '',
        catatanDapur: r.catatanDapur ?? '',
        catatanAdmin: r.catatanAdmin ?? '',
        waktuDibuat: r.waktuDibuat ? new Date(r.waktuDibuat).toISOString() : '',
        requestType: r.requestType,
      }));

      if (fmt === 'csv') {
        const csv = await this.exportService.exportToCSV(rows);
        this.setExportHeaders(res!, 'rejections_report', 'csv');
        res!.status(HttpStatus.OK).send(csv);
        return;
      }

      const pdf = await this.exportService.exportToPDF(
        rows,
        'Rejections Report',
      );
      this.setExportHeaders(res!, 'rejections_report', 'pdf');
      res!.status(HttpStatus.OK).send(pdf);
      return;
    }

    return pageData;
  }

  /**
   * GET /api/reports/audit-trail
   * Query audit logs with filters. Supports CSV/PDF export.
   */
  @Get('audit-trail')
  async getAuditTrail(
    @Query() queryDto: AuditTrailQueryDto,
    @Query('format') format?: string,
    @Res({ passthrough: true }) res?: Response,
  ): Promise<any> {
    const result = await this.auditTrailService.query(queryDto);

    const fmt = (format ?? '').toLowerCase();
    if (fmt === 'csv' || fmt === 'pdf') {
      const rows = (result.data ?? []).map((log: any) => ({
        id: log.id,
        timestamp: log.timestamp ? new Date(log.timestamp).toISOString() : '',
        aksi: log.aksi,
        detail: log.detail ?? '',
        user_id: log.user?.id ?? '',
        user_nik: log.user?.nomorIndukKaryawan ?? '',
        user_nama: log.user?.namaLengkap ?? '',
        user_role: log.user?.roleAccess ?? '',
        user_departmentId: log.user?.departmentId ?? '',
        user_jabatanId: log.user?.jabatanId ?? '',
      }));

      if (fmt === 'csv') {
        const csv = await this.exportService.exportToCSV(rows);
        this.setExportHeaders(res!, 'audit_trail', 'csv');
        res!.status(HttpStatus.OK).send(csv);
        return;
      }

      const pdf = await this.exportService.exportToPDF(rows, 'Audit Trail');
      this.setExportHeaders(res!, 'audit_trail', 'pdf');
      res!.status(HttpStatus.OK).send(pdf);
      return;
    }

    return result;
  }

  /**
   * GET /api/reports/audit-trail/order/:kodePesanan
   * Get chronological history of an order by its code
   */
  @Get('audit-trail/order/:kodePesanan')
  async getAuditTrailByOrder(
    @Param('kodePesanan') kodePesanan: string,
  ): Promise<any[]> {
    return this.auditTrailService.getByOrderCode(kodePesanan);
  }

  /**
   * GET /api/reports/audit-trail/action-types
   * Returns available action type strings
   */
  @Get('audit-trail/action-types')
  async getAuditTrailActionTypes(): Promise<string[]> {
    return this.auditTrailService.getActionTypes();
  }

  /**
   * Helper: set response headers for export downloads
   */
  private setExportHeaders(
    res: Response,
    filename: string,
    format: 'csv' | 'pdf',
  ) {
    const contentType = this.exportService.getContentType(format);
    const ext = this.exportService.getFileExtension(format);
    res.setHeader('Content-Type', contentType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}${ext}"`,
    );
  }
}
