/**
 * AppModule — Urutan dan Dependensi Modul
 *
 * Deskripsi Urutan Loading:
 * - ConfigModule.forRoot({ isGlobal: true }): Memastikan konfigurasi environment tersedia sejak awal
 *   sehingga modul lain (Prisma, Auth) dapat mengakses variabel env via ConfigService.
 * - EventEmitterModule.forRoot({ wildcard: true, delimiter: '.', maxListeners: 10 }): Mengaktifkan arsitektur event-driven
 *   dengan dukungan wildcard untuk pola event seperti 'order.*' agar perubahan status pesanan dapat di-broadcast.
 * - PrismaModule: Menyediakan PrismaService untuk akses database; harus tersedia sebelum Common/Auth/Users/Orders
 *   karena service-service tersebut bergantung pada koneksi database.
 * - CommonModule: Modul global yang mengekspos layanan lintas modul (AuditTrailService, decorators, guards, interfaces)
 *   sehingga dapat diinject di AuthService, UsersService, dan OrdersService tanpa impor eksplisit.
 * - AuthModule: Mengelola autentikasi (JWT strategies, guards) dan bergantung pada Prisma + Common.
 * - UsersModule: Operasi manajemen pengguna/karyawan, bergantung pada Prisma + Common; dan terproteksi oleh guard global.
 * - OrdersModule: Manajemen pesanan dengan workflow dan approval system; bergantung pada Prisma + Common + EventEmitter.
 * - WebSocketModule: Gateway notifikasi realtime menggunakan Socket.IO; menerima event dari Orders untuk broadcast ke rooms berbasis role/department/user; bergantung pada Config (WS) dan Common.
 * - ReportsModule: Reporting and analytics endpoints; provides consumption, department, performance, and rejection reports with CSV export; extends AuditTrailService with query capabilities for audit trail viewer.
 *
 * Rationale:
 * - Memastikan dependency chain konsisten: Config → EventEmitter → Prisma → Common → Auth/Users → Orders → WebSocket → Reports
 * - Reports module is loaded last as it aggregates data from Orders and provides read-only analytics without affecting core workflow.
 * - Menghindari kondisi race saat bootstrap dengan menyediakan config & event bus & db terlebih dahulu
 *
 * Catatan:
 * - EventEmitterModule: Provides event-driven architecture for order status changes
 * - OrdersModule: Order management with workflow and approval system, depends on Prisma + Common + EventEmitter
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';
import { WebSocketModule } from './websocket/websocket.module';
import { ReportsModule } from './reports/reports.module';
import { MasterDataModule } from './master-data/master-data.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 10,
    }),
    PrismaModule,
    CommonModule,
    AuthModule,
    UsersModule,
    OrdersModule,
    MasterDataModule,
    WebSocketModule,
    ReportsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
