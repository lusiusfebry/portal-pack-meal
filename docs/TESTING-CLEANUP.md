# Panduan Testing — Database Cleanup & Restore (PT Prima Sarana Gemilang — Site Taliabu)

Dokumen ini menjelaskan prosedur lengkap untuk menyiapkan state database yang bersih untuk pengujian alur kerja aplikasi, sekaligus memastikan keamanan data admin, integritas referensial, dan kemampuan rollback jika terjadi masalah.

Referensi skrip:
- [db-cleanup.js](scripts/db-tools/db-cleanup.js:1) — Cleanup dengan backup otomatis, konfirmasi interaktif, transaksi aman, dan verifikasi pasca-eksekusi
- [db-restore.js](scripts/db-tools/db-restore.js:1) — Restore dari JSON backup disertai reset sequence dan verifikasi admin
- [db-verify.js](scripts/db-tools/db-verify.js:1) — Verifikasi kondisi database (admin, tabel transaksi kosong, login API opsional)
- NPM scripts integrasi: lihat [package.json](package.json:1) — perintah singkat untuk menjalankan ketiga tool di atas

Komponen verifikasi via API login mengacu pada handler [AuthService.login()](backend/src/auth/auth.service.ts:130).

---

## Tujuan

- Membersihkan seluruh data uji/sample tanpa menghapus user admin dan karyawan admin
- Menjaga integritas referensial dengan urutan penghapusan yang tepat
- Menyediakan backup otomatis sebelum operasi destruktif
- Menyediakan mekanisme restore dan verifikasi yang cepat
- Menjamin aplikasi siap untuk pengujian dengan state “kosong” yang benar

## Data yang Dihapus dan Dipertahankan

- Dihapus:
  - Semua Pesanan (transaction_pesanan)
  - Semua AuditTrail (log_audit_trail)
  - Semua Karyawan selain admin
  - Semua User selain admin
  - Master data sample/testing (opsional; pola nama “sample”, “testing”, “demo”, atau master yang tidak direferensikan karyawan/admin sesuai mode)

- Dipertahankan:
  - User admin (role: administrator)
  - Karyawan admin (roleAccess: administrator)
  - Schema & struktur database
  - Riwayat migrasi

## Prasyarat

- PostgreSQL berjalan dan `DATABASE_URL` valid (otomatis dibaca dari `backend/.env` jika belum diset)
- Prisma Client sudah tergenerate di workspace backend
- Jalankan dari root repository

## NPM Scripts (Singkat)

Di [package.json](package.json:1) tersedia perintah singkat:

- Cleanup:
  - `npm run db:cleanup` — mode default (aman, tidak hapus master)
  - `npm run db:cleanup:dry` — hanya ringkasan (tanpa eksekusi)
  - `npm run db:cleanup:patterns` — hapus master data dengan pola nama sample/testing/demo (skip admin refs)
  - `npm run db:cleanup:unreferenced` — hapus master yang tidak direferensikan karyawan (departemen/jabatan/shifts orphan)
  - `npm run db:cleanup:all` — agresif, hapus semua master non-admin refs (gunakan dengan kehati-hatian)

- Restore:
  - `npm run db:restore` — restore dari backup JSON terbaru di folder `./backups`

- Verify:
  - `npm run db:verify` — ringkasan admin dan tabel transaksi
  - `npm run db:verify:details` — plus detail count master data

## Langkah Operasional

### 1) Dry-Run & Validasi Admin

Jalankan ringkasan untuk melihat target yang akan dihapus dan memverifikasi keberadaan admin:

```bash
npm run db:cleanup:dry
npm run db:verify
```

Output ringkasan akan menampilkan jumlah entri pada tabel transaksi, jumlah user/karyawan non-admin, dan status admin. Jika admin tidak ditemukan, hentikan proses dan gunakan toolkit recovery: [recovery-scripts.js](recovery-scripts.js:1).

### 2) Backup Otomatis

Sebelum cleanup, skrip [db-cleanup.js](scripts/db-tools/db-cleanup.js:1) membuat file backup JSON otomatis di folder `./backups/backup-YYYYMMDD-hhmmss.json`. File backup mencakup seluruh tabel (termasuk `passwordHash`). Simpan file ini secara aman dan jangan commit ke VCS.

### 3) Cleanup Aman (Mode Default)

Menjalankan cleanup standar (tanpa menghapus master):

```bash
npm run db:cleanup
```

