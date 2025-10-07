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

- Perbaikan infinite redirect loop offline di [frontend/vite.config.ts](frontend/vite.config.ts)
- Perbaikan kompilasi TypeScript backend & frontend (strict types, barrel exports, formatting) di [backend](backend/package.json) dan [frontend](frontend/package.json)
- Hardening CRUD Users Management (RBAC, audit trail, reset password aman) di [backend/src/users/users.controller.ts](backend/src/users/users.controller.ts)
- Perbaikan JWT Guard Global conflict yang menyebabkan 401 Unauthorized
- Perbaikan frontend axios interceptor dengan localStorage fallback untuk token access
