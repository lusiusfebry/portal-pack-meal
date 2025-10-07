# ARCHITECTURE — Bebang Pack Meal Portal

## Arsitektur Sistem

### Overview
Bebang Pack Meal Portal menggunakan arsitektur monorepo dengan dua workspace terpisah: backend API dan frontend SPA. Arsitektur ini dirancang untuk skalabilitas, maintainability, dan developer experience yang optimal.

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (React SPA)   │◄──►│   (NestJS)      │◄──►│  (PostgreSQL)   │
│                 │    │                 │    │                 │
│ - React 18      │    │ - NestJS 10     │    │ - Prisma ORM    │
│ - Vite 7        │    │ - JWT Auth      │    │ - Migrations    │
│ - Tailwind CSS  │    │ - WebSockets    │    │ - Relations     │
│ - PWA           │    │ - Validation    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Struktur Direktori

### Root Level
```
portal-pack-meal/
├── backend/                 # NestJS API workspace
├── frontend/               # React SPA workspace
├── .husky/                 # Git hooks
├── .kilocode/              # Kilo Code configuration
├── prompt/                 # Project documentation & prompts
├── package.json            # Root package.json (workspace config)
├── README.md               # Project documentation
└── PROJECT_OVERVIEW.md     # Project summary
```

### Backend Structure (NestJS)
```
backend/
├── src/
│   ├── app.module.ts       # Root module ✅ IMPLEMENTED
│   ├── app.controller.ts   # Root controller ✅ IMPLEMENTED
│   ├── app.service.ts      # Root service ✅ IMPLEMENTED
│   ├── main.ts             # Application bootstrap ✅ IMPLEMENTED
│   ├── auth/               # Authentication module 📁 STRUCTURE READY
│   ├── users/              # User management 📁 STRUCTURE READY
│   ├── orders/             # Order management 📁 STRUCTURE READY
│   ├── master-data/        # Master data (dept, position, shift) 📁 STRUCTURE READY
│   ├── notifications/      # WebSocket notifications 📁 STRUCTURE READY
│   └── common/             # Shared utilities 📁 STRUCTURE READY
├── prisma/
│   ├── schema.prisma       # Database schema ✅ IMPLEMENTED
│   ├── migrations/         # Database migrations
│   └── seed.ts             # Seed data script
├── test/                   # Test files
├── .env.example            # Environment template ✅ IMPLEMENTED
├── .env                    # Environment variables ✅ CREATED
├── nest-cli.json           # NestJS CLI config ✅ IMPLEMENTED
├── tsconfig.json           # TypeScript config ✅ IMPLEMENTED
└── package.json            # Backend dependencies ✅ IMPLEMENTED
```

### Frontend Structure (React + Vite)
```
frontend/
├── src/
│   ├── components/         # Reusable components 📁 STRUCTURE READY
│   │   ├── ui/            # Base UI components ✅ IMPLEMENTED (Button, Card, Input, Badge)
│   │   ├── forms/         # Form components 📁 STRUCTURE READY
│   │   ├── layout/        # Layout components 📁 STRUCTURE READY
│   │   └── pwa/           # PWA components ✅ IMPLEMENTED (OfflineIndicator, InstallPrompt, UpdatePrompt)
│   ├── pages/             # Page components 📁 STRUCTURE READY
│   │   ├── auth/          # Authentication pages 📁 STRUCTURE READY
│   │   ├── dashboard/     # Dashboard pages 📁 STRUCTURE READY
│   │   ├── orders/        # Order management 📁 STRUCTURE READY
│   │   ├── admin/         # Admin pages 📁 STRUCTURE READY
│   │   ├── reports/       # Reports pages 📁 STRUCTURE READY
│   │   ├── audit/         # Audit trail pages 📁 STRUCTURE READY
│   │   ├── approvals/     # Approval workflow pages 📁 STRUCTURE READY
│   │   ├── users/         # User management pages 📁 STRUCTURE READY
│   │   └── employee/      # Employee pages 📁 STRUCTURE READY
│   │   ├── dapur/         # Kitchen pages 📁 STRUCTURE READY
│   │   └── delivery/      # Delivery pages 📁 STRUCTURE READY
│   ├── hooks/             # Custom React hooks 📁 STRUCTURE READY
│   ├── stores/            # Zustand state stores 📁 STRUCTURE READY
│   ├── services/          # API services 📁 STRUCTURE READY
│   ├── utils/             # Utility functions 📁 STRUCTURE READY
│   ├── types/             # TypeScript types 📁 STRUCTURE READY
│   ├── styles/            # Global styles ✅ IMPLEMENTED
│   ├── App.tsx            # Root component ✅ IMPLEMENTED
│   └── main.tsx           # Application entry ✅ IMPLEMENTED
├── public/                # Static assets
│   └── icons/             # PWA icons 📁 STRUCTURE READY
├── vite.config.ts         # Vite configuration ✅ IMPLEMENTED
├── tailwind.config.js     # Tailwind CSS config ✅ IMPLEMENTED
├── tsconfig.json          # TypeScript config ✅ IMPLEMENTED
├── .env.example           # Environment template ✅ IMPLEMENTED
├── .env                   # Environment variables ✅ CREATED
└── package.json           # Frontend dependencies ✅ IMPLEMENTED
```
#### Legacy JS co-existence

