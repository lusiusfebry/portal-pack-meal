# Tasks — Memory Bank

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

Terakhir diperbarui: 2025-10-04