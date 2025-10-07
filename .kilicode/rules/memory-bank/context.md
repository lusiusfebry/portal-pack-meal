# CONTEXT — Bebang Pack Meal Portal

## Status Saat Ini (Oktober 2025)

### Final — Production Ready (COMPLETED)
- Aplikasi telah mencapai status Production Ready dengan seluruh 9 fase pengembangan selesai (Foundation → PWA & Production).
- Implementasi final mencakup: autentikasi & otorisasi, RBAC, WebSocket real‑time, PWA & offline, IndexedDB, reporting & audit trail, recovery toolkit, dan skrip database cleanup/restore/verify.
- Database nyata PostgreSQL terintegrasi penuh via Prisma (bukan mock/static).

#### Achievements Terkini
- Redesain halaman login dengan premium industrial design untuk PT Prima Sarana Gemilang — Site Taliabu: [LoginPage.tsx](frontend/src/pages/LoginPage.tsx:1) dan meta di [index.html](frontend/index.html:1).
- Database cleanup system yang robust: [db-cleanup.js](scripts/db-tools/db-cleanup.js:1), [db-restore.js](scripts/db-tools/db-restore.js:1), [db-verify.js](scripts/db-tools/db-verify.js:1).
- BigInt serialization fix untuk HTTP JSON: polyfill [main.ts](backend/src/main.ts:36) (`BigInt.prototype.toJSON = function () { return this.toString(); }`).
- Real database implementation dengan migrasi aktif dan seed: [schema.prisma](backend/prisma/schema.prisma:1), [seed.ts](backend/prisma/seed.ts:1), migrasi: [20251001075640_init](backend/prisma/migrations/20251001075640_init/migration.sql:1), [20251001083412_add_default_status_pesanan](backend/prisma/migrations/20251001083412_add_default_status_pesanan/migration.sql:1), [20251004024450_add_lokasi](backend/prisma/migrations/20251004024450_add_lokasi/migration.sql:1).
- Testing readiness: Playwright E2E (config [playwright.config.ts](playwright.config.ts:1), suites [tests/e2e/auth.spec.ts](tests/e2e/auth.spec.ts:1), [tests/e2e/admin-workflow.spec.ts](tests/e2e/admin-workflow.spec.ts:1)), API smoke tests ([get-departments.js](scripts/api-smoke/get-departments.js:1), [create-department.js](scripts/api-smoke/create-department.js:1)), typecheck hijau (`npm run typecheck`).

## Lingkungan & Layanan
- Backend: http://localhost:3000, Frontend: http://localhost:5173, WebSocket: ws://localhost:3001/notifications.
- Global guards & dekorator: [JwtAuthGuard](backend/src/common/guards/jwt-auth.guard.ts:7), [RolesGuard](backend/src/common/guards/roles.guard.ts:10), [Public()](backend/src/common/decorators/public.decorator.ts:4), [Roles(...)](backend/src/common/decorators/roles.decorator.ts:17).
- ValidationPipe & CORS parsing aman, API prefix 'api': [main.ts](backend/src/main.ts:1).
- Dedicated Socket.IO server adapter (transport websocket‑only, CORS): [websocket.gateway.ts](backend/src/websocket/websocket.gateway.ts:36), [websocket.guard.ts](backend/src/websocket/websocket.guard.ts:7), adapter di [main.ts](backend/src/main.ts:49).

## Modul & Fitur Utama (Sinkron Implementasi)

### Authentication & Authorization
- Endpoint & layanan: [AuthController](backend/src/auth/auth.controller.ts:1), [AuthService](backend/src/auth/auth.service.ts:18).
- JWT access & refresh, payload [JwtPayload](backend/src/common/interfaces/jwt-payload.interface.ts:1), proteksi hash password (bcrypt).
- Frontend axios dengan interceptor Bearer dan refresh token: [axios.ts](frontend/src/lib/axios.ts:1); fallback token aman via [getAccessTokenSafe()](frontend/src/lib/axios.ts:80).

