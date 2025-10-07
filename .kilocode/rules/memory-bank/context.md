# CONTEXT — Bebang Pack Meal Portal

## Status Saat Ini (Oktober 2025)

### Update Terbaru — Dokumentasi Deployment Lengkap (COMPLETED)

Ringkasan:
- **Dokumentasi deployment komprehensif** telah selesai sepenuhnya dengan lima tutorial deployment yang siap digunakan untuk berbagai environment.
- **Tutorial deployment multi-platform** mencakup Linux, Docker, Kubernetes, Windows, dan jaringan LAN enterprise.
- **Production-ready configurations** dengan automation scripts, security hardening, dan monitoring procedures.
- **Phase 9 (PWA & Production)** telah selesai sepenuhnya dengan implementasi PWA enhancements, optimasi performa, hardening aksesibilitas, dan persiapan production build.
- Seluruh error TypeScript pada backend dan frontend telah diperbaiki (korupsi package.json, method logout, formatting, peningkatan type-safety, missing exports, unused imports).
- Kedua workspace sekarang lulus pemeriksaan type penuh dengan perintah: `npx tsc --noemit` (tanpa output build).
- Aplikasi berjalan fungsional penuh dengan kode TypeScript yang bersih dan siap untuk production deployment.

### Tutorial Deployment yang Telah Diselesaikan ✅ COMPLETED

**1. tutorial_deploy.md** - Tutorial Deployment Multi-Platform
- Deployment untuk Linux (Ubuntu/CentOS), Docker containers, dan Kubernetes clusters
- Step-by-step instructions untuk environment development hingga production
- Automation scripts untuk streamline deployment process
- Security hardening dan production best practices
- Monitoring dan health check configurations

**2. deploy_windows.md** - Tutorial Deployment Windows
- Deployment khusus untuk Windows 10/11 dan Windows Server
- PowerShell automation scripts untuk setup dan maintenance
- IIS configuration dan service management
- Windows-specific security configurations
- Performance optimization untuk Windows environment

**3. deploy_database.md** - Tutorial Manajemen Database
- Database backup dan restore procedures (staging ke production)
- Migration management dan rollback strategies
- Performance tuning dan monitoring database
- Security hardening database PostgreSQL
- Automated backup scripts dan disaster recovery

**4. deploy_jaringan.md** - Tutorial Deployment Jaringan LAN
- Setup deployment untuk akses multi-user dalam jaringan LAN
- Network configuration dan firewall settings
- Load balancing dan high availability setup
- Multi-server deployment dengan reverse proxy
- Network security dan access control

**5. windows_deploy.md** - Tutorial Deployment Production Windows
- Deployment production dengan IP spesifik (192.168.3.1)
- Enterprise-grade Windows deployment configuration
- Detailed step-by-step untuk production environment
- Security compliance dan audit trail setup
- Maintenance procedures dan troubleshooting guides

### Cakupan Tutorial Deployment

Setiap tutorial mencakup komponen lengkap:
- **Preparation & Prerequisites**: System requirements dan dependency setup
- **Step-by-Step Instructions**: Detailed guides dengan command examples
- **Automation Scripts**: PowerShell dan Bash scripts untuk automated deployment
- **Security Hardening**: Best practices untuk production security
- **Monitoring & Maintenance**: Health checks, logging, dan maintenance procedures
- **Troubleshooting**: Common issues dan solutions
- **Production Configurations**: Environment-specific configs untuk production deployment

Catatan operasional:
- Jalankan pemeriksaan type secara cepat dari root monorepo:
  - Backend: `npm exec -w backend tsc --noemit`
  - Frontend: `npm exec -w frontend tsc --noemit`
- Disarankan menambahkan langkah type-check pada CI pipeline sebelum proses build untuk mencegah regresi ke depannya.
- Aplikasi siap untuk deployment dengan konfigurasi PWA, optimasi performa, dan aksesibilitas yang telah di-hardening.

### Update Terbaru — Status Autentikasi & Development Server (Oktober 2025)

#### Perbaikan Autentikasi (401 Unauthorized)
- **Masalah 401 Unauthorized sudah diselesaikan**:
  - JWT Guard Global conflict diperbaiki dengan proper guard chaining di [JwtAuthGuard](backend/src/common/guards/jwt-auth.guard.ts:7)
  - Frontend axios interceptor diperkuat dengan localStorage fallback melalui fungsi [getAccessTokenSafe()](frontend/src/lib/axios.ts:80)
  - Token refresh mechanism sekarang berfungsi dengan baik untuk menghindari expired session
  - Password hash protection ditingkatkan dengan bcrypt dan tidak pernah diekspor ke klien

#### Status TypeScript
- **Error TS5097 di frontend/main.tsx diperbaiki**:
  - Semua error TypeScript telah diperbaiki di backend dan frontend
  - Kedua workspace sekarang lulus pemeriksaan type penuh
  - Typecheck scripts tersedia di root, backend, dan frontend workspace

#### Status Development Server
- **npm run dev berjalan normal**:
  - Backend dan frontend berjalan tanpa startup errors
  - WebSocket connection stabil pada port 3001
  - Hot reload berfungsi dengan baik untuk kedua workspace

#### Master Data Frontend
- **Penambahan MasterDataPage untuk administrator**:
  - Halaman [MasterDataPage.tsx](frontend/src/pages/admin/MasterDataPage.tsx:1) untuk melihat data master (Departments, Jabatan, Shifts)
  - Menu "Master Data" sudah ada di [Sidebar.tsx](frontend/src/components/layout/Sidebar.tsx:36) untuk role administrator
  - Integrasi dengan backend API melalui [master.api.ts](frontend/src/services/api/master.api.ts:1) dengan fallback ke stub data

### Update Terbaru — Offline Support Fixes (PWA)

- **Perbaikan Infinite Redirect Loop di Service Worker**:
  - Root cause: navigasi ke halaman offline yang ikut ditangani kembali oleh strategi offline sehingga berulang
  - Solusi: Memperbaiki strategi navigasi offline di [frontend/vite.config.ts](frontend/vite.config.ts:88-107) dengan pengecualian untuk request ke offline page dan non-navigation routes (API/assets)
  - Service worker sekarang hanya melakukan offline fallback untuk navigation requests yang gagal, menghindari redirect berulang ke offline page
  - Penambahan logika offline detection yang menyinkronkan dengan cache policy saat online kembali

- **Implementasi Offline Detection di AppShell**:
  - Penambahan logika offline detection di [frontend/src/components/layout/AppShell.tsx](frontend/src/components/layout/AppShell.tsx:36-53) menggunakan `navigator.onLine` dan event listeners
  - Redirect otomatis ke halaman offline saat koneksi terputus dan user mengakses halaman lain
  - Indikator status koneksi real-time dengan animasi dan notifikasi toast

- **UI Components untuk Offline Experience**:
  - Indikator offline status real-time via [frontend/src/components/pwa/OfflineIndicator.tsx](frontend/src/components/pwa/OfflineIndicator.tsx:1) dengan toast notifications
  - Implementasi halaman offline khusus [frontend/src/pages/OfflinePage.tsx](frontend/src/pages/OfflinePage.tsx:1) dengan fallback UI dan opsi retry
  - Konsistensi visual dengan tema aplikasi (dark mode support) dan aksesibilitas

- **Technical Implementation Details**:
  - Service worker menggunakan NetworkOnly strategy untuk navigation requests dengan custom handlerDidError
  - Cached SPA shell disajikan sebagai fallback untuk menghindari redirect loop saat offline
  - Minimal offline shell sebagai safe fallback ketika cache tidak tersedia
  - Event listeners untuk 'online'/'offline' dengan proper cleanup dan state management

### Fase Pengembangan: Phase 9 Selesai — PWA & Production Ready (COMPLETED)

Pencapaian utama Phase 9:
- **PWA Enhancements**:
  - Konfigurasi vite-plugin-pwa 1.0.3 dengan precache patterns dan offline fallback route
  - Runtime caching strategy untuk API baca yang aman (stale-while-revalidate)
  - Service worker dengan proper cache management dan update handling
  - PWA manifest dengan icons, theme colors, dan display settings yang optimal
- **Offline Support Fixes**:
  - Perbaikan infinite redirect loop di service worker dengan memperbaiki strategi navigasi offline di [frontend/vite.config.ts](frontend/vite.config.ts:88-107)
  - Penambahan logika offline detection di [frontend/src/components/layout/AppShell.tsx](frontend/src/components/layout/AppShell.tsx:36-53) dengan indikator status koneksi real-time
  - Implementasi halaman offline khusus [frontend/src/pages/OfflinePage.tsx](frontend/src/pages/OfflinePage.tsx:1) dengan fallback UI dan opsi retry
  - Indikator offline status real-time via [frontend/src/components/pwa/OfflineIndicator.tsx](frontend/src/components/pwa/OfflineIndicator.tsx:1) dengan toast notifications
  - Service worker sekarang hanya melakukan fallback untuk navigation requests yang gagal, menghindari loop tak terbatas
  - Deteksi status koneksi menggunakan `navigator.onLine` dan event listeners 'online'/'offline'

- **Performance Optimization**:
  - Advanced code-splitting dengan lazy-loading untuk halaman berat (Reports, Audit Trail, Users Management)
  - Bundle optimization dengan tree shaking dan asset compression
  - Optimasi loading states dan transition animations
  - Audit bundle dan pengurangan ukuran initial load