- Frontend berisi pasangan berkas .js legacy dan .ts/.tsx typed untuk transisi bertahap ke TypeScript.
- File .js dianggap deprecated dan akan dihapus setelah verifikasi penuh terhadap padanan TypeScript‑nya.
- Contoh pasangan file:
  - [App.js](frontend/src/App.js:1) ↔ [App.tsx](frontend/src/App.tsx:1)
  - [main.js](frontend/src/main.js:1) ↔ [main.tsx](frontend/src/main.tsx:1)
  - [components/auth/ProtectedRoute.js](frontend/src/components/auth/ProtectedRoute.js:1) ↔ [components/auth/ProtectedRoute.tsx](frontend/src/components/auth/ProtectedRoute.tsx:1)
  - [services/api/orders.api.js](frontend/src/services/api/orders.api.js:1) ↔ [services/api/orders.api.ts](frontend/src/services/api/orders.api.ts:1)
  - [services/api/reports.api.js](frontend/src/services/api/reports.api.js:1) ↔ [services/api/reports.api.ts](frontend/src/services/api/reports.api.ts:1)
  - [services/websocket/socket.manager.js](frontend/src/services/websocket/socket.manager.js:1) ↔ [services/websocket/socket.manager.ts](frontend/src/services/websocket/socket.manager.ts:1)
  - [components/ui/Button.js](frontend/src/components/ui/Button.js:1) ↔ [components/ui/Button.tsx](frontend/src/components/ui/Button.tsx:1)
  - [components/ui/Table.js](frontend/src/components/ui/Table.js:1) ↔ [components/ui/Table.tsx](frontend/src/components/ui/Table.tsx:1)
  - [types/index.js](frontend/src/types/index.js:1) ↔ [types/index.ts](frontend/src/types/index.ts:1)

## Keputusan Arsitektur Utama

### 1. Monorepo Structure
**Alasan**: 
- Shared configuration dan tooling
- Konsistensi code style dan dependencies
- Simplified deployment dan CI/CD
- Easy code sharing antar workspace

**Implementasi**: ✅ **COMPLETED**
- npm workspaces dengan root package.json
- Concurrent script execution
- Centralized linting dan formatting

### 2. Backend: NestJS Framework
**Alasan**:
- TypeScript-first dengan strong typing
- Modular architecture yang terstruktur
- Built-in dependency injection
- Excellent untuk enterprise applications
- WebSocket support built-in

**Key Features**:
- Modules untuk domain separation
- Guards untuk authorization
- Pipes untuk validation
- Interceptors untuk logging/caching

**Implementation Status**: ✅ **FOUNDATION COMPLETED**
- NestJS 10 dengan TypeScript setup
- CORS dan validation pipe global
- Health check endpoint
- Struktur module dasar
- Perbaikan CORS configuration parsing
- Perbaikan API prefix configuration

### 3. Frontend: React + Vite
**Alasan**:
- Vite untuk development experience yang cepat
- React 18 dengan concurrent features
- TypeScript untuk type safety
- PWA support untuk mobile experience

**Key Features**:
- Component-based architecture
- Zustand untuk state management
- React Router untuk client-side routing
- Tailwind CSS untuk utility-first styling

**Implementation Status**: ✅ **FOUNDATION COMPLETED**
- React 18 + Vite 7 + TypeScript
- Tailwind CSS dengan desain system
- PWA configuration
- Dark mode support
- Development proxy
- Update dependencies ke versi terbaru (Vite 7.1.7, vite-plugin-pwa 1.0.3)

### 4. Database: PostgreSQL + Prisma
**Alasan**:
- PostgreSQL untuk relational data integrity
- Prisma untuk type-safe database access
- Excellent migration system
- Real-time capabilities dengan PostgreSQL

**Schema Design**:
- Master data tables (normalized)
- Transaction tables dengan foreign keys
- Audit trail table untuk compliance
- Indexing strategy untuk performance

**Implementation Status**: ✅ **COMPLETED**
- Prisma ORM terintegrasi penuh dengan NestJS melalui PrismaModule (Global) dan PrismaService
- Database schema dibuat untuk 6 core model: User, Department, Jabatan, Shift, Karyawan, Pesanan; serta AuditTrail sebagai tabel log
- Migrasi awal berhasil dijalankan: 20251001075640_init
- Database telah di-seed dengan data sample menggunakan script seeding
- Relasi dan indeks disiapkan untuk operasi read/write yang efisien
- Siap digunakan oleh modul bisnis pada Phase 3 (Authentication & Authorization)
### Update Terbaru — Database Default Status Pesanan
- Update schema: penambahan @default(MENUNGGU) pada field statusPesanan di [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma)
- Migrasi baru dibuat: [`20251001083412_add_default_status_pesanan`](backend/prisma/migrations/20251001083412_add_default_status_pesanan/migration.sql)
- Database sekarang memiliki default value yang tepat untuk workflow pesanan (status awal: MENUNGGU)
## Data Flow Architecture