- Konfirmasi interaktif: Anda diminta mengetik `CLEAN` (kecuali menambahkan `--yes`)
- Operasi berjalan dalam satu transaksi; jika terjadi error, seluruh perubahan akan di-rollback
- Penghapusan dilakukan dengan urutan aman: Pesanan → AuditTrail → Karyawan non-admin → User non-admin

### 4) Cleanup Master Data (Opsional)

Jika ingin menghapus master data sample/testing atau orphan:

- Pola nama “sample/testing/demo” (case-insensitive), tetap menjaga referensi admin:

```bash
npm run db:cleanup:patterns
```

- Master yang tidak direferensikan oleh karyawan (orphan):

```bash
npm run db:cleanup:unreferenced
```

- Hapus semua master non-admin refs (agresif, gunakan dengan ekstra hati-hati):

```bash
npm run db:cleanup:all
```

Catatan: pada mode “patterns” dan “all”, departemen/jabatan yang direferensikan karyawan admin akan tetap dipertahankan.

### 5) Verifikasi Pasca-Cleanup

Setelah cleanup:

```bash
npm run db:verify
npm run db:verify:details
```

Anda juga dapat memverifikasi login admin via API dengan parameter:

```bash
node scripts/db-tools/db-verify.js --api-base http://localhost:3000/api --admin-nik ADM001 --admin-password admin123
```

Atau langsung dari cleanup (opsional):

```bash
node scripts/db-tools/db-cleanup.js --api-base http://localhost:3000/api --admin-nik ADM001 --admin-password admin123
```

Login dilakukan ke endpoint [AuthService.login()](backend/src/auth/auth.service.ts:130).

### 6) Restore (Rollback) Jika Diperlukan

Jika diperlukan rollback, gunakan [db-restore.js](scripts/db-tools/db-restore.js:1):

- Restore dari backup terbaru di `./backups`:

```bash
npm run db:restore
```

- Atau tentukan file backup manual:

```bash
node scripts/db-tools/db-restore.js --file backups/backup-20251004-101500.json
```

- Konfirmasi interaktif: ketik `RESTORE`
- Proses restore akan:
  - Menghapus isi tabel dalam urutan FK-safe
  - Memasukkan data dari backup sesuai ID (preserve relasi & integritas)
  - Reset sequence/identity ke MAX(id)+1 untuk tabel yang menggunakan autoincrement
  - Memverifikasi admin pasca-restore

### 7) Validasi Aplikasi (UI)

Dengan dev server berjalan (`npm run dev`):

- Login sebagai admin dan pastikan halaman dashboard menampilkan state kosong:
  - Tidak ada pesanan pada daftar (Orders List)
  - Audit trail viewer menampilkan kosong
  - Master data tampil hanya sesuai mode cleanup yang dipilih
- Perhatikan toast/notifikasi dan konsistensi offline/PWA (tidak berubah dengan cleanup)

## Safety & Compliance

- Backup sebelum cleanup — otomatis, JSON disimpan ke `./backups`
- Konfirmasi interaktif — input eksplisit `CLEAN`/`RESTORE` untuk mencegah kesalahan
- Transaksi database — semua operasi dalam transaksi; jika error, rollback otomatis
- Integritas referensial — urutan penghapusan/resource yang tepat
- Data sensitif — `passwordHash` ada di backup; jangan dibagikan, enkripsi jika perlu
- Auditability — cleanup menghapus `log_audit_trail`; backup file menjadi sumber audit pra-cleanup

## Troubleshooting

- Admin tidak terdeteksi:
  - Jalankan toolkit admin recovery [recovery-scripts.js](recovery-scripts.js:1) → tindakan “find”, “make-admin”, “reset-password”
- Prisma Client error:
  - Pastikan `npm run install:all` sudah dijalankan dan Prisma Client tergenerate di workspace backend
- Koneksi DB gagal:
  - Verifikasi `DATABASE_URL` di `backend/.env` dan bahwa PostgreSQL berjalan
- Restore gagal di tengah:
  - Periksa format backup; gunakan `--dry-run` di restore untuk ringkasan terlebih dahulu
- Login API verifikasi gagal:
  - Periksa [AuthService.login()](backend/src/auth/auth.service.ts:130), periksa kredensial, dan pastikan backend dev server aktif (`http://localhost:3000/api`)

## Lampiran — Parameter CLI