- **Accessibility Hardening (WCAG 2.1 AA)**:
  - Navigasi keyboard lengkap dengan proper focus management
  - Label ARIA yang komprehensif untuk screen readers
  - Kontras warna yang memenuhi standar aksesibilitas
  - Heading hierarchy yang terstruktur dengan benar
  - Keyboard traps prevention dan focus trap management

- **Production Readiness**:
  - Build final untuk backend dan frontend dengan optimasi penuh
  - Validasi environment variables untuk production
  - Error boundaries yang kuat dengan user-friendly error messages
  - Logging dan monitoring setup dasar untuk production
  - Health check endpoints dan monitoring infrastructure

- **End-to-End Verification**:
  - Regresi fungsional untuk seluruh peran (administrator, employee, dapur, delivery)
  - Verifikasi real-time events dan WebSocket connections
  - Smoke test untuk seluruh alur utama (order creation, approval workflow, status updates)
  - Cross-browser compatibility testing

### Fase Pengembangan: Phase 3 Selesai — Authentication & Authorization (COMPLETED)

Pencapaian utama Phase 3:
- Implementasi autentikasi JWT end-to-end:
  - [AuthService.login()](backend/src/auth/auth.service.ts:106), [AuthService.generateTokens()](backend/src/auth/auth.service.ts:151), [AuthService.refreshTokens()](backend/src/auth/auth.service.ts:202), [AuthService.getUserProfile()](backend/src/auth/auth.service.ts:239)
  - Payload JWT terstandarisasi dengan [JwtPayload](backend/src/common/interfaces/jwt-payload.interface.ts:1)
- Guard global terpasang di bootstrap:
  - [JwtAuthGuard](backend/src/common/guards/jwt-auth.guard.ts:7) untuk autentikasi
  - [RolesGuard](backend/src/common/guards/roles.guard.ts:10) untuk otorisasi berbasis peran
  - Dokumentasi guard global di [main.ts](backend/src/main.ts:1)
- Dekorator untuk kontrol akses:
  - [Public()](backend/src/common/decorators/public.decorator.ts:4) untuk membuka route tanpa JWT
  - [Roles(...)](backend/src/common/decorators/roles.decorator.ts:17) untuk persyaratan role handler
- Audit trail terintegrasi sebagai cross-cutting concern:
  - [AuditTrailService](backend/src/common/services/audit-trail.service.ts:29) dengan helper: login success/failure, user created, status changed, role changed, password reset
  - Modul global [CommonModule](backend/src/common/common.module.ts:9) mengekspor service ini
  - Dokumentasi modul di [backend/src/common/README.md](backend/src/common/README.md:1)
- Users management dasar terimplementasi di service:
  - [UsersService.createUser()](backend/src/users/users.service.ts:24), [UsersService.updateStatus()](backend/src/users/users.service.ts:113), [UsersService.updateRole()](backend/src/users/users.service.ts:149), [UsersService.resetPassword()](backend/src/users/users.service.ts:197)
  - Dokumentasi high-level operasi di header [users.service.ts](backend/src/users/users.service.ts:1)
- Konfigurasi aplikasi diperkuat:
  - Urutan dan dependensi modul terdokumentasi di [app.module.ts](backend/src/app.module.ts:1)
  - CORS, Validation Pipe, dan API Prefix telah dikonfigurasi dan terdokumentasi di [main.ts](backend/src/main.ts:1)

Catatan Testing:
- Login credentials untuk testing tetap tersedia (ADM001/admin123, EMP001/emp123, KIT001/kitchen123, DEL001/delivery123, EMP002/emp123)

Phase 1 (Project Scaffolding) dan Phase 2 (Database & Core Models) telah selesai sepenuhnya. Backend dan frontend berjalan stabil dengan perbaikan yang telah dilakukan.

### Yang Telah Diselesaikan di Phase 1
✅ **Infrastruktur Monorepo**
- Struktur workspace dengan backend (NestJS) dan frontend (React + Vite)
- Konfigurasi build, linting, dan formatting terpusat
- Git hooks dengan Husky untuk quality control
- Root package.json dengan workspace configuration
- Script commands untuk concurrent development

✅ **Backend Foundation**
- NestJS 10 dengan TypeScript setup
- Konfigurasi environment variables (.env.example dan .env)
- CORS dan validation pipe global dengan perbaikan parsing
- Health check endpoint (/api/health)
- Dependensi inti: Prisma ORM, JWT, WebSockets, class-validator
- Konfigurasi ESLint, Prettier, TypeScript, dan NestJS CLI
- Struktur direktori dasar untuk modules (auth, users, orders, dll.)
- Perbaikan CORS configuration untuk menghindari undefined chaining issues
- Perbaikan API prefix configuration dengan konstanta

✅ **Frontend Foundation**
- React 18 + Vite 5 + TypeScript
- Tailwind CSS dengan desain system (primary emerald, accent amber)
- PWA configuration dengan vite-plugin-pwa
- Dark mode support dengan theme switching
- Development proxy untuk API dan WebSocket
- Konfigurasi ESLint, Prettier, dan TypeScript
- Landing page dasar dengan environment variable display
- Struktur direktori dasar untuk components, pages, hooks, dll.
- Update dependencies ke versi terbaru (Vite 7.1.7, vite-plugin-pwa 1.0.3)

✅ **Development Environment**
- ESLint + Prettier untuk kedua workspace
- TypeScript strict mode
- Hot reload development server
- Environment configuration templates
- Script commands untuk development, build, lint, dan format
- Perbaikan port configuration dan proxy settings

✅ **Perbaikan yang Telah Dilakukan**
- Backend: Perbaikan CORS configuration parsing untuk menghindari undefined chaining
- Backend: Perbaikan API prefix configuration dengan menggunakan konstanta
- Dependencies: Update Vite ke versi 7.1.7 dan vite-plugin-pwa ke 1.0.3
- Environment: Konfigurasi environment variables yang konsisten antara backend dan frontend
- Proxy: Konfigurasi proxy yang robust untuk API dan WebSocket connections

### Update Terbaru — Database Default Status Pesanan
- Update schema: penambahan @default(MENUNGGU) pada field statusPesanan di [backend/prisma/schema.prisma](backend/prisma/schema.prisma:1)
- Migrasi baru dibuat: [20251001083412_add_default_status_pesanan](backend/prisma/migrations/20251001083412_add_default_status_pesanan/migration.sql:1)
- Database sekarang memiliki default value yang tepat untuk workflow pesanan (status awal: MENUNGGU)

### Fase Pengembangan: Phase 4 Selesai — Order Management & Workflow (COMPLETED)

### Yang Telah Diselesaikan di Phase 4 - Order Management & Workflow ✅ COMPLETED

Pencapaian utama Phase 4:
- **Orders Module lengkap** dengan business logic untuk order lifecycle
- **Event-Driven Architecture** dengan @nestjs/event-emitter melalui [EventEmitterModule.forRoot()](backend/src/app.module.ts:41)
- **Approval Workflow** untuk Dapur rejection/edit dengan Admin approval
- **Role-Based Status Transitions** dengan validasi per role
- **Auto-Generated Order Codes** format PM-YYYYMMDD-XXX
- **Comprehensive Audit Trail** untuk semua order actions via [AuditTrailService](backend/src/common/services/audit-trail.service.ts:29)
- **8 API Endpoints** dengan role-based access control

Komponen yang Diimplementasikan:
- Event classes: [OrderStatusChangedEvent](backend/src/common/events/order-status-changed.event.ts:1), [OrderApprovalRequestedEvent](backend/src/common/events/order-approval-requested.event.ts:1), [OrderApprovalDecidedEvent](backend/src/common/events/order-approval-decided.event.ts:1)
- DTOs untuk operasi order dengan validation (create, update status, reject, edit, approve/reject, query): 
  - [CreateOrderDto](backend/src/orders/dto/create-order.dto.ts:1), [UpdateOrderStatusDto](backend/src/orders/dto/update-order-status.dto.ts:1), [RejectOrderDto](backend/src/orders/dto/reject-order.dto.ts:1), [EditOrderDto](backend/src/orders/dto/edit-order.dto.ts:1), [ApproveRejectOrderDto](backend/src/orders/dto/approve-reject-order.dto.ts:1), [QueryOrdersDto](backend/src/orders/dto/query-orders.dto.ts:1)
- Orders business logic: [OrdersService](backend/src/orders/orders.service.ts:1) dengan metode lengkap untuk lifecycle dan approval
- HTTP endpoints: [OrdersController](backend/src/orders/orders.controller.ts:1) dengan rute terproteksi oleh [RolesGuard](backend/src/common/guards/roles.guard.ts:10)
- Modul: [OrdersModule](backend/src/orders/orders.module.ts:1) terdaftar di [AppModule](backend/src/app.module.ts:1) bersama EventEmitter

API Endpoints yang Tersedia:
- Employee:
  - POST /api/orders (create) → [OrdersController.create()](backend/src/orders/orders.controller.ts:57)
  - GET /api/orders (list own) → [OrdersController.findAll()](backend/src/orders/orders.controller.ts:71)
  - GET /api/orders/:id (details) → [OrdersController.findOne()](backend/src/orders/orders.controller.ts:95)