#### Catatan Refinement
- Refinement guard & strategy refresh sedang dalam siklus pengujian.
- Referensi: [JwtRefreshStrategy](backend/src/auth/strategies/jwt-refresh.strategy.ts:1) dan [RolesGuard](backend/src/common/guards/roles.guard.ts:10) sedang diperbaiki untuk hardening dan konsistensi.
### Request Flow
```
Client Request → Frontend → API Gateway → Controller → Service → Repository → Database
                ↑                                    ↓
                └────── WebSocket Notifications ←──────┘
```

### Authentication Flow
```
Login Request → JWT Generation → Token Storage → API Requests with Bearer Token
                                    ↓
                              Role-based Guards → Resource Access
```

### Authentication Flow — Password Hash Protection (Updated)

- Validasi kredensial menggunakan bcrypt dan TIDAK pernah mengekspor `passwordHash` ke klien:
  - Verifikasi password dilakukan di [AuthService.validateUser()](backend/src/auth/auth.service.ts:77) dengan pembandingan aman pada [AuthService.validateUser()](backend/src/auth/auth.service.ts:87)
  - Response API yang memuat relasi `user` selalu menggunakan Prisma `select` (whitelist kolom aman) di [AuthService.login()](backend/src/auth/auth.service.ts:123) dan [AuthService.getUserProfile()](backend/src/auth/auth.service.ts:233)

```
Login (NIK + password)
  → Service: find karyawan.include(user) [internal only]
  → bcrypt.compare(plaintext, hash) → [AuthService.validateUser()](backend/src/auth/auth.service.ts:87)
  → Jika valid → [generateTokens()](backend/src/auth/auth.service.ts:161) → keluarkan access + refresh token
  → Load profil untuk UI dengan user.select { id, username, role, createdAt }
  → Note: passwordHash tidak pernah meninggalkan service boundary
```
### Real-time Flow
```
Status Change → Database Update → Event Emission → WebSocket Gateway → Client Update
```

## Component Relationships

### Backend Modules
```
AppModule ✅
├── AuthModule (JWT, Guards) 📁 STRUCTURE READY
├── UsersModule (User management) 📁 STRUCTURE READY
├── MasterDataModule (Departments, Positions, Shifts) 📁 STRUCTURE READY
├── OrdersModule (Order lifecycle) 📁 STRUCTURE READY
├── NotificationsModule (WebSocket) 📁 STRUCTURE READY
└── ReportsModule (Analytics) 📁 STRUCTURE READY
```

### Frontend Components
```
App ✅
├── Router (Role-based routing) ✅ IMPLEMENTED
├── AuthProvider (Authentication context) 📁 STRUCTURE READY
├── Layout (AppShell, Sidebar, Topbar) ✅ IMPLEMENTED
└── Pages
    ├── Dashboard (Per role) 📁 STRUCTURE READY
    ├── Orders (CRUD & tracking) 📁 STRUCTURE READY
    ├── Admin (Master data management) 📁 STRUCTURE READY
    ├── Reports (Analytics & export) 📁 STRUCTURE READY
    ├── Audit Trail (Compliance tracking) 📁 STRUCTURE READY
    ├── Approvals (Workflow management) 📁 STRUCTURE READY
    ├── Users (User management) 📁 STRUCTURE READY
    └── Profile (User settings) 📁 STRUCTURE READY
```

## Critical Implementation Paths

### 1. Order Creation Flow
```
Frontend Form → Validation → API POST /orders → Service Validation → Database Insert
                                    ↓
                              WebSocket Event → Real-time Update → Kitchen Dashboard
```

### 2. Status Update Flow
```
Kitchen Action → API PATCH /orders/:id/status → Business Logic → Database Update
                                    ↓
                              WebSocket Event → Multi-client Update
```

### 3. Approval Workflow
```
Kitchen Request → API POST /approvals → Admin Notification → Admin Decision
                                    ↓
                              Status Resolution → Database Update → Client Update
```

## Security Architecture

### Authentication
- JWT tokens dengan refresh mechanism
- Role-based access control (RBAC)
- Session management dengan secure cookies

### Authorization
- Route guards per role
- Resource-level permissions
- API endpoint protection

### Data Security
- Input validation dengan class-validator
- SQL injection prevention dengan Prisma
- CORS configuration untuk frontend access

## Performance Considerations

### Backend Optimization
- Database connection pooling
- Query optimization dengan Prisma
- Caching strategy (Redis jika needed)
- API response compression

### Frontend Optimization
- Code splitting per route
- Lazy loading untuk components
- Image optimization
- Service worker untuk PWA caching

## Scalability Architecture

### Horizontal Scaling
- Stateless API design
- Database connection management
- WebSocket scaling dengan Redis adapter
- Load balancing ready

### Vertical Scaling
- Memory-efficient data structures
- Optimized database queries
- CDN untuk static assets
- Database indexing strategy

## Integration Points

### External Systems
- Email service untuk notifications
- File storage service untuk uploads
- Payment gateway (jika needed)
- HR system integration (future)

### API Design
- RESTful API design principles
- Consistent error handling
- Standardized response format
- API versioning strategy

## Deployment Architecture

### Development Environment
- Local PostgreSQL database
- Hot reload untuk kedua workspace
- Development proxy configuration
- Environment-specific configs

