---
title: Bebang Pack Meal Portal
version: 1.0.0
date: 2025-10-02
author: Kilo Code
description: Portal operasional untuk mengelola alur pack meal
---

# Tutorial Aplikasi Bebang Pack Meal Portal

## Daftar Isi

1. Bagian 1: Instalasi Aplikasi
2. Bagian 2: Cara Menjalankan Aplikasi
3. Bagian 3: Kredensial Default dan Konfigurasi
4. Bagian 4: Konfigurasi Server Lokal dengan IP Tertentu
5. Bagian 5: Backup, Restore, dan Pemindahan Server
6. Bagian 6: FAQ (Frequently Asked Questions)
7. Bagian 7: Contoh Konfigurasi
8. Bagian 8: Tambahan

---

## Bagian 1: Instalasi Aplikasi

### Prasyarat Sistem

Pastikan sistem Anda memenuhi persyaratan berikut:

- Sistem Operasi: Windows 10, macOS, atau Linux (Ubuntu/Debian/CentOS/Arch)
- Node.js >= 18.0.0 dan npm >= 9.0.0
- PostgreSQL 14 atau lebih baru
- Git dan Visual Studio Code (disarankan)
- Port yang tersedia:
  - Backend API: 3000
  - Frontend SPA: 5173
  - WebSocket: 3001

Periksa versi alat:

```bash
node -v
npm -v
git --version
psql --version    # jika menggunakan psql CLI
```

Konfigurasi environment contoh tersedia di [backend/.env.example](backend/.env.example) dan [frontend/.env.example](frontend/.env.example). Lihat juga skrip workspace di [package.json](package.json:1) dan konfigurasi PWA/Proxy di [frontend/vite.config.ts](frontend/vite.config.ts:1).

### Instalasi untuk Windows

1) Instal Node.js (LTS) dan Git via Chocolatey (opsional, bisa juga dari installer resmi):

```cmd
choco install nodejs-lts -y
choco install git -y
```

2) Instal PostgreSQL:

```cmd
choco install postgresql14 -y
```

3) Buat database dan user (gunakan PowerShell atau CMD):

```bash
# Login ke psql (sesuaikan path jika perlu)
"C:\Program Files\PostgreSQL\14\bin\psql.exe" -U postgres

-- Di dalam psql, jalankan:
CREATE DATABASE bebang_pack_meal;
CREATE USER bpm_user WITH PASSWORD '123456789';
GRANT ALL PRIVILEGES ON DATABASE bebang_pack_meal TO bpm_user;
```

4) Clone repository dan instal dependencies:

```cmd
git clone <REPO_URL>
cd portal-pack-meal
npm run install:all
```

5) Salin file environment:

```cmd
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

6) Edit nilai [DATABASE_URL](backend/.env.example) di backend/.env sesuai kredensial lokal Anda. Contoh:

```env
DATABASE_URL=postgresql://bpm_user:123456789@localhost:5432/bebang_pack_meal?schema=public
```

7) Setup Prisma (generate client, migrasi, dan seeding data):

```cmd
npm exec -w backend prisma generate
npm exec -w backend prisma migrate dev --name init
npm exec -w backend prisma db seed
```

8) Verifikasi TypeScript tanpa build:

```cmd
npm exec -w backend tsc --noemit
npm exec -w frontend tsc --noemit
```

### Instalasi untuk macOS

1) Instal Node.js, Git, dan PostgreSQL via Homebrew:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew update
brew install node git postgresql@14
```

2) Inisialisasi dan jalankan PostgreSQL:

```bash
brew services start postgresql@14
createdb bebang_pack_meal
psql -U "$(whoami)" -d bebang_pack_meal -c "CREATE USER bpm_user WITH PASSWORD '123456789';"
psql -U "$(whoami)" -d bebang_pack_meal -c "GRANT ALL PRIVILEGES ON DATABASE bebang_pack_meal TO bpm_user;"
```

3) Clone repository dan instal dependencies:

```bash
git clone <REPO_URL>
cd portal-pack-meal
npm run install:all
```

4) Salin file environment dan edit [backend/.env](backend/.env.example):

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Ubah DATABASE_URL di backend/.env:

```env
DATABASE_URL=postgresql://bpm_user:123456789@localhost:5432/bebang_pack_meal?schema=public
```

5) Setup Prisma:

```bash
npm exec -w backend prisma generate
npm exec -w backend prisma migrate dev --name init
npm exec -w backend prisma db seed
```

6) Verifikasi TypeScript:

```bash
npm exec -w backend tsc --noemit
npm exec -w frontend tsc --noemit
```

### Instalasi untuk Linux (Ubuntu/Debian/CentOS/Arch)

1) Instal Node.js (disarankan via NVM), Git, dan PostgreSQL:

```bash
# Instal NVM
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.nvm/nvm.sh
nvm install 18
nvm use 18

# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y git postgresql

# CentOS/RHEL
sudo yum install -y git postgresql-server postgresql

# Arch
sudo pacman -S --noconfirm git postgresql
```

2) Inisialisasi dan jalankan PostgreSQL:

```bash
# Ubuntu/Debian
sudo service postgresql start
sudo -u postgres psql -c "CREATE DATABASE bebang_pack_meal;"
sudo -u postgres psql -c "CREATE USER bpm_user WITH PASSWORD '123456789';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE bebang_pack_meal TO bpm_user;"

# CentOS/RHEL (initdb mungkin diperlukan)
sudo postgresql-setup --initdb
sudo systemctl enable postgresql
sudo systemctl start postgresql
sudo -u postgres psql -c "CREATE DATABASE bebang_pack_meal;"
sudo -u postgres psql -c "CREATE USER bpm_user WITH PASSWORD '123456789';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE bebang_pack_meal TO bpm_user;"

# Arch
sudo systemctl enable postgresql
sudo systemctl start postgresql
sudo -u postgres psql -c "CREATE DATABASE bebang_pack_meal;"
sudo -u postgres psql -c "CREATE USER bpm_user WITH PASSWORD '123456789';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE bebang_pack_meal TO bpm_user;"
```

3) Clone repository dan instal dependencies:

```bash
git clone <REPO_URL>
cd portal-pack-meal
npm run install:all
```

4) Salin file environment dan sesuaikan [backend/.env](backend/.env.example):

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Ubah DATABASE_URL di backend/.env:

```env
DATABASE_URL=postgresql://bpm_user:123456789@localhost:5432/bebang_pack_meal?schema=public
```

5) Setup Prisma:

```bash
npm exec -w backend prisma generate
npm exec -w backend prisma migrate dev --name init
npm exec -w backend prisma db seed
```

6) Verifikasi TypeScript:

```bash
npm exec -w backend tsc --noemit
npm exec -w frontend tsc --noemit
```

### Verifikasi Instalasi

Lakukan pemeriksaan berikut untuk memastikan instalasi berhasil:

- Periksa versi alat:

```bash
node -v && npm -v && git --version && psql --version
```

- Validasi type-check untuk kedua workspace:

```bash
npm run typecheck
# atau jalankan per workspace:
npm run -w backend typecheck
npm run -w frontend typecheck
```

- Periksa status migrasi Prisma:

```bash
npm exec -w backend prisma migrate status
```

- Pastikan file environment telah dibuat: [backend/.env](backend/.env.example) dan [frontend/.env](frontend/.env.example).

---

## Bagian 2: Cara Menjalankan Aplikasi

### 1) Menjalankan Aplikasi dalam Mode Development

#### Menjalankan backend dan frontend secara bersamaan
Gunakan skrip root monorepo untuk menjalankan kedua workspace bersamaan via concurrently, sesuai definisi di [package.json](package.json:11).

```bash
npm run dev
```

Ekspektasi:
- Backend (NestJS) berjalan di http://localhost:3000 (prefix API: /api).
- Frontend (Vite + React) berjalan di http://localhost:5173 dan otomatis membuka browser (lihat konfigurasi server.open di [frontend/vite.config.ts](frontend/vite.config.ts:172-200)).
- Proxy frontend ke backend /api dikonfigurasi sesuai VITE_API_BASE_URL.

#### Menjalankan backend saja
Gunakan skrip workspace backend yang menjalankan NestJS dengan watch mode (lihat [backend/package.json](backend/package.json:6-8)):

```bash
# Opsi 1: dari root
npm run dev:backend

# Opsi 2: langsung di workspace backend
npm run -w backend start:dev
```

#### Menjalankan frontend saja
Gunakan skrip workspace frontend (lihat [frontend/package.json](frontend/package.json:39)):

```bash
# Opsi 1: dari root
npm run dev:frontend

# Opsi 2: langsung di workspace frontend
npm run -w frontend dev
```