### Orders & Approval Workflow
- Service: [OrdersService](backend/src/orders/orders.service.ts:1), Controller: [OrdersController](backend/src/orders/orders.controller.ts:1), Module: [OrdersModule](backend/src/orders/orders.module.ts:1).
- Event‑driven: [order.created](backend/src/orders/orders.service.ts:126), [order.status.changed](backend/src/common/events/order-status-changed.event.ts:1), [order.approval.requested](backend/src/common/events/order-approval-requested.event.ts:1), [order.approval.decided](backend/src/common/events/order-approval-decided.event.ts:1).
- Approval center (frontend): [ApprovalCenterPage.tsx](frontend/src/pages/approvals/ApprovalCenterPage.tsx:1); quick‑links routing fix di [router/index.tsx](frontend/src/router/index.tsx:135,151,143).

### Real‑time Notifications (WebSocket)
- Namespace /notifications, room targeting (role, department, user, karyawan): [websocket.gateway.ts](backend/src/websocket/websocket.gateway.ts:251).
- Guard handshake JWT & attach payload: [websocket.guard.ts](backend/src/websocket/websocket.guard.ts:13,41).
- Emisi event sinkron lifecycle orders: [websocket.gateway.ts](backend/src/websocket/websocket.gateway.ts:123,153,207,229).

### Reporting & Audit Trail
- Reports: [reports.service.ts](backend/src/reports/services/reports.service.ts:1), [reports.controller.ts](backend/src/reports/reports.controller.ts:1), [reports.module.ts](backend/src/reports/reports.module.ts:1).
- AuditTrailService query & logging: [audit-trail.service.ts](backend/src/common/services/audit-trail.service.ts:29).

### Master Data (Termasuk Lokasi — Matang)
- Controller & service: [master-data.controller.ts](backend/src/master-data/master-data.controller.ts:1), [master-data.service.ts](backend/src/master-data/master-data.service.ts:1), DTO: [create-lokasi.dto.ts](backend/src/master-data/dto/create-lokasi.dto.ts:1), [update-lokasi.dto.ts](backend/src/master-data/dto/update-lokasi.dto.ts:1).
- Validasi bisnis komprehensif (duplikasi, relasi/dependency), audit trail per operasi.

### PWA & Offline
- Service worker & runtime caching: offline navigation fallback & loop fix: [vite.config.ts](frontend/vite.config.ts:88-107).
- Komponen PWA: [OfflineIndicator.tsx](frontend/src/components/pwa/OfflineIndicator.tsx:1), [OfflinePage.tsx](frontend/src/pages/OfflinePage.tsx:1), [InstallPrompt.tsx](frontend/src/components/pwa/InstallPrompt.tsx:1), [UpdatePrompt.tsx](frontend/src/components/pwa/UpdatePrompt.tsx:1).
- IndexedDB utilities: [offline-storage.utils.ts](frontend/src/utils/offline-storage.utils.ts:1) (fail‑safe, logging konsisten).

### UI & UX — Login Premium Industrial
- Desain industrial premium (steel/charcoal + aksen amber), aksesibilitas WCAG 2.1 AA, interaksi halus 150–250ms: [LoginPage.tsx](frontend/src/pages/LoginPage.tsx:1).
- Penyesuaian meta dan theme di HTML: [index.html](frontend/index.html:1).

