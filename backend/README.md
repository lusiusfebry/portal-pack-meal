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

## Prisma Setup &amp; Database Migration

Langkah setup awal Prisma dan database PostgreSQL:

Prasyarat:
- PostgreSQL berjalan lokal/remote dan kredensial valid
- `DATABASE_URL` pada backend/.env sudah diisi benar
- Dependensi telah di-install (npm/yarn/pnpm)

Perintah-perintah utama:
```bash
# 1) Generate Prisma Client (wajib setelah mengubah schema.prisma)
npx prisma generate

# 2) Buat / jalankan migrasi (pengembangan)
#    - Jika belum ada migrasi awal, beri nama "init"
npx prisma migrate dev --name init

# 3) (Opsional) Seed data contoh
npx prisma db seed

# 4) (Opsional) Buka Prisma Studio (GUI database)
npx prisma studio

# 5) (Opsional, hati-hati) Reset database + jalankan seed ulang
npx prisma migrate reset

# 6) (Opsional) Cek status migrasi
npx prisma migrate status

# 7) (Opsional) Validasi &amp; format skema
npx prisma validate
npx prisma format
```

Catatan:
- Skema: `prisma/schema.prisma`
- Direktori migrasi: `prisma/migrations/`
- Seed script: `prisma/seed.ts`
- Jalankan `npx prisma generate` setiap kali skema berubah.
- Gunakan `npx prisma migrate dev` pada environment development.
- Untuk production gunakan `npx prisma migrate deploy` di pipeline/CI.
## Authentication & Authorization

Sistem autentikasi dan otorisasi telah diimplementasikan dengan alur berbasis NIK, JWT access token, dan refresh token pada cookie HTTP-only. Implementasi inti berada pada [AuthController](backend/src/auth/auth.controller.ts:18), DTO [LoginDto](backend/src/auth/dto/login.dto.ts:3), guard [RolesGuard](backend/src/common/guards/roles.guard.ts:10), decorator [Roles](backend/src/common/decorators/roles.decorator.ts:17), dan payload [JwtPayload](backend/src/common/interfaces/jwt-payload.interface.ts:5). Audit trail dicatat melalui [AuditTrailService](backend/src/common/services/audit-trail.service.ts:6). Kredensial uji tersedia di [seed.ts](backend/prisma/seed.ts:1).

### Ringkasan Flow Autentikasi
- Login (NIK + password) → Server mengembalikan `accessToken` (JWT) dan profil `user`, serta mengeset `refreshToken` di cookie HTTP-only.
- Akses endpoint terproteksi dengan header `Authorization: Bearer &lt;accessToken&gt;`.
- Refresh token menggunakan cookie `refreshToken` untuk mendapatkan `accessToken` baru (server juga akan memutar refresh token).
- Logout akan menghapus cookie `refreshToken`.

Detail implementasi cookie:
- `httpOnly`: true (cookie tidak dapat diakses dari JavaScript)
- `secure`: mengikuti `NODE_ENV` (aktif di production)
- `sameSite`: `lax`
- `path`: `/`
- `maxAge`: 7 hari

### Endpoints
Public:
- `POST /api/auth/login` — login dengan NIK + password; menyetel cookie `refreshToken` dan mengembalikan `{ accessToken, user }`
- `POST /api/auth/refresh` — memerlukan cookie `refreshToken`; mengembalikan `{ accessToken }` dan memutar cookie `refreshToken`
- `POST /api/auth/logout` — menghapus cookie `refreshToken`

Protected (JWT access token):
- `GET /api/auth/me` — profil pengguna terautentikasi (payload: [JwtPayload](backend/src/common/interfaces/jwt-payload.interface.ts:5))

Admin-only (menggunakan [RolesGuard](backend/src/common/guards/roles.guard.ts:10) dengan [Roles('administrator')](backend/src/common/decorators/roles.decorator.ts:17)):
- `POST /api/users` — buat user baru
- `GET /api/users` — daftar semua user
- `GET /api/users/:id` — detail user
- `PATCH /api/users/:id/status` — ubah status aktif/tidak aktif
- `PATCH /api/users/:id/role` — ubah peran user
- `POST /api/users/:id/reset-password` — reset password, mengembalikan password sementara

Catatan:
- Controller Users mengaktifkan guards: `@UseGuards(AuthGuard('jwt'), RolesGuard)` pada [UsersController](backend/src/users/users.controller.ts:21).

### Contoh Penggunaan API (curl)
Gunakan `curl.exe` pada Windows atau `curl` pada macOS/Linux.

1) Login (simpan cookie refreshToken ke file):
```bash
curl -X POST "http://localhost:3000/api/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"nik\":\"ADM001\",\"password\":\"admin123\"}" ^
  -c cookies.txt
```
Respons (contoh):
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "nik": "ADM001",
    "role": "administrator",
    ...
  }
}
```

2) Akses profil saat terautentikasi (ganti &lt;ACCESS_TOKEN&gt; dengan token dari hasil login):
```bash
curl -X GET "http://localhost:3000/api/auth/me" ^
  -H "Authorization: Bearer <ACCESS_TOKEN>"
```

3) Refresh token menggunakan cookie:
```bash
curl -X POST "http://localhost:3000/api/auth/refresh" ^
  -b cookies.txt
```

4) Logout dan hapus cookie:
```bash
curl -X POST "http://localhost:3000/api/auth/logout" ^
  -b cookies.txt