#### Verifikasi aplikasi berjalan
- Buka URL frontend: http://localhost:5173
- Health check API: http://localhost:3000/api/health
- Verifikasi WebSocket:
  - Pastikan server WS di port 3001 sudah aktif (lihat variabel `WS_PORT` di backend .env).
  - Frontend terhubung ke namespace notifikasi dengan VITE_WS_URL (lihat [frontend/.env.example](frontend/.env.example) dan implementasi klien WS di [frontend/src/services/websocket/socket.manager.ts](frontend/src/services/websocket/socket.manager.ts)).

Catatan:
- Proxy development untuk API dan WebSocket dikonfigurasi di [frontend/vite.config.ts](frontend/vite.config.ts:172-200). Jika Anda mengubah VITE_API_BASE_URL atau VITE_WS_URL di frontend .env, proxy akan menyesuaikan origin target secara otomatis.

---

### 2) Perintah-Perintah Penting

#### Build aplikasi untuk produksi
Bangun kedua workspace sekaligus sesuai skrip root [package.json](package.json:14-16):

```bash
npm run build
```

Atau per workspace:
```bash
npm run build:backend
npm run build:frontend
```

#### Menjalankan aplikasi produksi
Setelah build, jalankan backend (Nest) dan frontend (Vite preview) secara bersamaan sesuai skrip [package.json](package.json:27-30):

```bash
npm run start:prod
```

Atau per workspace:
```bash
# Backend (HTTP API pada PORT yang ditentukan di .env)
npm run -w backend start

# Frontend (preview server di port default Vite preview)
npm run -w frontend preview
```

Pastikan environment:
- Backend: set `.env` berisi `PORT=3000`, `WS_PORT=3001`, `CORS_ORIGIN=http://localhost:5173` dan `DATABASE_URL` valid (lihat [backend/.env.example](backend/.env.example)).
- Frontend: set `.env` berisi `VITE_API_BASE_URL=http://localhost:3000/api` dan `VITE_WS_URL=http://localhost:3001` (lihat [frontend/.env.example](frontend/.env.example)).

#### Pemeriksaan tipe (typecheck)
Pemeriksaan TypeScript tanpa output build (lihat skrip [package.json](package.json:30), [backend/package.json](backend/package.json:17), [frontend/package.json](frontend/package.json:46)):

```bash
# Root (cek kedua workspace)
npm run typecheck

# Per workspace
npm run -w backend typecheck
npm run -w frontend typecheck
```

#### Linting dan formatting
Linting:
```bash
# Root: jalankan lint untuk backend dan frontend
npm run lint

# Perbaiki otomatis (root)
npm run lint:fix

# Per workspace
npm run -w backend lint
npm run -w frontend lint
npm run -w frontend lint:fix
```

Formatting (Prettier):
```bash
# Format semua file (root)
npm run format

# Hanya cek format (root)
npm run format:check
```

---

### 3) Troubleshooting Masalah Umum

#### Database connection failed
Gejala: Backend gagal start dengan error koneksi database atau Prisma.

Langkah perbaikan:
1. Verifikasi nilai `DATABASE_URL` di backend/.env (lihat contoh di [backend/.env.example](backend/.env.example)). Contoh:
   ```env
   DATABASE_URL=postgresql://bpm_user:123456789@localhost:5432/bebang_pack_meal?schema=public
   ```
2. Pastikan PostgreSQL aktif dan kredensial benar (user, password, database).
3. Validasi status migrasi Prisma:
   ```bash
   npm exec -w backend prisma migrate status
   ```
4. Jika client Prisma belum di-generate:
   ```bash
   npm exec -w backend prisma generate
   ```
5. Jika migrasi belum diterapkan (dev):
   ```bash
   npm exec -w backend prisma migrate dev --name init
   ```
6. Seed data (opsional untuk testing):
   ```bash
   npm exec -w backend prisma db seed
   ```
7. Jika skema berubah atau terjadi mismatch, reset (hati-hati: menghapus data):
   ```bash
   npm exec -w backend prisma migrate reset
   ```

#### Port conflicts
Gejala: Aplikasi gagal bind ke port (EADDRINUSE) 3000, 5173, atau 3001.

Langkah identifikasi:
- Windows (CMD):
  ```cmd
  netstat -ano | findstr :3000
  netstat -ano | findstr :5173
  netstat -ano | findstr :3001
  ```
  Matikan proses yang menggunakan port:
  ```cmd
  taskkill /PID <PID> /F
  ```

Solusi alternatif:
- Ubah port frontend di [frontend/vite.config.ts](frontend/vite.config.ts:172-176) (server.port).
- Ubah port backend di backend/.env (`PORT=3000`).
- Ubah port WebSocket backend di backend/.env (`WS_PORT=3001`).
- Sinkronkan `VITE_API_BASE_URL` dan `VITE_WS_URL` di frontend `.env` agar proxy dan klien WS mengikuti perubahan.

#### CORS errors
Gejala: Browser menolak request dengan pesan terkait `Access-Control-Allow-Origin`.

Penyebab umum:
- Nilai `CORS_ORIGIN` di backend `.env` tidak mencantumkan origin frontend (misal `http://localhost:5173`).
- Perubahan port/frontend URL tidak disesuaikan.

Langkah perbaikan:
1. Pastikan backend `.env` mengandung:
   ```env
   CORS_ORIGIN=http://localhost:5173
   ```
2. Restart backend setelah mengubah `.env`.
3. Pastikan proxy Vite mengarah ke origin API yang benar (lihat [frontend/vite.config.ts](frontend/vite.config.ts:176-185)).

Catatan: Konfigurasi CORS dipasang di bootstrap aplikasi (lihat [backend/src/main.ts](backend/src/main.ts)).

#### WebSocket connection issues
Gejala: Frontend gagal terhubung ke server notifikasi, tidak ada event real-time.

Langkah perbaikan:
1. Verifikasi `WS_PORT` di backend `.env` (default 3001) dan pastikan port tidak konflik.
2. Verifikasi `VITE_WS_URL` di frontend `.env`:
   ```env
   VITE_WS_URL=http://localhost:3001
   ```
3. Pastikan klien Socket.IO menggunakan transport WebSocket dan handshake JWT sesuai implementasi (lihat [frontend/src/services/websocket/socket.manager.ts](frontend/src/services/websocket/socket.manager.ts)).
4. Jika berjalan di jaringan berbeda, pastikan firewall/antivirus tidak memblokir port 3001.
5. Pastikan URL namespace backend benar: `http://localhost:3001/notifications` (adapter WS dedicated dipasang di bootstrap, lihat [backend/src/main.ts](backend/src/main.ts)).

#### TypeScript errors
Gejala: Build gagal atau dev server error terkait tipe.

Langkah perbaikan:
1. Jalankan pemeriksaan tipe:
   ```bash
   npm run typecheck
   ```
2. Perbaiki missing exports, unused imports/variables, dan ketidaksesuaian tipe sesuai laporan compiler.
3. Jalankan lint dan format untuk membantu konsistensi:
   ```bash
   npm run lint && npm run format
   ```

#### Prisma errors
Gejala: Error saat generate/migrate/akses database.

Langkah perbaikan:
1. Generate client:
   ```bash
   npm exec -w backend prisma generate
   ```
2. Migrate dev (menerapkan migrasi ke database pengembangan):
   ```bash
   npm exec -w backend prisma migrate dev --name init
   ```
3. Deploy migrasi ke produksi (jika environment production):
   ```bash
   npm exec -w backend prisma migrate deploy
   ```
4. Reset migrasi (menghapus data, gunakan hati-hati):
   ```bash
   npm exec -w backend prisma migrate reset
   ```
5. Seed data:
   ```bash
   npm exec -w backend prisma db seed
   ```
6. Periksa skema dan migrasi terkini di:
   - [backend/prisma/schema.prisma](backend/prisma/schema.prisma)
   - [backend/prisma/migrations/20251001083412_add_default_status_pesanan/migration.sql](backend/prisma/migrations/20251001083412_add_default_status_pesanan/migration.sql)

---

Dengan langkah-langkah di atas, Anda dapat menjalankan aplikasi dalam mode pengembangan dan produksi, serta menangani masalah umum yang mungkin muncul selama setup dan operasional. Pastikan untuk selalu menyelaraskan nilai-nilai di `.env` backend dan frontend, serta memverifikasi proxy dan WebSocket sesuai [frontend/vite.config.ts](frontend/vite.config.ts:172-200) dan bootstrap server di [backend/src/main.ts](backend/src/main.ts).

## Bagian 3: Kredensial Default dan Konfigurasi

### 1. Kredensial Default Pengguna

Tabel kredensial default untuk akun awal pengujian. Gunakan hanya pada environment pengembangan, lalu segera ganti password sesuai kebijakan keamanan.

