# Tasks — Memory Bank

Last updated: 2025-10-04

## API Smoke Testing

Deskripsi singkat: Workflow smoke test API untuk verifikasi cepat endpoint kritis (login & master-data) tanpa menjalankan seluruh suite E2E.

1. Tujuan
   - Memverifikasi autentikasi dan endpoint master-data secara cepat.
   - Mendeteksi dini regresi (401, 5xx, payload tidak sesuai) sebelum E2E.

2. File yang terlibat
   - [scripts/api-smoke/get-departments.js](scripts/api-smoke/get-departments.js)
     - Fungsi login: [login()](scripts/api-smoke/get-departments.js:8)
     - Pemanggilan endpoint: [getDepartments()](scripts/api-smoke/get-departments.js:25)
   - [scripts/api-smoke/create-department.js](scripts/api-smoke/create-department.js)

3. Langkah-langkah menjalankan test
   - Persiapan:
     - Pastikan backend berjalan di http://localhost:3000 dan database siap.
     - Set variabel lingkungan yang diperlukan (lihat bagian 4).
   - Menjalankan via Windows CMD:
     - node scripts\\api-smoke\\get-departments.js
     - node scripts\\api-smoke\\create-department.js
   - Menjalankan via PowerShell/Bash:
     - node scripts/api-smoke/get-departments.js
     - node scripts/api-smoke/create-department.js

