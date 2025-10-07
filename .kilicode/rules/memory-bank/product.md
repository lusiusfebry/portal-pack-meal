# PRODUCT — Bebang Pack Meal Portal

## Mengapa Proyek Ini Ada

### Masalah Bisnis yang Diselesaikan
Bebang Pack Meal Portal diciptakan untuk mengatasi tantangan operasional dalam manajemen pemesanan dan distribusi pack meal di lingkungan perusahaan.
Masalah utama:
1. Proses manual tidak efisien (WA/telepon/form kertas), rawan salah input, tidak ada pelacakan real-time
2. Koordinasi antar tim rumit, visibilitas status rendah, sulit kelola perubahan
3. Minim data & pelaporan untuk perencanaan
4. Kontrol akses lemah, tanpa audit trail

### Solusi yang Ditawarkan
- Otomatisasi end-to-end dari pemesanan hingga distribusi
- Visibilitas real-time untuk semua pihak
- Pelaporan komprehensif dan audit trail
- Keamanan berbasis autentikasi JWT dan RBAC

## Status Produk — Production Ready (Oktober 2025)

Proyek telah mencapai Production Ready dengan implementasi lengkap dan verifikasi menyeluruh:
- Backend API NestJS dengan autentikasi, otorisasi, dan WebSocket real-time
- Frontend React + Vite dengan PWA dan offline support
- Database PostgreSQL nyata (bukan mock) melalui Prisma ORM
- RBAC untuk 4 peran: administrator, employee, dapur, delivery
- Testing readiness: smoke tests, E2E Playwright, typecheck hijau

Recent achievements:
- Redesain halaman login premium industrial untuk PT Prima Sarana Gemilang — Site Taliabu di [LoginPage.tsx](frontend/src/pages/LoginPage.tsx:1) dan penyesuaian meta di [index.html](frontend/index.html:1)
- Database cleanup system yang robust: [db-cleanup.js](scripts/db-tools/db-cleanup.js:1), [db-restore.js](scripts/db-tools/db-restore.js:1), [db-verify.js](scripts/db-tools/db-verify.js:1)
- BigInt serialization fix untuk response HTTP di [main.ts](backend/src/main.ts:37-42)
- Dokumentasi PRD resmi: [PRD.md](PRD.md:1)

Branding & kredit:
- Implementasi identitas visual PT Prima Sarana Gemilang — Site Taliabu pada halaman login.
- “Developed by Team IRGA — Site Taliabu”.

## Cara Kerja Sistem (High-level)

1. Karyawan membuat pesanan → validasi → kode otomatis → simpan DB
2. Dapur memproses antrian, ubah status sesuai tahap produksi
3. Delivery mengelola pengantaran dan update status
4. Admin memantau, melakukan approvals saat ada deviasi (reject/edit)
5. Notifikasi real-time ke pihak terkait via WebSocket

### Approval Workflow (Deviasi)
- Dapur mengajukan penolakan/edit (dengan alasan)
- Status order menjadi “Menunggu Persetujuan”
- Admin memutuskan approve/reject
- Sistem mengeksekusi keputusan dan mencatat audit trail

## Peran Pengguna
- Administrator: kontrol penuh, master data, approvals, laporan, audit
- Employee: buat pesanan, pantau status, notifikasi
- Dapur: kelola antrian, ubah status, ajukan deviasi
- Delivery: kelola daftar pengiriman, ubah status

## Fitur Kunci & Implementasi

### Autentikasi & Otorisasi
- JWT + refresh, guard global: [JwtAuthGuard](backend/src/common/guards/jwt-auth.guard.ts:7), [RolesGuard](backend/src/common/guards/roles.guard.ts:10)
- Dekorator akses: [Public()](backend/src/common/decorators/public.decorator.ts:4), [Roles(...)](backend/src/common/decorators/roles.decorator.ts:17)
- Endpoint auth: [AuthController](backend/src/auth/auth.controller.ts:1), layanan: [AuthService](backend/src/auth/auth.service.ts:18)

### Order Management
- Layanan bisnis: [OrdersService](backend/src/orders/orders.service.ts:1)
- Controller & routes: [OrdersController](backend/src/orders/orders.controller.ts:1)
- Event-driven updates: [order-status-changed.event.ts](backend/src/common/events/order-status-changed.event.ts:1), dll.

### Real-time Notifications
- Gateway WS dedicated namespace /notifications: [websocket.gateway.ts](backend/src/websocket/websocket.gateway.ts:36)
- Guard WS JWT: [websocket.guard.ts](backend/src/websocket/websocket.guard.ts:7)
- Binding server WS dedicated melalui adapter: [main.ts](backend/src/main.ts:49-73,129-141)

### Reporting & Audit Trail
- Reports service & controller: [reports.service.ts](backend/src/reports/services/reports.service.ts:1), [reports.controller.ts](backend/src/reports/reports.controller.ts:1)
- Audit trail terpusat: [audit-trail.service.ts](backend/src/common/services/audit-trail.service.ts:29)