| Role          | NIK (username) | Password    | Hak Akses Utama |
|---------------|-----------------|-------------|------------------|
| Administrator | ADM001          | admin123    | Akses penuh: manajemen pengguna, persetujuan, laporan, audit |
| Employee      | EMP001          | emp123      | Buat pesanan, lihat status pesanan milik sendiri |
| Dapur         | KIT001          | kitchen123  | Kelola antrian dapur, ubah status pesanan, ajukan penolakan/edit |
| Delivery      | DEL001          | delivery123 | Kelola pengiriman, ubah status pengantaran |
| Employee      | EMP002          | emp123      | Contoh akun tambahan untuk pengujian employee |

Penjelasan peran dan hak akses:
- Administrator: kontrol sistem, manajemen master data, pusat persetujuan, akses laporan dan audit.
- Employee: membuat pesanan dan memantau status pesanan yang berkaitan.
- Dapur: mengelola proses produksi, mengubah status pesanan, menginisiasi workflow approval (penolakan/edit).
- Delivery: mengelola distribusi dan status pengantaran.

Cara login pertama kali:
1) Jalankan aplikasi (lihat Bagian 2).
2) Buka http://localhost:5173.
3) Masukkan NIK (misal ADM001) dan password (misal admin123), lalu klik Login.
4) Setelah login, token akses diterbitkan oleh [AuthController.login()](backend/src/auth/auth.controller.ts:23) menggunakan layanan [AuthService.login()](backend/src/auth/auth.service.ts:129). Refresh token diset melalui cookie HTTP-only.

Contoh curl (opsional) untuk login:
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"nik":"ADM001","password":"admin123"}'
```

---

### 2. Environment Variables Penting

Semua variabel dikelola di backend [.env](backend/.env.example) dan frontend [.env](frontend/.env.example). Nilai default disediakan untuk pengembangan.

- Database configuration (backend):
  ```env
  # backend/.env
  DATABASE_URL=postgresql://postgres:123456789@localhost:5432/bebang_pack_meal?schema=public
  ```
  Skema, host, port, user, dan password harus disesuaikan dengan environment Anda. Lihat skema Prisma di [backend/prisma/schema.prisma](backend/prisma/schema.prisma).

- JWT secrets dan expiry (backend):
  ```env
  # backend/.env
  JWT_SECRET=supersecretjwt
  JWT_EXPIRES_IN=15m
  JWT_REFRESH_SECRET=supersecretrefresh
  JWT_REFRESH_EXPIRES_IN=7d
  ```
  Digunakan di [AuthService.generateTokens()](backend/src/auth/auth.service.ts:189). Ubah nilai default ke secret yang panjang dan acak untuk produksi.

- CORS configuration (backend):
  ```env
  # backend/.env
  CORS_ORIGIN=http://localhost:5173
  ```
  Dipakai saat bootstrap aplikasi untuk mengaktifkan CORS (lihat [backend/src/main.ts](backend/src/main.ts)).

- WebSocket configuration (backend + frontend):
  ```env
  # backend/.env
  WS_PORT=3001

  # frontend/.env
  VITE_WS_URL=http://localhost:3001
  ```
  Server WS dedicated dibinding di bootstrap (adapter Socket.IO), namespace: `/notifications`. Lihat [backend/src/websocket/websocket.gateway.ts](backend/src/websocket/websocket.gateway.ts) dan klien di [frontend/src/services/websocket/socket.manager.ts](frontend/src/services/websocket/socket.manager.ts).

---

### 3. Cara Mengubah Kredensial

Mengubah password user melalui UI (admin):
- Buka halaman manajemen pengguna di [frontend/src/pages/users/UsersManagementPage.tsx](frontend/src/pages/users/UsersManagementPage.tsx).
- Cari pengguna (berdasarkan NIK).
- Gunakan aksi Reset Password dari UI (jika tersedia) untuk mengeluarkan password sementara.
- Sistem akan memanggil endpoint [UsersController.resetPassword()](backend/src/users/users.controller.ts:77) yang mengeksekusi [UsersService.resetPassword()](backend/src/users/users.service.ts:235).

Reset password melalui API (administrator):
```bash
# Dapatkan ACCESS_TOKEN dengan login sebagai ADM001
ACCESS_TOKEN="<token_akses_admin>"

# Reset password user dengan id tertentu (contoh: id=5)
curl -X POST http://localhost:3000/api/users/5/reset-password \
  -H "Authorization: Bearer ${ACCESS_TOKEN}"
```
Respon mengembalikan `tempPassword` yang harus disampaikan ke pengguna untuk login awal, lalu wajib diganti (kebijakan di bawah).

Mengubah environment variables:
1) Edit file backend [.env](backend/.env.example) dan frontend [.env](frontend/.env.example) sesuai kebutuhan (DATABASE_URL, JWT_SECRET, CORS_ORIGIN, WS_PORT, VITE_API_BASE_URL, VITE_WS_URL).
2) Restart server setelah perubahan:
   ```bash
   # Jika dijalankan dari root
   npm run dev
   # atau jalankan ulang proses produksi
   npm run start:prod
   ```

Generate JWT secrets yang aman:
- Linux/macOS:
  ```bash
  openssl rand -base64 64
  ```
- Windows (PowerShell) atau lintas OS (Node.js):
  ```bash
  node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
  ```
Gunakan nilai berbeda untuk `JWT_SECRET` dan `JWT_REFRESH_SECRET`. Hindari nilai default seperti `supersecretjwt`.

---

### 4. Best Practices Keamanan

- Password policy:
  - Minimal 10–12 karakter, kombinasi huruf besar/kecil, angka, dan simbol.
  - Hindari penggunaan informasi pribadi atau pola berulang.
  - Wajib ganti password setelah reset (password sementara) pada login pertama.
- JWT secrets management:
  - Gunakan secret panjang dan acak; pisahkan secret access vs refresh.
  - Rotasi secret secara berkala; logout paksa sesi lama jika perlu.
  - Simpan secret via environment variables, bukan hard-coded di source code.
  - Validasi expiry: access pendek (mis. 15m), refresh lebih panjang (mis. 7d).
- Environment variables security:
  - Jangan commit file `.env` ke repository; gunakan `.env.example` sebagai template.
  - Pisahkan environment (development, staging, production) dengan nilai berbeda.
  - Pastikan `CORS_ORIGIN` hanya mengizinkan origin yang tepercaya.
- Regular password rotation:
  - Jadwalkan rotasi berkala (mis. 90 hari) untuk akun sensitif (administrator).
  - Audit perubahan password dengan [AuditTrailService](backend/src/common/services/audit-trail.service.ts).
  - Nonaktifkan akun yang tidak aktif, gunakan [UsersService.updateStatus()](backend/src/users/users.service.ts:151) melalui [UsersController.updateStatus()](backend/src/users/users.controller.ts:51).

Referensi teknis terkait autentikasi:
- Endpoint login: [AuthController.login()](backend/src/auth/auth.controller.ts:23)
- Refresh token: [AuthController.refresh()](backend/src/auth/auth.controller.ts:47), [AuthService.refreshTokens()](backend/src/auth/auth.service.ts:240)
- Pembuatan token: [AuthService.generateTokens()](backend/src/auth/auth.service.ts:189)
- Profil user terautentikasi: [AuthController.me()](backend/src/auth/auth.controller.ts:88), [AuthService.getUserProfile()](backend/src/auth/auth.service.ts:277)
- Guard & dekorator:
  - [JwtAuthGuard](backend/src/common/guards/jwt-auth.guard.ts)
  - [RolesGuard](backend/src/common/guards/roles.guard.ts)
  - [Public()](backend/src/common/decorators/public.decorator.ts)
  - [Roles(...)](backend/src/common/decorators/roles.decorator.ts)

## Bagian 4: Konfigurasi Server Lokal dengan IP Tertentu

### 1. Konfigurasi Backend untuk IP Tertentu

Untuk mengakses server dari device lain di jaringan lokal (Wi‑Fi/LAN), Anda perlu:
- Membind HTTP server ke alamat IP spesifik atau 0.0.0.0 (listen semua interface)
- Mengizinkan CORS untuk origin eksternal (mis. http://192.168.1.50:5173)
- Memastikan server WebSocket (Socket.IO) berjalan dan dapat diakses dari IP eksternal

#### a) Mengubah binding server dari localhost ke IP spesifik

Secara default, NestJS biasanya memanggil `app.listen(PORT)` yang bind ke semua interface. Untuk eksplisit mengikat ke IP tertentu (atau 0.0.0.0), ubah bootstrap di [backend/src/main.ts](backend/src/main.ts:1) seperti berikut:

```ts
// backend/src/main.ts (contoh potongan)
const PORT = Number(process.env.PORT ?? 3000);
// Gunakan HOST untuk binding spesifik. 0.0.0.0 = listen di semua interface (direkomendasikan untuk akses jaringan lokal)
const HOST = process.env.HOST ?? '0.0.0.0';

