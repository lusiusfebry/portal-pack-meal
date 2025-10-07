# PROJECT OVERVIEW — Bebang Pack Meal Portal
Ringkasan singkat:
Portal operasional untuk mengelola alur "pack meal" secara end‑to‑end, menghubungkan backend API (NestJS) dan frontend SPA (React + Vite) dengan dukungan realtime dan praktik pengembangan modern.

## Tujuan Utama
- Menyediakan portal terpusat untuk administrasi, operasional, dan monitoring proses pack meal.
- Mempercepat input, validasi, dan pelacakan data (menu, pesanan, produksi, distribusi).
- Mendukung autentikasi aman dan kontrol akses berbasis peran.
- Menyediakan antarmuka cepat, responsif, dan mudah dipakai oleh tim operasional.

## Fitur Kunci
- Autentikasi JWT dan manajemen sesi.
- Manajemen data inti (pengguna, pesanan, item/menu) dengan validasi.
- Update realtime via WebSocket (notifikasi/status).
- SPA modern dengan routing klien dan state management.
- Integrasi Tailwind untuk desain konsisten; siap PWA untuk pengalaman seperti aplikasi.
- Tooling lint/format terotomatisasi untuk kualitas kode.

## Teknologi Utama
- Backend: NestJS 10, Prisma ORM (PostgreSQL), JWT, WebSockets, RxJS, class-validator.
- Frontend: React 18, Vite 7.1.7, TypeScript, Tailwind CSS, React Router, Zustand, axios, Headless UI, Heroicons, PWA (vite-plugin-pwa 1.0.3).
- Infrastruktur dev: ESLint, Prettier, Husky, tsconfig lint rules.

## Signifikansi Proyek
- Meningkatkan efisiensi operasional dengan alur kerja terstandar dan data terpusat.
- Mengurangi kesalahan manual melalui validasi dan visibilitas status secara realtime.
- Skalabel untuk pertumbuhan volume pesanan dan tim.
- Fondasi teknis modern yang memudahkan pemeliharaan, pengujian, dan deployment.

## Update Terbaru (Oktober 2025) — Maintenance & Recovery

- Dokumentasi baru:
  - tutorial.md — panduan operasional lengkap (best practices, langkah umum, troubleshooting)
  - [emergency-admin-recovery.md](emergency-admin-recovery.md:1) — panduan kilat pemulihan akses admin dengan perintah siap pakai dan SQL fallback
  - [PRD.md](PRD.md:1) — dokumen PRD terbaru yang mendefinisikan kebutuhan produk dan acceptance criteria; menjadi referensi resmi untuk pengembangan, QA, dan validasi rilis
- Catatan status hari ini: [PRD.md](PRD.md:1) telah dibuat dan ditetapkan sebagai sumber kebenaran produk; siap digunakan oleh tim pengembangan, QA, dan operasional.
- Skrip recovery/diagnosis:
  - [recovery-scripts.js](recovery-scripts.js:1) — CLI darurat: find, verify, make-admin, reset-password, print-sql, print-shell, print-powershell, emit-shell, hash
  - [activate-user.js](activate-user.js:1) — aktivasi akun, diagnosis end‑to‑end (bcrypt/JWT/HTTP probe), reset state user
- NPM scripts (root) diperbarui di [package.json](package.json:9-34):
  - E2E: "test:e2e", "test:e2e:ui", "test:e2e:headed", "test:e2e:report", "test:e2e:codegen"
  - Production: "start:prod", "start:prod:backend", "start:prod:frontend"
  - Typecheck gabungan: "typecheck"
  - Utilitas recovery: "activate-user", "diagnose-user", "reset-user"
- Perbaikan CRUD Users Management (administrator) — endpoint terverifikasi di [UsersController](backend/src/users/users.controller.ts:1):
  - Create: [UsersController.create()](backend/src/users/users.controller.ts:29-34)
  - List: [UsersController.findAll()](backend/src/users/users.controller.ts:37-41)
  - Detail: [UsersController.findOne()](backend/src/users/users.controller.ts:44-48)
  - Update Status: [UsersController.updateStatus()](backend/src/users/users.controller.ts:51-63)
  - Update Role: [UsersController.updateRole()](backend/src/users/users.controller.ts:66-74)
  - Reset Password: [UsersController.resetPassword()](backend/src/users/users.controller.ts:77-85)
  - RBAC ditegakkan via [RolesGuard](backend/src/common/guards/roles.guard.ts:10) dan [Roles(...)](backend/src/common/decorators/roles.decorator.ts:17); reset password aman (bcrypt), audit trail konsisten.
- Status aplikasi: Production Ready, dengan dukungan PWA, offline detection, optimasi performa, aksesibilitas (WCAG 2.1 AA), dan verifikasi E2E.

## Update Terbaru — Status Autentikasi & TypeScript (Oktober 2025)

- Perbaikan Autentikasi (401 Unauthorized):
  - Masalah 401 Unauthorized sudah diselesaikan dengan perbaikan JWT Guard Global conflict
  - Frontend axios interceptor diperkuat dengan localStorage fallback melalui fungsi [getAccessTokenSafe()](frontend/src/lib/axios.ts:80)
  - Token refresh mechanism sekarang berfungsi dengan baik untuk menghindari expired session
  - Password hash protection ditingkatkan dengan bcrypt dan tidak pernah diekspor ke klien