```

5) Contoh Admin-only: daftar semua user
```bash
curl -X GET "http://localhost:3000/api/users" ^
  -H "Authorization: Bearer <ACCESS_TOKEN_ADMIN>"
```

### Kredensial Uji (Seed Data)
Tersedia pada [seed.ts](backend/prisma/seed.ts:146):
- Administrator: NIK `ADM001`, password `admin123`
- Employee: NIK `EMP001`, password `emp123`
- Kitchen: NIK `KIT001`, password `kitchen123`
- Delivery: NIK `DEL001`, password `delivery123`
- Employee 2: NIK `EMP002`, password `emp123`

### Authorization (RBAC)
Peran (roles) yang didukung:
- `administrator` — akses penuh termasuk manajemen user
- `employee` — akses fitur karyawan
- `dapur` — akses alur produksi/penyiapan
- `delivery` — akses alur pengiriman

Otorisasi dilakukan via metadata decorator [Roles(...)](backend/src/common/decorators/roles.decorator.ts:17) dan dievaluasi oleh [RolesGuard](backend/src/common/guards/roles.guard.ts:10) terhadap `request.user.role`.

### Audit Trail Logging
Audit dicatat ke tabel `log_audit_trail` melalui [AuditTrailService](backend/src/common/services/audit-trail.service.ts:6). Event yang didukung antara lain:
- `LOGIN_SUCCESS` — saat login berhasil ([logLoginSuccess()](backend/src/common/services/audit-trail.service.ts:20))
- `LOGIN_FAILURE` — saat login gagal ([logLoginFailure()](backend/src/common/services/audit-trail.service.ts:28))
- `USER_CREATED` — admin membuat user ([logUserCreated()](backend/src/common/services/audit-trail.service.ts:36))
- `USER_STATUS_CHANGED` — admin mengubah status aktif user ([logUserStatusChanged()](backend/src/common/services/audit-trail.service.ts:44))
- `PASSWORD_RESET` — admin melakukan reset password ([logPasswordReset()](backend/src/common/services/audit-trail.service.ts:52))

Struktur data audit trail mengikuti skema Prisma pada [schema.prisma](backend/prisma/schema.prisma:1).

### Keamanan
- Simpan `JWT_SECRET` dan `JWT_REFRESH_SECRET` secara aman di environment.
- Refresh token disimpan di cookie HTTP-only; jangan diekspos ke client-side JS.
- Terapkan `secure: true` di production (HTTPS).
- Pastikan `CORS_ORIGIN` dikonfigurasi sesuai domain frontend.
## Order Management &amp; Workflow

**Order Lifecycle**  
Alur pesanan mengikuti workflow terdefinisi dengan transisi status berbasis peran:

1. **Employee** membuat pesanan → Status: `MENUNGGU`
2. **Dapur** menerima pesanan → Status: `IN_PROGRESS`
3. **Dapur** menyelesaikan persiapan → Status: `READY`
4. **Delivery** mengambil pesanan → Status: `ON_DELIVERY`
5. **Delivery** menyelesaikan pengantaran → Status: `COMPLETE`

**Exception Flow (Approval Workflow)**  
Ketika Dapur perlu menolak atau mengedit pesanan:
1. **Dapur** meminta penolakan/edit dengan catatan wajib → Status: `MENUNGGU_PERSETUJUAN`
2. **Admin** meninjau permintaan di Approval Center
3. **Admin** menyetujui → Pesanan ditolak (`DITOLAK`) atau jumlah diperbarui
4. **Admin** menolak → Pesanan kembali ke status `MENUNGGU`

**Format Kode Pesanan**  
- Otomatis: `PM-YYYYMMDD-XXX`
- Contoh: `PM-20251001-001` (pesanan pertama pada 1 Oktober 2025)

**API Endpoints**

Order Creation (Employee):
- `POST /api/orders` — Membuat pesanan baru
  - Body: `{ "shiftId": 1, "jumlahPesanan": 10, "tanggalPesanan": "2025-10-01" }`
  - Mengembalikan: Pesanan yang dibuat dengan kode otomatis

Order Listing (Semua Peran):
- `GET /api/orders` — Daftar pesanan (difilter berdasarkan peran)
  - Query params: `status`, `departmentId`, `shiftId`, `tanggalMulai`, `tanggalAkhir`, `page`, `limit`
  - Employee: Hanya pesanan milik sendiri
  - Dapur: Pesanan dengan status MENUNGGU, IN_PROGRESS, MENUNGGU_PERSETUJUAN
  - Delivery: Pesanan dengan status READY, ON_DELIVERY
  - Admin: Semua pesanan dengan filter lengkap

Order Details:
- `GET /api/orders/:id` — Detail pesanan

Status Transitions (Dapur, Delivery, Admin):
- `PATCH /api/orders/:id/status` — Memperbarui status pesanan
  - Body: `{ "status": "IN_PROGRESS" }`
  - Memvalidasi izin peran untuk setiap transisi

Approval Workflow (Dapur):
- `POST /api/orders/:id/request-rejection` — Meminta penolakan pesanan
  - Body: `{ "catatanDapur": "Stok bahan habis untuk shift ini" }`
  - Catatan minimal 10 karakter

- `POST /api/orders/:id/request-edit` — Meminta perubahan jumlah
  - Body: `{ "jumlahPesananBaru": 8, "catatanDapur": "Hanya bisa menyediakan 8 porsi" }`

Approval Center (Admin):
- `GET /api/orders/pending-approvals` — Daftar permintaan persetujuan yang pending

- `POST /api/orders/:id/approve-reject` — Menyetujui/menolak permintaan
  - Body: `{ "decision": "APPROVED", "catatanAdmin": "Disetujui karena alasan valid" }`
  - Nilai `decision`: `APPROVED` atau `REJECTED`

**Event-Driven Architecture**  
Seluruh aksi pesanan memancarkan event untuk notifikasi realtime:
- `order.created` — Pesanan baru dibuat
- `order.status.changed` — Transisi status
- `order.approval.requested` — Permintaan approval dari Dapur
- `order.approval.decided` — Keputusan Admin untuk approval

Event-event ini akan dikonsumsi oleh WebSocket gateway (fase berikutnya) untuk update realtime.

**Audit Trail**  
Seluruh aksi pesanan dicatat:
- Pembuatan pesanan
- Perubahan status
- Permintaan penolakan/edit
- Keputusan approval
- Override oleh Admin

Lihat log di Prisma Studio: `npm run prisma:studio`

**Testing Order Workflow**
```bash
# Login sebagai employee
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"nik":"EMP001","password":"emp123"}'