await app.listen(PORT, HOST);
console.log(`HTTP API listening on http://${HOST}:${PORT}/api`);
```

Tambahkan variabel opsional di backend `.env`:
```env
# backend/.env
HOST=0.0.0.0
PORT=3000
```

Catatan:
- `0.0.0.0` membuat server dapat diakses dari device lain via IP host (mis. http://192.168.1.50:3000).
- Jika ingin membatasi hanya ke IP tertentu, set `HOST` ke IP tersebut (mis. `HOST=192.168.1.50`).

#### b) Konfigurasi CORS untuk IP eksternal

CORS di-setup saat bootstrap (lihat [backend/src/main.ts](backend/src/main.ts:1)) dan sumber origin berasal dari `.env`. Parser CORS mendukung daftar origin yang dipisahkan koma. Tambahkan origin frontend berbasis IP:

```env
# backend/.env
CORS_ORIGIN=http://localhost:5173,http://192.168.1.50:5173
```

Ini mengizinkan request browser yang datang dari kedua origin tersebut. Pastikan Anda merestart backend setelah mengubah `.env`.

#### c) Konfigurasi WebSocket untuk IP eksternal

Server WebSocket berjalan di port `WS_PORT` (dedicated Socket.IO). Pastikan host binding server WS adalah `0.0.0.0` atau IP spesifik. Implementasi adapter WS sudah dipasang global (lihat dokumentasi dan bootstrap di [backend/src/main.ts](backend/src/main.ts:1), gateway di [backend/src/websocket/websocket.gateway.ts](backend/src/websocket/websocket.gateway.ts:36)).

Environment backend:
```env
# backend/.env
WS_PORT=3001
# (opsional) jika Anda menambahkan dukungan host khusus untuk WS adapter, gunakan:
# WS_HOST=0.0.0.0
```

Frontend klien Socket.IO akan terhubung ke namespace notifikasi:
- URL: `http://<IP_HOST>:3001/notifications`

#### d) Contoh konfigurasi environment variables (backend)

```env
# backend/.env
NODE_ENV=development
HOST=0.0.0.0
PORT=3000
DATABASE_URL=postgresql://postgres:123456789@localhost:5432/bebang_pack_meal?schema=public

JWT_SECRET=supersecretjwt
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=supersecretrefresh
JWT_REFRESH_EXPIRES_IN=7d

# Izinkan origin lokal & eksternal
CORS_ORIGIN=http://localhost:5173,http://192.168.1.50:5173

# WebSocket dedicated server
WS_PORT=3001
# WS_HOST=0.0.0.0   # jika diimplementasikan
```

Referensi:
- Template env backend: [backend/.env.example](backend/.env.example)
- Bootstrap & CORS: [backend/src/main.ts](backend/src/main.ts:1)
- WebSocket gateway: [backend/src/websocket/websocket.gateway.ts](backend/src/websocket/websocket.gateway.ts:36)

---

### 2. Konfigurasi Frontend untuk IP Tertentu

Agar frontend berbasis Vite dapat berkomunikasi ke backend/WS via IP, sesuaikan `.env` frontend dan (opsional) expose dev/preview server ke jaringan.

#### a) Mengubah API base URL

Edit [frontend/.env](frontend/.env.example) agar mengarah ke IP host backend:
```env
# frontend/.env
VITE_API_BASE_URL=http://192.168.1.50:3000/api
```

Vite proxy akan otomatis menyesuaikan target origin berdasarkan nilai ini (lihat parser di [frontend/vite.config.ts](frontend/vite.config.ts:1)).

#### b) Mengubah WebSocket URL

Edit [frontend/.env](frontend/.env.example):
```env
# frontend/.env
VITE_WS_URL=http://192.168.1.50:3001
```

Klien Socket.IO menggunakan URL ini saat handshake (lihat implementasi di [frontend/src/services/websocket/socket.manager.ts](frontend/src/services/websocket/socket.manager.ts:1)).

#### c) Konfigurasi Vite proxy untuk external IP

Konfigurasi proxy telah disiapkan untuk membaca `VITE_API_BASE_URL` dan `VITE_WS_URL` lalu menurunkan ke origin/path yang tepat:

- Parser URL dan derivasi origin/path: [frontend/vite.config.ts](frontend/vite.config.ts:1-26)
- Proxy API dan WS: [frontend/vite.config.ts](frontend/vite.config.ts:172-200)

Tidak perlu mengubah file `vite.config.ts`; cukup set `.env` seperti di atas.

Catatan dev server:
- Untuk mengekspose Vite dev server ke jaringan (device lain bisa akses), jalankan dengan host publik:
  ```bash
  # dari root (passing arg ke script)
  npm run dev:frontend -- --host 0.0.0.0
  # atau langsung di workspace
  npm run -w frontend dev -- --host 0.0.0.0
  ```
  Device lain dapat membuka: `http://192.168.1.50:5173`

#### d) Build frontend untuk akses jaringan

Produksi:
```bash
npm run build:frontend
# preview hasil build dan expose ke jaringan (port default Vite preview: 4173)
npm run -w frontend preview -- --host 0.0.0.0 --port 4173
```

Atau gunakan Nginx sebagai reverse proxy/serving static files; lihat contoh lengkap di [nginx.conf.example](nginx.conf.example:1).

---

### 3. Pengaturan Firewall

Server yang listen di 0.0.0.0 masih bisa terblokir oleh firewall OS. Buka port berikut: 3000 (HTTP API), 3001 (WebSocket), 5173 (Vite dev), 4173 (Vite preview, jika dipakai).

#### a) Membuka port di Windows Firewall (CMD/PowerShell)

```cmd
netsh advfirewall firewall add rule name="BPM-HTTP-3000"   dir=in action=allow protocol=TCP localport=3000
netsh advfirewall firewall add rule name="BPM-WS-3001"     dir=in action=allow protocol=TCP localport=3001
netsh advfirewall firewall add rule name="BPM-Vite-5173"   dir=in action=allow protocol=TCP localport=5173
netsh advfirewall firewall add rule name="BPM-Preview-4173" dir=in action=allow protocol=TCP localport=4173
```

Verifikasi port listening:
```cmd
netstat -ano | findstr :3000
netstat -ano | findstr :3001
netstat -ano | findstr :5173
netstat -ano | findstr :4173
```

#### b) Membuka port di Linux (ufw/iptables)

UFW:
```bash
sudo ufw allow 3000/tcp
sudo ufw allow 3001/tcp
sudo ufw allow 5173/tcp
sudo ufw allow 4173/tcp
sudo ufw status
```

iptables (persistensi tergantung distro):
```bash
sudo iptables -A INPUT -p tcp --dport 3000 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 3001 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 5173 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 4173 -j ACCEPT
sudo iptables -L -n
```

#### c) Membuka port di macOS

Gunakan System Settings → Network → Firewall untuk mengizinkan incoming connections untuk aplikasi Node/Vite, atau gunakan CLI (advanced):

```bash
# Tambahkan Node ke firewall app list dan unblock (path Node bisa berbeda)
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /usr/local/bin/node
```

Verifikasi port listening:
```bash
sudo lsof -iTCP -sTCP:LISTEN -n -P | grep -E "3000|3001|5173|4173"
```

#### d) Verifikasi koneksi dari client lain

- Windows:
  ```powershell
  Test-NetConnection -ComputerName 192.168.1.50 -Port 3000
  Test-NetConnection -ComputerName 192.168.1.50 -Port 3001
  ```
- Linux/macOS:
  ```bash
  nc -vz 192.168.1.50 3000
  nc -vz 192.168.1.50 3001
  ```

---

### 4. Konfigurasi Jaringan Lanjutan

#### a) Static IP configuration

Agar IP host tidak berubah:
- Windows: Control Panel → Network and Sharing Center → Change adapter settings → Properties → Internet Protocol Version 4 (TCP/IPv4) → Set IP/Mask/Gateway/DNS manual.
- Linux: Konfigurasi via `netplan` (Ubuntu) atau `ifcfg` (RHEL/CentOS) bergantung distro.
- macOS: System Settings → Network → pilih interface → Configure IPv4: Manually → isi IP/Mask/Gateway/DNS.

Pastikan IP statis berada dalam subnet yang benar dan tidak bentrok.

#### b) DNS lokal (opsional)

Agar URL ramah (mis. `http://bpm.local`):
- Edit file hosts di device klien:
  - Windows: `C:\Windows\System32\drivers\etc\hosts`
  - Linux/macOS: `/etc/hosts`
- Tambahkan:
  ```
  192.168.1.50 bpm.local
  ```
- Untuk HTTPS development di domain lokal, gunakan sertifikat lokal (lihat mkcert di bawah).

#### c) Reverse proxy dengan Nginx (opsional)

Gunakan Nginx untuk:
- Menyajikan build frontend
- Meneruskan API `/api` ke backend
- Meneruskan Socket.IO `/socket.io` ke server WS