- Dapur:
  - GET /api/orders (process queue) → [OrdersController.findAll()](backend/src/orders/orders.controller.ts:71)
  - PATCH /api/orders/:id/status (update) → [OrdersController.updateStatus()](backend/src/orders/orders.controller.ts:108)
  - POST /api/orders/:id/request-rejection → [OrdersController.requestRejection()](backend/src/orders/orders.controller.ts:128)
  - POST /api/orders/:id/request-edit → [OrdersController.requestEdit()](backend/src/orders/orders.controller.ts:144)
- Delivery:
  - GET /api/orders (deliver queue) → [OrdersController.findAll()](backend/src/orders/orders.controller.ts:71)
  - PATCH /api/orders/:id/status (update) → [OrdersController.updateStatus()](backend/src/orders/orders.controller.ts:108)
- Admin:
  - GET /api/orders (all) → [OrdersController.findAll()](backend/src/orders/orders.controller.ts:71)
  - GET /api/orders/pending-approvals → [OrdersController.getPendingApprovals()](backend/src/orders/orders.controller.ts:85)
  - POST /api/orders/:id/approve-reject → [OrdersController.approveRejectRequest()](backend/src/orders/orders.controller.ts:158)
  - PATCH /api/orders/:id/status (override) → [OrdersController.updateStatus()](backend/src/orders/orders.controller.ts:108)

Event Emission untuk Real-Time:
- order.created — notifikasi pesanan baru → [OrdersService.create()](backend/src/orders/orders.service.ts:126)
- order.status.changed — transisi status → [OrdersService.updateStatus()](backend/src/orders/orders.service.ts:307)
- order.approval.requested — permintaan approval → [OrdersService.requestRejection()](backend/src/orders/orders.service.ts:369), [OrdersService.requestEdit()](backend/src/orders/orders.service.ts:439)
- order.approval.decided — keputusan admin → [OrdersService.approveRejectRequest()](backend/src/orders/orders.service.ts:534)

### Perbaikan Pasca-Implementasi Phase 4

Setelah review menyeluruh, telah dilakukan perbaikan berikut pada Orders Module:

**Audit Trail Logging untuk Approval Flow Status Transitions:**
- Menambahkan logging status change untuk semua transisi yang dipicu oleh approval workflow
- [OrdersService.requestRejection()](backend/src/orders/orders.service.ts:333): Log status change dari current status → MENUNGGU_PERSETUJUAN
- [OrdersService.requestEdit()](backend/src/orders/orders.service.ts:404): Log status change dari current status → MENUNGGU_PERSETUJUAN  
- [OrdersService.approveRejectRequest()](backend/src/orders/orders.service.ts:483): Log status change berdasarkan keputusan admin:
  - APPROVED + REJECT: MENUNGGU_PERSETUJUAN → DITOLAK
  - REJECTED: MENUNGGU_PERSETUJUAN → MENUNGGU
- Semua perubahan status sekarang tercatat dengan oldStatus dan newStatus yang lengkap

**Query Parameter Boolean Conversion:**
- Memperbaiki requiresApproval filter dengan menambahkan [@Type(() => Boolean)](backend/src/orders/dto/query-orders.dto.ts:29) decorator pada [QueryOrdersDto](backend/src/orders/dto/query-orders.dto.ts:1)
- Query parameter string "true"/"false" sekarang dikonversi ke boolean dengan benar
- Endpoint /api/orders?requiresApproval=true sekarang memfilter orders dengan benar

**Status Orders Module:**
- Semua API endpoints berfungsi dengan proper audit trail
- Query filters berfungsi dengan benar termasuk boolean parameters
- Event emission untuk real-time notifications siap digunakan di Phase 5

### Fase Pengembangan: Phase 5 Selesai — WebSocket Gateway Implementation (COMPLETED)

Pencapaian utama Phase 5:
- Socket.IO terintegrasi dengan namespace khusus untuk notifikasi: [backend/src/websocket/websocket.gateway.ts](backend/src/websocket/websocket.gateway.ts:36)
- Autentikasi JWT untuk koneksi WebSocket melalui guard khusus: [backend/src/websocket/websocket.guard.ts](backend/src/websocket/websocket.guard.ts:7)
  - Verifikasi token saat handshake: [backend/src/websocket/websocket.guard.ts](backend/src/websocket/websocket.guard.ts:13)
  - Ekstraksi token dari beberapa lokasi umum (auth, Authorization header, query): [backend/src/websocket/websocket.guard.ts](backend/src/websocket/websocket.guard.ts:41)
- Broadcasting berbasis room dengan skema berlapis (role, department, user, karyawan):
  - Penggabungan client ke room terstruktur pada saat koneksi: [backend/src/websocket/websocket.gateway.ts](backend/src/websocket/websocket.gateway.ts:251)
  - Emit ke beberapa rooms secara union semantics: [backend/src/websocket/websocket.gateway.ts](backend/src/websocket/websocket.gateway.ts:286)
  - Room yang digunakan:
    - Global per role: role:<role>
    - Per user: user:<userId> (sub)
    - Per karyawan: karyawan:<karyawanId>
    - Per department: dept:<departmentId>
    - Kombinasi dept + role: dept:<departmentId>:role:<role>
- Siklus koneksi dan manajemen lifecycle lengkap:
  - Inisialisasi gateway dan refine CORS origins: [backend/src/websocket/websocket.gateway.ts](backend/src/websocket/websocket.gateway.ts:60)
  - Penanganan koneksi dan join rooms: [backend/src/websocket/websocket.gateway.ts](backend/src/websocket/websocket.gateway.ts:86)
  - Penanganan disconnect: [backend/src/websocket/websocket.gateway.ts](backend/src/websocket/websocket.gateway.ts:110)
  - Resolusi CORS origin dari environment: [backend/src/websocket/websocket.gateway.ts](backend/src/websocket/websocket.gateway.ts:329)
- Event listeners (mengonsumsi event dari OrdersModule):
  - Pesanan dibuat: order.created → [backend/src/websocket/websocket.gateway.ts](backend/src/websocket/websocket.gateway.ts:123)
  - Status pesanan berubah: order.status.changed → [backend/src/websocket/websocket.gateway.ts](backend/src/websocket/websocket.gateway.ts:153)
  - Permintaan approval dapur: order.approval.requested → [backend/src/websocket/websocket.gateway.ts](backend/src/websocket/websocket.gateway.ts:207)
  - Keputusan admin atas approval: order.approval.decided → [backend/src/websocket/websocket.gateway.ts](backend/src/websocket/websocket.gateway.ts:229)
- Konfigurasi modul dan JWT untuk gateway:
  - Registrasi JwtModule via ConfigService (secret dan expiry dari env): [backend/src/websocket/websocket.module.ts](backend/src/websocket/websocket.module.ts:17)
  - Ekspor NotificationsGateway untuk digunakan lintas modul: [backend/src/websocket/websocket.module.ts](backend/src/websocket/websocket.module.ts:28)

Catatan arsitektur:
- Guard WsJwtGuard menempelkan payload JWT yang telah diverifikasi ke client.data.user untuk diakses oleh handler gateway.
- departmentId diterima dari handshake (auth atau query) agar dapat melakukan broadcasting yang presisi per-department.

Hasil:
- Real-time notifications telah berfungsi end-to-end untuk skenario inti (pembuatan pesanan, perubahan status, workflow approval) dengan target audiens yang tepat (role, department, dan user/karyawan terkait).

### Update Terbaru — WebSocket Dedicated Server Binding & Approval Notifications (Hardening)

- Dedicated Socket.IO server (WS_PORT=3001)
  - Server WebSocket dijalankan pada port terpisah menggunakan adapter kustom [DedicatedSocketIoAdapter.createIOServer()](backend/src/main.ts:53) dengan konfigurasi CORS di level server dan transport murni WebSocket.
  - Adapter dipasang secara global melalui [app.useWebSocketAdapter(...)](backend/src/main.ts:119) sehingga seluruh Gateway NestJS menggunakan server WS dedicated.
  - Namespace notifikasi diekspos pada http://localhost:3001/notifications, tervalidasi oleh log bootstrap di [bootstrap()](backend/src/main.ts:130).
  - Transport dipaksa WebSocket-only (transports: ['websocket']) pada [DedicatedSocketIoAdapter.createIOServer()](backend/src/main.ts:63) dan sinkron dengan deklarasi gateway di [@WebSocketGateway](backend/src/websocket/websocket.gateway.ts:36).

- Adapter pattern terintegrasi dengan NestJS
  - Meng-extend IoAdapter dari @nestjs/platform-socket.io melalui kelas [DedicatedSocketIoAdapter](backend/src/main.ts:42) untuk integrasi lifecycle Nest dan namespace gateway secara konsisten.
  - Sumber CORS origin diselesaikan satu kali dan diterapkan ke server IO, konsisten dengan resolusi CORS HTTP.

- Perbaikan approval request notifications
  - Event payload diperluas: menambahkan karyawanPemesanId di [OrderApprovalRequestedEvent](backend/src/common/events/order-approval-requested.event.ts:11).
  - Gateway kini melakukan broadcast langsung ke employee pemilik pesanan via room karyawan: [NotificationsGateway.handleApprovalRequested()](backend/src/websocket/websocket.gateway.ts:201).
  - Emisi event di service diperbarui agar menyertakan karyawanPemesanId pada
    - [OrdersService.requestRejection()](backend/src/orders/orders.service.ts:378)
    - [OrdersService.requestEdit()](backend/src/orders/orders.service.ts:456)

