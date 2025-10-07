## Update Terbaru — White Page Issue Fix &amp; PWA Production Assets (5 Oktober 2025)

1) White Page Issue — SELESAI
- Gejala: Halaman putih pada dev akibat service worker aktif mengintervensi HMR/initial paint.
- Solusi: Service worker cleanup khusus development sehingga tidak mendaftar SW saat dev; HMR kembali stabil dan halaman login berfungsi normal.
- Referensi:
  - Konfigurasi PWA (sinkron produksi + cleanup dev): [frontend/vite.config.ts](frontend/vite.config.ts:1)
  - Login page: [LoginPage.tsx](frontend/src/pages/LoginPage.tsx:1)

2) PWA — Production Ready (Aset &amp; Manifest Lengkap)
- Ikon PNG:
  - 192x192, 512x512, dan 512x512-maskable disediakan di folder [frontend/public/icons](frontend/public/icons/:1)
- Apple Touch Icon (iOS):
  - 180x180: [frontend/public/apple-touch-icon.png](frontend/public/apple-touch-icon.png:1)
- Manifest Web App:
  - Manifest lengkap: [frontend/public/manifest.webmanifest](frontend/public/manifest.webmanifest:1)
  - Bidang umum: name, short_name, start_url, scope, display, background_color, theme_color, icons (termasuk maskable)
- Index HTML:
  - Link rel="apple-touch-icon" aktif: [frontend/index.html](frontend/index.html:1)
- Vite PWA Config:
  - Sinkron untuk produksi; registrasi aman dan update SW sesuai standar: [frontend/vite.config.ts](frontend/vite.config.ts:1)

3) Status TypeScript — Bersih
- Frontend typecheck: ✅ PASSED
- Backend typecheck: ✅ PASSED
- Pemeriksaan gabungan hijau (tsc --noemit):
  - Root scripts: [package.json](package.json:9-34)
  - Backend: [backend/package.json](backend/package.json:1)
  - Frontend: [frontend/package.json](frontend/package.json:39)

4) Lingkungan Development — Stabil
- `npm run dev` berfungsi normal (backend via tsx watch, frontend via Vite).
- HMR terkoneksi dan responsif.
- Service worker dev cleanup otomatis mencegah gangguan saat pengembangan.

5) Infrastruktur Testing (tersedia)
- TestSprite tests: [testsprite_tests](testsprite_tests/:1)
- E2E Playwright: [tests/e2e/auth.spec.ts](tests/e2e/auth.spec.ts:1), [tests/e2e/admin-workflow.spec.ts](tests/e2e/admin-workflow.spec.ts:1); konfigurasi: [playwright.config.ts](playwright.config.ts:1)
- API Smoke Tests: [scripts/api-smoke/get-departments.js](scripts/api-smoke/get-departments.js:1), [scripts/api-smoke/create-department.js](scripts/api-smoke/create-department.js:1)

Status ringkas:
- White page issue dev telah diperbaiki melalui SW cleanup.
- Aset PWA (icons, apple-touch) dan manifest lengkap; Vite PWA config sinkron untuk produksi.
- TypeScript bersih di kedua workspace; dev environment stabil dengan HMR aktif.
[Memory Bank: Active]

## Update Terbaru — Perbaikan Selesai &amp; Konfigurasi (4 Oktober 2025)

Status teknis terbaru yang perlu dicatat untuk sinkronisasi troubleshooting dan perbaikan cepat.

- Backend — JwtStrategy DI error:
  - Gejala: Error "Cannot read properties of undefined (reading 'get')" pada inisialisasi strategi JWT di [jwt.strategy.ts](backend/src/auth/strategies/jwt.strategy.ts:1).
  - Dugaan akar masalah:
    - `ConfigService` tidak ter-inject atau tidak tersedia di konstruktor JwtStrategy.
    - `JwtModule` tidak diregister secara async dengan `ConfigService`, atau `ConfigModule` tidak di-import/bersifat global di [auth.module.ts](backend/src/auth/auth.module.ts:1).
    - Potensi ekspor/impor tidak konsisten di barrel [strategies/index.ts](backend/src/auth/strategies/index.ts:1) sehingga dependency graph provider terganggu.
  - Rencana perbaikan teknis:
    - Pastikan `ConfigModule.forRoot({ isGlobal: true })` aktif di AppModule; import `ConfigModule` pada AuthModule.
    - Gunakan `JwtModule.registerAsync({ inject: [ConfigService], useFactory: (config) => ({ secret: config.get('JWT_SECRET'), signOptions: { expiresIn: config.get('JWT_EXPIRES_IN') } }) })` pada AuthModule.
    - Validasi konstruktor `JwtStrategy` menggunakan DI yang tepat (`constructor(private readonly configService: ConfigService)`) dan guard terhadap nilai undefined.
    - Audit log injector (provider resolution) sesuai stack di [instance-loader.js](node_modules/@nestjs/core/injector/instance-loader.js:1).
  - Acceptance criteria:
    - Backend start tanpa error DI; rute ber-JWT berfungsi; E2E auth lulus.