Contoh konfigurasi sudah disediakan di [nginx.conf.example](nginx.conf.example:1). Sesuaikan:
- `server_name` ke domain/IP Anda (mis. `bpm.local`)
- `root` ke folder build frontend (`frontend/dist`)
- `proxy_pass` target ke IP/port backend/WS (bukan `localhost` jika berjalan di host berbeda)

#### d) SSL certificate untuk local network (opsional)

Gunakan mkcert untuk sertifikat development yang dipercaya oleh OS:
```bash
# Install mkcert (macOS via Homebrew, Windows via Chocolatey, Linux lihat repo mkcert)
brew install mkcert
mkcert -install
mkcert bpm.local
```

Hasil: file `bpm.local.pem` dan `bpm.local-key.pem`. Konfigurasikan di Nginx:
```nginx
# nginx.conf (contoh)
ssl_certificate /etc/ssl/local/bpm.local.pem;
ssl_certificate_key /etc/ssl/local/bpm.local-key.pem;
```

---

### 5. Testing Akses Jaringan

#### a) Verifikasi koneksi dari device lain

- Buka `http://192.168.1.50:5173` (dev) atau `http://192.168.1.50:4173` (preview) di browser device lain.
- Pastikan halaman login/dasbor tampil.

#### b) Testing API endpoints

Health check:
```bash
curl http://192.168.1.50:3000/api/health
```

Login (contoh):
```bash
curl -X POST http://192.168.1.50:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"nik":"ADM001","password":"admin123"}'
```

Pastikan respon JSON sesuai implementasi [AuthController.login()](backend/src/auth/auth.controller.ts:23).

#### c) Testing WebSocket connection

Konfirmasi dari browser devtools (Network → WS):
- Periksa koneksi ke `http://192.168.1.50:3001/notifications`
- Event `order:created`, `order:status-changed`, dll., dikirim dari gateway ([backend/src/websocket/websocket.gateway.ts](backend/src/websocket/websocket.gateway.ts:36)) dan ditangani di klien ([frontend/src/services/websocket/socket.manager.ts](frontend/src/services/websocket/socket.manager.ts:1)).

#### d) Troubleshooting koneksi jaringan

- Port tertutup:
  - Pastikan firewall sudah membuka port (lihat bagian 3).
  - Verifikasi proses benar‑benar listen di port: `netstat`/`lsof`.
- Salah origin/CORS:
  - Tambahkan IP origin frontend ke `CORS_ORIGIN` (lihat [backend/.env.example](backend/.env.example)) dan restart backend.
- Host binding tidak benar:
  - Pastikan `app.listen(PORT, HOST)` menggunakan `HOST=0.0.0.0` atau IP host (lihat [backend/src/main.ts](backend/src/main.ts:1)).
- Proxy Vite tidak sesuai:
  - Periksa `VITE_API_BASE_URL` dan `VITE_WS_URL` (lihat [frontend/.env.example](frontend/.env.example)). Proxy membaca nilai ini (lihat [frontend/vite.config.ts](frontend/vite.config.ts:172-200)).
- NAT/Wi‑Fi isolation:
  - Beberapa router mengaktifkan AP isolation; device klien tidak bisa mengakses host. Nonaktifkan fitur tersebut atau gunakan jaringan yang sama tanpa isolasi.
- Sertifikat/HTTPS lokal:
  - Untuk HTTPS di jaringan lokal, gunakan sertifikat development via mkcert sesuai panduan di Bagian 4.d dan konfigurasi Nginx sebagaimana contoh di [nginx.conf.example](nginx.conf.example:1).

Dengan langkah di atas, server dan klien dapat berkomunikasi di jaringan lokal menggunakan IP spesifik. Selalu sinkronkan konfigurasi `.env` backend &amp; frontend, verifikasi proxy di [frontend/vite.config.ts](frontend/vite.config.ts:172-200), dan bootstrap server di [backend/src/main.ts](backend/src/main.ts:1).
---
## Bagian 5: Backup, Restore, dan Pemindahan Server

Catatan: Bagian 5 sebelumnya berisi konfigurasi jaringan. Di bawah ini adalah panduan khusus untuk backup, restore, dan pemindahan server sesuai permintaan.

### 1. Backup Data Aplikasi

Berikut cakupan backup yang wajib diambil: database PostgreSQL, file konfigurasi (.env), dan source code aplikasi. Sertakan juga skrip otomatis untuk menjadwalkan backup reguler.

- Backup database PostgreSQL
  - Format rekomendasi: custom (-Fc) agar mudah di-restore selektif, serta plain SQL untuk audit.
  - Contoh (Linux/macOS):
    ```bash
    # Custom format (direkomendasikan)
    pg_dump -U postgres -h localhost -p 5432 -F c -d bebang_pack_meal -f /backups/bpm-db_$(date +%F_%H%M%S).dump

    # Plain SQL (opsional)
    pg_dump -U postgres -h localhost -p 5432 -F p -d bebang_pack_meal > /backups/bpm-db_$(date +%F_%H%M%S).sql
    ```
  - Contoh (Windows CMD/Powershell):
    ```cmd
    "C:\Program Files\PostgreSQL\14\bin\pg_dump.exe" -U postgres -h localhost -p 5432 -F c -d bebang_pack_meal -f "D:\backups\bpm-db_%DATE:~10,4%-%DATE:~4,2%-%DATE:~7,2%_%TIME:~0,2%%TIME:~3,2%%TIME:~6,2%.dump"
    ```
  - Referensi skema: [schema.prisma](backend/prisma/schema.prisma)

- Backup file konfigurasi (.env files)
  - Lokasi file:
    - Backend: [backend/.env.example](backend/.env.example) dan file actual backend/.env (jangan commit ke repo)
    - Frontend: [frontend/.env.example](frontend/.env.example) dan file actual frontend/.env
  - Contoh backup:
    ```bash
    mkdir -p /backups/env
    cp backend/.env /backups/env/backend.env.$(date +%F_%H%M%S)
    cp frontend/.env /backups/env/frontend.env.$(date +%F_%H%M%S)
    ```
  - Pastikan menyertakan dokumentasi versi environment (development/production) dan rujukan ke variabel penting:
    - Backend: DATABASE_URL, JWT_SECRET, JWT_REFRESH_SECRET, CORS_ORIGIN, PORT, WS_PORT
    - Frontend: VITE_API_BASE_URL, VITE_WS_URL

- Backup source code aplikasi
  - Jika menggunakan Git: pastikan remote telah di-push (origin/main).
    ```bash
    git status
    git add .
    git commit -m "chore: pre-backup snapshot"
    git push origin main
    ```
  - Arsip file (tanpa node_modules):
    ```bash
    tar --exclude='node_modules' -czf /backups/bpm-src_$(date +%F_%H%M%S).tar.gz .
    ```
  - Windows (robocopy ke direktori backup):
    ```cmd
    robocopy c:\project-it\portal-pack-meal D:\backups\portal-pack-meal_src /MIR /XD node_modules .git
    ```

- Script backup otomatis
  - Bash (Linux/macOS) — simpan sebagai /usr/local/bin/bpm-backup.sh dan beri executable:
    ```bash
    #!/usr/bin/env bash
    set -euo pipefail

    BACKUP_ROOT="/backups/portal-pack-meal"
    TS="$(date +%F_%H%M%S)"
    mkdir -p "${BACKUP_ROOT}/db" "${BACKUP_ROOT}/env" "${BACKUP_ROOT}/src"

    # DB (custom dump)
    pg_dump -U postgres -h localhost -p 5432 -F c -d bebang_pack_meal -f "${BACKUP_ROOT}/db/bpm-db_${TS}.dump"

    # ENV
    cp backend/.env "${BACKUP_ROOT}/env/backend_${TS}.env"
    cp frontend/.env "${BACKUP_ROOT}/env/frontend_${TS}.env"

    # SRC (archive without node_modules and .git)
    tar --exclude='node_modules' --exclude='.git' -czf "${BACKUP_ROOT}/src/bpm-src_${TS}.tar.gz" .

    echo "Backup selesai: ${TS}"
    ```
    Jadwalkan dengan cron (harian pukul 02:00):
    ```bash
    crontab -e
    # Tambahkan:
    0 2 * * * /usr/local/bin/bpm-backup.sh >> /var/log/bpm-backup.log 2>&1
    ```
  - PowerShell (Windows) — simpan sebagai C:\Scripts\bpm-backup.ps1:
    ```powershell
    $backupRoot = "D:\backups\portal-pack-meal"
    $ts = Get-Date -Format "yyyyMMdd_HHmmss"
    New-Item -ItemType Directory -Force -Path "$backupRoot\db","$backupRoot\env","$backupRoot\src" | Out-Null

    # DB backup (custom dump)
    & "C:\Program Files\PostgreSQL\14\bin\pg_dump.exe" -U postgres -h localhost -p 5432 -F c -d bebang_pack_meal -f "$backupRoot\db\bpm-db_$ts.dump"

    # ENV
    Copy-Item -Path "backend\.env" -Destination "$backupRoot\env\backend_$ts.env" -Force
    Copy-Item -Path "frontend\.env" -Destination "$backupRoot\env\frontend_$ts.env" -Force

    # SRC (robocopy without node_modules and .git)
    robocopy "C:\project-it\portal-pack-meal" "$backupRoot\src\portal-pack-meal_$ts" /MIR /XD node_modules .git

    Write-Host "Backup selesai: $ts"
    ```
    Jadwalkan via Task Scheduler: buat Basic Task harian 02:00, Action: Start a program, Program/script: powershell.exe, Arguments: `-ExecutionPolicy Bypass -File "C:\Scripts\bpm-backup.ps1"`