- Status TypeScript — SEMUA ERROR DIPERBAIKI:
  - Error TS5097 di frontend/main.tsx diperbaiki
  - Warning TypeScript di backend tentang file listing diperbaiki
  - Backend build error MODULE_NOT_FOUND diperbaiki
  - Kedua workspace sekarang lulus pemeriksaan type penuh dengan perintah: `npx tsc --noemit`

- Master Data Frontend:
  - Penambahan MasterDataPage untuk administrator di [frontend/src/pages/admin/MasterDataPage.tsx](frontend/src/pages/admin/MasterDataPage.tsx:1)
  - Menu "Master Data" sudah ada di [Sidebar.tsx](frontend/src/components/layout/Sidebar.tsx:36) untuk role administrator
  - Integrasi dengan backend API melalui [master.api.ts](frontend/src/services/api/master.api.ts:1) dengan fallback ke stub data

- Status Development Server:
  - npm run dev berjalan normal untuk backend dan frontend tanpa startup errors
  - WebSocket connection stabil pada port 3001
  - Hot reload berfungsi dengan baik untuk kedua workspace

## Bug Fixes yang Dilakukan

- Perbaikan infinite redirect loop offline di [frontend/vite.config.ts](frontend/vite.config.ts:1)
- Perbaikan kompilasi TypeScript backend & frontend (strict types, barrel exports, formatting) di [backend](backend/package.json:1) dan [frontend](frontend/package.json:1)
- Hardening CRUD Users Management (RBAC, audit trail, reset password aman) di [backend/src/users/users.controller.ts](backend/src/users/users.controller.ts:1)
- Perbaikan JWT Guard Global conflict yang menyebabkan 401 Unauthorized
- Perbaikan frontend axios interceptor dengan localStorage fallback untuk token access
## Final Updates — Production Ready Overview (Oktober 2025)
Status akhir: PRODUCTION READY untuk PT Prima Sarana Gemilang — Site Taliabu. Ringkasan singkat perubahan signifikan:

- Premium industrial Login UX: halaman login didesain ulang dengan aksesibilitas WCAG 2.1 AA dan micro‑interactions halus
  - Implementasi: [LoginPage.tsx](frontend/src/pages/LoginPage.tsx:1), meta/theme: [index.html](frontend/index.html:1)
- Database Cleanup System (ops/QA): alat cleanup/restore/verify dengan backup otomatis, transaksi & rollback, preservasi admin, verifikasi login opsional
  - Skrip: [db-cleanup.js](scripts/db-tools/db-cleanup.js:1), [db-restore.js](scripts/db-tools/db-restore.js:1), [db-verify.js](scripts/db-tools/db-verify.js:1), backup: [backups/backup-20251005-012718.json](backups/backup-20251005-012718.json:1)
- BigInt Serialization Fix: polyfill HTTP JSON untuk mencegah error “Do not know how to serialize a BigInt”
  - Patch: [backend/src/main.ts](backend/src/main.ts:36-42)
- Real Database Implementation (bukan mock): PostgreSQL + Prisma dengan schema, migrasi, dan seed
  - Schema & migrasi: [schema.prisma](backend/prisma/schema.prisma:1), [20251001075640_init](backend/prisma/migrations/20251001075640_init/migration.sql:1), [20251001083412_add_default_status_pesanan](backend/prisma/migrations/20251001083412_add_default_status_pesanan/migration.sql:1), [20251004024450_add_lokasi](backend/prisma/migrations/20251004024450_add_lokasi/migration.sql:1), seed: [seed.ts](backend/prisma/seed.ts:1)
- Testing Readiness (CI‑friendly):
  - Typecheck hijau (tsc --noemit): [package.json](package.json:30), [backend/package.json](backend/package.json:17), [frontend/package.json](frontend/package.json:46)
  - API Smoke Tests: [get-departments.js](scripts/api-smoke/get-departments.js:1), [create-department.js](scripts/api-smoke/create-department.js:1)
  - E2E Playwright: [playwright.config.ts](playwright.config.ts:1), suites [tests/e2e/auth.spec.ts](tests/e2e/auth.spec.ts:1), [tests/e2e/admin-workflow.spec.ts](tests/e2e/admin-workflow.spec.ts:1), laporan: [playwright-report/index.html](playwright-report/index.html:1)

Referensi & sumber kebenaran:
- PRD (source of truth produk & acceptance criteria): [PRD.md](PRD.md:1)
- Arsitektur: [.kilicode/rules/memory-bank/architecture.md](.kilicode/rules/memory-bank/architecture.md:1)
- Teknis: [.kilicode/rules/memory-bank/tech.md](.kilicode/rules/memory-bank/tech.md:1)
- Produk: [.kilicode/rules/memory-bank/product.md](.kilicode/rules/memory-bank/product.md:1)

Catatan:
- Frontend PWA & offline telah di-hardening (fallback navigasi aman, runtime caching, indikator offline)
  - Konfigurasi: [frontend/vite.config.ts](frontend/vite.config.ts:88-161)
- Real‑time via dedicated WebSocket server namespace `/notifications` dengan guard JWT dan room targeting
  - Gateway & guard: [backend/src/websocket/websocket.gateway.ts](backend/src/websocket/websocket.gateway.ts:36,251), [backend/src/websocket/websocket.guard.ts](backend/src/websocket/websocket.guard.ts:7,13,41), adapter: [backend/src/main.ts](backend/src/main.ts:49-73,129-141)