### Production Considerations
- Container deployment (Docker)
- Database migrations strategy
- Environment variable management
- Monitoring dan logging setup

## Configuration Implementation

### Backend Configuration ✅ IMPLEMENTED
- **CORS Configuration**: Fixed parsing untuk menghindari undefined chaining issues
- **API Prefix**: Simplified dengan konstanta untuk menghindari undefined env
- **Environment Variables**: Template dan actual file sudah dikonfigurasi
- **Validation Pipe**: Global configuration dengan transform options

### Frontend Configuration ✅ IMPLEMENTED
- **Vite Configuration**: Update ke versi 7.1.7 dengan proxy yang robust
- **PWA Configuration**: Update vite-plugin-pwa ke versi 1.0.3
- **Environment Variables**: Template dan actual file sudah dikonfigurasi
- **Proxy Setup**: Konfigurasi proxy untuk API dan WebSocket yang robust

### Development Environment ✅ IMPLEMENTED
- **Monorepo Scripts**: Concurrent development untuk backend dan frontend
- **Code Quality**: ESLint dan Prettier untuk kedua workspace
- **Git Hooks**: Husky untuk pre-commit quality control
- **Port Configuration**: Backend (3000) dan Frontend (5173) tanpa konflik
## Update — Authentication & Authorization Details (Phase 3 COMPLETED)

### JWT Payload & Token Management
- Payload standar didefinisikan di [JwtPayload](backend/src/common/interfaces/jwt-payload.interface.ts:1)
- Pembuatan token dilakukan oleh [AuthService.generateTokens()](backend/src/auth/auth.service.ts:151) dengan secret dan expiry dari ConfigService
- Alur login, refresh, dan profil user terdokumentasi di [AuthService.login()](backend/src/auth/auth.service.ts:106), [AuthService.refreshTokens()](backend/src/auth/auth.service.ts:202), [AuthService.getUserProfile()](backend/src/auth/auth.service.ts:239)

### Global Guards (Bootstrap)
- Guard autentikasi JWT: [JwtAuthGuard](backend/src/common/guards/jwt-auth.guard.ts:7)
- Guard otorisasi berbasis peran: [RolesGuard](backend/src/common/guards/roles.guard.ts:10)
- Dekorator kontrol akses:
  - Public route: [Public()](backend/src/common/decorators/public.decorator.ts:4)
  - Role-based access: [Roles(...)](backend/src/common/decorators/roles.decorator.ts:17)
- Konfigurasi pemasangan di bootstrap: [main.ts](backend/src/main.ts:18)

### Common Module (Global Providers)
- CommonModule mengekspor layanan lintas modul: [CommonModule](backend/src/common/common.module.ts:9)
- Audit logging terpusat: [AuditTrailService](backend/src/common/services/audit-trail.service.ts:29)

### Updated Request Flow with Authentication
```
Client → Frontend (React) → API (NestJS)
  │
  ├─ POST /api/auth/login
  │     ├─ Controller → [AuthService.login()](backend/src/auth/auth.service.ts:106)
  │     │     ├─ validate: NIK + password
  │     │     ├─ audit: LOGIN_FAILURE or LOGIN_SUCCESS via [AuditTrailService](backend/src/common/services/audit-trail.service.ts:29)
  │     │     └─ issue tokens: [AuthService.generateTokens()](backend/src/auth/auth.service.ts:151)
  │     └─ Response: { accessToken, refreshToken, user }
  │
  ├─ Protected Routes (Bearer token)
  │     ├─ Global Guards:
  │     │     ├─ [JwtAuthGuard](backend/src/common/guards/jwt-auth.guard.ts:7) → attach request.user (skip if [Public()](backend/src/common/decorators/public.decorator.ts:4))
  │     │     └─ [RolesGuard](backend/src/common/guards/roles.guard.ts:10) → verify [Roles(...)](backend/src/common/decorators/roles.decorator.ts:17)
  │     ├─ Controller → Service → Prisma → Database
  │     └─ Optional audit: user operations via [AuditTrailService](backend/src/common/services/audit-trail.service.ts:29)
  │
  └─ POST /api/auth/refresh
        ├─ Controller → [AuthService.refreshTokens()](backend/src/auth/auth.service.ts:202)
        └─ Issue new tokens via [AuthService.generateTokens()](backend/src/auth/auth.service.ts:151)
```

### Component Relationships (Updated)
- AppModule dependency chain: [AppModule](backend/src/app.module.ts:1)
  - ConfigModule (global config) → PrismaModule (DB access) → CommonModule (global services) → AuthModule & UsersModule
- Auth Module:
  - Service & DTO: [AuthService](backend/src/auth/auth.service.ts:18), [LoginDto](backend/src/auth/dto/login.dto.ts:1)
  - Strategies: [JwtStrategy](backend/src/auth/strategies/jwt.strategy.ts:1), [JwtRefreshStrategy](backend/src/auth/strategies/jwt-refresh.strategy.ts:1)