### 2. Restore Data Aplikasi

- Restore database PostgreSQL
  - Dari custom dump (.dump):
    ```bash
    # Buat DB jika belum ada
    createdb bebang_pack_meal

    # Restore
    pg_restore -U postgres -h localhost -p 5432 -d bebang_pack_meal -c /backups/bpm-db_YYYY-MM-DD_HHMMSS.dump
    ```
  - Dari plain SQL:
    ```bash
    psql -U postgres -h localhost -p 5432 -d bebang_pack_meal -f /backups/bpm-db_YYYY-MM-DD_HHMMSS.sql
    ```

- Restore file konfigurasi
  ```bash
  cp /backups/env/backend.env.YYYY-MM-DD_HHMMSS backend/.env
  cp /backups/env/frontend.env.YYYY-MM-DD_HHMMSS frontend/.env
  ```
  Verifikasi nilai penting sesuai environment baru:
  - Backend: DATABASE_URL, JWT_SECRET/REFRESH, CORS_ORIGIN, PORT, WS_PORT
  - Frontend: VITE_API_BASE_URL, VITE_WS_URL
  Referensi template: [backend/.env.example](backend/.env.example), [frontend/.env.example](frontend/.env.example)

- Verifikasi restore berhasil
  ```bash
  # Type-check keduanya
  npm exec -w backend tsc --noemit
  npm exec -w frontend tsc --noemit

  # Status migrasi prisma (sesuaikan DB target)
  npm exec -w backend prisma migrate status

  # Jalankan aplikasi dev untuk smoke test
  npm run dev
  ```
  Health check API: `curl http://localhost:3000/api/health`

- Troubleshooting restore
  - Error koneksi DB: validasi DATABASE_URL di backend `.env`, pastikan DB dan kredensial ada.
  - Error Prisma: regenerasi client/migrasi:
    ```bash
    npm exec -w backend prisma generate
    npm exec -w backend prisma migrate deploy
    ```
  - Ketidakcocokan skema: bandingkan dengan [schema.prisma](backend/prisma/schema.prisma) dan migrasi terakhir, mis. [20251001083412_add_default_status_pesanan](backend/prisma/migrations/20251001083412_add_default_status_pesanan/migration.sql)

### 3. Pemindahan Server

- Persiapan server baru
  - Instal Node.js (>=18), npm (>=9), Git, PostgreSQL (>=14), Nginx (opsional).
  - Buka port: 3000 (HTTP API), 3001 (WebSocket), 5173/4173 (dev/preview).
  - Buat database dan user:
    ```bash
    sudo -u postgres psql -c "CREATE DATABASE bebang_pack_meal;"
    sudo -u postgres psql -c "CREATE USER bpm_user WITH PASSWORD 'STRONG_PASSWORD';"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE bebang_pack_meal TO bpm_user;"
    ```

- Instalasi prasyarat di server baru
  ```bash
  git clone <REPO_URL>
  cd portal-pack-meal
  npm run install:all
  cp backend/.env.example backend/.env
  cp frontend/.env.example frontend/.env
  ```

- Transfer source code dan konfigurasi
  - Opsi Git (disarankan): pastikan commit dan push dari server lama, lalu pull di server baru.
  - Opsi rsync (antar Linux):
    ```bash
    rsync -avz --exclude=node_modules --exclude=.git user@old-host:/path/portal-pack-meal/ /srv/portal-pack-meal/
    ```
  - Windows → Linux: gunakan `robocopy` di Windows dan SMB/SFTP untuk transfer.

- Transfer database
  - Ekspor dari server lama:
    ```bash
    pg_dump -U postgres -h old-host -F c -d bebang_pack_meal -f /tmp/bpm-db.dump
    ```
  - Impor ke server baru:
    ```bash
    scp user@old-host:/tmp/bpm-db.dump /tmp/
    createdb bebang_pack_meal
    pg_restore -U postgres -h localhost -d bebang_pack_meal -c /tmp/bpm-db.dump
    ```
  - Terapkan migrasi sesuai versi code:
    ```bash
    npm exec -w backend prisma migrate deploy
    ```

- Konfigurasi ulang environment variables
  - Backend [backend/.env.example](backend/.env.example):
    ```env
    HOST=0.0.0.0
    PORT=3000
    DATABASE_URL=postgresql://bpm_user:STRONG_PASSWORD@localhost:5432/bebang_pack_meal?schema=public
    JWT_SECRET=<generate_new_secure_secret>
    JWT_REFRESH_SECRET=<generate_new_secure_refresh_secret>
    CORS_ORIGIN=http://<FRONTEND_HOST>:5173
    WS_PORT=3001
    ```
  - Frontend [frontend/.env.example](frontend/.env.example):
    ```env
    VITE_API_BASE_URL=http://<BACKEND_HOST>:3000/api
    VITE_WS_URL=http://<BACKEND_HOST>:3001
    ```
  - Generate secret:
    ```bash
    openssl rand -base64 64
    # atau:
    node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
    ```

### 4. Validasi Setelah Pemindahan

- Testing koneksi database
  ```bash
  npm exec -w backend prisma migrate status
  psql -U bpm_user -h localhost -d bebang_pack_meal -c "\dt"
  ```

- Testing API endpoints
  ```bash
  curl http://<BACKEND_HOST>:3000/api/health
  curl -X POST http://<BACKEND_HOST>:3000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"nik":"ADM001","password":"admin123"}'
  ```

- Testing frontend
  ```bash
  npm run -w frontend preview -- --host 0.0.0.0 --port 4173
  # buka http://<FRONTEND_HOST>:4173
  ```

- Testing WebSocket connection
  - Namespace: `http://<BACKEND_HOST>:3001/notifications`
  - Pastikan klien mengikuti [socket.manager.ts](frontend/src/services/websocket/socket.manager.ts:1) dan gateway berjalan [websocket.gateway.ts](backend/src/websocket/websocket.gateway.ts:36)

- Testing fitur lengkap aplikasi (E2E)
  - Gunakan Playwright:
    ```bash
    npx playwright test
    ```
    Konfigurasi: [playwright.config.ts](playwright.config.ts:1), contoh spesifikasi: [tests/e2e/admin-workflow.spec.ts](tests/e2e/admin-workflow.spec.ts:1), [tests/e2e/auth.spec.ts](tests/e2e/auth.spec.ts:1), [tests/e2e/dapur-workflow.spec.ts](tests/e2e/dapur-workflow.spec.ts:1), [tests/e2e/delivery-workflow.spec.ts](tests/e2e/delivery-workflow.spec.ts:1)

### 5. Maintenance dan Monitoring

- Schedule backup reguler
  - Cron harian (02:00): lihat skrip di atas.
  - Windows Task Scheduler: set task untuk menjalankan PowerShell backup.

- Monitoring kesehatan server
  - PM2 (opsional) menggunakan [ecosystem.config.js](backend/ecosystem.config.js:1):
    ```bash
    # install pm2 jika belum
    npm i -g pm2
    # start backend via ecosystem file (sesuaikan konfigurasi)
    pm2 start backend/ecosystem.config.js
    pm2 status
    pm2 logs
    ```
  - Health check API: `curl http://<BACKEND_HOST>:3000/api/health`

- Log management
  - PM2 logs: `pm2 logs`
  - Aplikasi backend (Nest) mencetak bootstrap & error ke stdout/stderr; integrasikan dengan journald atau file log harian.
  - Nginx (opsional): /var/log/nginx/access.log dan error.log, sesuaikan [nginx.conf.example](nginx.conf.example:1)

- Update aplikasi
  ```bash
  # Ambil perubahan kode
  git pull origin main

  # Pasang dependencies
  npm run install:all

  # Terapkan migrasi DB
  npm exec -w backend prisma migrate deploy

  # Build dan jalankan produksi
  npm run build
  npm run start:prod
  ```
  - Sinkronkan perubahan environment apabila ada penyesuaian pada [frontend/vite.config.ts](frontend/vite.config.ts:1) (proxy/PWA) atau [backend/src/main.ts](backend/src/main.ts:1) (CORS/adapter WS).
  - Jika PWA aktif, rekomendasikan clear cache pada klien setelah update besar.