# Buat pesanan (gunakan access token dari login)
curl -X POST http://localhost:3000/api/orders \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"shiftId":1,"jumlahPesanan":10}'

# Login sebagai dapur
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"nik":"KIT001","password":"kitchen123"}'

# Ubah status pesanan ke IN_PROGRESS
curl -X PATCH http://localhost:3000/api/orders/1/status \
  -H "Authorization: Bearer DAPUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status":"IN_PROGRESS"}'

# Minta penolakan (memicu approval workflow)
curl -X POST http://localhost:3000/api/orders/1/request-rejection \
  -H "Authorization: Bearer DAPUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"catatanDapur":"Stok bahan tidak mencukupi untuk jumlah ini"}'

# Login sebagai admin
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"nik":"ADM001","password":"admin123"}'

# Lihat pending approvals
curl -X GET http://localhost:3000/api/orders/pending-approvals \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN"

# Setujui permintaan
curl -X POST http://localhost:3000/api/orders/1/approve-reject \
  -H "Authorization: Bearer ADMIN_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"decision":"APPROVED","catatanAdmin":"Disetujui"}'
```
## Real-Time Notifications (WebSocket)

Sistem notifikasi realtime menggunakan Socket.IO Gateway pada NestJS, terintegrasi dengan event domain dari modul pesanan. Gateway diamankan dengan JWT guard, melakukan room-based broadcasting per role/department, dan mengoptimalkan CORS berdasarkan konfigurasi environment.

### 1) Arsitektur

- Gateway realtime: [NotificationsGateway](backend/src/websocket/websocket.gateway.ts:47) dengan namespace khusus `/notifications`
- Autentikasi WebSocket: [WsJwtGuard](backend/src/websocket/websocket.guard.ts:7) memverifikasi JWT pada handshake dan menempelkan payload JWT ke `client.data.user`
- Modul konfigurasi: [WebSocketModule](backend/src/websocket/websocket.module.ts:14) mendaftarkan gateway dan JwtModule (secret/expiry via ConfigService)
- Konsumsi event domain (Event-Driven):
  - Listener pesanan baru: [OnEvent('order.created')](backend/src/websocket/websocket.gateway.ts:123)
  - Listener perubahan status: [OnEvent('order.status.changed')](backend/src/websocket/websocket.gateway.ts:153)
  - Listener permintaan approval: [OnEvent('order.approval.requested')](backend/src/websocket/websocket.gateway.ts:207)
  - Listener keputusan approval: [OnEvent('order.approval.decided')](backend/src/websocket/websocket.gateway.ts:229)
- Manajemen room (join saat connect): [NotificationsGateway.joinRooms()](backend/src/websocket/websocket.gateway.ts:251)
- CORS WebSocket di-refine pada init: [NotificationsGateway.afterInit()](backend/src/websocket/websocket.gateway.ts:60) menggunakan [resolveCorsOrigin()](backend/src/websocket/websocket.gateway.ts:329)

Diagram singkat alur:
```
OrdersService → emit event ──► NotificationsGateway (OnEvent handlers)
                                  │
                                  ├─ resolve audience rooms (role/dept/user/karyawan)
                                  └─ emit "order.*" ke client yang relevan
```

### 2) Detail Koneksi (Namespace, Port, URL, Autentikasi)

- Namespace: `/notifications`
- URL (default attach ke HTTP server backend):
  - Development default: `http://localhost:3000/notifications`
  - Jika menggunakan port terpisah (via reverse proxy atau konfigurasi eksternal): `http://localhost:3001/notifications` (mengikuti `WS_PORT` jika diterapkan di lingkungan)
- Autentikasi (diproses oleh [WsJwtGuard](backend/src/websocket/websocket.guard.ts:13)):
  - Kirim JWT access token melalui salah satu opsi:
    - `handshake.auth.token`
    - Header `Authorization: Bearer <token>`
    - Query string `?token=<token>`
  - Opsional: `departmentId` untuk penentuan room dept via:
    - `handshake.auth.departmentId`
    - Query string `?departmentId=<id>`
- CORS WS: Daftar origin diambil dari `CORS_ORIGIN` (comma-separated). Gateway akan mengubah opsi CORS runtime pada init ([afterInit()](backend/src/websocket/websocket.gateway.ts:60)).

### 3) Contoh Koneksi Client