- Frontend — Master Data API export mismatch:
  - Gejala: Vite error "does not provide an export named 'createLokasi'" saat import dari [master.api.js](frontend/src/services/api/master.api.js:1).
  - Dugaan akar masalah:
    - Bridging legacy JS ↔ TS tidak sinkron; fungsi tersedia di [master.api.ts](frontend/src/services/api/master.api.ts:1) namun tidak diekspor di berkas JS atau import menunjuk ke file yang salah (ekstensi .js).
  - Rencana perbaikan teknis:
    - Konsolidasikan impor agar menunjuk ke typed source ([index.ts](frontend/src/services/api/index.ts:1) atau langsung ke [master.api.ts](frontend/src/services/api/master.api.ts:1)) tanpa ekstensi.
    - Jika perlu sementara, tambahkan named export `createLokasi` di [master.api.js](frontend/src/services/api/master.api.js:1) agar paritas tercapai sebelum cleanup JS.
    - Audit penggunaan `createLokasi` di [LokasiForm.tsx](frontend/src/components/forms/LokasiForm.tsx:1) dan [MasterDataPage.tsx](frontend/src/pages/admin/MasterDataPage.tsx:1).
  - Acceptance criteria:
    - Import berfungsi; aksi create lokasi sukses dari UI; konsol tanpa error export.

- Status Development Server:
  - Backend: http://localhost:3000 — tidak stabil akibat error DI di JwtStrategy; rute yang memerlukan JWT dapat gagal.
  - Frontend: http://localhost:5173 — berjalan; error modul export pada fitur Lokasi menghambat aksi create.
  - WebSocket: ws://localhost:3001 — tidak ada indikasi gangguan spesifik; bergantung pada boot backend.

- Catatan Operasional:
  - E2E yang memerlukan autentikasi mungkin gagal hingga perbaikan JwtStrategy; jalankan smoke test master-data non-protected untuk sanity jika relevan.
  - Setelah perbaikan, jalankan:
    - Typecheck: `npm run typecheck` (root) atau per workspace.
    - Smoke API: [get-departments.js](scripts/api-smoke/get-departments.js:1), [create-department.js](scripts/api-smoke/create-department.js:1).
    - E2E Playwright: `npm run test:e2e` (root) dan verifikasi laporan.

---

## Update Terbaru — 4 Oktober 2025