- Users Module:
  - Service operations:
    - Create: [UsersService.createUser()](backend/src/users/users.service.ts:24)
    - Update status: [UsersService.updateStatus()](backend/src/users/users.service.ts:113)
    - Update role: [UsersService.updateRole()](backend/src/users/users.service.ts:149)
    - Reset password: [UsersService.resetPassword()](backend/src/users/users.service.ts:197)
  - Audit logging: [AuditTrailService](backend/src/common/services/audit-trail.service.ts:29)
- Common Module:
  - Decorators: [Public()](backend/src/common/decorators/public.decorator.ts:4), [Roles(...)](backend/src/common/decorators/roles.decorator.ts:17)
  - Guards: [JwtAuthGuard](backend/src/common/guards/jwt-auth.guard.ts:7), [RolesGuard](backend/src/common/guards/roles.guard.ts:10)
  - Interfaces: [JwtPayload](backend/src/common/interfaces/jwt-payload.interface.ts:1)

### Security Implementation Notes
- ValidationPipe global, whitelist & transform enabled: [main.ts](backend/src/main.ts:35)
- CORS parsing aman untuk daftar origin: [main.ts](backend/src/main.ts:23)
- API prefix konsisten 'api': [main.ts](backend/src/main.ts:47)

### Diagram — Role-based Access Evaluation
```
Controller Handler ── requires [Roles('administrator')](backend/src/common/decorators/roles.decorator.ts:17)
   │
Global Guards
   ├─ [JwtAuthGuard](backend/src/common/guards/jwt-auth.guard.ts:7) → request.user.role
   └─ [RolesGuard](backend/src/common/guards/roles.guard.ts:10)
         ├─ read metadata [ROLES_KEY](backend/src/common/decorators/roles.decorator.ts:16)
         └─ includes(user.role) ? allow : deny
```
### Frontend — Phase 8 (COMPLETED)

Arsitektur frontend telah diperluas dengan implementasi penuh untuk dashboard per peran, manajemen pesanan, workflow persetujuan, fitur admin, dan integrasi real-time.

#### Halaman (Role-specific)
- Admin:
  - Dashboard: [AdminDashboardPage.tsx](frontend/src/pages/admin/AdminDashboardPage.tsx:1)
  - Master Data: [MasterDataPage.tsx](frontend/src/pages/admin/MasterDataPage.tsx:1) ✅ **NEW**
  - Laporan: [ReportsPage.tsx](frontend/src/pages/reports/ReportsPage.tsx:1)
  - Audit Trail: [AuditTrailPage.tsx](frontend/src/pages/audit/AuditTrailPage.tsx:1)
  - Manajemen Pengguna: [UsersManagementPage.tsx](frontend/src/pages/users/UsersManagementPage.tsx:1)
- Employee:
  - Dashboard: [EmployeeDashboardPage.tsx](frontend/src/pages/employee/EmployeeDashboardPage.tsx:1)
  - Buat Pesanan: [CreateOrderPage.tsx](frontend/src/pages/orders/CreateOrderPage.tsx:1)
- Dapur:
  - Dashboard: [DapurDashboardPage.tsx](frontend/src/pages/dapur/DapurDashboardPage.tsx:1)
  - Kanban (DnD): [KanbanBoardPage.tsx](frontend/src/pages/orders/KanbanBoardPage.tsx:1)
- Delivery:
  - Dashboard: [DeliveryDashboardPage.tsx](frontend/src/pages/delivery/DeliveryDashboardPage.tsx:1)
  - Daftar Pengiriman (mobile-first): [DeliveryListPage.tsx](frontend/src/pages/orders/DeliveryListPage.tsx:1)
- Orders (umum):
  - Daftar Pesanan: [OrdersListPage.tsx](frontend/src/pages/orders/OrdersListPage.tsx:1)
  - Detail Pesanan: [OrderDetailPage.tsx](frontend/src/pages/orders/OrderDetailPage.tsx:1)
- Approval Workflow:
  - Pusat Persetujuan: [ApprovalCenterPage.tsx](frontend/src/pages/approvals/ApprovalCenterPage.tsx:1)

#### Lapis Layanan (API Services, Typed)
- Orders API: [orders.api.ts](frontend/src/services/api/orders.api.ts:1)
- Users API: [users.api.ts](frontend/src/services/api/users.api.ts:1)
- Reports API: [reports.api.ts](frontend/src/services/api/reports.api.ts:1)
- Master Data API: [master.api.ts](frontend/src/services/api/master.api.ts:1) ✅ **NEW**
- Barrel services: [index.ts](frontend/src/services/api/index.ts:1)

#### Integrasi Real-time (Socket.IO Client)
- Socket Manager (auth JWT, auto-reconnect, event relay): [socket.manager.ts](frontend/src/services/websocket/socket.manager.ts:1)
- Hook event WebSocket: [useWebSocket.ts](frontend/src/hooks/useWebSocket.ts:1)
- Hook notifikasi global (toast): [useNotifications.ts](frontend/src/hooks/useNotifications.ts:1)

Events yang ditangani: `order:created`, `order:status-changed`, `order:approval-requested`, `order:approval-decided`