JavaScript (socket.io-client):
```js
// npm i socket.io-client
import { io } from "socket.io-client";

// Token JWT access, mis. hasil dari POST /api/auth/login
const accessToken = "YOUR_ACCESS_TOKEN";
const departmentId = 1; // opsional, untuk room dept

// Default attach ke backend HTTP server (port 3000):
const socket = io("http://localhost:3000/notifications", {
  transports: ["websocket"], // prefer websocket transport
  auth: { token: accessToken, departmentId }, // dikonsumsi WsJwtGuard + room dept
  withCredentials: true, // untuk header/cookie jika diperlukan
});

// Event handlers
socket.on("connect", () => {
  console.log("[WS] connected:", socket.id);
});

socket.on("order.created", (payload) => {
  console.log("[WS] order.created:", payload);
});

socket.on("order.status.changed", (payload) => {
  console.log("[WS] order.status.changed:", payload);
});

socket.on("order.approval.requested", (payload) => {
  console.log("[WS] order.approval.requested:", payload);
});

socket.on("order.approval.decided", (payload) => {
  console.log("[WS] order.approval.decided:", payload);
});

socket.on("disconnect", (reason) => {
  console.log("[WS] disconnected:", reason);
});
```

Catatan autentikasi handshake: Guard akan membaca token dari `auth.token`, `Authorization: Bearer`, atau `?token=` sesuai implementasi [getTokenFromHandshake()](backend/src/websocket/websocket.guard.ts:41).

### 4) Room-Based Broadcasting (Targeting)

Saat terkoneksi, client akan otomatis bergabung ke room berdasarkan payload JWT dan departmentId (jika ada), melalui [joinRooms()](backend/src/websocket/websocket.gateway.ts:251):
- `role:<role>` — room global per peran (mis. `role:dapur`, `role:administrator`)
- `user:<sub>` — room per user id (subject/JWT sub)
- `karyawan:<karyawanId>` — room per karyawan
- `dept:<departmentId>` — room per departemen
- `dept:<departmentId>:role:<role>` — kombinasi dept+role untuk targeting lebih presisi

Broadcast helper: [emitToRooms()](backend/src/websocket/websocket.gateway.ts:286) akan mengirim ke union rooms unik yang ditentukan oleh handler event.

### 5) Dokumentasi Event Types

Event dan payload yang disiarkan:

- `order.created` ([handleOrderCreated](backend/src/websocket/websocket.gateway.ts:123))
  - Payload (contoh bidang): `{ orderId, departmentId, kodePesanan, jumlahPesanan, tanggalPesanan, createdBy }`
  - Audience: `dept:<departmentId>:role:dapur`, `role:administrator`

- `order.status.changed` ([handleOrderStatusChanged](backend/src/websocket/websocket.gateway.ts:153))
  - Payload: `{ orderId, departmentId, oldStatus, newStatus, karyawanPemesanId, changedBy }`
  - Audience berdasarkan `newStatus`:
    - `MENUNGGU`, `IN_PROGRESS` → `dept:<departmentId>:role:dapur`
    - `READY` → `dept:<departmentId>:role:dapur` + `dept:<departmentId>:role:delivery`
    - `ON_DELIVERY` → `dept:<departmentId>:role:delivery`
    - `COMPLETE`, `DITOLAK`, `MENUNGGU_PERSETUJUAN` → `role:administrator`
  - Selalu include direct notify: `karyawan:<karyawanPemesanId>`

- `order.approval.requested` ([handleApprovalRequested](backend/src/websocket/websocket.gateway.ts:207))
  - Payload: `{ orderId, departmentId, requestType: 'REJECT' | 'EDIT', requestedBy, catatanDapur }`
  - Audience: `role:administrator`, `dept:<departmentId>:role:administrator`

- `order.approval.decided` ([handleApprovalDecided](backend/src/websocket/websocket.gateway.ts:229))
  - Payload: `{ orderId, departmentId, decision: 'APPROVED' | 'REJECTED', decidedBy, catatanAdmin, requestedBy }`
  - Audience: `dept:<departmentId>:role:dapur`, `role:administrator`, `karyawan:<requestedBy>`

Catatan: Bentuk payload berasal dari event classes di `src/common/events/*` dan data OrdersService; kolom dapat bertambah sesuai evolusi bisnis.

### 6) Instruksi Testing Koneksi WebSocket

Langkah uji sederhana di development:

1) Login untuk memperoleh access token:
```bash
curl -X POST "http://localhost:3000/api/auth/login" ^
  -H "Content-Type: application/json" ^
  -d "{\"nik\":\"ADM001\",\"password\":\"admin123\"}"
```

2) Jalankan skrip Node sederhana (lihat contoh "Contoh Koneksi Client") dengan `accessToken` hasil login.

3) Picu event melalui API:
- Buat pesanan (memicu `order.created`):
```bash
curl -X POST http://localhost:3000/api/orders ^
  -H "Authorization: Bearer YOUR_EMPLOYEE_ACCESS_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"shiftId\":1,\"jumlahPesanan\":10}"
```

- Ubah status (memicu `order.status.changed`):
```bash
curl -X PATCH http://localhost:3000/api/orders/1/status ^
  -H "Authorization: Bearer YOUR_DAPUR_OR_DELIVERY_ACCESS_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"status\":\"IN_PROGRESS\"}"
```

- Ajukan approval (memicu `order.approval.requested`):
```bash
curl -X POST http://localhost:3000/api/orders/1/request-rejection ^
  -H "Authorization: Bearer YOUR_DAPUR_ACCESS_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"catatanDapur\":\"Stok bahan tidak mencukupi\"}"
```