- Backend Authentication Fix — injeksi ConfigService pada strategi JWT telah diperbaiki di [jwt.strategy.ts](backend/src/auth/strategies/jwt.strategy.ts:1). Autentikasi berjalan normal, aplikasi start tanpa error, dan verifikasi berjalan hijau pada smoke/E2E.
- Status Layanan — Backend (http://localhost:3000) dan Frontend (http://localhost:5173) berjalan normal; WebSocket dedicated server pada ws://localhost:3001 stabil.
- Dokumentasi Produk — [PRD.md](PRD.md:1) telah dibuat dan ditetapkan sebagai referensi resmi untuk scope, acceptance criteria, dan test plan lintas tim (engineering/QA/ops).
- Status Aplikasi — Production Ready tetap konsisten dengan pencapaian performa, aksesibilitas, dan verifikasi integrasi.

## Update Terbaru — Fitur Lokasi (Master Data) — 4 Oktober 2025

### Database Schema & Migration
- **Model Lokasi**: Ditambahkan ke Prisma schema di [schema.prisma](backend/prisma/schema.prisma:172-186) dengan field:
  - `namaLokasi` (VARCHAR(100), unique)
  - `alamat` (TEXT, required)
  - `keterangan` (TEXT, optional)
  - `isActive` (BOOLEAN, default true)
  - Standard timestamps (created_at, updated_at)
- **Migration**: Database migration berhasil dijalankan: [20251004024450_add_lokasi](backend/prisma/migrations/20251004024450_add_lokasi/migration.sql:1)
- **Indexes**: Unique index pada namaLokasi dan regular index pada isActive untuk performa query

### Backend Implementation
- **Service Layer**: CRUD operations lengkap di [MasterDataService](backend/src/master-data/master-data.service.ts:480-589):
  - `getLokasi()` - Read access untuk semua roles
  - `createLokasi()` - Create dengan audit trail MASTER_LOKASI_CREATED
  - `updateLokasi()` - Update dengan audit trail MASTER_LOKASI_UPDATED
  - `deleteLokasi()` - Delete dengan audit trail MASTER_LOKASI_DELETED
- **Controller Layer**: API endpoints di [MasterDataController](backend/src/master-data/master-data.controller.ts:160-189):
  - `GET /master-data/lokasi` - Read (all roles)
  - `POST /master-data/lokasi` - Create (admin only)
  - `PATCH /master-data/lokasi/:id` - Update (admin only)
  - `DELETE /master-data/lokasi/:id` - Delete (admin only)
- **DTOs**: Validation classes di [create-lokasi.dto.ts](backend/src/master-data/dto/create-lokasi.dto.ts:1) dan [update-lokasi.dto.ts](backend/src/master-data/dto/update-lokasi.dto.ts:1) dengan class-validator decorators

### Frontend Implementation
- **Type Definitions**: Interface Lokasi di [user.types.ts](frontend/src/types/user.types.ts:134-142) dengan proper TypeScript typing
- **API Layer**: Service functions di [master.api.ts](frontend/src/services/api/master.api.ts:223-282):
  - `getLokasi()` - Fetch dengan error handling dan fallback
  - `createLokasi()`, `updateLokasi()`, `deleteLokasi()` - CRUD operations dengan proper error handling
  - Payload interfaces: `CreateLokasiPayload` dan `UpdateLokasiPayload`
- **Form Component**: Dedicated form di [LokasiForm.tsx](frontend/src/components/forms/LokasiForm.tsx:1) dengan:
  - Client-side validation (namaLokasi min 2 chars, alamat required, keterangan optional)
  - State management dengan React hooks
  - Proper error handling dan loading states
- **UI Integration**: Full integration di [MasterDataPage.tsx](frontend/src/pages/admin/MasterDataPage.tsx:1):
  - Lokasi table dengan columns: ID, Nama Lokasi, Alamat, Status, Keterangan, Actions
  - CRUD operations dengan modal forms
  - Role-based access control (admin only untuk write operations)

### Technical Implementation Details
- **Audit Trail**: Semua operasi Lokasi tercatat di audit trail dengan action types:
  - `MASTER_LOKASI_CREATED` - Saat create lokasi baru
  - `MASTER_LOKASI_UPDATED` - Saat update lokasi (dengan detail perubahan)
  - `MASTER_LOKASI_DELETED` - Saat delete lokasi
- **Validation**: Backend validation dengan class-validator decorators dan frontend validation dengan custom validation logic
- **Error Handling**: Comprehensive error handling dengan user-friendly error messages dan proper HTTP status codes
- **Role-Based Access**: Read access untuk semua roles, write operations (create/update/delete) hanya untuk administrator
- **TypeScript**: Full TypeScript support dengan proper type definitions, error-free compilation, dan strict typing

### API Endpoints Summary
```
GET    /api/master-data/lokasi     - Read (all roles)
POST   /api/master-data/lokasi     - Create (admin only)
PATCH  /api/master-data/lokasi/:id - Update (admin only)
DELETE /api/master-data/lokasi/:id - Delete (admin only)
```

### Database Schema Summary
```sql
CREATE TABLE "master_lokasi" (
    "id" SERIAL NOT NULL,
    "nama_lokasi" VARCHAR(100) NOT NULL,
    "alamat" TEXT NOT NULL,
    "keterangan" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "master_lokasi_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "master_lokasi_nama_lokasi_key" ON "master_lokasi"("nama_lokasi");
CREATE INDEX "idx_master_lokasi_nama_lokasi" ON "master_lokasi"("nama_lokasi");
CREATE INDEX "idx_master_lokasi_is_active" ON "master_lokasi"("is_active");
```
## Update Terbaru — 4 Oktober 2025

- Backend Authentication Fix — injeksi ConfigService pada strategi JWT telah diperbaiki di [jwt.strategy.ts](backend/src/auth/strategies/jwt.strategy.ts:1). Autentikasi berjalan normal, aplikasi start tanpa error, dan verifikasi berjalan hijau pada smoke/E2E.
- Status Layanan — Backend (http://localhost:3000) dan Frontend (http://localhost:5173) berjalan normal; WebSocket dedicated server pada ws://localhost:3001 stabil.
- Dokumentasi Produk — [PRD.md](PRD.md:1) telah dibuat dan ditetapkan sebagai referensi resmi untuk scope, acceptance criteria, dan test plan lintas tim (engineering/QA/ops).
- Status Aplikasi — Production Ready tetap konsisten dengan pencapaian performa, aksesibilitas, dan verifikasi integrasi.

## Update Terbaru — Fitur Lokasi (Master Data) — 4 Oktober 2025

### Database Schema & Migration
- **Model Lokasi**: Ditambahkan ke Prisma schema di [schema.prisma](backend/prisma/schema.prisma:172-186) dengan field:
  - `namaLokasi` (VARCHAR(100), unique)
  - `alamat` (TEXT, required)
  - `keterangan` (TEXT, optional)
  - `isActive` (BOOLEAN, default true)
  - Standard timestamps (created_at, updated_at)
- **Migration**: Database migration berhasil dijalankan: [20251004024450_add_lokasi](backend/prisma/migrations/20251004024450_add_lokasi/migration.sql:1)
- **Indexes**: Unique index pada namaLokasi dan regular index pada isActive untuk performa query

### Backend Implementation
- **Service Layer**: CRUD operations lengkap di [MasterDataService](backend/src/master-data/master-data.service.ts:480-589):
  - `getLokasi()` - Read access untuk semua roles
  - `createLokasi()` - Create dengan audit trail MASTER_LOKASI_CREATED
  - `updateLokasi()` - Update dengan audit trail MASTER_LOKASI_UPDATED
  - `deleteLokasi()` - Delete dengan audit trail MASTER_LOKASI_DELETED
- **Controller Layer**: API endpoints di [MasterDataController](backend/src/master-data/master-data.controller.ts:160-189):
  - `GET /master-data/lokasi` - Read (all roles)
  - `POST /master-data/lokasi` - Create (admin only)
  - `PATCH /master-data/lokasi/:id` - Update (admin only)
  - `DELETE /master-data/lokasi/:id` - Delete (admin only)
- **DTOs**: Validation classes di [create-lokasi.dto.ts](backend/src/master-data/dto/create-lokasi.dto.ts:1) dan [update-lokasi.dto.ts](backend/src/master-data/dto/update-lokasi.dto.ts:1) dengan class-validator decorators

### Frontend Implementation
- **Type Definitions**: Interface Lokasi di [user.types.ts](frontend/src/types/user.types.ts:134-142) dengan proper TypeScript typing
- **API Layer**: Service functions di [master.api.ts](frontend/src/services/api/master.api.ts:223-282):
  - `getLokasi()` - Fetch dengan error handling dan fallback
  - `createLokasi()`, `updateLokasi()`, `deleteLokasi()` - CRUD operations dengan proper error handling
  - Payload interfaces: `CreateLokasiPayload` dan `UpdateLokasiPayload`
- **Form Component**: Dedicated form di [LokasiForm.tsx](frontend/src/components/forms/LokasiForm.tsx:1) dengan:
  - Client-side validation (namaLokasi min 2 chars, alamat required, keterangan optional)
  - State management dengan React hooks
  - Proper error handling dan loading states
- **UI Integration**: Full integration di [MasterDataPage.tsx](frontend/src/pages/admin/MasterDataPage.tsx:1):
  - Lokasi table dengan columns: ID, Nama Lokasi, Alamat, Status, Keterangan, Actions
  - CRUD operations dengan modal forms
  - Role-based access control (admin only untuk write operations)

### Technical Implementation Details
- **Audit Trail**: Semua operasi Lokasi tercatat di audit trail dengan action types:
  - `MASTER_LOKASI_CREATED` - Saat create lokasi baru
  - `MASTER_LOKASI_UPDATED` - Saat update lokasi (dengan detail perubahan)
  - `MASTER_LOKASI_DELETED` - Saat delete lokasi
- **Validation**: Backend validation dengan class-validator decorators dan frontend validation dengan custom validation logic
- **Error Handling**: Comprehensive error handling dengan user-friendly error messages dan proper HTTP status codes
- **Role-Based Access**: Read access untuk semua roles, write operations (create/update/delete) hanya untuk administrator
- **TypeScript**: Full TypeScript support dengan proper type definitions, error-free compilation, dan strict typing

### API Endpoints Summary
```
GET    /api/master-data/lokasi     - Read (all roles)
POST   /api/master-data/lokasi     - Create (admin only)
PATCH  /api/master-data/lokasi/:id - Update (admin only)
DELETE /api/master-data/lokasi/:id - Delete (admin only)
```

### Database Schema Summary
```sql
CREATE TABLE "master_lokasi" (
    "id" SERIAL NOT NULL,
    "nama_lokasi" VARCHAR(100) NOT NULL,
    "alamat" TEXT NOT NULL,
    "keterangan" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    
    CONSTRAINT "master_lokasi_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE UNIQUE INDEX "master_lokasi_nama_lokasi_key" ON "master_lokasi"("nama_lokasi");
CREATE INDEX "idx_master_lokasi_nama_lokasi" ON "master_lokasi"("nama_lokasi");
CREATE INDEX "idx_master_lokasi_is_active" ON "master_lokasi"("is_active");

## Update Terbaru — Redesain Login Page (Industrial Premium) — 4 Oktober 2025

Ringkasan Teknis (Frontend):
- Complete redesign halaman login dengan industrial premium aesthetic — memanfaatkan stack yang ada (React + Vite + Tailwind CSS) tanpa menambah dependency runtime baru.
- Branding perusahaan: PT Prima Sarana Gemilang — Site Taliabu terintegrasi profesional pada halaman login.
- Kredit developer: Team IRGA — Site Taliabu.

Dependensi & Konfigurasi Frontend:
- Dependency: Tidak ada penambahan library UI; tetap menggunakan Tailwind CSS + komponen React kustom. Micro‑interactions diimplementasikan dengan CSS (transition/transform) untuk performa optimal.
- Konfigurasi Vite/Tailwind: Tidak perlu perubahan struktural; desain memanfaatkan token warna yang sudah ada serta utility Tailwind.
- Perbaikan meta di [frontend/index.html](frontend/index.html:1):
  - theme‑color disesuaikan dengan palet gelap (steel/charcoal) agar address bar/OS chrome konsisten.
  - color‑scheme: dark light untuk membantu UA memilih skema warna kontras.
  - viewport disesuaikan agar scaling & tap targets akurat untuk perangkat mobile.
  - Preconnect/prefetch (opsional) untuk font/CDN bila digunakan; memastikan tidak menambah blocking resources.

Dokumentasi Perubahan di [LoginPage.tsx](frontend/src/pages/LoginPage.tsx:1):
- Komponen [LoginPage()](frontend/src/pages/LoginPage.tsx:1) direstruktur menjadi layout form yang ringkas dengan panel visual industrial:
  - Struktur form semantik: label terasosiasi, input dengan aria‑invalid bila error, region feedback menggunakan aria‑describedby & aria‑live="polite".
  - Validasi progresif (progressive disclosure): error inline per field dan ringkasan error (bila diperlukan) yang dapat diakses oleh pembaca layar.
  - Technical grid overlays & metallic depth highlights: overlay halus berbasis CSS (opacity rendah, backdrop‑blur selektif); premium shadows (multi‑layer) berbasis box‑shadow/filters.
  - Fokus states kontras tinggi pada palet gelap (ring/outline Tailwind dengan warna accent/amber).
- Palet warna:
  - Steel blues: #1e293b, #334155
  - Charcoal: #0f172a
  - Steel gray: #64748b
  - Amber accents (premium highlights)
- Micro‑interactions:
  - Transition 150–250ms, easing cubic‑bezier; transform‑only (scale/translate) + will‑change untuk menghindari layout thrash.
  - Hover/focus states halus pada tombol dan elemen interaktif dengan feedback visual yang jelas.

Performance Optimizations:
- LCP: Menghindari hero image berat; efek visual murni CSS (gradients/overlays) untuk menjaga waktu render awal rendah.
- Paint/Composite: Menggunakan transform + will‑change pada elemen interaktif; meminimalkan repaint.
- Asset: Meta/performance tweaks di [frontend/index.html](frontend/index.html:1) untuk color‑scheme/theme‑color; optional preconnect fonts (jika diperlukan).
- CSS: Utility‑first; menghindari CSS besar/kustom yang tidak perlu; memanfaatkan Tailwind JIT agar payload kecil.
- Interaksi: Memastikan prefers‑reduced‑motion didukung; animasi halus yang tidak mengganggu.

Accessibility Enhancements (WCAG 2.1 AA):
- Navigasi keyboard lengkap: tab order logis; focus ring kontras di palet gelap; tidak ada keyboard traps.
- ARIA & Semantik:
  - label → input terasosiasi; aria‑describedby untuk help/error; region feedback menggunakan aria‑live.
  - Role/landmark yang tepat untuk container form.
- Kontras:
  - Teks pada background steel/charcoal diverifikasi memenuhi rasio kontras AA.
- Error Handling:
  - Pesan validasi jelas, dikomunikasikan via screen reader; ikon/status tidak menjadi satu‑satunya indikator.

Responsive Behavior (Advanced):
- Mobile‑first: Kolom tunggal; spacing terukur; target sentuh ≥ 44px; keyboard on‑screen friendly.
- Tablet/Desktop: Dua kolom adaptif (panel brand/visual vs form); overlay grid skalabel; menjaga hierarchy dan readability.
- Breakpoints Tailwind: Layout & padding disesuaikan untuk ritme visual konsisten di semua viewport.

Files Modified:
- [LoginPage.tsx](frontend/src/pages/LoginPage.tsx:1) — UI/UX industrial premium implementasi lengkap.
- [frontend/index.html](frontend/index.html:1) — meta fix (branding, theme‑color, color‑scheme, viewport).

Verifikasi:
- Screenshot desktop & mobile diambil; diperiksa untuk visual hierarchy, kontras, dan konsistensi.
- Login flow diuji end‑to‑end:
  - Validasi input (empty/invalid), pesan error, dan success path.
  - Keyboard navigation & focus management.
- Konsol browser bersih (tanpa error/warning relevan).
- Typecheck lulus (frontend); tidak ada regresi pada rute lain. E2E/smoke tetap hijau.

Status:
- Production Ready dengan enhanced login experience; kualitas UI/UX meningkat untuk environment enterprise/industrial tanpa menambah beban dependency.

## Final Updates — Production Ready Tech (Oktober 2025)

Ringkasan update teknis untuk status akhir Production Ready; melengkapi dokumen tanpa mengubah struktur inti.

- Premium Login UX (Industrial Design)
  - Halaman login didesain ulang dengan estetika industrial premium (steel/charcoal + aksen amber), aksesibilitas WCAG 2.1 AA, dan micro‑interactions 150–250ms.
  - Referensi: [LoginPage.tsx](frontend/src/pages/LoginPage.tsx:1), [index.html](frontend/index.html:1).

- Dev Runtime — tsx (Pengganti ts-node-dev)
  - Backend dev: `tsx watch src/main.ts` melalui workspace script.
  - Referensi: [backend/package.json](backend/package.json:7), penggunaan di root: [package.json](package.json:11-13).
  - Catatan kompatibilitas Node 22 &amp; warning concurrently (non‑fatal) disertakan di bagian “Solusi Runtime Dev Backend — tsx”.

- BigInt Serialization Fix (HTTP JSON)
  - Polyfill aman untuk serialisasi BigInt pada response HTTP:
    - `BigInt.prototype.toJSON = function () { return this.toString(); }`
  - Referensi: [backend/src/main.ts](backend/src/main.ts:36-42).

- Database — Real PostgreSQL (Bukan Mock) dengan Prisma
  - Schema &amp; migrasi aktif:
    - [backend/prisma/schema.prisma](backend/prisma/schema.prisma:1)
    - Migrasi: [20251001075640_init](backend/prisma/migrations/20251001075640_init/migration.sql:1), [20251001083412_add_default_status_pesanan](backend/prisma/migrations/20251001083412_add_default_status_pesanan/migration.sql:1), [20251004024450_add_lokasi](backend/prisma/migrations/20251004024450_add_lokasi/migration.sql:1)
  - Seed contoh: [backend/prisma/seed.ts](backend/prisma/seed.ts:1)

- WebSocket Dedicated Server &amp; Adapter
  - Binding server WS dedicated (`WS_PORT`=3001), transports `['websocket']`, CORS konsisten; namespace `/notifications`.
  - Guard handshake JWT, room targeting (role, dept, user, karyawan).
  - Referensi: [backend/src/websocket/websocket.gateway.ts](backend/src/websocket/websocket.gateway.ts:36,251), [backend/src/websocket/websocket.guard.ts](backend/src/websocket/websocket.guard.ts:7,13,41), adapter di [backend/src/main.ts](backend/src/main.ts:49-73,129-141).

- PWA &amp; Offline Support (Service Worker + Runtime Caching)
  - Perbaikan infinite redirect loop; offline navigation fallback aman (SPA shell).
  - Runtime caching: API dinamis (NetworkFirst), API statis (CacheFirst), assets/images, Google Fonts (SWR).
  - UI PWA: OfflineIndicator, OfflinePage, InstallPrompt, UpdatePrompt.
  - Referensi: [frontend/vite.config.ts](frontend/vite.config.ts:88-107,110-161), [OfflineIndicator.tsx](frontend/src/components/pwa/OfflineIndicator.tsx:1), [OfflinePage.tsx](frontend/src/pages/OfflinePage.tsx:1), [InstallPrompt.tsx](frontend/src/components/pwa/InstallPrompt.tsx:1), [UpdatePrompt.tsx](frontend/src/components/pwa/UpdatePrompt.tsx:1).

- Offline Storage — IndexedDB Utilities
  - Object stores: `orders` dan `user-data`; desain fail‑safe &amp; logging konsisten.
  - Referensi: [offline-storage.utils.ts](frontend/src/utils/offline-storage.utils.ts:1).

- Recovery &amp; Database Tools (Safety‑first)
  - Skrip operasional: cleanup/restore/verify dengan backup otomatis, transaksi &amp; rollback, preservasi admin, verifikasi login opsional.
  - BigInt‑safe JSON: serializer (cleanup) &amp; revival (restore).
  - Referensi: [scripts/db-tools/db-cleanup.js](scripts/db-tools/db-cleanup.js:1,294-304), [scripts/db-tools/db-restore.js](scripts/db-tools/db-restore.js:1,215-234), [scripts/db-tools/db-verify.js](scripts/db-tools/db-verify.js:1), folder [backups/](backups/backup-20251005-012718.json:1).

- Testing Readiness (CI‑friendly)
  - Typecheck hijau: root/backend/frontend (tsc --noemit).
    - Referensi: [package.json](package.json:30), [backend/package.json](backend/package.json:17), [frontend/package.json](frontend/package.json:46).
  - API Smoke Tests: [scripts/api-smoke/get-departments.js](scripts/api-smoke/get-departments.js:1), [scripts/api-smoke/create-department.js](scripts/api-smoke/create-department.js:1).
  - E2E Playwright: [playwright.config.ts](playwright.config.ts:1), suites [tests/e2e/auth.spec.ts](tests/e2e/auth.spec.ts:1), [tests/e2e/admin-workflow.spec.ts](tests/e2e/admin-workflow.spec.ts:1), laporan: [playwright-report/index.html](playwright-report/index.html:1).

- Security &amp; RBAC Hardening
  - Guards global &amp; dekorator akses: [JwtAuthGuard](backend/src/common/guards/jwt-auth.guard.ts:7), [RolesGuard](backend/src/common/guards/roles.guard.ts:10), [Public()](backend/src/common/decorators/public.decorator.ts:4), [Roles(...)](backend/src/common/decorators/roles.decorator.ts:17).
  - Proteksi hash password (bcrypt) dan seleksi field aman pada relasi user (Prisma `select`).
  - Frontend: axios interceptor Bearer + refresh dengan fallback token: [axios.ts](frontend/src/lib/axios.ts:1), helper [getAccessTokenSafe()](frontend/src/lib/axios.ts:80).

Status akhir: Tech stack lengkap, tooling operasional matang, dan kesiapan testing telah terverifikasi. Proyek berada pada kondisi PRODUCTION READY untuk PT Prima Sarana Gemilang — Site Taliabu.