- Hasil
  - Binding WS stabil pada port dedicated (3001) dengan transport WebSocket murni.
  - Notifikasi approval lebih tepat sasaran: admin (global), admin per-department, dan employee terkait menerima update secara serentak.

### Fase Pengembangan: Phase 6 Selesai — Reports & Audit Trail Module (COMPLETED)

#### Verifikasi Implementasi Phase 6 — SEMUA KOMPONEN TERIMPLEMENTASI DENGAN BENAR

- Reports Module Core Components — ✅ VERIFIED Lengkap
  - [backend/src/reports/services/reports.service.ts](backend/src/reports/services/reports.service.ts)
  - [backend/src/reports/reports.controller.ts](backend/src/reports/reports.controller.ts)
  - [backend/src/reports/reports.module.ts](backend/src/reports/reports.module.ts)
- AuditTrailService Query Methods — ✅ VERIFIED Lengkap
  - Metode: query, getByOrderCode, getActionTypes di [backend/src/common/services/audit-trail.service.ts](backend/src/common/services/audit-trail.service.ts)
- AppModule Registration — ✅ VERIFIED Lengkap
  - Import [backend/src/reports/reports.module.ts](backend/src/reports/reports.module.ts) pada [backend/src/app.module.ts](backend/src/app.module.ts), posisi di imports array dan dokumentasi konsisten
- Documentation — ✅ VERIFIED Lengkap
  - [backend/README.md](backend/README.md) dan [README.md](README.md) telah diperbarui dan selaras dengan implementasi

#### Ketersediaan API Endpoints (7 endpoints)

- Reports (4 endpoints):
  - Consumption Report
  - Department Report
  - Performance Report
  - Rejections Report
- Audit Trail (3 endpoints):
  - Query (filterable)
  - Order History by Order Code
  - Action Types

Kesimpulan: Phase 6 — Reports & Audit Trail Module COMPLETED. Backend fully functional untuk kapabilitas reporting dan audit trail.

### Fase Pengembangan: Phase 7 Selesai — Frontend Foundation (Authentication & Routing) (COMPLETED)

Pencapaian utama Phase 7 (Frontend):
- Authentication system di frontend terintegrasi dengan JWT + refresh token:
  - Zustand store untuk sesi: [auth.store.ts](frontend/src/stores/auth.store.ts:1)
  - Axios instance dengan interceptor Bearer dan refresh: [axios.ts](frontend/src/lib/axios.ts:1)
  - Types untuk payload/token: [auth.types.ts](frontend/src/types/auth.types.ts:1)
- Protected routes dengan role-based access control (RBAC):
  - Guard komponen protected: [ProtectedRoute.tsx](frontend/src/components/auth/ProtectedRoute.tsx:1)
  - Konfigurasi router dengan React Router v6: [router/index.tsx](frontend/src/router/index.tsx:1)
- UI component library dasar:
  - Button: [Button.tsx](frontend/src/components/ui/Button.tsx:1)
  - Card: [Card.tsx](frontend/src/components/ui/Card.tsx:1)
  - Input: [Input.tsx](frontend/src/components/ui/Input.tsx:1)
  - Badge: [Badge.tsx](frontend/src/components/ui/Badge.tsx:1)
- Layout system:
  - AppShell: [AppShell.tsx](frontend/src/components/layout/AppShell.tsx:1)
  - Sidebar: [Sidebar.tsx](frontend/src/components/layout/Sidebar.tsx:1)
  - Topbar: [Topbar.tsx](frontend/src/components/layout/Topbar.tsx:1)
- Theme management dengan dark mode:
  - Hook tema: [useTheme.ts](frontend/src/hooks/useTheme.ts:1)
  - Styles global: [index.css](frontend/src/styles/index.css:1)
- Routing pages utama:
  - Login: [LoginPage.tsx](frontend/src/pages/LoginPage.tsx:1)
  - Dashboard: [DashboardPage.tsx](frontend/src/pages/DashboardPage.tsx:1)
  - Unauthorized: [UnauthorizedPage.tsx](frontend/src/pages/UnauthorizedPage.tsx:1)
  - Not Found: [NotFoundPage.tsx](frontend/src/pages/NotFoundPage.tsx:1)
- Perbaikan TypeScript:
  - Penyelarasan strict mode di [tsconfig.json](frontend/tsconfig.json:1)
  - Penyesuaian tipe untuk auth dan route props di [auth.types.ts](frontend/src/types/auth.types.ts:1) dan [router/index.tsx](frontend/src/router/index.tsx:1)

Hasil: Frontend foundation untuk authentication & routing telah selesai dan stabil; siap integrasi order management pada Phase 8.

## Alur Kerja Dapur & RBAC Updates (COMPLETED)

### Perbaikan RBAC untuk Role Dapur

#### Masalah yang Diperbaiki
- **403 Forbidden Error**: Role dapur sebelumnya tidak dapat mengakses endpoint `/api/orders/pending-approvals`
- **Business Logic Gap**: Dapur perlu melihat permintaan approval yang mereka ajukan untuk tracking dan follow-up
- **Inconsistent Access**: Administrator dapat mengakses endpoint tetapi dapur tidak, padahal keduanya terlibat dalam workflow approval

#### Solusi yang Diimplementasikan
- **Update RBAC Configuration**: Menambahkan role 'dapur' ke decorator `@Roles` pada endpoint `getPendingApprovals()` di [OrdersController](backend/src/orders/orders.controller.ts:88)
- **Access Control Alignment**: Sekarang kedua role ('administrator' dan 'dapur') dapat mengakses endpoint pending approvals sesuai kebutuhan business logic
- **Validation Scripts**: Membuat skrip test untuk memverifikasi perbaikan:
  - [test-dapur-pending-approvals.js](scripts/test-dapur-pending-approvals.js:1) - Test khusus untuk akses dapur
  - [test-pending-approvals-endpoint.js](scripts/test-pending-approvals-endpoint.js:1) - Test komprehensif untuk semua role

#### Status Perbaikan
- ✅ **COMPLETED**: Role dapur sekarang dapat mengakses `/api/orders/pending-approvals` dengan token yang valid
- ✅ **VERIFIED**: Administrator tetap dapat mengakses endpoint tanpa gangguan
- ✅ **TESTED**: Skrip test konfirmasi kedua role dapat mengakses endpoint sesuai harapan

### Alur Kerja Dapur yang Komprehensif

#### Tanggung Jawab Role Dapur
1. **Monitoring Antrian Pesanan**
   - Melihat pesanan berstatus "Menunggu", "Diproses", dan "Siap"
   - Mengupdate status pesanan sesuai tahap produksi
   - Dashboard real-time di [DapurDashboardPage.tsx](frontend/src/pages/dapur/DapurDashboardPage.tsx:1)

2. **Manajemen Status Pesanan**
   - **Menunggu → Diproses**: Saat mulai mengerjakan pesanan
   - **Diproses → Siap**: Saat pesanan selesai dibuat dan siap diantar
   - **Siap → Complete**: Saat pesanan telah diambil/diantar

3. **Workflow Approval untuk Penolakan/Perubahan**
   - **Request Rejection**: Ajukan penolakan pesanan dengan alasan jelas
   - **Request Edit**: Ajukan perubahan jumlah pesanan dengan justifikasi
   - **Tracking Approval**: Monitor status permintaan approval yang diajukan
   - Akses ke pending approvals untuk melihat status permintaan mereka

#### Endpoint-endpoint yang Dapat Diakses Dapur
1. **GET /api/orders** - Melihat daftar pesanan (filter berdasarkan role dapur)
2. **GET /api/orders/:id** - Melihat detail pesanan spesifik
3. **PATCH /api/orders/:id/status** - Mengupdate status pesanan
4. **POST /api/orders/:id/request-rejection** - Mengajukan penolakan pesanan
5. **POST /api/orders/:id/request-edit** - Mengajukan perubahan jumlah pesanan
6. **GET /api/orders/pending-approvals** - Melihat daftar permintaan approval (termasuk yang diajukan sendiri)

#### Alur Approval/Request Rejection yang Melibatkan Dapur
1. **Inisiasi Permintaan**:
   - Dapur mengajukan penolakan/edit melalui endpoint khusus
   - Sistem mengubah status pesanan menjadi "MENUNGGU_PERSETUJUAN"
   - Notifikasi terkirim ke administrator via WebSocket

2. **Review Administrator**:
   - Administrator menerima notifikasi di dashboard
   - Administrator dapat menyetujui atau menolak permintaan
   - Keputusan administrator mempengaruhi status akhir pesanan

3. **Resolusi**:
   - **Jika disetujui**: Status berubah sesuai permintaan (DITOLAK atau kembali ke MENUNGGU dengan jumlah baru)
   - **Jika ditolak**: Status kembali ke status sebelumnya
   - Notifikasi terkirim ke dapur tentang keputusan administrator

#### Validasi Business Logic
- **Hak Akses Sesuai Peran**: Dapur hanya dapat mengajukan permintaan, tidak dapat menyetujui
- **Audit Trail Lengkap**: Semua perubahan status tercatat dengan user dan timestamp
- **Real-time Notifications**: WebSocket events untuk update status instan
- **Consistent UI**: Frontend menampilkan informasi yang konsisten dengan hak akses backend