- Putuskan approval (memicu `order.approval.decided`):
```bash
curl -X POST http://localhost:3000/api/orders/1/approve-reject ^
  -H "Authorization: Bearer YOUR_ADMIN_ACCESS_TOKEN" ^
  -H "Content-Type: application/json" ^
  -d "{\"decision\":\"APPROVED\",\"catatanAdmin\":\"Disetujui\"}"
```

Periksa log di client (`console.log`) dan log server (NestJS) untuk memastikan broadcast berjalan.

### 7) Integrasi dengan Frontend

- Env frontend: `VITE_WS_URL` (contoh `http://localhost:3000/notifications` atau `http://localhost:3001/notifications` bila ada reverse proxy)
- Gunakan `socket.io-client` pada React:
```ts
import { io, Socket } from "socket.io-client";

export function createNotificationsSocket(accessToken: string, deptId?: number): Socket {
  return io(import.meta.env.VITE_WS_URL, {
    transports: ["websocket"],
    auth: { token: accessToken, departmentId: deptId },
    withCredentials: true,
  });
}
```
- Subscribing di hooks/store (Zustand): daftarkan listener pada mount, bersihkan pada unmount untuk mencegah memory leak
- Sinkronkan payload event ke state UI (mis. daftar pesanan, badge notifikasi, toast real-time)

### 8) Contoh Alur Event

Contoh: Employee membuat pesanan → Dapur mendapatkan notifikasi antrian
1. Employee `POST /api/orders` → OrdersService memancarkan `order.created`
2. Gateway menangkap event dan broadcast ke rooms: `dept:<departmentId>:role:dapur`, `role:administrator`
3. Client dapur (yang berada pada departemen tersebut) menerima `order.created` dan memperbarui daftar antrian secara realtime

Contoh: Dapur mengubah status ke `READY` → Delivery diberitahu
1. Dapur `PATCH /api/orders/:id/status {status: "READY"}` → `order.status.changed`
2. Gateway broadcast ke: `dept:<departmentId>:role:dapur` dan `dept:<departmentId>:role:delivery` + `karyawan:<pemesan>`
3. Client delivery melihat pesanan siap diantar tanpa perlu refresh

### 9) Tips Debugging

- Verifikasi token dikirim pada handshake (lihat [WsJwtGuard.canActivate()](backend/src/websocket/websocket.guard.ts:13))
  - Cek `auth.token` atau header Authorization pada network tab
- Pastikan namespace URL benar (`/notifications`) dan origin sesuai CORS (`CORS_ORIGIN`)
  - CORS di-refine pada init: [afterInit()](backend/src/websocket/websocket.gateway.ts:60), [resolveCorsOrigin()](backend/src/websocket/websocket.gateway.ts:329)
- Cek room join saat connect (server log "Joined rooms..."):
  - Implementasi: [joinRooms()](backend/src/websocket/websocket.gateway.ts:251)
- Telusuri handler event untuk audience:
  - Status-based routing: [handleOrderStatusChanged()](backend/src/websocket/websocket.gateway.ts:153)
  - Approval flow: [handleApprovalRequested()](backend/src/websocket/websocket.gateway.ts:207), [handleApprovalDecided()](backend/src/websocket/websocket.gateway.ts:229)
- Perhatikan jaringan:
  - `transports: ["websocket"]` menghindari isu polling pada beberapa lingkungan
  - `withCredentials: true` bila membutuhkan cookie/headers
- Lihat log server saat init & koneksi:
  - Init log: "WebSocket initialized: namespace=/notifications"
  - Koneksi log: "Client connected: ..."
## Production Deployment

**Build for Production:**
```bash
# Build TypeScript to JavaScript
npm run build

# Output: dist/ directory
# Contains compiled JavaScript files
```

**Environment Configuration:**
- Copy `.env.production.example` to `.env`
- **Critical: Change all default values!**
  - Generate strong JWT secrets: 
    ```bash
    node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
    ```
  - Update DATABASE_URL with production credentials
  - Set CORS_ORIGIN to production frontend URL
  - Set NODE_ENV=production

**Database Setup:**
```bash
# Run migrations (production mode)
npm run prisma:migrate:prod

# Generate Prisma Client
npm run prisma:generate

# Optional: Seed initial data
npm run prisma:seed
```

**Process Management (PM2):**

The backend includes `ecosystem.config.js` for PM2 process management.

```bash
# Install PM2 globally
npm install -g pm2

# Start application in cluster mode
pm2 start ecosystem.config.js --env production

# Monitor
pm2 monit

# View logs
pm2 logs bebang-pack-meal-api

# Restart
pm2 restart bebang-pack-meal-api

# Stop
pm2 stop bebang-pack-meal-api

# Save process list (auto-start on reboot)
pm2 save
pm2 startup
```

**PM2 Features:**
- Cluster mode with 2 instances for load balancing
- Automatic restart on crashes
- Memory limit (500MB per instance)
- Log management with rotation
- Zero-downtime reload

**Nginx Reverse Proxy:**

See [nginx.conf.example](nginx.conf.example) in root directory for complete Nginx configuration.

**Key points:**
- Nginx serves frontend static files
- Nginx proxies `/api/*` to backend (localhost:3000)
- Nginx proxies `/socket.io/*` to WebSocket server (localhost:3001)
- SSL/HTTPS enabled via Let's Encrypt
- Gzip compression for API responses