4. Variabel lingkungan yang diperlukan
   - API_BASE_URL (default: http://localhost:3000/api)
   - ADMIN_NIK (default: ADM001)
   - ADMIN_PASSWORD (default: admin123)

5. Cara interpretasi hasil
   - Skrip mencetak status HTTP dan body respons.
   - GET departments:
     - 200 OK dengan array data departemen → lulus.
     - 401/403 → masalah autentikasi/otorisasi.
     - 5xx → masalah server.
   - CREATE department:
     - 201 Created → lulus (departemen baru dibuat).
     - 409 Conflict → non-fatal (departemen sudah ada), anggap lulus jika respons jelas.
     - 400/422 → periksa payload dan validasi.

6. Kapan harus menjalankan
   - Setelah perubahan pada modul autentikasi (guards, strategi JWT) atau master-data.
   - Setelah deployment backend ke lingkungan dev/staging/production.
   - Saat mendiagnosis error 401/403 atau kegagalan fetch di frontend.
   - Sebagai check cepat di CI sebelum menjalankan E2E Playwright ([playwright.config.ts](playwright.config.ts:1)).

7. Catatan tambahan
   - Workflow ini melengkapi E2E; fokus pada sanity check endpoint inti, eksekusi cepat.
   - Pastikan kredensial admin tersedia dan valid; gunakan nilai default bila tidak ditentukan.
   - Simpan output terminal sebagai artefak CI bila diperlukan untuk diagnosis regresi.

---

## Perbaikan Backend — JwtStrategy DI error ("Cannot read properties of undefined (reading 'get')") — Status: COMPLETED (2025-10-04)

Deskripsi singkat: Memperbaiki error DI pada inisialisasi strategi JWT yang menyebabkan autentikasi gagal.

1. File yang terlibat
   - [backend/src/auth/strategies/jwt.strategy.ts](backend/src/auth/strategies/jwt.strategy.ts:1)
   - [backend/src/auth/auth.module.ts](backend/src/auth/auth.module.ts:1)
   - [backend/src/app.module.ts](backend/src/app.module.ts:1)
   - [backend/src/auth/strategies/index.ts](backend/src/auth/strategies/index.ts:1)
   - [node_modules/@nestjs/core/injector/instance-loader.js](node_modules/@nestjs/core/injector/instance-loader.js:1)

2. Langkah-langkah perbaikan
   - Pastikan `ConfigModule` global di AppModule: lihat [backend/src/app.module.ts](backend/src/app.module.ts:1).
   - Registrasi `JwtModule.registerAsync` di AuthModule dengan `ConfigService`: lihat [backend/src/auth/auth.module.ts](backend/src/auth/auth.module.ts:1).
   - Validasi konstruktor `JwtStrategy` menggunakan DI `ConfigService` dan guard terhadap nilai undefined: lihat [backend/src/auth/strategies/jwt.strategy.ts](backend/src/auth/strategies/jwt.strategy.ts:1).
   - Audit barrel `strategies/index.ts` untuk ekspor yang konsisten: lihat [backend/src/auth/strategies/index.ts](backend/src/auth/strategies/index.ts:1).
   - Jalankan dev dan pantau injector logs: lihat [node_modules/@nestjs/core/injector/instance-loader.js](node_modules/@nestjs/core/injector/instance-loader.js:1).

3. Solusi yang diterapkan
   - Mengaktifkan [ConfigModule.forRoot({ isGlobal: true })](backend/src/app.module.ts:1) agar ConfigService tersedia secara global.
   - Menggunakan [JwtModule.registerAsync](backend/src/auth/auth.module.ts:1) dengan `inject: [ConfigService]` dan membaca secret/expiry via `config.get(...)`.
   - Memperbarui konstruktor [JwtStrategy](backend/src/auth/strategies/jwt.strategy.ts:1) untuk DI `ConfigService` dan menambahkan guard terhadap nilai undefined.
   - Verifikasi: Backend start tanpa error; rute ber-JWT berfungsi; smoke test dan E2E autentikasi lulus.

4. Acceptance criteria
   - Backend start tanpa error; rute ber-JWT berfungsi; E2E autentikasi lulus. Status: TERPENUHI.

---

## Perbaikan Frontend — Master Data API export mismatch ("does not provide an export named 'createLokasi'") — Status: COMPLETED (2025-10-04)

Deskripsi singkat: Menyelaraskan impor/ekspor fungsi `createLokasi` antara modul JS legacy dan TS typed agar UI Lokasi berfungsi.

1. File yang terlibat
   - [frontend/src/services/api/master.api.ts](frontend/src/services/api/master.api.ts:1)
   - [frontend/src/services/api/master.api.js](frontend/src/services/api/master.api.js:1)
   - [frontend/src/services/api/index.ts](frontend/src/services/api/index.ts:1)
   - [frontend/src/components/forms/LokasiForm.tsx](frontend/src/components/forms/LokasiForm.tsx:1)
   - [frontend/src/pages/admin/MasterDataPage.tsx](frontend/src/pages/admin/MasterDataPage.tsx:1)

2. Langkah-langkah perbaikan
   - Konsolidasikan impor agar menunjuk ke sumber typed (barrel [frontend/src/services/api/index.ts](frontend/src/services/api/index.ts:1) atau langsung [frontend/src/services/api/master.api.ts](frontend/src/services/api/master.api.ts:1)).
   - Jika perlu sementara, tambahkan named export `createLokasi` pada [frontend/src/services/api/master.api.js](frontend/src/services/api/master.api.js:1) untuk paritas hingga cleanup.
   - Audit semua referensi `createLokasi` di komponen/form terkait: [frontend/src/components/forms/LokasiForm.tsx](frontend/src/components/forms/LokasiForm.tsx:1), [frontend/src/pages/admin/MasterDataPage.tsx](frontend/src/pages/admin/MasterDataPage.tsx:1).
   - Jalankan dev dan verifikasi tidak ada error di konsol; uji aksi create Lokasi end‑to‑end.

3. Solusi yang diterapkan
   - Menstandarkan impor ke barrel typed [frontend/src/services/api/index.ts](frontend/src/services/api/index.ts:1) atau langsung ke [frontend/src/services/api/master.api.ts](frontend/src/services/api/master.api.ts:1) tanpa ekstensi.
   - Untuk bridging sementara, menambahkan ekspor bernama `createLokasi` di [frontend/src/services/api/master.api.js](frontend/src/services/api/master.api.js:1) atau memigrasi referensi UI ke modul TS sepenuhnya.
   - Memperbarui referensi impor pada halaman/form terkait bila diperlukan; memverifikasi aksi create Lokasi sukses dan tidak ada error Vite terkait export.

4. Acceptance criteria
   - Import berfungsi, aksi create Lokasi sukses, konsol tanpa error modul export. Status: TERPENUHI.

---

Catatan: Jangan mengubah [brief.md](.kilicode/rules/memory-bank/brief.md:1) secara langsung; file tersebut dikelola manual. Arsitektur dan tech sudah diselaraskan; referensi tetap di [architecture.md](.kilicode/rules/memory-bank/architecture.md:1) dan [tech.md](.kilicode/rules/memory-bank/tech.md:1).