#### UI Components (Advanced)
- Tabel data: [Table.tsx](frontend/src/components/ui/Table.tsx:1)
- Modal (Headless UI): [Modal.tsx](frontend/src/components/ui/Modal.tsx:1)
- Select (Headless UI): [Select.tsx](frontend/src/components/ui/Select.tsx:1)
- DatePicker (native styled): [DatePicker.tsx](frontend/src/components/ui/DatePicker.tsx:1)
- Toast provider & helpers: [Toast.tsx](frontend/src/components/ui/Toast.tsx:1)
- Spinner: [Spinner.tsx](frontend/src/components/ui/Spinner.tsx:1)
- Empty State: [EmptyState.tsx](frontend/src/components/ui/EmptyState.tsx:1)
- Pagination: [Pagination.tsx](frontend/src/components/ui/Pagination.tsx:1)
- Barrel UI: [index.ts](frontend/src/components/ui/index.ts:1)

#### Domain Types (Typed)
- Orders & DTOs: [order.types.ts](frontend/src/types/order.types.ts:1)
- Reports & audit: [report.types.ts](frontend/src/types/report.types.ts:1)
- Users (admin DTOs): [user.types.ts](frontend/src/types/user.types.ts:1)
- WebSocket payloads: [websocket.types.ts](frontend/src/types/websocket.types.ts:1)
- Barrel types: [index.ts](frontend/src/types/index.ts:1)

#### Routing & Guards (RBAC Frontend)
- Router (role-aware untuk /orders): [index.tsx](frontend/src/router/index.tsx:1)
- ProtectedRoute dengan allowedRoles: [ProtectedRoute.tsx](frontend/src/components/auth/ProtectedRoute.tsx:1)
- Layout: [AppShell.tsx](frontend/src/components/layout/AppShell.tsx:1), [Sidebar.tsx](frontend/src/components/layout/Sidebar.tsx:1), [Topbar.tsx](frontend/src/components/layout/Topbar.tsx:1)
##### Routing Fix — Approval Center Quick-links

Perbaikan routing memastikan tautan cepat (quick-links) dari dashboard mengarah ke halaman yang tepat dengan guard peran yang sesuai:
- /admin/approvals → render ApprovalCenterPage khusus administrator, guard peran ketat di [index.tsx](frontend/src/router/index.tsx:135) dan implementasi guard di [ProtectedRoute.tsx](frontend/src/components/auth/ProtectedRoute.tsx:1)
- /orders/pending-approvals → render ApprovalCenterPage untuk administrator dan dapur sesuai kebutuhan operasional di [index.tsx](frontend/src/router/index.tsx:151)
- /orders/queue → render KanbanBoardPage khusus dapur dengan guard peran di [index.tsx](frontend/src/router/index.tsx:143)

Dampak arsitektural:
- Konsistensi alur navigasi operasional lintas peran melalui RBAC di lapis routing
- Penguatan kontrol akses di client-side tanpa mengubah kontrak API
- Sinkronisasi UX antara dashboard dan halaman persetujuan, sejalan dengan desain event real-time