**Health Check:**
```bash
# Test backend is running
curl http://localhost:3000/api/health

# Should return:
# {"status":"ok","message":"Bebang Pack Meal Portal API is running",...}
```

**Security Checklist:**
- [ ] Change DATABASE_URL password
- [ ] Generate new JWT_SECRET and JWT_REFRESH_SECRET
- [ ] Set CORS_ORIGIN to production domain only
- [ ] Enable HTTPS
- [ ] Set up database backups
- [ ] Configure firewall
- [ ] Review and limit exposed ports
- [ ] Enable rate limiting (optional)
- [ ] Set up monitoring and alerting

**Monitoring:**
```bash
# PM2 monitoring
pm2 monit

# Check process status
pm2 status

# View metrics
pm2 describe bebang-pack-meal-api
```

**Logs Location:**
- PM2 logs: `backend/logs/pm2-*.log`
- Application logs: Console output captured by PM2
- Nginx logs: `/var/log/nginx/bebang-pack-meal-*.log`

For complete deployment guide, see [DEPLOYMENT.md](DEPLOYMENT.md) in root directory.
## Reporting &amp; Analytics

Bagian ini mendokumentasikan fitur pelaporan dan analitik yang tersedia di backend. Seluruh endpoint berada di controller [ReportsController](backend/src/reports/reports.controller.ts:24) dan dibatasi untuk peran administrator melalui guard peran di kelas controller. Autentikasi JWT diterapkan secara global. Dukungan ekspor tersedia dalam format CSV, serta stub PDF sebagai placeholder implementasi.

### Overview

- Route prefix: `/api/reports` (mengikuti prefix global `api`)
- Akses: Admin-only via [`@Roles('administrator')`](backend/src/reports/reports.controller.ts:27)
- Guard: [`RolesGuard`](backend/src/common/guards/roles.guard.ts:7), [`JwtAuthGuard`](backend/src/common/guards/jwt-auth.guard.ts:7) (global)
- Format respons utama: JSON
- Ekspor:
  - `?format=csv` → unduh file CSV
  - `?format=pdf` → stub PDF (placeholder; akan diimplementasikan di masa depan)
- Implementasi:
  - Controller: [ReportsController](backend/src/reports/reports.controller.ts:24)
  - Service inti: [ReportsService](backend/src/reports/services/reports.service.ts:1)
  - Ekspor: [ExportService](backend/src/reports/services/export.service.ts:1)
  - Audit Trail: [AuditTrailService](backend/src/common/services/audit-trail.service.ts:1)

### Report Types

#### 1) Consumption Report
- Endpoint: `GET /api/reports/consumption`
- Purpose: Menyajikan konsumsi total (jumlah pesanan dan total porsi) per periode.
- Deskripsi:
  - Mengelompokkan pesanan berdasarkan periode waktu
  - Mengabaikan pesanan berstatus `DITOLAK`
  - Mendukung filter shift
  - Grouping harian via Prisma, mingguan/bulanan via SQL `date_trunc`
- Query Parameters ([ConsumptionReportQueryDto](backend/src/reports/dto/consumption-report-query.dto.ts:10)):
  - `tanggalMulai` (string, ISO date, opsional)
  - `tanggalAkhir` (string, ISO date, opsional)
  - `groupBy` (`DAILY` | `WEEKLY` | `MONTHLY`, default: `DAILY`)
  - `shiftId` (number, opsional)
- Response (JSON Array):
  ```json
  [
    {
      "period": "2025-10-01",
      "totalOrders": 12,
      "totalMeals": 120
    }
  ]
  ```
- Ekspor:
  - `GET /api/reports/consumption?format=csv` → CSV
  - `GET /api/reports/consumption?format=pdf` → PDF (stub)

#### 2) Department Report
- Endpoint: `GET /api/reports/department`
- Purpose: Agregasi pesanan per departemen (jumlah pesanan, total porsi, proporsi persentase).
- Query Parameters ([DepartmentReportQueryDto](backend/src/reports/dto/department-report-query.dto.ts:6)):
  - `tanggalMulai` (string, ISO date, opsional)
  - `tanggalAkhir` (string, ISO date, opsional)
  - `departmentId` (number, opsional)
  - `status` ([StatusPesanan](backend/src/orders/dto/update-order-status.dto.ts:1), opsional)
  - `shiftId` (number, opsional)
- Response (JSON Array):
  ```json
  [
    {
      "departmentId": 1,
      "departmentName": "IT Department",
      "totalOrders": 20,
      "totalMeals": 200,
      "percentage": 55.5
    }
  ]
  ```
- Ekspor:
  - `GET /api/reports/department?format=csv` → CSV
  - `GET /api/reports/department?format=pdf` → PDF (stub)

#### 3) Performance Report
- Endpoint: `GET /api/reports/performance`
- Purpose: Metrik performa end‑to‑end (durasi total, processing, preparation, delivery) untuk pesanan `COMPLETE` dengan breakdown per departemen dan per shift.
- Catatan:
  - Rentang waktu diterapkan pada `waktuDibuat` (gte) dan `waktuSelesai` (lte)
  - Hanya pesanan dengan status `COMPLETE`
- Query Parameters ([PerformanceReportQueryDto](backend/src/reports/dto/performance-report-query.dto.ts:4)):
  - `tanggalMulai` (string, ISO date, opsional)
  - `tanggalAkhir` (string, ISO date, opsional)
  - `departmentId` (number, opsional)
  - `shiftId` (number, opsional)
