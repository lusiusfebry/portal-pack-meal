# PROJECT OVERVIEW — Bebang Pack Meal Portal
Ringkasan singkat:
Portal operasional untuk mengelola alur “pack meal” secara end‑to‑end, menghubungkan backend API (NestJS) dan frontend SPA (React + Vite) dengan dukungan realtime dan praktik pengembangan modern.

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
- Frontend: React 18, Vite 5, TypeScript, Tailwind CSS, React Router, Zustand, axios, Headless UI, Heroicons, PWA (vite-plugin-pwa).
- Infrastruktur dev: ESLint, Prettier, Husky, tsconfig lint rules.

## Signifikansi Proyek
- Meningkatkan efisiensi operasional dengan alur kerja terstandar dan data terpusat.
- Mengurangi kesalahan manual melalui validasi dan visibilitas status secara realtime.
- Skalabel untuk pertumbuhan volume pesanan dan tim.
- Fondasi teknis modern yang memudahkan pemeliharaan, pengujian, dan deployment.