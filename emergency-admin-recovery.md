# Panduan Recovery Admin Kilat — Bebang Pack Meal Portal
Dokumen ringkas untuk memulihkan akses admin saat darurat. Fokus: langkah praktis, perintah siap copy‑paste, contoh output, dan troubleshooting singkat.

## Quick Recovery Guide (langsung eksekusi)
Jalankan dari direktori root repo. Script utama: [recovery-scripts.js](recovery-scripts.js:1) dan [activate-user.js](activate-user.js:1).

1) Inspect status admin (cek cepat):
```bash
node recovery-scripts.js find --id ADM001
```

2) Paksa role administrator:
```bash
node recovery-scripts.js make-admin --id ADM001 --yes
```

3) Reset password admin (pilih salah satu):
- Auto TEMP password dan tampilkan di output:
```bash
node recovery-scripts.js reset-password --id ADM001
```
- Set password spesifik (contoh kuat):
```bash
node recovery-scripts.js reset-password --id ADM001 --new-password "Adm1nStr0ng!" --yes
```

4) Pastikan akun aktif (flag isActive) dan verifikasi:
```bash
node activate-user.js --nik ADM001 --activate --admin-nik ADM001
node recovery-scripts.js verify --id ADM001
```

5) Uji login via HTTP (opsional, butuh backend berjalan di http://localhost:3000):
```bash
node activate-user.js --nik ADM001 --diagnose --password Adm1nStr0ng! --probe-http
```

## Prasyarat Minimal (mode panik)
- Pastikan file environment backend tersedia; script otomatis membaca [backend/.env](backend/.env.example:1) jika ada.
- Prisma Client sudah di‑generate (jalankan sekali): 
```bash
npm exec -w backend prisma generate
```
- Jalankan perintah dari root repo agar resolusi modul bekerja.

## Tabel Perintah Cepat (Skenario → Perintah)
| Skenario | Perintah (copy‑paste) | Catatan |
|---|---|---|
| Admin terkunci sekarang | `node recovery-scripts.js make-admin --id ADM001 --yes` | Mengatur role di User + Karyawan jadi administrator, serta aktif |
| Reset password admin ke TEMP | `node recovery-scripts.js reset-password --id ADM001` | TEMP-****** akan ditampilkan di output |
| Reset password ke nilai spesifik | `node recovery-scripts.js reset-password --id ADM001 --new-password "Adm1nStr0ng!" --yes` | Gunakan kutip ganda di Windows |
| Aktivasi akun yang non‑aktif | `node activate-user.js --nik EMP001 --activate --admin-nik ADM001` | Tulis audit USER_STATUS_CHANGED |
| Promosikan karyawan jadi admin | `node recovery-scripts.js make-admin --id EMP001 --yes` | Identifier = NIK/username yang sama |
| Verifikasi status akhir | `node recovery-scripts.js verify --id ADM001` | Menampilkan snapshot JSON |
| Diagnosa login end‑to‑end | `node activate-user.js --nik ADM001 --diagnose --password Adm1nStr0ng! --probe-http` | Uji bcrypt + JWT + HTTP |
| Cetak template SQL manual | `node recovery-scripts.js print-sql` | Jalur fallback tanpa Node |
| Generate hash bcrypt | `node recovery-scripts.js hash --password "Adm1nStr0ng!"` | Untuk metode SQL langsung |
| Emit wrapper shell/ps | `node recovery-scripts.js emit-shell` | Menghasilkan recovery-linux.sh dan recovery-windows.ps1 |

## Contoh Penggunaan Script

### A. [recovery-scripts.js](recovery-scripts.js:1)
- Promote admin cepat:
```bash
node recovery-scripts.js make-admin --id ADM001 --yes
```
Contoh output (dipersingkat):
```json
{
  "action": "make-admin",
  "updated": true,
  "userId": 1,
  "karyawanId": 1
}
{
  "found": true,
  "identifier": "ADM001",
  "user": { "id": 1, "username": "ADM001", "role": "administrator", "passwordHash": "<redacted>" },
  "karyawan": { "id": 1, "roleAccess": "administrator", "isActive": true }
}
```

- Reset password (TEMP) dan tampilkan:
```bash
node recovery-scripts.js reset-password --id ADM001
```
Contoh output:
```json
{ "action": "reset-password", "success": true, "tempPassword": "TEMP-ABC234" }
```

- Cetak SQL fallback:
```bash
node recovery-scripts.js print-sql
```

### B. [activate-user.js](activate-user.js:1)
- Aktivasi akun dan verifikasi:
```bash
node activate-user.js --nik EMP001 --activate --admin-nik ADM001
```
Contoh output (dipersingkat):
```text
[RUN] activateUser for EMP001
[OK] Activated karyawan EMP001
[VERIFY] Karyawan status: { isActive: true, hasUser: true }
[RESULT] activateUser: { success: true }
```

- Diagnosa login dengan probe HTTP:
```bash
node activate-user.js --nik ADM001 --diagnose --password Adm1nStr0ng! --probe-http
```
Contoh output (ringkas tabel):
```text
presence  ok=true  Karyawan found
active    ok=true  isActive=true
userLink  ok=true  hasUser=true
bcryptCompare ok=true Password valid
tokenGenerate ok=true JWT generated
httpProbe ok=true HTTP login OK, user.id=1
```

## Fallback SQL Manual (singkat)
Jika tidak bisa menjalankan Node/script, gunakan template berikut (ganti IDENTIFIER dengan NIK/username dan HASH dengan bcrypt yang dihasilkan):

- Promote jadi administrator + aktif:
```sql
-- Pastikan koneksi ke database sesuai [backend/.env](backend/.env.example:1)
UPDATE users SET role_access='administrator' WHERE username='IDENTIFIER';
UPDATE master_karyawan SET role_access='administrator', is_active=TRUE WHERE nomor_induk_karyawan='IDENTIFIER';
```

- Reset password langsung (butuh bcrypt hash):
```sql
UPDATE users SET password_hash='HASH' WHERE username='IDENTIFIER';
```

- Verifikasi singkat:
```sql
SELECT u.username, u.role_access, k.role_access, k.is_active
FROM users u JOIN master_karyawan k ON k.user_id=u.id
WHERE u.username='IDENTIFIER' OR k.nomor_induk_karyawan='IDENTIFIER';
```

## Troubleshooting Singkat
- “[ERROR] @prisma/client not found” → jalankan: 
```bash
npm exec -w backend prisma generate
```
- “Failed to initialize PrismaClient / DATABASE_URL tidak ada” → pastikan [backend/.env](backend/.env.example:1) valid.
- “Unknown or unsupported action” → cek bantuan:
```bash
node recovery-scripts.js help
```
- HTTP probe gagal (timeout/401) → pastikan backend aktif di http://localhost:3000 dan kredensial benar.
- Role tidak valid → gunakan salah satu: administrator | employee | dapur | delivery.
- Windows quoting → pakai tanda kutip ganda untuk --new-password.

## Catatan Keamanan (singkat)
- Password disimpan sebagai bcrypt hash; hash tidak pernah ditampilkan oleh skrip (redacted). Kebijakan selaras dengan [AuthService.login()](backend/src/auth/auth.service.ts:123) dan proteksi di [AuthService.validateUser()](backend/src/auth/auth.service.ts:87).
- Semua perubahan kritis menulis audit trail bila memungkinkan (lihat pola di [recovery-scripts.js](recovery-scripts.js:289) dan [activate-user.js](activate-user.js:154)).
- Simpan kredensial “break‑glass” secara aman (vault), dan rotasi rahasia secara berkala.