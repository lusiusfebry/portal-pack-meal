/**
 * CommonModule — Modul Global untuk Shared Utilities dan Services
 *
 * Deskripsi:
 * - Ditandai dengan @Global() sehingga provider di dalam modul ini tersedia secara global
 *   tanpa perlu mengimpor CommonModule di setiap module lain.
 * - Menyediakan AuditTrailService sebagai layanan audit umum untuk mencatat aktivitas sistem
 *   (login success/failure, perubahan status/role user, reset password, dsb).
 *
 * Rationale:
 * - Memusatkan cross-cutting concerns (audit, decorators, guards, interfaces) agar konsisten
 *   dan mudah digunakan lintas modul (Auth, Users, Orders, dll).
 *
 * Pola Penggunaan:
 * - Cukup inject AuditTrailService di service manapun:
 *   constructor(private readonly auditTrail: AuditTrailService) {}
 * - Panggil method log* untuk mencatat tindakan tertentu.
 *
 * Lifecycle & Scope:
 * - Karena modul ini global, AuditTrailService bersifat singleton dalam aplikasi NestJS.
 */
import { Global, Module } from '@nestjs/common';
import { AuditTrailService } from './services';

@Global()
@Module({
  providers: [AuditTrailService],
  exports: [AuditTrailService],
})
export class CommonModule {}