### Integrasi Frontend-Backend untuk Alur Dapur

#### Dashboard Dapur
- [DapurDashboardPage.tsx](frontend/src/pages/dapur/DapurDashboardPage.tsx:1) menampilkan:
  - Statistik pesanan hari ini (Menunggu, Diproses, Siap)
  - Jumlah permintaan approval yang pending
  - Preview antrian pesanan
  - Tombol navigasi ke antrian lengkap dan persetujuan

#### Navigasi & Routing
- `/orders/queue` - Halaman antrian lengkap dengan Kanban board
- `/orders/pending-approvals` - Halaman persetujuan untuk dapur
- Routing dengan guard peran di [ProtectedRoute.tsx](frontend/src/components/auth/ProtectedRoute.tsx:1)

#### API Integration
- [orders.api.ts](frontend/src/services/api/orders.api.ts:1) menyediakan fungsi:
  - `getOrders()` - Mengambil daftar pesanan
  - `getPendingApprovals()` - Mengambil daftar permintaan approval
  - `updateOrderStatus()` - Mengupdate status pesanan
  - `requestRejection()` - Mengajukan penolakan
  - `requestEdit()` - Mengajukan perubahan

## Status Aplikasi Saat Ini — Production Ready

### Pencapaian Utama Phase 9 (Production Readiness)
- **PWA Implementation**: Service worker dengan proper caching strategies, offline support yang diperbaiki (fix infinite loop), dan app-like experience
- **Offline Support**: Detection status koneksi real-time, halaman offline khusus, dan indikator offline yang user-friendly
- **Performance Optimization**: Code-splitting, lazy-loading, dan bundle optimization untuk fast loading
- **Accessibility Compliance**: WCAG 2.1 AA compliance dengan keyboard navigation dan screen reader support
- **Production Build**: Optimized builds untuk backend dan frontend dengan proper error handling
- **End-to-End Testing**: Comprehensive testing untuk semua user flows dan edge cases

### Technical Debt & Considerations — RESOLVED

#### Performance ✅ RESOLVED
- Caching strategy diimplementasikan melalui PWA service worker
- Database optimization dengan proper indexing dan query optimization
- Lazy loading diimplementasikan untuk komponen berat

#### Security ✅ RESOLVED
- Input validation dengan ValidationPipe global
- Rate limiting dan security headers
- Audit trail lengkap untuk compliance
- Password hash protection dengan bcrypt

#### Testing ✅ RESOLVED
- E2E testing dengan Playwright untuk critical user flows
- Component testing untuk UI components
- API testing untuk backend endpoints

#### Monitoring ✅ RESOLVED
- Structured logging dengan proper error tracking
- Performance monitoring untuk API response times
- Health check endpoints untuk monitoring infrastructure

## Environment Configuration

### Development
- Backend: http://localhost:3000 ✅ BERJALAN STABIL
- Frontend: http://localhost:5173 ✅ BERJALAN STABIL
- Database: PostgreSQL lokal ✅ TERKONFIGURASI
- WebSocket: http://localhost:3001

### Production Ready
- Backend build: ✅ COMPLETED dengan optimasi penuh
- Frontend build: ✅ COMPLETED dengan PWA dan optimasi
- Environment validation: ✅ COMPLETED
- Error boundaries: ✅ COMPLETED
- Monitoring setup: ✅ COMPLETED

### Dependencies Status
- Semua dependensi utama sudah terinstall
- Dependencies telah diupdate ke versi terbaru (Vite 7.1.7, vite-plugin-pwa 1.0.3)
- Tidak ada dependensi yang outdated
- Tidak ada security vulnerabilities yang diketahui

## Troubleshooting yang Telah Dilakukan

### Backend Issues
- CORS Configuration: parsing diperbaiki untuk menghindari undefined chaining issues
- API Prefix: disederhanakan dengan konstanta
- Environment Variables: konsisten dan robust

### Frontend Issues
- Dependencies: update ke versi terbaru untuk compatibility
- Proxy Configuration: setup robust untuk API/WebSocket
- Theme System: dark/light mode berfungsi baik

### Development Environment
- Port Conflicts: resolusi konflik port antara backend dan frontend
- Hot Reload: memastikan hot reload berfungsi baik
- Environment Variables: validasi dan testing konfigurasi

### Autentikasi Issues (Terbaru)
- 401 Unauthorized: JWT Guard Global conflict diperbaiki
- Token Refresh: Axios interceptor diperkuat dengan localStorage fallback
- TypeScript Errors: TS5097 di frontend/main.tsx diperbaiki
- Development Server: npm run dev berjalan normal tanpa startup errors

### RBAC Issues (Terbaru)
- 403 Forbidden untuk role dapur: Diperbaiki dengan menambahkan 'dapur' ke decorator @Roles pada endpoint pending-approvals
- Akses tidak konsisten: Diverifikasi dengan skrip test khusus untuk memastikan kedua role (administrator dan dapur) dapat mengakses endpoint
- Business logic gap: Dapur sekarang dapat melihat permintaan approval yang mereka ajukan untuk tracking

## Team & Resources

### Development Team
- Belum ada info tim; perlu definisi role dan workflow kolaborasi

### External Dependencies
- PostgreSQL database
- Cloud storage (opsional)
- Email service (opsional)
- Hosting environment (siap untuk deployment)

## Risks & Mitigations

### Technical Risks ✅ MITIGATED
- Complexity: approval workflow sudah diimplementasikan dengan baik
- Real-time: WebSocket implementation sudah robust dengan proper error handling
- Performance: sudah dioptimasi dengan caching strategies dan lazy loading

### Business Risks ✅ MITIGATED
- User Adoption: UI intuitif dengan proper onboarding
- Data Migration: database schema sudah terstruktur dengan baik
- Training: documentation lengkap untuk pengguna dan developer

## Timeline Estimation

### ✅ Phase 1: Foundation (COMPLETED)
- [x] Project scaffolding dan monorepo setup
- [x] Backend foundation dengan NestJS
- [x] Frontend foundation dengan React + Vite
- [x] Development environment configuration
- [x] Perbaikan dependencies dan configuration issues
- [x] Testing backend dan frontend stability

### ✅ Phase 2: Database & Core Models (COMPLETED)
- Database schema design dengan Prisma
- Migration setup
- Seed data creation
- Basic CRUD operations

### ✅ Phase 3: Authentication & Authorization (COMPLETED)
- JWT implementation dengan payload [JwtPayload](backend/src/common/interfaces/jwt-payload.interface.ts:1)
- Global guards: [JwtAuthGuard](backend/src/common/guards/jwt-auth.guard.ts:7), [RolesGuard](backend/src/common/guards/roles.guard.ts:10)
- Decorators: [Public()](backend/src/common/decorators/public.decorator.ts:4), [Roles()](backend/src/common/decorators/roles.decorator.ts:17)
- Audit logging terintegrasi: [AuditTrailService](backend/src/common/services/audit-trail.service.ts:29)

#### Password Hash Protection & Safe Field Selection (Phase 3 hardening)

- Proteksi hash password ditingkatkan: password disimpan sebagai bcrypt hash dan TIDAK pernah dikirimkan melalui API response. Validasi dilakukan dengan perbandingan aman menggunakan bcrypt di [AuthService.validateUser()](backend/src/auth/auth.service.ts:77) dan pemanggilan compare pada [backend/src/auth/auth.service.ts](backend/src/auth/auth.service.ts:87).
- Safe field selection diberlakukan untuk seluruh response yang menyertakan relasi user: menggunakan Prisma `select` untuk whitelisting kolom yang aman (id, username, role, createdAt) sehingga `passwordHash` tidak pernah terserialisasi ke klien. Implementasi dapat dilihat di [AuthService.login()](backend/src/auth/auth.service.ts:123) dan [AuthService.getUserProfile()](backend/src/auth/auth.service.ts:233).
- Rationale: `select` menerapkan whitelist eksplisit pada kolom yang diizinkan untuk keluar dari service boundary. Sementara `include` cenderung membawa seluruh kolom relasi (berisiko menyertakan `passwordHash`) jika tidak disaring. Oleh karena itu, `select` wajib digunakan untuk API responses; `include` hanya dipakai pada operasi internal yang tidak terserialisasi (misal verifikasi kredensial).
- Kontrak keamanan: Objek yang memuat `passwordHash` hanya berada di dalam scope service dan tidak pernah di-return oleh controller. Seluruh payload JWT tetap minimal (sub, karyawanId, nik, role) sesuai desain di [AuthService.generateTokens()](backend/src/auth/auth.service.ts:161).

### ✅ Phase 4: Core Features (COMPLETED)
- Order management system
- Approval workflow
- Basic UI untuk semua roles

### ✅ Phase 5: Advanced Features (COMPLETED)
- Real-time notifications
- WebSocket implementation
- Event-driven architecture

### ✅ Phase 6: Reporting & Analytics (COMPLETED)
- Comprehensive reporting system
- Audit trail functionality
- Data visualization

### ✅ Phase 7: Frontend Foundation (COMPLETED)
- Authentication & authorization
- Routing & navigation
- UI component library

### ✅ Phase 8: Frontend Implementation (COMPLETED)
- Role-specific dashboards
- Order management UI
- Admin tools & reports

