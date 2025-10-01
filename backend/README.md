# Bebang Pack Meal Backend (NestJS)

Backend aplikasi Bebang Pack Meal dibangun menggunakan NestJS (TypeScript) dengan integrasi Prisma untuk pengelolaan database PostgreSQL, JWT untuk otentikasi, dan WebSockets untuk komunikasi realtime. Dokumen ini menjelaskan setup, konfigurasi, cara menjalankan, dan praktik terbaik yang digunakan.

## Prasyarat

- Node.js v18+ (disarankan v18 atau v20)
- npm, yarn, atau pnpm
- PostgreSQL v14+ berjalan lokal atau remote
- Port yang tersedia:
  - HTTP API: `PORT=3000`
  - WebSocket: `WS_PORT=3001`

## Instalasi

1. Masuk ke direktori backend:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
   atau
   ```bash
   yarn
   ```
   atau
   ```bash
   pnpm install
   ```

## Konfigurasi Lingkungan

Siapkan variabel lingkungan pada berkas `.env`. Template contoh telah disediakan pada [`.env.example`](./.env.example):

```
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://postgres:123456789@localhost:5432/bebang_pack_meal?schema=public
JWT_SECRET=supersecretjwt
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=supersecretrefresh
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
WS_PORT=3001
```

Salin template:
```bash
cp .env.example .env
```

### Deskripsi Variabel

- `NODE_ENV`: environment aplikasi (`development`, `production`, `test`)
- `PORT`: port HTTP REST API NestJS
- `DATABASE_URL`: koneksi PostgreSQL (format Prisma)
- `JWT_SECRET`: secret utama untuk access token
- `JWT_EXPIRES_IN`: waktu kedaluwarsa access token (contoh: `15m`, `1h`)
- `JWT_REFRESH_SECRET`: secret untuk refresh token
- `JWT_REFRESH_EXPIRES_IN`: waktu kedaluwarsa refresh token (contoh: `7d`)
- `CORS_ORIGIN`: origin yang diizinkan untuk CORS (frontend dev: `http://localhost:5173`)
- `WS_PORT`: port server WebSocket

## Menjalankan Aplikasi

Script tersedia di [package.json](./package.json):

- Development (hot-reload):
  ```bash
  npm run start:dev
  ```
- Production build:
  ```bash
  npm run build
  npm run start
  ```
- Lint:
  ```bash
  npm run lint
  ```
- Test (Jest):
  ```bash
  npm test
  ```

## Arsitektur & Teknologi

- Framework: NestJS v10 (`@nestjs/common`, `@nestjs/core`)
- Konfigurasi environment: `@nestjs/config`
- Otentikasi: `@nestjs/jwt`, `@nestjs/passport`, `bcrypt`
- Validasi DTO: `class-validator`, `class-transformer`
- Database ORM: Prisma (`@prisma/client`, `prisma`)
- Realtime: `@nestjs/websockets`
- RxJS untuk alur reaktif internal

Konfigurasi toolchain:
- ESLint: [`.eslintrc.js`](./.eslintrc.js)
- Prettier: [`.prettierrc`](./.prettierrc)
- TypeScript: [`tsconfig.json`](./tsconfig.json)
- Nest CLI: [`nest-cli.json`](./nest-cli.json)
- Git ignore: [`.gitignore`](./.gitignore)

## Struktur Proyek

Struktur direktori inti:
```
backend/
├─ src/                # Kode sumber NestJS (module, controller, service, gateway)
├─ prisma/             # Skema Prisma dan migrasi
├─ .env                # Variabel environment (lokal, tidak commit)
├─ .env.example        # Template environment
├─ .gitignore          # Pola file yang diabaikan Git
├─ .eslintrc.js        # Konfigurasi ESLint
├─ .prettierrc         # Konfigurasi Prettier
├─ tsconfig.json       # Konfigurasi TypeScript
├─ nest-cli.json       # Konfigurasi Nest CLI
└─ package.json
```

## Database & Prisma

Pastikan `DATABASE_URL` sudah benar pada `.env`.

Langkah Prisma:
```bash
# Generate prisma client
npx prisma generate

# Buat migrasi (development)
npx prisma migrate dev --name init

# Opsional: seed data (jika tersedia script)
# npx prisma db seed
```

Tips:
- Simpan skema di `prisma/schema.prisma`
- Migrasi disimpan di `prisma/migrations/`
- Jangan commit file database lokal (`*.db`, `*.db-journal` telah di-ignore)

## Otentikasi (JWT)

- Access Token: ditandatangani dengan `JWT_SECRET`, kedaluwarsa `JWT_EXPIRES_IN`
- Refresh Token: ditandatangani dengan `JWT_REFRESH_SECRET`, kedaluwarsa `JWT_REFRESH_EXPIRES_IN`
- Gunakan `@nestjs/jwt` untuk sign/verify token pada service otentikasi
- Simpan hash password menggunakan `bcrypt`

Best practices:
- Jangan expose secret melalui log
- Rotasi secret jika perlu
- Validasi payload dengan DTO

## WebSockets

- Port default WebSocket: `WS_PORT=3001`
- Gunakan `@nestjs/websockets` untuk membuat gateway realtime
- Pastikan CORS untuk WS diatur sesuai origin frontend (`CORS_ORIGIN`)

## CORS

Aktifkan CORS untuk origin frontend dev:
- `CORS_ORIGIN=http://localhost:5173`
- Atur pada bootstrap NestJS (mis. `app.enableCors({ origin: process.env.CORS_ORIGIN, credentials: true })`)

## Kualitas Kode

ESLint dan Prettier:
- ESLint TypeScript rules: lihat [`.eslintrc.js`](./.eslintrc.js)
- Prettier styling: lihat [`.prettierrc`](./.prettierrc)
- Jalankan lint sebelum commit:
  ```bash
  npm run lint
  ```

TypeScript:
- Strict mode diaktifkan (`strict: true`)
- Output build: `dist/`
- Target: `ES2021`

## Pengujian

- Framework: Jest (`@types/jest`, `jest`)
- Konvensi file test: `**/*.spec.ts` atau `**/*.test.ts`
- Menjalankan test:
  ```bash
  npm test
  ```

## Deployment

- Set `NODE_ENV=production`
- Build terlebih dahulu:
  ```bash
  npm run build
  ```
- Pastikan environment di server produksi menyertakan:
  - `DATABASE_URL` ke DB produksi
  - Secret JWT yang aman
  - `CORS_ORIGIN` sesuai domain frontend
  - Port service tersedia dan tidak bentrok

## Keamanan

- Jangan commit file `.env` ke repository (sudah di-ignore)
- Gunakan secret yang kuat untuk JWT
- Batasi CORS hanya untuk origin yang tepercaya
- Log-internal jangan menampilkan informasi sensitif

## Troubleshooting

- Database tidak terhubung:
  - Periksa `DATABASE_URL`
  - Pastikan PostgreSQL berjalan
  - Cek firewall/port
- Error Prisma:
  - Jalankan `npx prisma generate`
  - Periksa skema di `prisma/schema.prisma`
- Error lint:
  - Jalankan `npm run lint` dan perbaiki sesuai rule
- WebSocket tidak tersambung:
  - Pastikan `WS_PORT` tidak bentrok
  - Periksa CORS dan client URL

## Lisensi

Hak cipta internal Bebang Pack Meal. Penggunaan di luar organisasi memerlukan izin.