### PWA & Offline Support
- Service worker & runtime caching: [vite.config.ts](frontend/vite.config.ts:80-161)
- Offline page & indikator: [OfflineIndicator.tsx](frontend/src/components/pwa/OfflineIndicator.tsx:1), [OfflinePage.tsx](frontend/src/pages/OfflinePage.tsx:1)
- Update prompt & install prompt: [UpdatePrompt.tsx](frontend/src/components/pwa/UpdatePrompt.tsx:1), [InstallPrompt.tsx](frontend/src/components/pwa/InstallPrompt.tsx:1)

### Offline Storage (IndexedDB)
- Utilitas simpan/muat data offline: [offline-storage.utils.ts](frontend/src/utils/offline-storage.utils.ts:1)
- Prinsip fail‑safe: selalu kembalikan default aman saat error, logging konsisten

## Data & Database

- PostgreSQL + Prisma ORM; schema di [schema.prisma](backend/prisma/schema.prisma:1)
- Migrasi aktif:
  - 20251001075640_init → [migration.sql](backend/prisma/migrations/20251001075640_init/migration.sql:1)
  - 20251001083412_add_default_status_pesanan → [migration.sql](backend/prisma/migrations/20251001083412_add_default_status_pesanan/migration.sql:1)
  - 20251004024450_add_lokasi → [migration.sql](backend/prisma/migrations/20251004024450_add_lokasi/migration.sql:1)
- Seed data: [seed.ts](backend/prisma/seed.ts:1)
- BigInt serialization fix (HTTP JSON): polyfill `BigInt.prototype.toJSON` di [main.ts](backend/src/main.ts:37-42) mencegah error “Do not know how to serialize a BigInt”

### Database Cleanup System (Safety-first)
- Alat operasional:
  - Cleanup: [db-cleanup.js](scripts/db-tools/db-cleanup.js:1)
  - Restore: [db-restore.js](scripts/db-tools/db-restore.js:1)
  - Verify: [db-verify.js](scripts/db-tools/db-verify.js:1)
- Fitur utama:
  - Backup otomatis ke folder [backups/](backups/backup-20251005-012718.json:1)
  - Konfirmasi destruktif, transaksi, rollback
  - Mode penghapusan master data aman (patterns/unreferenced/all) tanpa menghapus referensi admin
  - Verifikasi pasca‑cleanup (admin tetap ada, tabel transaksi kosong, opsi verifikasi login API)
- Format backup JSON aman terhadap BigInt via replacer serializer di [db-cleanup.js.jsonStringifySafe()](scripts/db-tools/db-cleanup.js:294-304) dan revival BigInt di [db-restore.js.reviveBigIntFields()](scripts/db-tools/db-restore.js:215-234)

## Frontend Experience — Login Premium Industrial
- Implementasi desain industrial premium di [LoginPage.tsx](frontend/src/pages/LoginPage.tsx:1) dengan palet steel/charcoal dan aksen amber, micro‑interactions 150–250ms, fokus pada aksesibilitas (WCAG 2.1 AA).
- Penyesuaian meta untuk konsistensi tema dan aksesibilitas di [index.html](frontend/index.html:1).
- Tidak menambah dependency UI baru; tetap Tailwind CSS + komponen kustom.

## Testing Readiness
- Typecheck: root/frontend/backend script “typecheck” — [package.json](package.json:9-34), [backend/package.json](backend/package.json:1), [frontend/package.json](frontend/package.json:39)
- API Smoke Tests: [get-departments.js](scripts/api-smoke/get-departments.js:1), [create-department.js](scripts/api-smoke/create-department.js:1)
- E2E Playwright: konfigurasi [playwright.config.ts](playwright.config.ts:1) dan suites di [tests/e2e](tests/e2e/auth.spec.ts:1)
- Recovery & diagnosis ops: [recovery-scripts.js](recovery-scripts.js:1), [activate-user.js](activate-user.js:1)

## Nilai Bisnis
- Efisiensi operasional (reduksi proses manual), visibilitas real‑time, kepatuhan melalui audit trail, dan fondasi skalabel.

## Target Pengguna
- Administrator, Employee, Dapur, Delivery (mobile‑first untuk delivery)

## Keunggulan Kompetitif
- Integrasi end‑to‑end, real‑time updates, approval workflow terstruktur, PWA siap produksi, audit compliance

## Integrasi & Deployment Singkat
- Dev: Backend http://localhost:3000, Frontend http://localhost:5173, WS http://localhost:3001
- CORS & Validation global di [main.ts](backend/src/main.ts:88-121,106-116)
- Build & produksi terdokumentasi di [DEPLOYMENT.md](DEPLOYMENT.md:1)

## Referensi Utama
- Arsitektur: [architecture.md](.kilicode/rules/memory-bank/architecture.md:1)
- Konteks: [context.md](.kilicode/rules/memory-bank/context.md:1)
- Tech: [tech.md](.kilicode/rules/memory-bank/tech.md:1)
- PRD: [PRD.md](PRD.md:1)
- Backend README: [backend/README.md](backend/README.md:1)
- Frontend README: [frontend/README.md](frontend/README.md:1)