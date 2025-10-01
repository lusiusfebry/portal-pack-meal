# Bebang Pack Meal Portal Monorepo

Proyek monorepo untuk aplikasi Portal Bebang Pack Meal yang terdiri dari dua workspace: backend (NestJS) dan frontend (React + Vite). Repo ini menyatukan workflow pengembangan, build, linting, formatting, serta Git hooks untuk meningkatkan kualitas kode.

Bagian ini ditulis dalam Bahasa Indonesia sesuai pedoman dokumentasi proyek.

## Ringkasan Proyek (Project Overview)

Portal ini menyediakan:
- Layanan API backend untuk autentikasi, manajemen data, dan real‑time event (NestJS + Prisma).
- Aplikasi frontend SPA untuk antarmuka pengguna (React, Vite, Tailwind).
- Manajemen dependensi dan skrip terpusat melalui root package.json monorepo.

## Tech Stack

- Backend: NestJS, Prisma ORM, RxJS, JWT, WebSockets
- Frontend: React 18, Vite 5, Tailwind CSS, Headless UI, Heroicons, Zustand, Axios, React Router
- Bahasa: TypeScript
- Tooling: ESLint, Prettier, Husky, Concurrently

## Prasyarat (Prerequisites)

- Node.js >= 18.0.0
- npm >= 9.0.0
- Database PostgreSQL (disarankan) atau sesuai konfigurasi Prisma
- Kredensial environment (lihat bagian Database Credentials)

Pastikan Anda memiliki akses ke variabel lingkungan (.env) untuk backend dan frontend.

## Panduan Cepat (Quick Start Guide)

1. Klon repositori:

   git clone <REPO_URL>
   cd portal-pack-meal

2. Instal semua dependensi (root + workspaces):

   npm run install:all

3. Siapkan file environment:

   - Backend: salin backend/.env.example menjadi backend/.env dan sesuaikan nilainya
   - Frontend: salin frontend/.env.example menjadi frontend/.env dan sesuaikan nilainya

4. Jalankan pengembangan (concurrently backend + frontend):

   npm run dev

5. Akses aplikasi dan API:

   - Frontend (Vite default): http://localhost:5173
   - Backend (NestJS default): http://localhost:3000

Catatan: Port aktual dapat berbeda sesuai konfigurasi di kode atau .env. Sesuaikan sesuai kebutuhan.

## Skrip Tersedia (Available Scripts)

Skrip root (lihat [package.json](package.json:1)):
- install:all: Install semua dependensi pada seluruh workspace
- dev: Jalankan backend dan frontend secara bersamaan
- dev:backend: Jalankan hanya backend (delegasi ke workspace backend)
- dev:frontend: Jalankan hanya frontend (delegasi ke workspace frontend)
- build: Build backend dan frontend
- build:backend: Build hanya backend
- build:frontend: Build hanya frontend
- lint: Lint backend dan frontend
- lint:fix: Perbaiki isu linting
- format: Format kode pada backend lalu frontend
- format:check: Periksa format kode
- prepare: Inisialisasi Husky

Contoh penggunaan:

   npm run dev         # jalankan keduanya
   npm run dev:backend # jalankan hanya backend
   npm run dev:frontend# jalankan hanya frontend

## Titik Akses (Access Points)

- Frontend: http://localhost:5173 (preview: npm run -w frontend preview)
- Backend API: http://localhost:3000 (sesuaikan jika PORT berbeda di .env)

## Referensi Dokumentasi (Documentation References)

- Backend: [README.md](backend/README.md)
- Frontend: [README.md](frontend/README.md)
- Konteks desain dan prinsip: [context/design-principles.md](/context/design-principles.md) jika tersedia

## Design System

- Framework UI: Tailwind CSS + Headless UI (sesuai dependencies saat ini)
- Prinsip desain modern, responsif, aksesibilitas WCAG 2.1 AA
- Konsistensi tipografi, warna, dan spacing

Jika later diadopsi, NextUI dapat diintegrasikan sesuai pedoman internal.

## Kredensial Database (Database Credentials)

Konfigurasi database dikelola melalui variabel lingkungan pada backend:

- DATABASE_URL="postgresql://user:password@host:port/dbname"
- Variabel lain untuk auth, storage, email, dsb. sesuai kebutuhan.

Jangan commit nilai rahasia; gunakan backend/.env dan perbarui contoh di backend/.env.example.

## Alur Pengembangan (Development Workflow)

- Pull perubahan terbaru dari branch utama
- Bekerja pada feature branch
- Gunakan lint dan format sebelum commit:

   npm run lint
   npm run format

- Commit dengan konvensi yang jelas (disarankan Conventional Commits)
- Push dan buat PR; pastikan CI/pipeline lulus
- Gunakan Husky untuk pre-commit checks (diinisialisasi via npm run prepare)

## Kontribusi (Contributing Guidelines)

- Ikuti standar kode TypeScript, ESLint, dan Prettier
- Tambahkan/ update dokumentasi bila menambah fitur
- Sertakan test bila relevan
- Hormati struktur monorepo dan dependency boundaries
- Review rekan sebelum merge

## Struktur Monorepo

- backend/: layanan API (NestJS, Prisma)
- frontend/: aplikasi React (Vite, Tailwind)
- .husky/: Git hooks (opsional, namun disarankan untuk pre-commit)
- package.json (root): orkestrasi skrip dan workspaces
- .gitignore (root): aturan pengecualian file

## Catatan Tambahan

- Jalankan npm run prepare sekali untuk menginisialisasi Husky setelah npm install
- Pastikan Node.js dan npm memenuhi versi pada engines
- Sesuaikan port, kredensial, dan konfigurasi sesuai lingkungan lokal/CI

Terima kasih telah berkontribusi pada Bebang Pack Meal Portal.