### Cleanup ([db-cleanup.js](scripts/db-tools/db-cleanup.js:1))
- `--yes` — skip konfirmasi interaktif
- `--dry-run` — hanya ringkasan
- `--delete-master <none|patterns|unreferenced|all>` — mode master cleanup (default: `none`)
- `--backup-dir <path>` — folder output backup (default: `./backups`)
- `--api-base <url>` — verifikasi login admin via API (opsional)
- `--admin-nik <nik>`, `--admin-password <pw>` — kredensial verifikasi (opsional)

### Restore ([db-restore.js](scripts/db-tools/db-restore.js:1))
- `--file <path>` — file backup (default: terbaru di `./backups`)
- `--yes` — skip konfirmasi interaktif
- `--dry-run` — ringkasan tanpa eksekusi
- `--api-base <url>`, `--admin-nik <nik>`, `--admin-password <pw>` — verifikasi login admin pasca-restore (opsional)

### Verify ([db-verify.js](scripts/db-tools/db-verify.js:1))
- `--api-base <url>`, `--admin-nik <nik>`, `--admin-password <pw>` — uji login admin via API (opsional)
- `--details` — sertakan count master data

---

## Acceptance Criteria (QA)

- Setelah `npm run db:cleanup`:
  - Admin tetap ada (users.admin ≥ 1, karyawan.admin ≥ 1)
  - `pesanan.count === 0`, `auditTrail.count === 0`
  - Admin berhasil login via API (opsional)
  - UI menampilkan state kosong yang benar
- Setelah `npm run db:restore`:
  - Data kembali sesuai backup
  - Sequences disesuaikan (insert berikutnya tidak bentrok)
  - Admin tetap bisa login

Dokumen ini menjadi SOP resmi untuk persiapan testing alur kerja aplikasi.
## Update — BigInt Serialization Fix (Oktober 2025)

Perubahan penting untuk mencegah error "TypeError: Do not know how to serialize a BigInt" saat proses backup JSON:

- Backup: serialisasi aman BigInt diterapkan di [scripts/db-tools/db-cleanup.js](scripts/db-tools/db-cleanup.js) dengan pengganti JSON.stringify menggunakan fungsi internal yang mengubah BigInt menjadi string.
- Restore: normalisasi BigInt pada payload backup diterapkan di [scripts/db-tools/db-restore.js](scripts/db-tools/db-restore.js) sehingga nilai BigInt (contoh: kolom id pada AuditTrail) bisa direstore kembali secara aman dari string/number/bigint.

### Dampak dan Kompatibilitas
- Backup baru: kolom BigInt akan tersimpan sebagai string di file JSON (mis. "12345"), meningkatkan kompatibilitas lintas lingkungan.
- Restore: mendukung format baru (string) dan lama (number/bigint), sehingga file backup apa pun yang sudah ada tetap bisa dipulihkan.
- Integritas data & relasi: mekanisme restore tidak mengubah skema relasi; semua foreign key dan sequence di-reset sesuai implementasi sebelumnya.

### Catatan Verifikasi
- Setelah `npm run db:cleanup` (tanpa restore), skrip verify mengharapkan tabel transaksi kosong: `pesanan = 0`, `auditTrail = 0`.
- Setelah `npm run db:restore`, kondisi tabel transaksi akan kembali terisi sesuai backup; maka peringatan "Transactional tables are not empty" dari verify adalah **normal** dan sesuai ekspektasi pasca-restore.
- Admin:
  - Pasca-cleanup: admin harus tetap ada dan lolos verifikasi (`usersAdmin ≥ 1`, `karyawanAdmin ≥ 1`).
  - Pasca-restore: admin tetap ada; opsional, verifikasi login via API dapat dijalankan (butuh backend aktif).

### Langkah Uji Singkat
1) Cleanup end-to-end:
- `npm run db:cleanup:all`
- Pastikan keluaran menunjukkan backup sukses, transaksi cleanup sukses, dan verifikasi pasca-cleanup: `pesanan=0`, `audit_trail=0`, admin tetap ada.

2) Restore & verifikasi:
- `npm run db:restore`
- `npm run db:verify:details`
  - Perhatikan bahwa tabel transaksi akan berisi data sesuai backup (ini normal).
- (Opsional) Verifikasi login admin via API:
  - `node scripts\\db-tools\\db-verify.js --api-base http://localhost:3000/api --admin-nik ADM001 --admin-password admin123`

### Keamanan
- File backup menyertakan nilai sensitif (mis. passwordHash). Simpan secara aman, jangan commit ke VCS.