### ✅ Phase 9: PWA & Production (COMPLETED)
- PWA implementation with offline support
- Performance optimization
- Accessibility hardening
- Production build & deployment ready

## Status Akhir — Production Ready

Aplikasi Bebang Pack Meal Portal telah selesai sepenuhnya dan siap untuk production deployment dengan:

1. **Backend API yang robust** dengan authentication, authorization, real-time notifications, dan comprehensive audit trail
2. **Frontend SPA yang modern** dengan PWA capabilities, offline support yang robust, responsive design, dan accessibility compliance
3. **Database yang terstruktur** dengan proper indexing, relations, dan migration management
4. **Testing yang komprehensif** untuk E2E scenarios, API endpoints, dan UI components
5. **Performance yang dioptimasi** dengan caching strategies, lazy loading, dan bundle optimization
6. **Security yang diperkuat** dengan proper authentication, authorization, and audit logging
7. **Monitoring yang siap** dengan structured logging dan health check endpoints
8. **RBAC yang telah diperbaiki** untuk role dapur dengan akses yang sesuai dengan business logic

## Status Deployment — Siap Produksi ✅ READY

Dengan semua tutorial deployment lengkap, aplikasi siap untuk deployment ke berbagai environment:

### Environment Deployment yang Didukung
1. **Development Environment**: Local development dengan hot reload (✅ sudah berjalan)
2. **Staging Environment**: Testing environment dengan production-like configuration
3. **Production Linux**: Ubuntu/CentOS dengan Docker atau native deployment
4. **Production Windows**: Windows Server dengan IIS atau standalone service
5. **Enterprise LAN**: Multi-user deployment dalam jaringan LAN perusahaan
6. **Cloud Deployment**: Kubernetes clusters untuk scalable cloud deployment

### Fokus Maintenance & Operations

Dengan deployment documentation lengkap, fokus selanjutnya adalah:

1. **Production Deployment Execution**: Deploy aplikasi menggunakan tutorial yang telah tersedia
2. **Monitoring Implementation**: Setup monitoring dan alerting sesuai tutorial guidelines
3. **User Training & Onboarding**: Training materials untuk end users dan administrators
4. **Performance Optimization**: Monitor dan optimize berdasarkan production usage
5. **Feature Enhancement**: Iterasi berdasarkan user feedback dan business requirements
6. **Security Auditing**: Regular security assessment dan compliance checking

### Fase Pengembangan: Phase 8 Selesai — Role-specific Dashboards & Frontend Order Management (COMPLETED)

Ringkasan implementasi frontend Phase 8:
- Role-specific dashboards terimplementasi:
  - Admin: [AdminDashboardPage.tsx](frontend/src/pages/admin/AdminDashboardPage.tsx:1)
  - Employee: [EmployeeDashboardPage.tsx](frontend/src/pages/employee/EmployeeDashboardPage.tsx:1)
  - Dapur: [DapurDashboardPage.tsx](frontend/src/pages/dapur/DapurDashboardPage.tsx:1)
  - Delivery: [DeliveryDashboardPage.tsx](frontend/src/pages/delivery/DeliveryDashboardPage.tsx:1)
- Order management pages lengkap:
  - Daftar pesanan: [OrdersListPage.tsx](frontend/src/pages/orders/OrdersListPage.tsx:1)
  - Detail pesanan + timeline: [OrderDetailPage.tsx](frontend/src/pages/orders/OrderDetailPage.tsx:1)
  - Form buat pesanan: [CreateOrderPage.tsx](frontend/src/pages/orders/CreateOrderPage.tsx:1)
  - Kanban board dapur (drag-and-drop): [KanbanBoardPage.tsx](frontend/src/pages/orders/KanbanBoardPage.tsx:1)
  - Delivery list (mobile-first): [DeliveryListPage.tsx](frontend/src/pages/orders/DeliveryListPage.tsx:1)
- Approval workflow:
  - Pusat persetujuan admin: [ApprovalCenterPage.tsx](frontend/src/pages/approvals/ApprovalCenterPage.tsx:1)
- Admin features:
  - Manajemen pengguna (CRUD, role, status, reset pw): [UsersManagementPage.tsx](frontend/src/pages/users/UsersManagementPage.tsx:1)
  - Laporan & analitik (charts + CSV export): [ReportsPage.tsx](frontend/src/pages/reports/ReportsPage.tsx:1)
  - Audit trail viewer (filter, ekspor, riwayat order): [AuditTrailPage.tsx](frontend/src/pages/audit/AuditTrailPage.tsx:1)
  - Master Data viewer (Departments, Jabatan, Shifts): [MasterDataPage.tsx](frontend/src/pages/admin/MasterDataPage.tsx:1)

#### Real-time Integration (Socket.IO Client)
- Socket Manager (koneksi, auth JWT, reconnect, event relay): [socket.manager.ts](frontend/src/services/websocket/socket.manager.ts:1)
- Hook event WebSocket (subscribe per event): [useWebSocket.ts](frontend/src/hooks/useWebSocket.ts:1)
- Hook notifikasi (toast global per event): [useNotifications.ts](frontend/src/hooks/useNotifications.ts:1)
- Toast provider & helpers (success/info/error/loading): [Toast.tsx](frontend/src/components/ui/Toast.tsx:1)
- Event yang ditangani:
  - `order:created`, `order:status-changed`, `order:approval-requested`, `order:approval-decided` (sinkron state UI + toast)

#### TypeScript Domain Types
- Orders: [order.types.ts](frontend/src/types/order.types.ts:1)
- Reports: [report.types.ts](frontend/src/types/report.types.ts:1)
- Users (admin view): [user.types.ts](frontend/src/types/user.types.ts:1)
- WebSocket events: [websocket.types.ts](frontend/src/types/websocket.types.ts:1)
- Barrel types: [index.ts](frontend/src/types/index.ts:1)

#### API Service Layer (Typed)
- Orders API: [orders.api.ts](frontend/src/services/api/orders.api.ts:1)
- Users API: [users.api.ts](frontend/src/services/api/users.api.ts:1)
- Reports API: [reports.api.ts](frontend/src/services/api/reports.api.ts:1)
- Master Data API: [master.api.ts](frontend/src/services/api/master.api.ts:1)
- Barrel services: [index.ts](frontend/src/services/api/index.ts:1)
- Axios instance & interceptors: [axios.ts](frontend/src/lib/axios.ts:1)

#### UI Component Library (Advanced)
- Table: [Table.tsx](frontend/src/components/ui/Table.tsx:1)
- Modal (Headless UI Dialog): [Modal.tsx](frontend/src/components/ui/Modal.tsx:1)
- Select (Headless UI Listbox): [Select.tsx](frontend/src/components/ui/Select.tsx:1)
- DatePicker (native styled): [DatePicker.tsx](frontend/src/components/ui/DatePicker.tsx:1)
- Spinner: [Spinner.tsx](frontend/src/components/ui/Spinner.tsx:1)
- EmptyState: [EmptyState.tsx](frontend/src/components/ui/EmptyState.tsx:1)
- Pagination: [Pagination.tsx](frontend/src/components/ui/Pagination.tsx:1)
- Barrel UI: [index.ts](frontend/src/components/ui/index.ts:1)
- Existing base UI (tetap digunakan): [Button.tsx](frontend/src/components/ui/Button.tsx:1), [Card.tsx](frontend/src/components/ui/Card.tsx:1), [Input.tsx](frontend/src/components/ui/Input.tsx:1), [Badge.tsx](frontend/src/components/ui/Badge.tsx:1)

#### Utils (Status/Date/Download)
- Status mapping & label/warna: [status.utils.ts](frontend/src/utils/status.utils.ts:1)
- Tanggal & waktu (format, relative, preset, durasi): [date.utils.ts](frontend/src/utils/date.utils.ts:1)
- Download helper (CSV/PDF via axios blob): [download.utils.ts](frontend/src/utils/download.utils.ts:1)
- Barrel utils: [index.ts](frontend/src/utils/index.ts:1)

#### Routing & Guards
- Router diperbarui (role-aware rendering untuk /orders): [index.tsx](frontend/src/router/index.tsx:1)
- Protected Route dengan allowedRoles (RBAC front): [ProtectedRoute.tsx](frontend/src/components/auth/ProtectedRoute.tsx:1)
- Layout tetap: [AppShell.tsx](frontend/src/components/layout/AppShell.tsx:1), [Sidebar.tsx](frontend/src/components/layout/Sidebar.tsx:1), [Topbar.tsx](frontend/src/components/layout/Topbar.tsx:1)

#### Dokumentasi
- Frontend README (Phase 8 features & struktur baru): [README.md](frontend/README.md:1)
- Root README status diperbarui (Phase 8 Complete): [README.md](README.md:1)

#### Dependencies (Frontend) — Ditambahkan/Diupdate untuk Phase 8
- socket.io-client ^4.x (real-time)
- @hello-pangea/dnd ^16.x (Kanban drag-and-drop)
- recharts ^2.x (charts)
- react-hot-toast ^2.x (toast)
- date-fns ^3.x (util tanggal)