## Database & Operasional
- Prisma schema & migrations aktif: [schema.prisma](backend/prisma/schema.prisma:1), migrasi: [20251001075640_init](backend/prisma/migrations/20251001075640_init/migration.sql:1), [20251001083412_add_default_status_pesanan](backend/prisma/migrations/20251001083412_add_default_status_pesanan/migration.sql:1), [20251004024450_add_lokasi](backend/prisma/migrations/20251004024450_add_lokasi/migration.sql:1).
- Seed contoh: [seed.ts](backend/prisma/seed.ts:1).
- BigInt fix (HTTP JSON): polyfill di [main.ts](backend/src/main.ts:36) mencegah error serialisasi.
- Database Cleanup System (Safety‑first):
  - Cleanup: [db-cleanup.js](scripts/db-tools/db-cleanup.js:1) — backup otomatis ke [backups/](backups/backup-20251005-012718.json:1), konfirmasi destruktif, transaksi & rollback, mode hapus master data aman, preservasi referensi admin.
  - Restore: [db-restore.js](scripts/db-tools/db-restore.js:1) — urutan insert transactional, reset sequences, admin verification, optional login probe.
  - Verify: [db-verify.js](scripts/db-tools/db-verify.js:1) — verifikasi jumlah record, keberadaan admin, opsi login API.
  - BigInt‑safe JSON: serializer di [db-cleanup.js.jsonStringifySafe()](scripts/db-tools/db-cleanup.js:294-304), revival di [db-restore.js.reviveBigIntFields()](scripts/db-tools/db-restore.js:215-234).

## Testing Readiness
- Typecheck: root/backend/frontend script “typecheck”: [package.json](package.json:30), [backend/package.json](backend/package.json:17), [frontend/package.json](frontend/package.json:46).
- API Smoke: [get-departments.js](scripts/api-smoke/get-departments.js:1), [create-department.js](scripts/api-smoke/create-department.js:1).
- E2E Playwright: [playwright.config.ts](playwright.config.ts:1), suites: [tests/e2e/auth.spec.ts](tests/e2e/auth.spec.ts:1), [tests/e2e/admin-workflow.spec.ts](tests/e2e/admin-workflow.spec.ts:1).
- Laporan Playwright: [playwright-report/index.html](playwright-report/index.html:1).

## Aksesibilitas & Performa
- Aksesibilitas WCAG 2.1 AA: keyboard navigation, ARIA labels, focus management, kontras warna, trap prevention.
- Optimasi performa: code‑splitting & lazy‑loading, tree‑shaking, asset optimization; micro‑interactions 150–300ms.

## Status Fase & Milestone
- Phase 1–9: COMPLETED. Semua deliverable sudah terimplementasi dan diverifikasi.
- Security: proteksi hash password (bcrypt), JWT & refresh, guards global, audit logging, CORS aman.
- Real‑time: WebSocket dedicated, room targeting sesuai role/dept/user/karyawan.
- Offline: SW fallback aman, IndexedDB utils, experience yang informatif saat transisi online/offline.

## Operasional — Fokus Berikutnya (Post‑Production)
- Deployment & monitoring (observabilitas, alerts).
- User training & onboarding materials.
- Continuous improvement berdasar feedback pengguna.

## Perintah Pemeriksaan Cepat
- Backend Typecheck: `npm exec -w backend tsc --noemit`.
- Frontend Typecheck: `npm exec -w frontend tsc --noemit`.
- Dev monorepo: `npm run dev` (backend via tsx watch [backend/package.json](backend/package.json:7), frontend via Vite [frontend/package.json](frontend/package.json:39)).

## Referensi Dokumentasi Terkait
- Product: [product.md](.kilicode/rules/memory-bank/product.md:1)
- Architecture: [architecture.md](.kilicode/rules/memory-bank/architecture.md:1)
- Tech: [tech.md](.kilicode/rules/memory-bank/tech.md:1)
- Brief: [brief.md](.kilicode/rules/memory-bank/brief.md:1)
- PRD: [PRD.md](PRD.md:1)
- Backend README: [backend/README.md](backend/README.md:1)
- Frontend README: [frontend/README.md](frontend/README.md:1)

## Catatan Konsistensi
- Dokumen telah disinkronkan dengan implementasi aktual di repository.
- Pastikan tautan rujukan tetap valid pasca perubahan struktur file.
- Gunakan PRD sebagai source of truth untuk kebutuhan produk & acceptance criteria.