Dengan panduan ini, proses backup, restore, dan pemindahan server untuk Bebang Pack Meal Portal dapat dilakukan secara aman dan terstandar. Selalu verifikasi health check, koneksi WebSocket, dan jalankan suite E2E untuk memastikan kualitas setelah setiap operasi besar.
## Bagian 6: FAQ (Frequently Asked Questions)

### 1) Apa saja prasyarat minimum untuk menjalankan aplikasi?
- Sistem Operasi: Windows 10, macOS, atau Linux
- Node.js &gt;= 18, npm &gt;= 9
- PostgreSQL 14+
- Port yang tersedia: 3000 (HTTP API), 3001 (WebSocket), 5173 (Vite dev), 4173 (Vite preview)
- Editor disarankan: Visual Studio Code
- Lihat prasyarat detail pada bagian instalasi dan referensi konfigurasi di [backend/.env.example](backend/.env.example) dan [frontend/.env.example](frontend/.env.example). CORS dan WS adapter dipasang di [main.ts](backend/src/main.ts:1) dan gateway di [websocket.gateway.ts](backend/src/websocket/websocket.gateway.ts:36).

### 2) Bagaimana cara mengubah port default aplikasi?
- Backend: set `PORT` di [backend/.env](backend/.env.example) (default 3000). Binding host dapat diatur melalui `HOST`. Implementasi listen berada di [main.ts](backend/src/main.ts:1).
- WebSocket backend: set `WS_PORT` di [backend/.env](backend/.env.example) (default 3001). Namespace notifikasi: `/notifications` di [websocket.gateway.ts](backend/src/websocket/websocket.gateway.ts:36).
- Frontend dev: ubah port di konfigurasi Vite server pada [vite.config.ts](frontend/vite.config.ts:172-176).
- Frontend koneksi API/WS: sesuaikan `VITE_API_BASE_URL` dan `VITE_WS_URL` di [frontend/.env](frontend/.env.example).
- Setelah mengubah nilai `.env`, restart proses dev/produksi:
  ```bash
  npm run dev
  # atau
  npm run start:prod
  ```

### 3) Kenapa aplikasi tidak bisa diakses dari device lain di jaringan?
- Pastikan backend listen ke `HOST=0.0.0.0` (atau IP spesifik) di [backend/.env](backend/.env.example) dan panggilan listen di [main.ts](backend/src/main.ts:1) menggunakan host tersebut.
- Tambahkan origin frontend berbasis IP pada `CORS_ORIGIN` di [backend/.env](backend/.env.example).
- Expose Vite dev/preview ke jaringan: `--host 0.0.0.0` (lihat [vite.config.ts](frontend/vite.config.ts:172-200)).
- Pastikan firewall OS membuka port yang diperlukan (lihat panduan firewall di Bagian 4).
- Sesuaikan `VITE_API_BASE_URL` dan `VITE_WS_URL` dengan IP host.

### 4) Bagaimana cara reset password administrator?
- Melalui UI (Admin): gunakan halaman manajemen pengguna [UsersManagementPage.tsx](frontend/src/pages/users/UsersManagementPage.tsx:1).
- Melalui API:
  ```bash
  ACCESS_TOKEN="<token_admin>"
  curl -X POST http://localhost:3000/api/users/<USER_ID>/reset-password \
    -H "Authorization: Bearer ${ACCESS_TOKEN}"
  ```
  Endpoint controller berada di [UsersController.resetPassword()](backend/src/users/users.controller.ts:77) yang memanggil [UsersService.resetPassword()](backend/src/users/users.service.ts:197). Password sementara (tempPassword) wajib diganti saat login pertama.

### 5) Apa yang harus dilakukan jika database connection failed?
- Verifikasi `DATABASE_URL` di [backend/.env](backend/.env.example) sesuai kredensial lokal/produksi.
- Pastikan PostgreSQL aktif (service berjalan, user/password benar).
- Periksa status migrasi dan generate Prisma client:
  ```bash
  npm exec -w backend prisma migrate status
  npm exec -w backend prisma generate
  ```
- Terapkan migrasi untuk dev/produksi:
  ```bash
  npm exec -w backend prisma migrate dev --name init
  # atau
  npm exec -w backend prisma migrate deploy
  ```
- Lihat skema di [schema.prisma](backend/prisma/schema.prisma:1) dan migrasi terbaru (contoh: [20251001083412_add_default_status_pesanan](backend/prisma/migrations/20251001083412_add_default_status_pesanan/migration.sql:1)).

### 6) Bagaimana cara update aplikasi ke versi terbaru?
```bash
git pull origin main
npm run install:all
npm exec -w backend prisma migrate deploy
npm run build
npm run start:prod
```
- Sinkronkan perubahan environment apabila ada penyesuaian pada [vite.config.ts](frontend/vite.config.ts:1) (proxy/PWA) atau [main.ts](backend/src/main.ts:1) (CORS/adapter WS).
- Jika PWA aktif, rekomendasikan clear cache pada klien setelah update besar.

### 7) Bisakah aplikasi dijalankan tanpa internet?
- Ya, selama semua komponen berjalan lokal:
  - Backend (NestJS) dan database PostgreSQL lokal
  - Frontend dev/preview berjalan lokal
  - WebSocket lokal (`WS_PORT` lokal)
- PWA menyediakan offline shell untuk navigasi tertentu (perbaikan loop offline ada di [vite.config.ts](frontend/vite.config.ts:88-107)). Namun operasi yang membutuhkan API/DB tetap memerlukan koneksi ke backend lokal.

### 8) Bagaimana cara menambah user baru?
- Melalui UI: gunakan halaman admin [UsersManagementPage.tsx](frontend/src/pages/users/UsersManagementPage.tsx:1).
- Melalui API (contoh):
  ```bash
  ACCESS_TOKEN="<token_admin>"
  curl -X POST http://localhost:3000/api/users \
    -H "Authorization: Bearer ${ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d '{"nik":"EMP003","username":"emp003","role":"employee","departmentId":1}'
  ```
  Operasi pembuatan user di service: [UsersService.createUser()](backend/src/users/users.service.ts:24).

### 9) Apa perbedaan antara mode development dan production?
- Development:
  - Hot reload, logging lebih verbose
  - Vite dev server di 5173, proxy otomatis berdasarkan `.env`
  - Tidak ada minification full, sourcemaps aktif
- Production:
  - Build teroptimasi (tree-shaking, minification)
  - Service worker PWA aktif (offline support, cache)
  - Jalankan backend via `npm run -w backend start`, frontend via `npm run -w frontend preview`
- Konfigurasi Vite/PWA: [vite.config.ts](frontend/vite.config.ts:1). Bootstrap backend (CORS, WS adapter): [main.ts](backend/src/main.ts:1).

### 10) Bagaimana cara troubleshooting WebSocket yang tidak terhubung?
- Verifikasi `WS_PORT` di [backend/.env](backend/.env.example) dan `VITE_WS_URL` di [frontend/.env](frontend/.env.example).
- Pastikan namespace yang dipakai: `http://<HOST>:3001/notifications` (lihat [websocket.gateway.ts](backend/src/websocket/websocket.gateway.ts:36)).
- Periksa firewall untuk port 3001.
- Pastikan klien Socket.IO menggunakan transport WebSocket dan handshake JWT sesuai [socket.manager.ts](frontend/src/services/websocket/socket.manager.ts:1).
- Jika lintas jaringan, nonaktifkan AP isolation di router.

---

## Bagian 7: Contoh Konfigurasi

### 1) Contoh lengkap backend/.env (Development)
```env
# backend/.env — DEVELOPMENT
NODE_ENV=development
HOST=0.0.0.0
PORT=3000

DATABASE_URL=postgresql://postgres:123456789@localhost:5432/bebang_pack_meal?schema=public

JWT_SECRET=supersecretjwt
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=supersecretrefresh
JWT_REFRESH_EXPIRES_IN=7d

# Izinkan origin lokal & eksternal (contoh IP frontend dev)
CORS_ORIGIN=http://localhost:5173,http://192.168.1.50:5173

# WebSocket dedicated server
WS_PORT=3001
```
Referensi bootstrap/CORS/WS adapter: [main.ts](backend/src/main.ts:1), gateway: [websocket.gateway.ts](backend/src/websocket/websocket.gateway.ts:36).

