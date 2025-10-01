# Husky Git Hooks

Direktori ini digunakan untuk mengelola Git hooks melalui Husky. Husky membantu menjalankan pemeriksaan otomatis (lint, format, test, dsb.) sebelum commit/push agar kualitas kode tetap terjaga.

## Inisialisasi Husky

1. Pastikan dependensi sudah terpasang:
   - Root: `npm run install:all`

2. Jalankan perintah prepare (menginisialisasi Husky di repo):
   - `npm run prepare`

Perintah di atas mengeksekusi `husky install` sesuai skrip pada [package.json](../package.json:1).

## Membuat Hook Umum

Contoh membuat hook pre-commit untuk linting dan pengecekan format:

```bash
npx husky add .husky/pre-commit "npm run lint && npm run format:check"
```

Hook di atas akan:
- Menjalankan lint untuk backend dan frontend
- Mengecek format kode (Prettier) untuk backend dan frontend

Jika lint/format gagal, commit akan dibatalkan.

## Catatan Platform

- Pada Windows, disarankan menggunakan Git Bash untuk menjalankan script Husky.
- Pastikan Node.js (>= 18) dan npm (>= 9) sesuai dengan spesifikasi di [package.json](../package.json:1).

## Struktur & Best Practices

- Simpan setiap hook sebagai file terpisah di `.husky/` (misal: `pre-commit`, `pre-push`).
- Isi file hook berupa perintah shell yang ingin dijalankan sebelum aksi Git terkait.
- Sesuaikan perintah hook dengan kebutuhan CI/CD dan alur pengembangan tim.

## Troubleshooting

- Jika hook tidak berjalan:
  - Pastikan `npm run prepare` sudah dijalankan.
  - Pastikan file hook memiliki hak eksekusi (Husky akan mengatur saat `npx husky add ...`).
  - Pastikan perintah dalam hook valid untuk platform yang digunakan.

Direktori `.husky/` ini dibuat agar siap dipakai untuk menambahkan hook sesuai kebutuhan proyek.