## Ringkasan Singkat untuk Stakeholders
- Aplikasi Bebang Pack Meal Portal siap produksi untuk PT Prima Sarana Gemilang — Site Taliabu.
- Seluruh fitur inti berfungsi dan telah diuji: autentikasi, RBAC, orders, approval, reporting, audit trail, realtime, PWA & offline, recovery & database tools.
- Infrastruktur dan dokumentasi mendukung operasi, pemeliharaan, dan pengembangan berkelanjutan.

## Update Terbaru — White Page Issue Fix &amp; PWA Assets (5 Oktober 2025)

### 1) Perbaikan White Page Issue — SELESAI
- Root cause: service worker aktif pada environment development yang mengganggu HMR dan initial paint.
- Solusi:
  - Cleanup SW khusus dev: menonaktifkan pendaftaran service worker saat development sehingga HMR tetap stabil dan tidak terjadi white page.
  - HMR kembali tersambung dengan baik; halaman login berfungsi normal.
- Referensi implementasi:
  - Konfigurasi PWA (sinkron produksi, cleanup dev): [frontend/vite.config.ts](frontend/vite.config.ts:1)
  - Halaman login: [LoginPage.tsx](frontend/src/pages/LoginPage.tsx:1)

### 2) PWA — Production Ready (Aset &amp; Manifest Lengkap)
- Ikon PNG:
  - 192x192, 512x512, 512x512 maskable di [frontend/public/icons](frontend/public/icons/:1)
- Apple Touch Icon (iOS):
  - 180x180 di [frontend/public/apple-touch-icon.png](frontend/public/apple-touch-icon.png:1)
- Manifest web app:
  - File manifest lengkap: [frontend/public/manifest.webmanifest](frontend/public/manifest.webmanifest:1)
  - fields umum: name, short_name, start_url, scope, display, background_color, theme_color, icons (termasuk maskable)
- Index HTML:
  - Link rel="apple-touch-icon" aktif: [frontend/index.html](frontend/index.html:1)
- Vite PWA config:
  - Sinkron untuk produksi, dengan registrasi yang aman dan update SW yang sesuai: [frontend/vite.config.ts](frontend/vite.config.ts:1)

### 3) Status TypeScript — Bersih
- Frontend typecheck: ✅ PASSED
- Backend typecheck: ✅ PASSED
- Seluruh error TypeScript telah diperbaiki; pemeriksaan gabungan hijau:
  - Root: [package.json](package.json:30)
  - Backend: [backend/package.json](backend/package.json:17)
  - Frontend: [frontend/package.json](frontend/package.json:46)

### 4) Lingkungan Development — Stabil
- `npm run dev` berfungsi normal (backend via tsx watch, frontend via Vite).
- HMR terkoneksi dan responsif di frontend.
- Service worker dev cleanup otomatis, tidak mengganggu pengalaman pengembangan.

### 5) File Kunci yang Diupdate
- HTML:
  - [frontend/index.html](frontend/index.html:1) — apple-touch-icon enabled, meta konsisten
- Manifest:
  - [frontend/public/manifest.webmanifest](frontend/public/manifest.webmanifest:1) — manifest PWA lengkap
- Config:
  - [frontend/vite.config.ts](frontend/vite.config.ts:1) — PWA config sinkron (production), cleanup untuk dev
- Assets:
  - Ikon PNG: [frontend/public/icons](frontend/public/icons/:1)
  - Apple Touch Icon: [frontend/public/apple-touch-icon.png](frontend/public/apple-touch-icon.png:1)

### 6) Testing Infrastructure (terkonfirmasi tersedia)
- TestSprite tests: [testsprite_tests](testsprite_tests/:1)
- Playwright E2E tests: [tests/e2e](tests/e2e/auth.spec.ts:1)
- API smoke tests: [scripts/api-smoke](scripts/api-smoke/get-departments.js:1)

Ringkasan:
- White page issue pada dev telah diselesaikan melalui service worker cleanup.
- Aset PWA (icons, apple-touch) dan manifest kini lengkap; konfigurasi Vite PWA sinkron untuk produksi.
- TypeScript bersih di kedua workspace; development environment stabil dengan HMR aktif.