### 2) Contoh lengkap backend/.env (Production)
```env
# backend/.env — PRODUCTION
NODE_ENV=production
HOST=0.0.0.0
PORT=3000

# Gunakan kredensial kuat dan SSL jika perlu
DATABASE_URL=postgresql://bpm_user:STRONG_PASSWORD@db-host:5432/bebang_pack_meal?schema=public

# Generate secrets unik dan panjang
JWT_SECRET=<generate_secure_secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<generate_secure_refresh_secret>
JWT_REFRESH_EXPIRES_IN=7d

# Batasi hanya origin yang tepercaya (domain produksi)
CORS_ORIGIN=https://portal.bebang.co.id

WS_PORT=3001
```

### 3) Contoh lengkap frontend/.env (Development)
```env
# frontend/.env — DEVELOPMENT
VITE_API_BASE_URL=http://localhost:3000/api
VITE_WS_URL=http://localhost:3001

VITE_APP_NAME=Bebang Pack Meal Portal
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=development
```
Proxy dev akan mengikuti nilai ini (lihat [vite.config.ts](frontend/vite.config.ts:172-200)).

### 4) Contoh lengkap frontend/.env (Production)
```env
# frontend/.env — PRODUCTION
VITE_API_BASE_URL=https://portal.bebang.co.id/api
VITE_WS_URL=wss://portal.bebang.co.id

VITE_APP_NAME=Bebang Pack Meal Portal
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=production
```

### 5) Contoh konfigurasi Nginx reverse proxy
Gunakan sebagai acuan atau sesuaikan dari file contoh [nginx.conf.example](nginx.conf.example:1):
```nginx
# /etc/nginx/sites-available/portal-pack-meal.conf
server {
  listen 80;
  server_name portal.bebang.co.id;

  # Frontend build (Vite)
  root /var/www/portal-pack-meal/frontend/dist;
  index index.html;

  # Serve SPA
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Proxy API ke backend NestJS
  location /api/ {
    proxy_pass http://127.0.0.1:3000/api/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_http_version 1.1;
  }

  # Proxy Socket.IO (WebSocket) ke dedicated server
  location /socket.io/ {
    proxy_pass http://127.0.0.1:3001/socket.io/;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_http_version 1.1;
  }

  # Static cache opsional
  location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico)$ {
    expires 7d;
    add_header Cache-Control "public, max-age=604800";
  }
}
```

### 6) Contoh konfigurasi PM2 untuk production
Gunakan ecosystem file yang telah tersedia di repo: [ecosystem.config.js](backend/ecosystem.config.js:1)
```bash
# Install PM2 jika belum
npm i -g pm2

# Start backend via ecosystem file
pm2 start backend/ecosystem.config.js

# Cek status & logs
pm2 status
pm2 logs
```
Contoh minimal `ecosystem.config.js`:
```js
module.exports = {
  apps: [
    {
      name: "bpm-backend",
      script: "dist/main.js",
      cwd: "./backend",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production"
      }
    }
  ]
};
```

### 7) Contoh script backup otomatis
Linux/macOS (cron):
```bash
#!/usr/bin/env bash
set -euo pipefail

BACKUP_ROOT="/backups/portal-pack-meal"
TS="$(date +%F_%H%M%S)"
mkdir -p "${BACKUP_ROOT}/db" "${BACKUP_ROOT}/env" "${BACKUP_ROOT}/src"

# DB (custom dump)
pg_dump -U postgres -h localhost -p 5432 -F c -d bebang_pack_meal -f "${BACKUP_ROOT}/db/bpm-db_${TS}.dump"

# ENV
cp backend/.env "${BACKUP_ROOT}/env/backend_${TS}.env"
cp frontend/.env "${BACKUP_ROOT}/env/frontend_${TS}.env"

# SRC (archive tanpa node_modules dan .git)
tar --exclude='node_modules' --exclude='.git' -czf "${BACKUP_ROOT}/src/bpm-src_${TS}.tar.gz" .

echo "Backup selesai: ${TS}"
```
Jadwalkan:
```bash
crontab -e
# Tambahkan:
0 2 * * * /usr/local/bin/bpm-backup.sh >> /var/log/bpm-backup.log 2>&1
```
Windows (Task Scheduler, PowerShell):
```powershell
$backupRoot = "D:\backups\portal-pack-meal"
$ts = Get-Date -Format "yyyyMMdd_HHmmss"
New-Item -ItemType Directory -Force -Path "$backupRoot\db","$backupRoot\env","$backupRoot\src" | Out-Null

& "C:\Program Files\PostgreSQL\14\bin\pg_dump.exe" -U postgres -h localhost -p 5432 -F c -d bebang_pack_meal -f "$backupRoot\db\bpm-db_$ts.dump"
Copy-Item -Path "backend\.env" -Destination "$backupRoot\env\backend_$ts.env" -Force
Copy-Item -Path "frontend\.env" -Destination "$backupRoot\env\frontend_$ts.env" -Force
robocopy "C:\project-it\portal-pack-meal" "$backupRoot\src\portal-pack-meal_$ts" /MIR /XD node_modules .git
```
Jadwalkan via Task Scheduler: Action program `powershell.exe`, Arguments `-ExecutionPolicy Bypass -File "C:\Scripts\bpm-backup.ps1"`.

---

## Bagian 8: Tambahan

### 1) Screenshot ilustratif (deskripsi teks)
- Login Page: Form sederhana dengan input NIK dan password, tombol Login. Header menampilkan nama aplikasi. Indikator error saat kredensial salah.
- Admin Dashboard: Kartu ringkasan metrik (jumlah pesanan, pending approvals, status dapur), tabel daftar terbaru, quick-links ke [ApprovalCenterPage.tsx](frontend/src/pages/approvals/ApprovalCenterPage.tsx:1) dan [ReportsPage.tsx](frontend/src/pages/reports/ReportsPage.tsx:1).
- Dapur Kanban: Board drag-and-drop dengan kolom “MENUNGGU”, “DIPROSES”, “SIAP”, menggunakan DnD library. Notifikasi real-time via toast dari [useNotifications.ts](frontend/src/hooks/useNotifications.ts:1).
- Delivery List (mobile-first): Daftar pesanan siap antar, tombol aksi besar untuk update status, koneksi real-time ke WS.

### 2) Link ke dokumentasi terkait
- Panduan Deploy: [DEPLOYMENT.md](DEPLOYMENT.md:1)
- Ringkasan Proyek: [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md:1)
- README Root: [README.md](README.md:1)
- Backend README: [backend/README.md](backend/README.md:1)
- Frontend README: [frontend/README.md](frontend/README.md:1)
- Konfigurasi Vite &amp; PWA: [frontend/vite.config.ts](frontend/vite.config.ts:1)
- Bootstrap &amp; CORS &amp; WS Adapter: [backend/src/main.ts](backend/src/main.ts:1)

### 3) Kontak support (jika ada)
- Saat ini belum tersedia kanal support resmi publik.
- Untuk bantuan internal:
  - Buat issue di repository dan sertakan log/error terkait.
  - Lampirkan environment (`backend/.env`, `frontend/.env`) tanpa secrets sensitif.
  - Sertakan hasil health check: `curl http://<BACKEND_HOST>:3000/api/health`.
---
## Penutup

Ringkasan singkat:
- Tutorial ini mencakup instalasi, cara menjalankan aplikasi, kredensial dan konfigurasi, pengaturan akses jaringan lokal (IP spesifik), backup/restore/pemindahan server, FAQ, contoh konfigurasi, serta informasi tambahan.
- Pastikan nilai environment backend dan frontend selalu sinkron, port tidak konflik, serta proxy dan WebSocket terkonfigurasi dengan benar.
- Verifikasi kesehatan sistem secara berkala melalui health check API dan suite E2E untuk mencegah regresi.

Rekomendasi operasional:
- Sebelum produksi, lakukan type-check keduanya: [`npm run typecheck`](package.json:30) lalu build: [`npm run build`](package.json:14-16) dan jalankan produksi: [`npm run start:prod`](package.json:27-30).
- Kelola rahasia (JWT secrets) secara aman dan rotasi secara berkala; jangan commit file `.env` ke repository.
- Setelah pembaruan besar (build baru atau perubahan konfigurasi PWA), anjurkan clear cache pada klien agar perubahan segera terlihat.

Informasi tambahan:
- Panduan deploy lengkap: [`DEPLOYMENT.md`](DEPLOYMENT.md:1)
- Ringkasan proyek: [`PROJECT_OVERVIEW.md`](PROJECT_OVERVIEW.md:1)
- Backend bootstrap, CORS, dan WS adapter: [`backend/src/main.ts`](backend/src/main.ts:1)
- Konfigurasi Vite, proxy, dan PWA: [`frontend/vite.config.ts`](frontend/vite.config.ts:1)
- Contoh dan konfigurasi E2E: [`playwright.config.ts`](playwright.config.ts:1) dan spesifikasi di `tests/e2e/`

Tanda tangan:
— Tim Kilo Code • Bebang Pack Meal Portal