- Response (JSON Object):
  ```json
  {
    "overall": {
      "count": 42,
      "avgTotalDurationMinutes": 85.3,
      "avgProcessingTimeMinutes": 15.2,
      "avgPreparationTimeMinutes": 32.7,
      "avgDeliveryTimeMinutes": 21.4
    },
    "byDepartment": [
      {
        "departmentId": 1,
        "departmentName": "IT Department",
        "count": 18,
        "avgTotalDurationMinutes": 82.1,
        "avgProcessingTimeMinutes": 14.0,
        "avgPreparationTimeMinutes": 30.5,
        "avgDeliveryTimeMinutes": 20.0
      }
    ],
    "byShift": [
      {
        "shiftId": 1,
        "shiftName": "Shift 1",
        "count": 20,
        "avgTotalDurationMinutes": 88.0,
        "avgProcessingTimeMinutes": 16.0,
        "avgPreparationTimeMinutes": 34.0,
        "avgDeliveryTimeMinutes": 22.0
      }
    ]
  }
  ```
- Ekspor:
  - `GET /api/reports/performance?format=csv` → CSV (flattened rows; controller melakukan flatten)
  - `GET /api/reports/performance?format=pdf` → PDF (stub)

#### 4) Rejection Report
- Endpoint: `GET /api/reports/rejections`
- Purpose: Daftar permintaan penolakan/edit yang membutuhkan persetujuan admin, dengan pagination dan filter.
- Query Parameters ([RejectionReportQueryDto](backend/src/reports/dto/rejection-report-query.dto.ts:6)):
  - `tanggalMulai` (string, ISO date, opsional)
  - `tanggalAkhir` (string, ISO date, opsional)
  - `departmentId` (number, opsional)
  - `approvalStatus` ([ApprovalStatus](backend/src/orders/dto/approve-reject-order.dto.ts:1), opsional)
  - `page` (number, default: 1)
  - `limit` (number, default: 50)
- Response (JSON Object, paginated):
  ```json
  {
    "data": [
      {
        "id": 123,
        "kodePesanan": "PM-20251001-001",
        "departmentId": 1,
        "departmentName": "IT Department",
        "karyawanPemesanId": 10,
        "shiftId": 1,
        "shiftName": "Shift 1",
        "jumlahPesanan": 8,
        "jumlahPesananAwal": 10,
        "statusPesanan": "MENUNGGU_PERSETUJUAN",
        "requiresApproval": true,
        "approvalStatus": "PENDING",
        "catatanDapur": "Hanya bisa 8",
        "catatanAdmin": null,
        "waktuDibuat": "2025-10-01T07:30:00.000Z",
        "requestType": "EDIT"
      }
    ],
    "total": 3,
    "page": 1,
    "limit": 50,
    "totalPages": 1
  }
  ```
- Ekspor:
  - `GET /api/reports/rejections?format=csv` → CSV (berdasarkan halaman saat ini)
  - `GET /api/reports/rejections?format=pdf` → PDF (stub)

### Audit Trail Viewer

- Overview: Menyediakan kemampuan untuk menelusuri audit logs, melihat histori kronologis per pesanan, serta mendapatkan daftar tipe aksi yang tersedia. Implementasi berada di [AuditTrailService](backend/src/common/services/audit-trail.service.ts:1) dengan endpoint pada [ReportsController](backend/src/reports/reports.controller.ts:218).
- Logged Events (contoh):
  - `LOGIN_SUCCESS`, `LOGIN_FAILURE`
  - `USER_CREATED`, `USER_STATUS_CHANGED`, `PASSWORD_RESET`
  - `ORDER_CREATED`, `ORDER_STATUS_CHANGED`
  - `ORDER_REJECTION_REQUESTED`, `ORDER_EDIT_REQUESTED`
  - `APPROVAL_DECIDED`, `ORDER_OVERRIDE`
- Endpoints:
  1) Query logs  
     `GET /api/reports/audit-trail`  
     Query Parameters ([AuditTrailQueryDto](backend/src/reports/dto/audit-trail-query.dto.ts:4)):
     - `search` (string, opsional) — filter OR pada `aksi`/`detail`
     - `userId` (number, opsional)
     - `aksi` (string, opsional) — filter aksi spesifik
     - `tanggalMulai` (string, ISO date, opsional)
     - `tanggalAkhir` (string, ISO date, opsional)
     - `page` (number, default: 1)
     - `limit` (number, default: 50)
     Response (JSON, paginated):
     ```json
     {
       "data": [
         {
           "id": 1,
           "timestamp": "2025-10-01T07:00:00.000Z",
           "aksi": "LOGIN_SUCCESS",
           "detail": "User ADM001 logged in successfully",
           "user": {
             "id": 1,
             "nomorIndukKaryawan": "ADM001",
             "namaLengkap": "Admin User",
             "roleAccess": "administrator",
             "departmentId": 1,
             "jabatanId": 2
           }
         }
       ],
       "total": 120,
       "page": 1,
       "limit": 50,
       "totalPages": 3
     }
     ```
  2) Order history by code  
     `GET /api/reports/audit-trail/order/:kodePesanan`  
     Response (JSON Array, kronologis):
     ```json
     [
       {
         "id": 10,
         "timestamp": "2025-10-01T07:10:00.000Z",
         "aksi": "ORDER_CREATED",
         "detail": "Order PM-20251001-001 created: qty=10, shift=Shift 1",
         "user": { "id": 10, "nomorIndukKaryawan": "EMP001", "namaLengkap": "Employee 1", "roleAccess": "employee" }
       }
     ]
     ```
  3) Action types  
     `GET /api/reports/audit-trail/action-types`  
     Response:
     ```json
     ["APPROVAL_DECIDED", "LOGIN_FAILURE", "LOGIN_SUCCESS", "ORDER_CREATED", "ORDER_EDIT_REQUESTED", "ORDER_OVERRIDE", "ORDER_REJECTION_REQUESTED", "ORDER_STATUS_CHANGED", "PASSWORD_RESET", "USER_CREATED", "USER_STATUS_CHANGED"]
     ```