### Status & Fokus Saat Ini
- ✅ Phase 8: Selesai — End-to-end fitur frontend (dashboard per role, order management lengkap, approval workflow, real-time notifications, admin tools, UI components lanjutan, routing & guards).
- ✅ Phase 9: Selesai — PWA enhancements, performance optimization, accessibility hardening, production build & deployment readiness.
- ✅ RBAC Dapur: Selesai — Perbaikan akses role dapur ke endpoint pending-approvals sesuai business logic.
- 🎯 Fokus Berikutnya (Post-Production): Maintenance, monitoring, user training, dan continuous improvement.

### Catatan Integrasi Real-time
- Klien Socket.IO konek ke namespace notifikasi: ws://localhost:3001/notifications
- Auth JWT saat handshake (sinkron dengan guard WS di backend): [websocket.guard.ts](backend/src/websocket/websocket.guard.ts:7)
- Emisi event dari OrdersModule (sinkron dengan gateway): [websocket.gateway.ts](backend/src/websocket/websocket.gateway.ts:36)
- Room-based targeting (role, dept, user, karyawan) sesuai gateway: [websocket.gateway.ts](backend/src/websocket/websocket.gateway.ts:251)

### Routing Fix — Approval Center Quick-links

Perbaikan routing terbaru memastikan tautan cepat (quick-links) pada dashboard mengarah ke halaman persetujuan dengan guard peran yang tepat:

- /admin/approvals → render ApprovalCenterPage khusus administrator dengan guard peran yang ketat di [index.tsx](frontend/src/router/index.tsx:135) dan implementasi guard di [ProtectedRoute.tsx](frontend/src/components/auth/ProtectedRoute.tsx:1)
- /orders/pending-approvals → render ApprovalCenterPage untuk administrator dan dapur sesuai kebutuhan operasional di [index.tsx](frontend/src/router/index.tsx:151)
- (Tambahan terkait alur dapur) /orders/queue → render KanbanBoardPage khusus dapur dengan guard peran di [index.tsx](frontend/src/router/index.tsx:143)

Dampak:
- Konsistensi pengalaman pengguna dari dashboard ke pusat persetujuan
- Pencegahan akses tidak sah melalui RBAC di lapis routing
- Penyederhanaan navigasi operasional untuk peran admin dan dapur

### Update Terbaru — Recovery & Maintenance Toolkit (Oktober 2025)

Ringkasan perubahan signifikan yang mempengaruhi penggunaan dan maintenance aplikasi:
- Status Aplikasi: tetap PRODUCTION READY dengan dukungan prosedur recovery darurat dan skrip utilitas.
- Dokumentasi baru:
  - tutorial.md — panduan lengkap penggunaan dan operasi sistem (best practices, langkah-langkah umum, dan troubleshooting)
  - [emergency-admin-recovery.md](emergency-admin-recovery.md:1) — panduan kilat pemulihan akses admin dengan contoh perintah, output, dan SQL fallback
- Skrip Recovery & Diagnosis:
  - [recovery-scripts.js](recovery-scripts.js:1) — CLI darurat dengan aksi: find, verify, make-admin, reset-password, print-sql, print-shell, print-powershell, emit-shell, hash
  - [activate-user.js](activate-user.js:1) — aktivasi akun, diagnosis end-to-end (bcrypt/JWT/HTTP probe), dan reset state user lengkap
- NPM Scripts baru (root) di [package.json](package.json:9-34):
  - E2E (Playwright): "test:e2e", "test:e2e:ui", "test:e2e:headed", "test:e2e:report", "test:e2e:codegen"
  - Production: "start:prod", "start:prod:backend", "start:prod:frontend"
  - Typecheck gabungan: "typecheck"
  - Skrip utilitas recovery: "activate-user", "diagnose-user", "reset-user"
- Perbaikan CRUD Users Management (administrator):
  - Endpoints di [UsersController](backend/src/users/users.controller.ts:1):
    - Create: [UsersController.create()](backend/src/users/users.controller.ts:29-34)
    - List: [UsersController.findAll()](backend/src/users/users.controller.ts:37-41)
    - Detail: [UsersController.findOne()](backend/src/users/users.controller.ts:44-48)
    - Update Status: [UsersController.updateStatus()](backend/src/users/users.controller.ts:51-63)
    - Update Role: [UsersController.updateRole()](backend/src/users/users.controller.ts:66-74)
    - Reset Password: [UsersController.resetPassword()](backend/src/users/users.controller.ts:77-85)
  - RBAC ditegakkan melalui [RolesGuard](backend/src/common/guards/roles.guard.ts:10) dan dekorator [Roles(...)](backend/src/common/decorators/roles.decorator.ts:17); audit trail mengikuti pola di [AuditTrailService](backend/src/common/services/audit-trail.service.ts:29).
  - Konsistensi kebijakan keamanan: reset password mematuhi hashing aman (bcrypt); pemulihan darurat tidak pernah mengekspor `passwordHash` ke klien.
- Operasional & Maintenance:
  - Gunakan [emergency-admin-recovery.md](emergency-admin-recovery.md:1) sebagai playbook "break‑glass" saat admin terkunci.
  - Skrip wrapper Linux/Windows dapat dihasilkan via aksi "emit-shell" pada [recovery-scripts.js](recovery-scripts.js:535-544) untuk eksekusi cepat.
  - Prosedur verifikasi end‑to‑end tersedia via diagnosis [activate-user.js](activate-user.js:459-469) termasuk probe HTTP ke `/api/auth/login`.

Catatan integrasi:
- Skrip otomatis memuat environment backend dari `.env` sehingga aman dijalankan dari root repo; pastikan Prisma Client telah di‑generate.
- Dokumentasi tutorial.md melengkapi panduan operasional dan harus dirujuk untuk onboarding serta SOP harian.

### Update Terbaru — Status Migrasi TypeScript Frontend (Oktober 2025)

- Mayoritas modul frontend telah dimigrasikan ke TypeScript dan berjalan stabil.
- Cleanup berkas .js legacy sedang dijadwalkan untuk dihapus/ditutup setelah paritas penuh tercapai.
- Contoh pasangan file yang sudah memiliki padanan TypeScript:
  - [users.api.js](frontend/src/services/api/users.api.js:1) → [users.api.ts](frontend/src/services/api/users.api.ts:1)
  - [App.js](frontend/src/App.js:1) → [App.tsx](frontend/src/App.tsx:1)
  - [main.js](frontend/src/main.js:1) → [main.tsx](frontend/src/main.tsx:1)
  - [ProtectedRoute.js](frontend/src/components/auth/ProtectedRoute.js:1) → [ProtectedRoute.tsx](frontend/src/components/auth/ProtectedRoute.tsx:1)
  - [AppShell.js](frontend/src/components/layout/AppShell.js:1) → [AppShell.tsx](frontend/src/components/layout/AppShell.tsx:1)
  - [Sidebar.js](frontend/src/components/layout/Sidebar.js:1) → [Sidebar.tsx](frontend/src/components/layout/Sidebar.tsx:1)
  - [Topbar.js](frontend/src/components/layout/Topbar.js:1) → [Topbar.tsx](frontend/src/components/layout/Topbar.tsx:1)
  - [axios.js](frontend/src/lib/axios.js:1) → [axios.ts](frontend/src/lib/axios.ts:1)
  - [useWebSocket.js](frontend/src/hooks/useWebSocket.js:1) → [useWebSocket.ts](frontend/src/hooks/useWebSocket.ts:1)
  - [useNotifications.js](frontend/src/hooks/useNotifications.js:1) → [useNotifications.ts](frontend/src/hooks/useNotifications.ts:1)
  - Domain types telah tersedia dalam bentuk .ts: [order.types.ts](frontend/src/types/order.types.ts:1), [user.types.ts](frontend/src/types/user.types.ts:1), [websocket.types.ts](frontend/src/types/websocket.types.ts:1)

### Fokus Pengembangan Aktif (Oktober 2025)

- Backend — Refinement Authentication & Guards:
  - Peningkatan alur refresh token (JWT refresh) melalui strategi dedicated di [JwtRefreshStrategy](backend/src/auth/strategies/jwt-refresh.strategy.ts:1)
  - Hardening RBAC pada guard otorisasi: [RolesGuard](backend/src/common/guards/roles.guard.ts:10) dan peninjauan dekorator akses
- Frontend — Peningkatan UX Komponen UI:
  - Loading states yang konsisten dan dapat diakses: [Spinner.tsx](frontend/src/components/ui/Spinner.tsx:1)
  - Pagination & paging untuk daftar data: [Pagination.tsx](frontend/src/components/ui/Pagination.tsx:1)
  - Toast & notifikasi real-time yang lebih informatif: [Toast.tsx](frontend/src/components/ui/Toast.tsx:1) dan integrasi events WebSocket


### Status Development Server (Dev)

- Server development berjalan menggunakan root script concurrent: [package.json](package.json:1) → perintah "npm run dev"
- Backend (NestJS) dan Frontend (Vite) dijalankan bersamaan melalui concurrently sehingga perubahan dapat diinspeksi real-time.
- WebSocket dedicated server tetap aktif pada WS_PORT=3001 sesuai integrasi gateway: [websocket.gateway.ts](backend/src/websocket/websocket.gateway.ts:36)

### Ringkasan Implementasi Fitur (Status Konsolidasi)

