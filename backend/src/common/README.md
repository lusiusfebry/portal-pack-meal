# Common Module — Shared Utilities, Guards, Decorators, Interfaces, and Services

CommonModule adalah modul global yang menyediakan komponen lintas-domain untuk seluruh aplikasi (Auth, Users, Orders, dll). Dengan penandaan `@Global()`, provider di dalamnya dapat diinject di mana saja tanpa perlu meng-impor modul Common per modul.

- Implementasi: [CommonModule](backend/src/common/common.module.ts:9)
- Guard Global yang diaktifkan pada bootstrap: [JwtAuthGuard](backend/src/common/guards/jwt-auth.guard.ts:7), [RolesGuard](backend/src/common/guards/roles.guard.ts:10)
- Dekorator: [Public()](backend/src/common/decorators/public.decorator.ts:4), [Roles()](backend/src/common/decorators/roles.decorator.ts:17)
- Service: [AuditTrailService](backend/src/common/services/audit-trail.service.ts:29)
- Interface: [JwtPayload](backend/src/common/interfaces/jwt-payload.interface.ts:1)

## Struktur Direktori

```
backend/src/common/
├── common.module.ts               # Modul global, mengekspor layanan bersama
├── decorators/
│   ├── current-user.decorator.ts  # (opsional) dekorator helper untuk mengambil user
│   ├── public.decorator.ts        # Menandai route/public handler agar bebas guard JWT
│   └── roles.decorator.ts         # Menandai role yang diizinkan untuk handler
├── guards/
│   ├── jwt-auth.guard.ts          # Guard autentikasi JWT (menghormati Public)
│   └── roles.guard.ts             # Guard otorisasi berbasis peran (Roles)
├── interfaces/
│   └── jwt-payload.interface.ts   # Kontrak payload JWT (sub, karyawanId, nik, role)
└── services/
    └── audit-trail.service.ts     # Layanan pencatatan audit trail sistem
```

## Komponen

### 1) Decorators

- [Public()](backend/src/common/decorators/public.decorator.ts:4)
  - Menandai endpoint agar dilewati oleh [JwtAuthGuard](backend/src/common/guards/jwt-auth.guard.ts:7).
  - Contoh: endpoint login atau health check.

- [Roles(...roles)](backend/src/common/decorators/roles.decorator.ts:17)
  - Menentukan peran yang diizinkan mengakses handler.
  - Divalidasi oleh [RolesGuard](backend/src/common/guards/roles.guard.ts:10) setelah user terautentikasi.

- [CurrentUser()](backend/src/common/decorators/current-user.decorator.ts:1) (opsional, jika digunakan)
  - Helper untuk mengambil request.user yang telah diset oleh strategi Passport JWT.

### 2) Guards

- [JwtAuthGuard](backend/src/common/guards/jwt-auth.guard.ts:7)
  - Turunan dari `AuthGuard('jwt')`.
  - Mengecek metadata [IS_PUBLIC_KEY](backend/src/common/decorators/public.decorator.ts:3) agar route yang ditandai Public dilewati.
  - Jika tidak public, guard akan memvalidasi JWT dan menyuntikkan user ke `request.user`.

- [RolesGuard](backend/src/common/guards/roles.guard.ts:10)
  - Mengevaluasi metadata [ROLES_KEY](backend/src/common/decorators/roles.decorator.ts:16).
  - Memastikan `request.user.role` termasuk salah satu role yang dipersyaratkan.
  - Berjalan setelah JwtAuthGuard (urutan di [bootstrap](backend/src/main.ts:18)).

### 3) Interfaces

- [JwtPayload](backend/src/common/interfaces/jwt-payload.interface.ts:1)
  - Kontrak payload JWT:
    - `sub`: user id
    - `karyawanId`: id karyawan
    - `nik`: nomor induk karyawan
    - `role`: role akses
  - Digunakan saat penandatanganan dan validasi token.

### 4) Services

- [AuditTrailService](backend/src/common/services/audit-trail.service.ts:29)
  - Layanan pencatatan ke tabel `auditTrail`.
  - Metode:
    - `log(params)` — metode generik
    - `logLoginSuccess(karyawanId, nik)`
    - `logLoginFailure(nik, reason)`
    - `logUserCreated(adminId, createdNik)`
    - `logUserStatusChanged(adminId, targetNik, isActive)`
    - `logPasswordReset(adminId, targetNik)`
  - Digunakan oleh [AuthService](backend/src/auth/auth.service.ts:41) dan [UsersService](backend/src/users/users.service.ts:12) untuk mencatat tindakan penting.

## Pola Penggunaan

### Menandai Route Public (tanpa autentikasi)
```ts
// auth.controller.ts (contoh)
import { Controller, Post, Body } from '@nestjs/common';
import { Public } from '@/common/decorators/public.decorator'; // [Public()](backend/src/common/decorators/public.decorator.ts:4)
import { AuthService } from './auth.service';
import { LoginDto } from './dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) { // [AuthService.login()](backend/src/auth/auth.service.ts:106)
    return this.authService.login(dto);
  }
}
```

### Mengizinkan Hanya Role Tertentu
```ts
// users.controller.ts (contoh)
import { Controller, Patch, Param, Body } from '@nestjs/common';
import { Roles } from '@/common/decorators/roles.decorator'; // [Roles()](backend/src/common/decorators/roles.decorator.ts:17)
import { UsersService } from './users.service';
import { UpdateUserStatusDto } from './dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles('administrator') // [RolesGuard](backend/src/common/guards/roles.guard.ts:10)
  @Patch(':id/status')
  updateStatus(@Param('id') id: number, @Body() dto: UpdateUserStatusDto) {
    return this.usersService.updateStatus(/* adminKaryawanId */ 1, id, dto); // [UsersService.updateStatus()](backend/src/users/users.service.ts:113)
  }
}
```

### Mencatat Audit Trail dari Service
```ts
// users.service.ts (contoh)
import { Injectable } from '@nestjs/common';
import { AuditTrailService } from '@/common/services/audit-trail.service'; // [AuditTrailService](backend/src/common/services/audit-trail.service.ts:29)

@Injectable()
export class UsersService {
  constructor(private readonly auditTrail: AuditTrailService) {}

  async resetPassword(adminKaryawanId: number, id: number) {
    // ... update password
    await this.auditTrail.logPasswordReset(adminKaryawanId, 'EMP001'); // [logPasswordReset()](backend/src/common/services/audit-trail.service.ts:124)
    return { message: 'Temporary password generated' };
  }
}
```

## Integrasi pada Bootstrap (Global Guards)

Guard global dipasang pada [bootstrap](backend/src/main.ts:18):
- [JwtAuthGuard](backend/src/common/guards/jwt-auth.guard.ts:7) berjalan duluan, menghormati [Public()](backend/src/common/decorators/public.decorator.ts:4)
- [RolesGuard](backend/src/common/guards/roles.guard.ts:10) berjalan setelah autentikasi sukses dan membaca `request.user.role`

Dokumentasi detail: komentar pada [main.ts](backend/src/main.ts:1)

## Prinsip Desain

- Single Source of Truth untuk cross-cutting concerns
- Dekorator dan guard yang eksplisit dan dapat diaudit
- Service yang generik namun menyediakan helper yang umum digunakan
- Mudah diuji dan diekspansi

## Catatan

- Karena `CommonModule` diberi `@Global()`, provider seperti [AuditTrailService](backend/src/common/services/audit-trail.service.ts:29) bersifat singleton.
- Tambahkan komponen baru (decorator/guard/interface/service) di modul ini jika digunakan lintas domain agar konsisten dan mudah ditemukan.