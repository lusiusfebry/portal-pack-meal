import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './services/reports.service';
import { ExportService } from './services/export.service';

/**
 * ReportsModule
 *
 * Mendaftarkan ReportsController beserta providers ReportsService dan ExportService.
 * AuditTrailService disediakan oleh CommonModule secara global (lihat CommonModule di AppModule),
 * sehingga tidak perlu dideklarasikan ulang di sini.
 */
@Module({
  imports: [],
  controllers: [ReportsController],
  providers: [ReportsService, ExportService],
  exports: [ReportsService, ExportService],
})
export class ReportsModule {}