#### Desain & UX
- Dark mode konsisten (Tailwind, kelas dark)
- Aksen warna: Emerald (#34D399) dan Amber (#FBBF24)
- Dapur: Kanban drag-and-drop untuk antrian
- Delivery: Mobile-first, tombol aksi besar
- Notifikasi real-time via toast (role-aware)

### Operations & Recovery Toolkit (Oktober 2025)

Tambahan kapabilitas operasional untuk maintenance dan pemulihan darurat; tidak mengubah arsitektur runtime inti, namun penting untuk reliability dan recovery:

- Playbook Recovery:
  - [emergency-admin-recovery.md](emergency-admin-recovery.md:1) — panduan kilat "break‑glass" untuk memulihkan akses admin (perintah siap pakai, contoh output, SQL fallback).
- CLI Recovery & Diagnosis:
  - [recovery-scripts.js](recovery-scripts.js:1) — tool darurat berbasis Node/Prisma:
    - Aksi: find, verify, make-admin, reset-password, print-sql, print-shell, print-powershell, emit-shell, hash
    - Wrapper generator: "emit-shell" menulis recovery-linux.sh & recovery-windows.ps1 ([emitShellFiles()](recovery-scripts.js:535-544))
    - Audit trail pada operasi kritis (aksi: EMERGENCY_ADMIN_RECOVERY_MAKE_ADMIN, EMERGENCY_ADMIN_RECOVERY_PASSWORD_RESET)
  - [activate-user.js](activate-user.js:1) — aktivasi akun, diagnosis end‑to‑end (bcrypt/JWT/HTTP probe), reset state user terarah.
- NPM Scripts (root) untuk operasi & QA: [package.json](package.json:9-34)
  - E2E (Playwright): "test:e2e", "test:e2e:ui", "test:e2e:headed", "test:e2e:report", "test:e2e:codegen"
  - Production: "start:prod", "start:prod:backend", "start:prod:frontend"
  - Quality: "typecheck"
  - Recovery utilities: "activate-user", "diagnose-user", "reset-user"
- Users Management CRUD — verifikasi endpoint (administrator): [UsersController](backend/src/users/users.controller.ts:1)
  - Create: [UsersController.create()](backend/src/users/users.controller.ts:29-34)
  - List: [UsersController.findAll()](backend/src/users/users.controller.ts:37-41)
  - Detail: [UsersController.findOne()](backend/src/users/users.controller.ts:44-48)
  - Update Status: [UsersController.updateStatus()](backend/src/users/users.controller.ts:51-63)
  - Update Role: [UsersController.updateRole()](backend/src/users/users.controller.ts:66-74)
  - Reset Password: [UsersController.resetPassword()](backend/src/users/users.controller.ts:77-85)

Catatan Keamanan (Sinkron dengan arsitektur Security):
- Password selalu di‑hash (bcrypt) dan tidak pernah diekspor; validasi aman konsisten dengan [AuthService.validateUser()](backend/src/auth/auth.service.ts:87).
- Seleksi field aman untuk relasi user pada response tetap menggunakan Prisma `select` seperti pada [AuthService.login()](backend/src/auth/auth.service.ts:123).

Dampak Arsitektural:
- Menambah lapisan operasional (ops/recovery) tanpa mengubah modularitas backend/frontend.
- Mendukung SRE/operational workflows (diagnosa, pemulihan, verifikasi) yang terintegrasi dengan audit trail dan kebijakan keamanan yang ada.


### Update — Master Data Module (Matang)

Backend (NestJS) — Layanan Master Data telah lengkap dengan CRUD dan audit trail terintegrasi:
- Departments:
  - Create: [MasterDataService.createDepartment()](backend/src/master-data/master-data.service.ts:53)
  - Update: [MasterDataService.updateDepartment()](backend/src/master-data/master-data.service.ts:81)
  - Delete: [MasterDataService.deleteDepartment()](backend/src/master-data/master-data.service.ts:125)
- Jabatan:
  - Create: [MasterDataService.createJabatan()](backend/src/master-data/master-data.service.ts:156)
  - Update: [MasterDataService.updateJabatan()](backend/src/master-data/master-data.service.ts:210)
  - Delete: [MasterDataService.deleteJabatan()](backend/src/master-data/master-data.service.ts:291)
- Shift:
  - Create: [MasterDataService.createShift()](backend/src/master-data/master-data.service.ts:355)
  - Update: [MasterDataService.updateShift()](backend/src/master-data/master-data.service.ts:388)
  - Delete: [MasterDataService.deleteShift()](backend/src/master-data/master-data.service.ts:456)

Detail penting:
- Validasi bisnis komprehensif (cek duplikasi, validasi relasi dan dependency, validasi format waktu shift).
- Audit trail pada setiap operasi via Common Service (aksi seperti MASTER_DEPARTMENT_CREATED/UPDATED/DELETED, dsb).
- DTO terstruktur untuk input layer (lihat folder DTO pada modul master-data): [index.ts](backend/src/master-data/dto/index.ts:1)

Frontend (React + Vite) — Integrasi layer layanan dan halaman admin:
- Halaman administrasi Master Data: [MasterDataPage.tsx](frontend/src/pages/admin/MasterDataPage.tsx)
- Lapis layanan API typed: [master.api.ts](frontend/src/services/api/master.api.ts)
- Sinkronisasi tampilan (urut asc), serta pemetaan relasi aman untuk jabatan → department.


### PWA Enhancements & Offline Support Architecture

Service Worker (vite-plugin-pwa) mengimplementasikan strategi caching dan fallback offline yang aman:
- Konfigurasi Workbox inti:
  - navigateFallback: [frontend/vite.config.ts](frontend/vite.config.ts:81-83)
  - Strategi navigasi offline dengan fallback SPA shell (mencegah redirect loop) melalui handlerDidError:
    - [handlerDidError()](frontend/vite.config.ts:95-104)
- Runtime caching (ringkas):
  - API dinamis (orders, auth/me) — NetworkFirst: [runtimeCaching.api-dynamic](frontend/vite.config.ts:110-124)
  - API relatif statis (shifts, departments) — CacheFirst: [runtimeCaching.api-static](frontend/vite.config.ts:126-139)
  - Assets & images — CacheFirst: [runtimeCaching.images](frontend/vite.config.ts:141-154)
  - Google Fonts (stylesheets) — StaleWhileRevalidate: [runtimeCaching.google-fonts](frontend/vite.config.ts:156-161)

UI/UX offline dan update:
- Halaman offline khusus: [OfflinePage.tsx](frontend/src/pages/OfflinePage.tsx)
- Indikator status offline real-time: [OfflineIndicator.tsx](frontend/src/components/pwa/OfflineIndicator.tsx)
- Prompt instalasi PWA: [InstallPrompt.tsx](frontend/src/components/pwa/InstallPrompt.tsx)
- Prompt update service worker: [UpdatePrompt.tsx](frontend/src/components/pwa/UpdatePrompt.tsx)
- Deteksi online/offline dan guard di shell aplikasi: [AppShell.tsx](frontend/src/components/layout/AppShell.tsx)

Arsitektur hasil:
- Navigation requests saat offline menyajikan SPA shell dari cache untuk menghindari loop, kemudian UI merender OfflinePage.
- API dibedakan antara data dinamis (prefer network) dan data relatif statis (prefer cache) untuk performa optimal.
- UX informatif saat transisi online/offline, update SW, dan instalasi PWA.


### Testing Strategy — API Smoke Tests

Smoke tests ringan untuk sanity check autentikasi dan endpoint master-data (Node 18+ fetch):
- Get Departments: [scripts/api-smoke/get-departments.js](scripts/api-smoke/get-departments.js:1)
  - Login admin → GET /master-data/departments
  - Fungsi login: [login()](scripts/api-smoke/get-departments.js:8)
  - Fetch departments: [getDepartments()](scripts/api-smoke/get-departments.js:25)
- Create Department: [scripts/api-smoke/create-department.js](scripts/api-smoke/create-department.js)

Cara jalankan (contoh):
- Windows CMD:
  - node scripts\\api-smoke\\get-departments.js
  - node scripts\\api-smoke\\create-department.js
- PowerShell/Bash:
  - node scripts/api-smoke/get-departments.js

Variabel lingkungan:
- API_BASE_URL (default http://localhost:3000/api)
- ADMIN_NIK (default ADM001), ADMIN_PASSWORD (default admin123)

Tujuan arsitektural:
- Deteksi dini regresi kritis (login, otorisasi, endpoint master-data) tanpa overhead penuh E2E.
- Pelengkap E2E Playwright, cocok untuk verifikasi cepat di lingkungan dev/CI.


### Offline Storage — IndexedDB Utilities

Penyimpanan offline untuk pesanan dan profil user via IndexedDB, fail‑safe dan mudah dipulihkan:
- Skema:
  - Database: bebang-pack-meal-offline (versi 1)
  - Object stores: orders (keyPath: id), user-data (keyPath: id)
- API utilitas (Typed):
  - Open/upgrade DB: [openDB()](frontend/src/utils/offline-storage.utils.ts:13)
  - Simpan batch pesanan: [saveOrdersToCache()](frontend/src/utils/offline-storage.utils.ts:52)
  - Ambil semua pesanan: [getOrdersFromCache()](frontend/src/utils/offline-storage.utils.ts:97)
  - Simpan profil user: [saveUserDataToCache()](frontend/src/utils/offline-storage.utils.ts:123)
  - Ambil profil user: [getUserDataFromCache()](frontend/src/utils/offline-storage.utils.ts:165)
  - Bersihkan cache: [clearOfflineCache()](frontend/src/utils/offline-storage.utils.ts:191)

Prinsip desain:
- Fail gracefully: selalu kembalikan default aman saat error ([], null).
- Transaksi eksplisit dengan logging konsisten untuk diagnosis [offline-storage.utils.ts](frontend/src/utils/offline-storage.utils.ts).
- Sinkron dengan strategi PWA untuk pengalaman offline yang stabil.


### Pola Bridging Migrasi TypeScript

Kebijakan migrasi bertahap dari .js legacy ke .ts/.tsx tanpa menghambat pengembangan:
- TypeScript sebagai sumber kebenaran; berkas .js dipertahankan sementara untuk kompatibilitas sampai paritas fungsional/visual terverifikasi (lint, typecheck, E2E).
- Cleanup .js dilakukan pasca verifikasi menyeluruh per modul/fitur.
- Contoh pasangan aktif:
  - App: [App.js](frontend/src/App.js:1) ↔ [App.tsx](frontend/src/App.tsx:1)
  - Entry: [main.js](frontend/src/main.js:1) ↔ [main.tsx](frontend/src/main.tsx:1)
  - Guard: [ProtectedRoute.js](frontend/src/components/auth/ProtectedRoute.js:1) ↔ [ProtectedRoute.tsx](frontend/src/components/auth/ProtectedRoute.tsx:1)
  - Router: [index.js](frontend/src/router/index.js:1) ↔ [index.tsx](frontend/src/router/index.tsx:1)
  - Axios: [axios.js](frontend/src/lib/axios.js:1) ↔ [axios.ts](frontend/src/lib/axios.ts:1)
  - Services: [orders.api.js](frontend/src/services/api/orders.api.js:1) ↔ [orders.api.ts](frontend/src/services/api/orders.api.ts:1), [reports.api.js](frontend/src/services/api/reports.api.js:1) ↔ [reports.api.ts](frontend/src/services/api/reports.api.ts:1), [users.api.js](frontend/src/services/api/users.api.js:1) ↔ [users.api.ts](frontend/src/services/api/users.api.ts:1), [master.api.js](frontend/src/services/api/master.api.js:1) ↔ [master.api.ts](frontend/src/services/api/master.api.ts:1)
  - WebSocket: [socket.manager.js](frontend/src/services/websocket/socket.manager.js:1) ↔ [socket.manager.ts](frontend/src/services/websocket/socket.manager.ts:1)
  - Types & Stores: [types/index.js](frontend/src/types/index.js:1) ↔ [types/index.ts](frontend/src/types/index.ts:1), [auth.store.js](frontend/src/stores/auth.store.js:1) ↔ [auth.store.ts](frontend/src/stores/auth.store.ts:1)

Standar operasional:
- Selalu prioritaskan perbaikan tipe dan barrel exports saat menambah/merefaktor modul TS.
- Jalankan pemeriksaan tipe gabungan sebelum cleanup:
  - npm run typecheck (root) atau per workspace.
- E2E/Smoke harus hijau sebelum penghapusan berkas .js terkait untuk mencegah regresi.