### CSV Export

- Usage: Tambahkan `?format=csv` pada endpoint report/audit berikut:
  - `/api/reports/consumption?format=csv`
  - `/api/reports/department?format=csv`
  - `/api/reports/performance?format=csv`
  - `/api/reports/rejections?format=csv`
  - `/api/reports/audit-trail?format=csv`
- Implementasi konversi CSV menggunakan [`json2csv`](backend/src/reports/services/export.service.ts:11) di [ExportService.exportToCSV()](backend/src/reports/services/export.service.ts:11)
- Header download disetel oleh helper controller [`setExportHeaders()`](backend/src/reports/reports.controller.ts:284) dengan Content-Type dan Content-Disposition yang sesuai.

### PDF Export (Stub)

- Status: Belum diimplementasikan (placeholder)
- Usage: `?format=pdf` tersedia pada semua endpoint di ReportsController
- Implementasi stub: [ExportService.exportToPDF()](backend/src/reports/services/export.service.ts:38) saat ini mengembalikan Buffer placeholder dan mencetak peringatan di console.
- Rencana: Integrasi library `pdfkit` atau render HTML via `puppeteer/Playwright` di masa depan.

### Testing Reports (curl)

Contoh pengujian (Windows `cmd` dengan `^`; di macOS/Linux ganti `^` menjadi `\`). Semua endpoint memerlukan akses administrator (`Authorization: Bearer &lt;ACCESS_TOKEN_ADMIN&gt;`).

1) Consumption (JSON, harian, 7 hari terakhir):
```bash
curl -X GET "http://localhost:3000/api/reports/consumption" ^
  -H "Authorization: Bearer <ACCESS_TOKEN_ADMIN>"
```

Consumption (CSV, bulanan, filter shiftId=1):
```bash
curl -X GET "http://localhost:3000/api/reports/consumption?groupBy=MONTHLY&shiftId=1&format=csv" ^
  -H "Authorization: Bearer <ACCESS_TOKEN_ADMIN>"
```

2) Department (JSON, rentang tanggal dan status):
```bash
curl -X GET "http://localhost:3000/api/reports/department?tanggalMulai=2025-09-01&tanggalAkhir=2025-10-01&status=READY" ^
  -H "Authorization: Bearer <ACCESS_TOKEN_ADMIN>"
```

Department (CSV):
```bash
curl -X GET "http://localhost:3000/api/reports/department?format=csv" ^
  -H "Authorization: Bearer <ACCESS_TOKEN_ADMIN>"
```

3) Performance (JSON, filter departemen dan shift):
```bash
curl -X GET "http://localhost:3000/api/reports/performance?departmentId=1&shiftId=1" ^
  -H "Authorization: Bearer <ACCESS_TOKEN_ADMIN>"
```

Performance (CSV, flattened rows):
```bash
curl -X GET "http://localhost:3000/api/reports/performance?format=csv" ^
  -H "Authorization: Bearer <ACCESS_TOKEN_ADMIN>"
```

4) Rejections (JSON, pagination + filter approvalStatus):
```bash
curl -X GET "http://localhost:3000/api/reports/rejections?approvalStatus=PENDING&page=1&limit=50" ^
  -H "Authorization: Bearer <ACCESS_TOKEN_ADMIN>"
```

Rejections (CSV):
```bash
curl -X GET "http://localhost:3000/api/reports/rejections?format=csv" ^
  -H "Authorization: Bearer <ACCESS_TOKEN_ADMIN>"
```

5) Audit Trail (JSON, pencarian teks + rentang tanggal):
```bash
curl -X GET "http://localhost:3000/api/reports/audit-trail?search=ORDER&tanggalMulai=2025-09-01&tanggalAkhir=2025-10-01&page=1&limit=50" ^
  -H "Authorization: Bearer <ACCESS_TOKEN_ADMIN>"
```

Audit Trail (CSV):
```bash
curl -X GET "http://localhost:3000/api/reports/audit-trail?format=csv" ^
  -H "Authorization: Bearer <ACCESS_TOKEN_ADMIN>"
```

Audit Trail — Order history by code:
```bash
curl -X GET "http://localhost:3000/api/reports/audit-trail/order/PM-20251001-001" ^
  -H "Authorization: Bearer <ACCESS_TOKEN_ADMIN>"
```

Audit Trail — Action types:
```bash
curl -X GET "http://localhost:3000/api/reports/audit-trail/action-types" ^
  -H "Authorization: Bearer <ACCESS_TOKEN_ADMIN>"
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
├─ src/prisma/         # PrismaModule &amp; PrismaService (wrapper DI untuk akses Prisma Client)
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
## Next Steps

- Phase 6: Reporting and audit trail APIs ✅
- Phase 9: Production deployment and PWA enhancements ✅

**Status: Production Ready! 🚀**

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