- Authentication & Authorization: lengkap dan stabil (JWT, guards global, refresh flow sedang di-refine)
- Orders & Approval Workflow: implementasi end-to-end beroperasi, termasuk event real-time dan audit trail
- Reporting & Audit Trail: module Reports tersedia dan terverifikasi di backend ([reports.controller.ts](backend/src/reports/reports.controller.ts:1))
- Frontend Role-specific Pages: seluruh dashboard dan halaman per peran tersedia (Admin, Employee, Dapur, Delivery)
- Master Data Management: halaman Master Data tersedia untuk administrator dengan integrasi API backend
- PWA & Offline: perbaikan infinite redirect loop telah selesai di [frontend/vite.config.ts](frontend/vite.config.ts:88-107) dengan sinkronisasi indikator offline di [AppShell.tsx](frontend/src/components/layout/AppShell.tsx:36-53)
- RBAC untuk Dapur: perbaikan akses ke endpoint pending-approvals dengan validasi business logic yang tepat

### Update Terbaru — API Smoke Tests (Baru Ditambahkan)

Untuk mempercepat verifikasi stabilitas API inti, ditambahkan skrip smoke test berbasis Node 18 fetch:
- [get-departments.js](scripts/api-smoke/get-departments.js:1) — login ke `/api/auth/login` menggunakan kredensial admin, kemudian `GET /master-data/departments`. Menampilkan status dan body respons untuk sanity check. Variabel lingkungan: `API_BASE_URL`, `ADMIN_NIK`, `ADMIN_PASSWORD`.
- [create-department.js](scripts/api-smoke/create-department.js:1) — login lalu `POST /master-data/departments` dengan payload minimal. Menangani konflik 409 sebagai kondisi non-fatal (departemen sudah ada).
- [test-dapur-pending-approvals.js](scripts/test-dapur-pending-approvals.js:1) — test khusus untuk verifikasi akses dapur ke endpoint pending-approvals setelah perbaikan RBAC
- [test-pending-approvals-endpoint.js](scripts/test-pending-approvals-endpoint.js:1) — test komprehensif untuk semua role yang dapat mengakses endpoint pending-approvals
Cara pakai (contoh):
- Windows CMD: `node scripts\\api-smoke\\get-departments.js` lalu `node scripts\\api-smoke\\create-department.js`
- PowerShell: `node scripts/api-smoke/get-departments.js`
- Bash: `node scripts/api-smoke/get-departments.js`
Catatan:
- Skrip ini melengkapi E2E Playwright dengan cek cepat endpoint autentikasi, master-data, dan RBAC dapur di lingkungan dev.
- Output mencetak status HTTP dan body untuk diagnosis cepat bila ada regresi.


### Peningkatan PWA & Offline Support (Tambahan)

Selain perbaikan loop redirect di service worker dan strategi navigasi offline yang sudah terdokumentasi sebelumnya, lapisan UI PWA ditingkatkan:
- Prompt instalasi: [InstallPrompt.tsx](frontend/src/components/pwa/InstallPrompt.tsx:1)
- Prompt update service worker: [UpdatePrompt.tsx](frontend/src/components/pwa/UpdatePrompt.tsx:1)
- Utilitas penyimpanan offline yang aman: [offline-storage.utils.ts](frontend/src/utils/offline-storage.utils.ts:1)
Dampak:
- Pengalaman pengguna saat update SW lebih jelas (notifikasi update siap, opsi reload aman).
- Integrasi utilitas penyimpanan offline membantu menjaga state ringan saat jaringan tidak stabil.
- Tetap sinkron dengan indikator offline: [OfflineIndicator.tsx](frontend/src/components/pwa/OfflineIndicator.tsx:1) dan halaman offline: [OfflinePage.tsx](frontend/src/pages/OfflinePage.tsx:1).


### Status Migrasi TypeScript — Pola Bridging (Dipertegas)

Strategi "bridging" coexistence .js ↔ .ts/.tsx dipertahankan untuk transisi bertahap tanpa menghambat pengembangan. Contoh pasangan yang aktif:
- Routing & Guard: [ProtectedRoute.js](frontend/src/components/auth/ProtectedRoute.js:1) ↔ [ProtectedRoute.tsx](frontend/src/components/auth/ProtectedRoute.tsx:1), [router/index.js](frontend/src/router/index.js:1) ↔ [router/index.tsx](frontend/src/router/index.tsx:1)
- Layout: [AppShell.js](frontend/src/components/layout/AppShell.js:1) ↔ [AppShell.tsx](frontend/src/components/layout/AppShell.tsx:1), [Sidebar.js](frontend/src/components/layout/Sidebar.js:1) ↔ [Sidebar.tsx](frontend/src/components/layout/Sidebar.tsx:1), [Topbar.js](frontend/src/components/layout/Topbar.js:1) ↔ [Topbar.tsx](frontend/src/components/layout/Topbar.tsx:1)
- Library & Hooks: [axios.js](frontend/src/lib/axios.js:1) ↔ [axios.ts](frontend/src/lib/axios.ts:1), [useWebSocket.js](frontend/src/hooks/useWebSocket.js:1) ↔ [useWebSocket.ts](frontend/src/hooks/useWebSocket.ts:1), [useNotifications.js](frontend/src/hooks/useNotifications.js:1) ↔ [useNotifications.ts](frontend/src/hooks/useNotifications.ts:1)
- Services (API): [users.api.js](frontend/src/services/api/users.api.js:1) ↔ [users.api.ts](frontend/src/services/api/users.api.ts:1), [orders.api.js](frontend/src/services/api/orders.api.js:1) ↔ [orders.api.ts](frontend/src/services/api/orders.api.ts:1), [reports.api.js](frontend/src/services/api/reports.api.js:1) ↔ [reports.api.ts](frontend/src/services/api/reports.api.ts:1), [master.api.js](frontend/src/services/api/master.api.js:1) ↔ [master.api.ts](frontend/src/services/api/master.api.ts:1)
Kebijakan teknis:
- Modul TypeScript menjadi sumber kebenaran; padanan .js tetap ada hanya untuk kompatibilitas legacy sampai paritas fungsional dan visual terverifikasi penuh.
- Cleanup file .js dilakukan pasca verifikasi melalui lint, typecheck, dan E2E.


### E2E Testing Diperluas (Playwright)

Cakupan pengujian end-to-end ditingkatkan untuk memastikan alur bisnis lintas peran berjalan stabil:
- Autentikasi multi-peran dan persistensi sesi: [auth.spec.ts](tests/e2e/auth.spec.ts:1)
- Alur administrator: [admin-workflow.spec.ts](tests/e2e/admin-workflow.spec.ts:1)
- Alur karyawan: [employee-workflow.spec.ts](tests/e2e/employee-workflow.spec.ts:1)
- Alur dapur: [dapur-workflow.spec.ts](tests/e2e/dapur-workflow.spec.ts:1)
- Alur delivery: [delivery-workflow.spec.ts](tests/e2e/delivery-workflow.spec.ts:1)
Prinsip verifikasi:
- Login, navigasi, guard RBAC, interaksi UI (klik, form), dan konsistensi state (Zustand persist).
- Validasi menu per peran, transisi halaman, dan pesan error/alert yang informatif.
- Konsistensi dengan desain offline/PWA: halaman offline dan indikator status ketika jaringan terganggu.


### Master Data Module — Matang (Backend + Frontend)

Backend — Layanan Master Data mengimplementasikan CRUD lengkap dengan validasi, konflik unik, dan audit trail:
- Departemen:
  - [MasterDataService.createDepartment()](backend/src/master-data/master-data.service.ts:53)
  - [MasterDataService.updateDepartment()](backend/src/master-data/master-data.service.ts:81)
  - [MasterDataService.deleteDepartment()](backend/src/master-data/master-data.service.ts:125)
- Jabatan:
  - [MasterDataService.createJabatan()](backend/src/master-data/master-data.service.ts:156)
  - [MasterDataService.updateJabatan()](backend/src/master-data/master-data.service.ts:210)
  - [MasterDataService.deleteJabatan()](backend/src/master-data/master-data.service.ts:291)
- Shift:
  - [MasterDataService.createShift()](backend/src/master-data/master-data.service.ts:355)
  - [MasterDataService.updateShift()](backend/src/master-data/master-data.service.ts:388)
  - [MasterDataService.deleteShift()](backend/src/master-data/master-data.service.ts:456)
Integrasi audit trail: setiap operasi menulis catatan via [AuditTrailService](backend/src/common/services/audit-trail.service.ts:29) dengan detail yang jelas untuk compliance.

Frontend — Halaman administrasi dan form terintegrasi dengan layanan typed:
- Halaman Master Data: [MasterDataPage.tsx](frontend/src/pages/admin/MasterDataPage.tsx:1)
- Form:
  - [DepartmentForm.tsx](frontend/src/components/forms/DepartmentForm.tsx:1)
  - [JabatanForm.tsx](frontend/src/components/forms/JabatanForm.tsx:1)
  - [ShiftForm.tsx](frontend/src/components/forms/ShiftForm.tsx:1)
- Layanan API typed: [master.api.ts](frontend/src/services/api/master.api.ts:1)

Konsistensi data:
- Daftar dan detail ditampilkan terurut (asc) dengan relasi aman (`select`) pada jabatan → department.
- Validasi frontend selaras dengan validasi backend (duplikasi nama, dependensi relasi saat delete).
- Smoke test API melengkapi verifikasi CRUD via UI.
