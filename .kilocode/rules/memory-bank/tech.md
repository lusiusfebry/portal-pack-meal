# TECH — Bebang Pack Meal Portal

## Teknologi Utama

### Backend Stack
- **Framework**: NestJS 10.4.0 ✅ INSTALLED
- **Language**: TypeScript 5.5.4 ✅ INSTALLED
- **Database**: PostgreSQL (dengan Prisma ORM 5.17.0) ✅ INSTALLED
- **Authentication**: JWT (@nestjs/jwt 10.2.0) ✅ INSTALLED
- **Real-time**: WebSockets (@nestjs/websockets 10.4.0) ✅ INSTALLED
- **Validation**: class-validator 0.14.0, class-transformer 0.5.1 ✅ INSTALLED
- **Security**: bcrypt 5.1.1 untuk password hashing ✅ INSTALLED
- **Reactive Programming**: RxJS 7.8.1 ✅ INSTALLED

### Frontend Stack
- **Framework**: React 18.3.1 ✅ INSTALLED
- **Bundler**: Vite 7.1.7 ✅ UPDATED (dari 5.4.8)
- **Language**: TypeScript 5.6.2 ✅ INSTALLED
- **Styling**: Tailwind CSS 3.4.10 ✅ INSTALLED
- **State Management**: Zustand 4.5.4 ✅ INSTALLED
- **Routing**: React Router DOM 6.26.2 ✅ INSTALLED
- **HTTP Client**: Axios 1.7.7 ✅ INSTALLED
- **UI Components**: Headless UI 2.1.4, Heroicons 2.1.5 ✅ INSTALLED
- **PWA**: vite-plugin-pwa 1.0.3 ✅ UPDATED (dari 0.20.5)
- **Real-time**: Socket.io Client 4.8.1 ✅ INSTALLED
- **Date Utilities**: date-fns 3.6.0 ✅ INSTALLED
- **Utilities**: clsx 2.1.1 ✅ INSTALLED

#### Catatan Migrasi TypeScript (Frontend) — Status: hampir selesai
- Mayoritas modul frontend telah dimigrasikan ke TypeScript dan lulus pemeriksaan tipe penuh.
- Modul yang saat ini memiliki duplikasi .js vs .ts (akan dibersihkan setelah validasi paritas):
  - Entry & Core:
    - [App.js](frontend/src/App.js:1) ↔ [App.tsx](frontend/src/App.tsx:1)
    - [main.js](frontend/src/main.js:1) ↔ [main.tsx](frontend/src/main.tsx:1)
  - Hooks:
    - [hooks/useNotifications.js](frontend/src/hooks/useNotifications.js:1) ↔ [hooks/useNotifications.ts](frontend/src/hooks/useNotifications.ts:1)
    - [hooks/useTheme.js](frontend/src/hooks/useTheme.js:1) ↔ [hooks/useTheme.ts](frontend/src/hooks/useTheme.ts:1)
    - [hooks/useWebSocket.js](frontend/src/hooks/useWebSocket.js:1) ↔ [hooks/useWebSocket.ts](frontend/src/hooks/useWebSocket.ts:1)
    - [hooks/usePWA.js](frontend/src/hooks/usePWA.js:1) ↔ [hooks/usePWA.ts](frontend/src/hooks/usePWA.ts:1)
  - Library:
    - [lib/axios.js](frontend/src/lib/axios.js:1) ↔ [lib/axios.ts](frontend/src/lib/axios.ts:1)
  - Router:
    - [router/index.js](frontend/src/router/index.js:1) ↔ [router/index.tsx](frontend/src/router/index.tsx:1)
  - Services (API layer):
    - [services/api/index.js](frontend/src/services/api/index.js:1) ↔ [services/api/index.ts](frontend/src/services/api/index.ts:1)
    - [services/api/master.api.js](frontend/src/services/api/master.api.js:1) ↔ [services/api/master.api.ts](frontend/src/services/api/master.api.ts:1)
    - [services/api/orders.api.js](frontend/src/services/api/orders.api.js:1) ↔ [services/api/orders.api.ts](frontend/src/services/api/orders.api.ts:1)
    - [services/api/reports.api.js](frontend/src/services/api/reports.api.js:1) ↔ [services/api/reports.api.ts](frontend/src/services/api/reports.api.ts:1)
    - [services/api/users.api.js](frontend/src/services/api/users.api.js:1) ↔ [services/api/users.api.ts](frontend/src/services/api/users.api.ts:1)
  - WebSocket:
    - [services/websocket/socket.manager.js](frontend/src/services/websocket/socket.manager.js:1) ↔ [services/websocket/socket.manager.ts](frontend/src/services/websocket/socket.manager.ts:1)
  - Stores:
    - [stores/auth.store.js](frontend/src/stores/auth.store.js:1) ↔ [stores/auth.store.ts](frontend/src/stores/auth.store.ts:1)
  - Types:
    - [types/auth.types.js](frontend/src/types/auth.types.js:1) ↔ [types/auth.types.ts](frontend/src/types/auth.types.ts:1)
    - [types/index.js](frontend/src/types/index.js:1) ↔ [types/index.ts](frontend/src/types/index.ts:1)
    - [types/order.types.js](frontend/src/types/order.types.js:1) ↔ [types/order.types.ts](frontend/src/types/order.types.ts:1)
    - [types/report.types.js](frontend/src/types/report.types.js:1) ↔ [types/report.types.ts](frontend/src/types/report.types.ts:1)
    - [types/user.types.js](frontend/src/types/user.types.js:1) ↔ [types/user.types.ts](frontend/src/types/user.types.ts:1)
    - [types/websocket.types.js](frontend/src/types/websocket.types.js:1) ↔ [types/websocket.types.ts](frontend/src/types/websocket.types.ts:1)
  - Utils:
    - [utils/date.utils.js](frontend/src/utils/date.utils.js:1) ↔ [utils/date.utils.ts](frontend/src/utils/date.utils.ts:1)
    - [utils/download.utils.js](frontend/src/utils/download.utils.js:1) ↔ [utils/download.utils.ts](frontend/src/utils/download.utils.ts:1)
    - [utils/index.js](frontend/src/utils/index.js:1) ↔ [utils/index.ts](frontend/src/utils/index.ts:1)
    - [utils/offline-storage.utils.js](frontend/src/utils/offline-storage.utils.js:1) ↔ [utils/offline-storage.utils.ts](frontend/src/utils/offline-storage.utils.ts:1)
    - [utils/status.utils.js](frontend/src/utils/status.utils.js:1) ↔ [utils/status.utils.ts](frontend/src/utils/status.utils.ts:1)
  - Pages (contoh representatif, semua memiliki padanan .tsx):
    - [pages/DashboardPage.js](frontend/src/pages/DashboardPage.js:1) ↔ [pages/DashboardPage.tsx](frontend/src/pages/DashboardPage.tsx:1)
    - [pages/LoginPage.js](frontend/src/pages/LoginPage.js:1) ↔ [pages/LoginPage.tsx](frontend/src/pages/LoginPage.tsx:1)
    - [pages/NotFoundPage.js](frontend/src/pages/NotFoundPage.js:1) ↔ [pages/NotFoundPage.tsx](frontend/src/pages/NotFoundPage.tsx:1)
    - [pages/OfflinePage.js](frontend/src/pages/OfflinePage.js:1) ↔ [pages/OfflinePage.tsx](frontend/src/pages/OfflinePage.tsx:1)
    - [pages/UnauthorizedPage.js](frontend/src/pages/UnauthorizedPage.js:1) ↔ [pages/UnauthorizedPage.tsx](frontend/src/pages/UnauthorizedPage.tsx:1)
    - [pages/approvals/ApprovalCenterPage.js](frontend/src/pages/approvals/ApprovalCenterPage.js:1) ↔ [pages/approvals/ApprovalCenterPage.tsx](frontend/src/pages/approvals/ApprovalCenterPage.tsx:1)
    - [pages/audit/AuditTrailPage.js](frontend/src/pages/audit/AuditTrailPage.js:1) ↔ [pages/audit/AuditTrailPage.tsx](frontend/src/pages/audit/AuditTrailPage.tsx:1)
    - [pages/delivery/DeliveryDashboardPage.js](frontend/src/pages/delivery/DeliveryDashboardPage.js:1) ↔ [pages/delivery/DeliveryDashboardPage.tsx](frontend/src/pages/delivery/DeliveryDashboardPage.tsx:1)
    - [pages/employee/EmployeeDashboardPage.js](frontend/src/pages/employee/EmployeeDashboardPage.js:1) ↔ [pages/employee/EmployeeDashboardPage.tsx](frontend/src/pages/employee/EmployeeDashboardPage.tsx:1)
    - [pages/orders/CreateOrderPage.js](frontend/src/pages/orders/CreateOrderPage.js:1) ↔ [pages/orders/CreateOrderPage.tsx](frontend/src/pages/orders/CreateOrderPage.tsx:1)
    - [pages/orders/DeliveryListPage.js](frontend/src/pages/orders/DeliveryListPage.js:1) ↔ [pages/orders/DeliveryListPage.tsx](frontend/src/pages/orders/DeliveryListPage.tsx:1)
    - [pages/orders/KanbanBoardPage.js](frontend/src/pages/orders/KanbanBoardPage.js:1) ↔ [pages/orders/KanbanBoardPage.tsx](frontend/src/pages/orders/KanbanBoardPage.tsx:1)
    - [pages/orders/OrderDetailPage.js](frontend/src/pages/orders/OrderDetailPage.js:1) ↔ [pages/orders/OrderDetailPage.tsx](frontend/src/pages/orders/OrderDetailPage.tsx:1)
    - [pages/orders/OrdersListPage.js](frontend/src/pages/orders/OrdersListPage.js:1) ↔ [pages/orders/OrdersListPage.tsx](frontend/src/pages/orders/OrdersListPage.tsx:1)
    - [pages/reports/ReportsPage.js](frontend/src/pages/reports/ReportsPage.js:1) ↔ [pages/reports/ReportsPage.tsx](frontend/src/pages/reports/ReportsPage.tsx:1)
    - [pages/users/UsersManagementPage.js](frontend/src/pages/users/UsersManagementPage.js:1) ↔ [pages/users/UsersManagementPage.tsx](frontend/src/pages/users/UsersManagementPage.tsx:1)
- Rencana cleanup file .js legacy:
  - Semua berkas .js legacy yang memiliki padanan .ts/.tsx akan dihapus setelah verifikasi penuh terhadap paritas fungsional dan visual dari implementasi TypeScript.
  - Jadwal cleanup: post-production maintenance sprint, dengan penghapusan bertahap dan pemeriksaan lint/typecheck per commit.

#### Catatan Dependensi UI
- Dependensi UI aktual pada runtime adalah Headless UI + Tailwind CSS; Heroicons untuk ikon.
- NextUI yang disebut dalam dokumen desain berperan sebagai pedoman visual (design guideline) dan tidak menjadi dependency runtime pada proyek ini.

### Development Tools
- **Package Manager**: npm (dengan workspaces) ✅ CONFIGURED
- **Code Quality**: ESLint 8.57.0, Prettier 3.3.3 ✅ CONFIGURED
- **Git Hooks**: Husky 9.1.6 ✅ CONFIGURED
- **Process Management**: Concurrently 8.2.2 ✅ CONFIGURED
- **Testing**: Jest 29.7.0 (backend), @testing-library (frontend) ✅ INSTALLED
- **Typecheck Scripts**: tersedia di seluruh workspace:
  - Root monorepo: script "typecheck" di [package.json](package.json:30)
  - Backend: script "typecheck" di [backend/package.json](backend/package.json:17)
  - Frontend: script "typecheck" di [frontend/package.json](frontend/package.json:46)

## Environment Setup

### System Requirements
- **Node.js**: >= 18.0.0 ✅ VERIFIED
- **npm**: >= 9.0.0 ✅ VERIFIED
- **Database**: PostgreSQL 14+ 🔄 TO BE SETUP
- **IDE**: VS Code (recommended)

### Development Environment Variables

#### Backend (.env) ✅ TEMPLATE & ACTUAL CREATED
```env
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

#### Frontend (.env) ✅ TEMPLATE & ACTUAL CREATED
```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_WS_URL=http://localhost:3001
VITE_APP_NAME=Bebang Pack Meal Portal
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=development
```

## Project Structure & Configuration

### Monorepo Configuration ✅ IMPLEMENTED
```json
{
  "name": "bebang-pack-meal-portal",
  "workspaces": ["backend", "frontend"],
  "scripts": {
    "install:all": "npm install",
    "dev": "concurrently -c \"blue,green\" -n \"backend,frontend\" \"npm run dev:backend\" \"npm run dev:frontend\"",
    "build": "npm run build:backend && npm run build:frontend",
    "lint": "npm run -w backend lint && npm run -w frontend lint",
    "format": "npm exec -w backend prettier --write . && npm run -w frontend format"
  }
}
```

### Backend Configuration ✅ IMPLEMENTED

#### TypeScript (tsconfig.json)
- Target: ES2021
- Module: CommonJS
- Strict mode enabled
- Decorators enabled for NestJS
- Output directory: ./dist

#### NestJS (nest-cli.json)
- Source root: src/
- TypeScript config path: tsconfig.json
- Delete outDir on build

#### ESLint (.eslintrc.js)
- TypeScript parser
- Recommended rules for NestJS
- Integration with Prettier

#### Prettier (.prettierrc)
- Single quotes: true
- Trailing commas: all
- Print width: 80
- Tab width: 2
- Semi: true

### Frontend Configuration ✅ IMPLEMENTED

#### Vite (vite.config.ts)
- React plugin (@vitejs/plugin-react)
- PWA plugin (vite-plugin-pwa)
- Path alias: @ -> ./src
- Dev server port: 5173
- Proxy configuration for API and WebSocket
- **Updated**: Vite 7.1.7 dengan proxy yang robust

#### TypeScript (tsconfig.json)
- Target: ES2020
- JSX: react-jsx
- Path aliases: @/* -> ./src/*
- Strict mode enabled

#### Tailwind CSS (tailwind.config.js)
- Content: index.html, src/**/*.{ts,tsx,js,jsx}
- Dark mode: class-based
- Custom colors: primary (emerald), accent (amber)
- Custom fonts: Inter (sans), Poppins (display)

#### PWA Configuration
- Name: Bebang Pack Meal Portal
- Short name: BPM Portal
- Theme color: #10B981 (emerald)
- Display: standalone
- Icons: 192x192, 512x512, maskable
- **Updated**: vite-plugin-pwa 1.0.3

### Frontend Foundation — Phase 7 (COMPLETED)
- Authentication system dengan JWT + refresh token
  - Axios interceptor Bearer + refresh: [axios.ts](frontend/src/lib/axios.ts:1)
  - Session store (Zustand): [auth.store.ts](frontend/src/stores/auth.store.ts:1)
  - Types payload/token: [auth.types.ts](frontend/src/types/auth.types.ts:1)
- Protected routes & RBAC
  - Guard komponen: [ProtectedRoute.tsx](frontend/src/components/auth/ProtectedRoute.tsx:1)
  - Router (React Router v6): [router/index.tsx](frontend/src/router/index.tsx:1)
- UI component library dasar
  - Button: [Button.tsx](frontend/src/components/ui/Button.tsx:1)
  - Card: [Card.tsx](frontend/src/components/ui/Card.tsx:1)
  - Input: [Input.tsx](frontend/src/components/ui/Input.tsx:1)
  - Badge: [Badge.tsx](frontend/src/components/ui/Badge.tsx:1)
- Layout system
  - AppShell: [AppShell.tsx](frontend/src/components/layout/AppShell.tsx:1)
  - Sidebar: [Sidebar.tsx](frontend/src/components/layout/Sidebar.tsx:1)
  - Topbar: [Topbar.tsx](frontend/src/components/layout/Topbar.tsx:1)
- Theme management (dark/light)
  - Hook tema: [useTheme.ts](frontend/src/hooks/useTheme.ts:1)
  - Styles global: [index.css](frontend/src/styles/index.css:1)
- Routing pages utama
  - Login: [LoginPage.tsx](frontend/src/pages/LoginPage.tsx:1)
  - Dashboard: [DashboardPage.tsx](frontend/src/pages/DashboardPage.tsx:1)
  - Unauthorized: [UnauthorizedPage.tsx](frontend/src/pages/UnauthorizedPage.tsx:1)
  - Not Found: [NotFoundPage.tsx](frontend/src/pages/NotFoundPage.tsx:1)

## Development Workflow

### Installation ✅ READY
```bash
# Clone repository
git clone <REPO_URL>
cd portal-pack-meal

# Install all dependencies
npm run install:all

# Setup environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### Development Server ✅ READY
```bash
# Start both backend and frontend
npm run dev

# Start only backend
npm run dev:backend

# Start only frontend
npm run dev:frontend
```

### Build Process ✅ READY
```bash
# Build both workspaces
npm run build

# Build specific workspace
npm run build:backend
npm run build:frontend
```

### Code Quality ✅ READY
```bash
# Lint all code
npm run lint

# Fix linting issues
npm run lint:fix

# Format all code
npm run format

# Check formatting
npm run format:check
```

## Database Setup ✅ COMPLETED

### Prisma Configuration
```prisma
// backend/prisma/schema.prisma (✅ IMPLEMENTED)
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

### Migration & Seeding
```bash
# Generate Prisma client
npx prisma generate

# Create initial migration (already applied)
npx prisma migrate dev --name init
# Applied migration: 20251001075640_init

# Seed sample data
npx prisma db seed
```
### Update Terbaru — Database Default Status Pesanan
- Update schema: penambahan @default(MENUNGGU) pada field statusPesanan di [`backend/prisma/schema.prisma`](backend/prisma/schema.prisma)
- Migrasi baru dibuat: [`20251001083412_add_default_status_pesanan`](backend/prisma/migrations/20251001083412_add_default_status_pesanan/migration.sql)
- Database sekarang memiliki default value yang tepat untuk workflow pesanan (status awal: MENUNGGU)

### Models Implemented
- User, Department, Jabatan, Shift, Karyawan, Pesanan
- AuditTrail (log table)

### Integration
- PrismaModule (Global) dan PrismaService terintegrasi dengan NestJS

### Testing Credentials
- ADM001 / admin123 (administrator)
- EMP001 / emp123 (employee)
- KIT001 / kitchen123 (dapur)
- DEL001 / delivery123 (delivery)
- EMP002 / emp123 (employee)

## API Architecture 🔄 TO BE IMPLEMENTED

### RESTful Endpoints Structure
```
/api/
├── auth/
│   ├── POST /login
│   ├── POST /refresh
│   └── POST /logout
├── users/
│   ├── GET /users
│   ├── POST /users
│   ├── GET /users/:id
│   ├── PUT /users/:id
│   └── DELETE /users/:id
├── master-data/
│   ├── /departments
│   ├── /positions
│   ├── /shifts
│   └── /employees
├── orders/
│   ├── GET /orders
│   ├── POST /orders
│   ├── GET /orders/:id
│   ├── PATCH /orders/:id/status
│   └── DELETE /orders/:id
├── approvals/
│   ├── GET /approvals
│   ├── POST /approvals/:id/approve
│   └── POST /approvals/:id/reject
└── reports/
    ├── GET /reports/consumption
    ├── GET /reports/performance
    └── GET /reports/audit
```

### WebSocket Events
```typescript
// Real-time events
interface WebSocketEvents {
  'order:created': Order;
  'order:status_changed': { orderId: string; status: string };
  'approval:requested': Approval;
  'approval:resolved': Approval;
  'notification': Notification;
}
```

## Frontend Architecture 🔄 TO BE IMPLEMENTED

### Component Structure
```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── index.ts
│   ├── forms/           # Form components
│   │   ├── LoginForm.tsx
│   │   ├── OrderForm.tsx
│   │   └── UserForm.tsx
│   └── layout/          # Layout components
│       ├── Header.tsx
│       ├── Sidebar.tsx
│       └── Footer.tsx
├── pages/               # Page components
│   ├── auth/
│   ├── dashboard/
│   ├── orders/
│   └── admin/
├── hooks/               # Custom hooks
│   ├── useAuth.ts
│   ├── useOrders.ts
│   └── useWebSocket.ts
├── stores/              # Zustand stores
│   ├── authStore.ts
│   ├── orderStore.ts
│   └── uiStore.ts
├── services/            # API services
│   ├── api.ts
│   ├── authService.ts
│   └── orderService.ts
├── types/               # TypeScript types
│   ├── auth.ts
│   ├── order.ts
│   └── api.ts
└── utils/               # Utility functions
    ├── constants.ts
    ├── helpers.ts
    └── validators.ts
```

### State Management
```typescript
// Zustand store example
interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}
```

## Security Implementation 🔄 TO BE IMPLEMENTED

### JWT Configuration
```typescript
// JWT service configuration
const jwtConfig = {
  accessToken: {
    secret: process.env.JWT_SECRET,
    expiresIn: '15m',
  },
  refreshToken: {
    secret: process.env.JWT_REFRESH_SECRET,
    expiresIn: '7d',
  },
};
```

### Validation Pipes ✅ CONFIGURED
```typescript
// Global validation pipe
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
  }),
);
```

### CORS Configuration ✅ CONFIGURED & FIXED
```typescript
// CORS setup - FIXED PARSING
const rawCors = process.env.CORS_ORIGIN;
const corsOrigin = rawCors
  ? rawCors.split(',').map((s) => s.trim()).filter(Boolean)
  : ['*'];
app.enableCors({
  origin: corsOrigin.includes('*') ? true : corsOrigin,
  credentials: true,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type, Authorization',
});
```

## Testing Strategy 🔄 TO BE IMPLEMENTED

### Backend Testing
```bash
# Run unit tests
npm test

# Run e2e tests
npm run test:e2e

# Test coverage
npm run test:cov
```

### Frontend Testing
```bash
# Run unit tests
npm run test

# Run component tests
npm run test:components

# Run e2e tests
npm run test:e2e
```


## Deployment Considerations

### Environment Variables
- Production secrets harus disimpan securely
- Database connection strings harus menggunakan SSL
- JWT secrets harus di-generate per environment

### Build Optimization
- Backend: TypeScript compilation ke JavaScript
- Frontend: Code splitting dan tree shaking
- Assets: Image optimization dan compression

### Monitoring
- Application logging dengan structured format
- Performance monitoring untuk API response times
- Error tracking dengan stack traces

## Troubleshooting

### Common Issues
1. **Database connection failed**
   - Periksa DATABASE_URL di .env
   - Pastikan PostgreSQL berjalan
   - Verifikasi database exists

2. **CORS errors**
   - Periksa CORS_ORIGIN configuration
   - Pastikan frontend URL benar
   - **FIXED**: Parsing issues telah diperbaiki

3. **WebSocket connection issues**
   - Verifikasi WS_PORT tidak bentrok
   - Periksa firewall settings

4. **Build failures**
   - Clear node_modules dan reinstall
   - Periksa TypeScript errors
   - Verifikasi environment variables

### Development Tips
- Gunakan `npm run dev` untuk development dengan hot reload
- Check console untuk error messages
- Gunakan browser dev tools untuk debugging
- Monitor network tab untuk API calls

## Troubleshooting yang Telah Dilakukan ✅ RESOLVED

### Backend Issues
- **CORS Configuration**: Perbaikan parsing untuk menghindari undefined chaining issues
  - Problem: `process.env.CORS_ORIGIN?.split(',')` bisa menghasilkan undefined
  - Solution: Parsing dengan fallback yang robust
  - Status: ✅ FIXED

- **API Prefix**: Perbaikan configuration dengan menggunakan konstanta
  - Problem: `process.env.API_PREFIX` bisa undefined
  - Solution: Gunakan konstanta 'api' sebagai default
  - Status: ✅ FIXED

- **Environment Variables**: Konfigurasi yang konsisten dan robust
  - Problem: Template dan actual file tidak konsisten
  - Solution: Buat .env actual dari .env.example
  - Status: ✅ FIXED

### Frontend Issues
- **Dependencies**: Update ke versi terbaru untuk compatibility
  - Problem: Vite 5.4.8 memiliki compatibility issues
  - Solution: Update ke Vite 7.1.7 dan vite-plugin-pwa 1.0.3
  - Status: ✅ FIXED

- **Proxy Configuration**: Setup yang robust untuk API dan WebSocket
  - Problem: Proxy configuration tidak robust untuk development
  - Solution: Konfigurasi proxy dengan parsing URL yang benar
  - Status: ✅ FIXED

- **Theme System**: Implementasi dark/light mode yang berfungsi dengan baik
  - Problem: Theme switching tidak persisten
  - Solution: Implementasi localStorage dan system preference detection
  - Status: ✅ FIXED

### Development Environment
- **Port Conflicts**: Resolusi konflik port antara backend dan frontend
  - Problem: Port 3000 dan 5173 bentrok dengan service lain
  - Solution: Konfigurasi port yang konsisten dan dokumentasi
  - Status: ✅ FIXED

- **Hot Reload**: Memastikan hot reload berfungsi dengan baik
  - Problem: Hot reload tidak bekerja untuk beberapa file types
  - Solution: Konfigurasi Vite watcher dan file includes
  - Status: ✅ FIXED

- **Environment Variables**: Validasi dan testing konfigurasi
  - Problem: Environment variables tidak terload dengan benar
  - Solution: Validasi di startup dan fallback values
  - Status: ✅ FIXED

## Dependencies Update History

### Recent Updates (Oktober 2025)
- **Vite**: 5.4.8 → 7.1.7 (major version update)
- **vite-plugin-pwa**: 0.20.5 → 1.0.3 (major version update)
- **Reason**: Compatibility issues dan performance improvements
- **Impact**: Development experience yang lebih baik dan build yang lebih stabil

### Version Management Strategy
- Backend dependencies: Stable versions dengan security patches
- Frontend dependencies: Latest stable untuk development experience
- Review dependencies setiap bulan untuk security updates
- Major version updates dengan testing yang thorough

## Frontend — Phase 8 (COMPLETED)

### Frontend Dependencies — Phase 8 Updates
- Added UI/UX and real-time libraries:
  - @hello-pangea/dnd ^16.x — Kanban drag-and-drop
  - recharts ^2.x — Charts for dashboards and reports
  - react-hot-toast ^2.x — Toast notifications
- Already present and used in Phase 8:
  - socket.io-client ^4.x — Real-time WebSocket client
  - date-fns ^3.x — Tanggal/waktu utility

### Frontend Architecture — Phase 8 (COMPLETED)
- Status migrasi TypeScript (frontend): almost complete — mayoritas modul telah berpindah ke .ts/.tsx.
- Pasangan berkas .js/.ts yang akan dihapus setelah validasi (contoh representatif):
  - [App.js](frontend/src/App.js:1) ↔ [App.tsx](frontend/src/App.tsx:1)
  - [main.js](frontend/src/main.js:1) ↔ [main.tsx](frontend/src/main.tsx:1)
  - [router/index.js](frontend/src/router/index.js:1) ↔ [router/index.tsx](frontend/src/router/index.tsx:1)
  - [lib/axios.js](frontend/src/lib/axios.js:1) ↔ [lib/axios.ts](frontend/src/lib/axios.ts:1)
  - [services/api/users.api.js](frontend/src/services/api/users.api.js:1) ↔ [services/api/users.api.ts](frontend/src/services/api/users.api.ts:1)
  - [services/websocket/socket.manager.js](frontend/src/services/websocket/socket.manager.js:1) ↔ [services/websocket/socket.manager.ts](frontend/src/services/websocket/socket.manager.ts:1)
  - [types/index.js](frontend/src/types/index.js:1) ↔ [types/index.ts](frontend/src/types/index.ts:1)
  - [utils/date.utils.js](frontend/src/utils/date.utils.js:1) ↔ [utils/date.utils.ts](frontend/src/utils/date.utils.ts:1)
- Layanan, hooks, pages, stores, types, dan utils telah memiliki padanan .ts/.tsx stabil, siap untuk penghapusan berkas .js legacy.
- Role-specific dashboards:
  - Admin: [AdminDashboardPage.tsx](frontend/src/pages/admin/AdminDashboardPage.tsx:1)
  - Employee: [EmployeeDashboardPage.tsx](frontend/src/pages/employee/EmployeeDashboardPage.tsx:1)
  - Dapur: [DapurDashboardPage.tsx](frontend/src/pages/dapur/DapurDashboardPage.tsx:1)
  - Delivery: [DeliveryDashboardPage.tsx](frontend/src/pages/delivery/DeliveryDashboardPage.tsx:1)
- Order management:
  - Daftar pesanan: [OrdersListPage.tsx](frontend/src/pages/orders/OrdersListPage.tsx:1)
  - Detail + timeline + actions: [OrderDetailPage.tsx](frontend/src/pages/orders/OrderDetailPage.tsx:1)
  - Form buat pesanan: [CreateOrderPage.tsx](frontend/src/pages/orders/CreateOrderPage.tsx:1)
  - Kanban dapur (DnD): [KanbanBoardPage.tsx](frontend/src/pages/orders/KanbanBoardPage.tsx:1)
  - Delivery list (mobile-first): [DeliveryListPage.tsx](frontend/src/pages/orders/DeliveryListPage.tsx:1)
- Approval workflow:
  - Pusat persetujuan: [ApprovalCenterPage.tsx](frontend/src/pages/approvals/ApprovalCenterPage.tsx:1)
- Admin features:
  - Manajemen pengguna: [UsersManagementPage.tsx](frontend/src/pages/users/UsersManagementPage.tsx:1)
  - Laporan & analitik: [ReportsPage.tsx](frontend/src/pages/reports/ReportsPage.tsx:1)
  - Audit trail viewer: [AuditTrailPage.tsx](frontend/src/pages/audit/AuditTrailPage.tsx:1)
  - Master Data viewer: [MasterDataPage.tsx](frontend/src/pages/admin/MasterDataPage.tsx:1)
- Services (API layer):
  - Orders API: [orders.api.ts](frontend/src/services/api/orders.api.ts:1)
  - Users API: [users.api.ts](frontend/src/services/api/users.api.ts:1)
  - Reports API: [reports.api.ts](frontend/src/services/api/reports.api.ts:1)
  - Master data API: [master.api.ts](frontend/src/services/api/master.api.ts:1)
  - Barrel: [index.ts](frontend/src/services/api/index.ts:1)
- WebSocket client:
  - Socket Manager: [socket.manager.ts](frontend/src/services/websocket/socket.manager.ts:1)
- Hooks:
  - useWebSocket: [useWebSocket.ts](frontend/src/hooks/useWebSocket.ts:1)
  - useNotifications: [useNotifications.ts](frontend/src/hooks/useNotifications.ts:1)
- Utilities:
  - Status mapping: [status.utils.ts](frontend/src/utils/status.utils.ts:1)
  - Tanggal/waktu: [date.utils.ts](frontend/src/utils/date.utils.ts:1)
  - Download helpers: [download.utils.ts](frontend/src/utils/download.utils.ts:1)
  - Barrel: [index.ts](frontend/src/utils/index.ts:1)
- UI Components (advanced):
  - Table: [Table.tsx](frontend/src/components/ui/Table.tsx:1)
  - Modal (Headless UI): [Modal.tsx](frontend/src/components/ui/Modal.tsx:1)
  - Select (Headless UI): [Select.tsx](frontend/src/components/ui/Select.tsx:1)
  - DatePicker (native styled): [DatePicker.tsx](frontend/src/components/ui/DatePicker.tsx:1)
  - Toast provider & helpers: [Toast.tsx](frontend/src/components/ui/Toast.tsx:1)
  - Spinner: [Spinner.tsx](frontend/src/components/ui/Spinner.tsx:1)
  - EmptyState: [EmptyState.tsx](frontend/src/components/ui/EmptyState.tsx:1)
  - Pagination: [Pagination.tsx](frontend/src/components/ui/Pagination.tsx:1)
  - Barrel UI: [index.ts](frontend/src/components/ui/index.ts:1)
- Routing & Guards (updated):
  - Router (role-aware /orders): [index.tsx](frontend/src/router/index.tsx:1)
  - Protected route with allowedRoles: [ProtectedRoute.tsx](frontend/src/components/auth/ProtectedRoute.tsx:1)

### Recent Update — Routing Fix (Approval Center quick-links)

Perbaikan routing untuk konsistensi navigasi dari dashboard dan penegakan RBAC di lapis routing (frontend):
- /admin/approvals → render ApprovalCenterPage khusus administrator, rute dideklarasikan di [index.tsx](frontend/src/router/index.tsx:135) dengan guard di [ProtectedRoute.tsx](frontend/src/components/auth/ProtectedRoute.tsx:1)
- /orders/pending-approvals → render ApprovalCenterPage untuk administrator dan dapur di [index.tsx](frontend/src/router/index.tsx:151)
- /orders/queue → render KanbanBoardPage khusus dapur di [index.tsx](frontend/src/router/index.tsx:143)

Dampak teknis:
- RBAC client-side ditegakkan melalui allowedRoles pada ProtectedRoute tanpa mengubah kontrak API
- Quick-links dari dashboard kini menuju halaman target yang tepat dengan guard peran konsisten
- Tidak ada perubahan dependencies; ini murni perubahan konfigurasi routing

### WebSocket Integration (Client)
- Endpoint: ws://localhost:3001/notifications (config via VITE_WS_URL)
- Auth: JWT token saat handshake (sinkron dengan guard WS di backend)
- Events ditangani:
  - order:created, order:status-changed, order:approval-requested, order:approval-decided
- Global notifications:
  - Toast provider + useNotifications untuk menampilkan notifikasi relevan sesuai role

### Domain Types (Typed)
- Orders & DTOs: [order.types.ts](frontend/src/types/order.types.ts:1)
- Reports & audit trail: [report.types.ts](frontend/src/types/report.types.ts:1)
- Users (admin view DTOs): [user.types.ts](frontend/src/types/user.types.ts:1)
- WebSocket event payloads: [websocket.types.ts](frontend/src/types/websocket.types.ts:1)
- Barrel types: [index.ts](frontend/src/types/index.ts:1)

### Documentation (Updated)
- Frontend: Phase 8 features & struktur baru — [README.md](frontend/README.md:1)
- Root: Status diperbarui ke Phase 8 Complete — [README.md](README.md:1)

### Update Terbaru — TypeScript Compilation Fixed (Backend & Frontend)

Ringkasan:
- Backend: seluruh error TypeScript telah diperbaiki (korupsi [`package.json`](backend/package.json), perbaikan method logout di [`AuthController.logout()`](backend/src/auth/auth.controller.ts:1), penyeragaman formatting sesuai ESLint/Prettier, peningkatan type-safety pada guards, decorators, dan services).
- Frontend: seluruh error TypeScript telah diperbaiki (missing exports pada barrel files seperti [`frontend/src/types/index.ts`](frontend/src/types/index.ts), unused imports dan unused variables di komponen UI serta pages seperti [`OrdersListPage.tsx`](frontend/src/pages/orders/OrdersListPage.tsx:1)).
- Kedua workspace kini lulus pemeriksaan type penuh dengan perintah: `npx tsc --noemit` (tanpa output build).
- Aplikasi berjalan fungsional penuh dengan kode TypeScript yang bersih.

Perintah pemeriksaan cepat (dari root monorepo):
```bash
npm exec -w backend tsc --noemit
npm exec -w frontend tsc --noemit
```

CI/CD Rekomendasi:
- Tambahkan langkah type-check sebelum proses build untuk mencegah regresi di masa depan:
  - Backend: [`tsc`](backend/tsconfig.json:1) dengan `--noemit`
  - Frontend: [`tsc`](frontend/tsconfig.json:1) dengan `--noemit`

#### Detail Perbaikan Teknis

Backend:
- Menormalkan dan mengoreksi konfigurasi [`package.json`](backend/package.json) agar konsisten dengan NestJS workspace dan mencegah korupsi skrip.
- Memperbaiki implementasi method logout di [`auth.controller.ts`](backend/src/auth/auth.controller.ts:1) agar selaras dengan kontrak layanan dan tipe DTO.
- Menyelaraskan tipe pada guards dan decorators (mis. [`RolesGuard`](backend/src/common/guards/roles.guard.ts:10), [`CurrentUser`](backend/src/common/decorators/current-user.decorator.ts:1)) untuk menghindari `any` dan narrow types yang tidak aman.
- Penyesuaian import dan export index files (mis. [`backend/src/auth/strategies/index.ts`](backend/src/auth/strategies/index.ts:1), [`backend/src/common/decorators/index.ts`](backend/src/common/decorators/index.ts:1)) untuk ekspor eksplisit.
- Format konsisten sesuai konfigurasi Prettier dan ESLint (trailing commas, single quotes, print width).

Frontend:
- Menambahkan ekspor yang hilang di barrel files (mis. [`frontend/src/services/api/index.ts`](frontend/src/services/api/index.ts:1), [`frontend/src/components/ui/index.ts`](frontend/src/components/ui/index.ts:1)).
- Membersihkan unused imports dan variables pada komponen UI (mis. [`Spinner.tsx`](frontend/src/components/ui/Spinner.tsx:1), [`Toast.tsx`](frontend/src/components/ui/Toast.tsx:1)) dan halaman (mis. [`AdminDashboardPage.tsx`](frontend/src/pages/admin/AdminDashboardPage.tsx:1)).
- Menyelaraskan tipe props dan route guards (mis. [`ProtectedRoute.tsx`](frontend/src/components/auth/ProtectedRoute.tsx:1), [`router/index.tsx`](frontend/src/router/index.tsx:1)) dengan strict mode TypeScript.
- Penyesuaian types domain untuk konsistensi (mis. [`order.types.ts`](frontend/src/types/order.types.ts:1), [`websocket.types.ts`](frontend/src/types/websocket.types.ts:1)).

#### Praktik Operasional
- Jalankan pemeriksaan type secara rutin sebelum commit besar dan sebelum build produksi.
- Gunakan skrip lint dan format untuk menjaga kebersihan kode:
  ```bash
  npm run lint && npm run format
  ```
- Pastikan barrel exports tetap akurat setelah menambah/merubah file.

### Troubleshooting — TypeScript Errors (Backend & Frontend) ✅ RESOLVED

- Backend:
  - Korupsi [`package.json`](backend/package.json) → diperbaiki, memastikan skrip dan dependensi valid.
  - Method logout tidak konsisten → diperbaiki di [`auth.controller.ts`](backend/src/auth/auth.controller.ts:1).
  - Formatting dan type-safety → diselaraskan sesuai ESLint/Prettier dan strict typing.
- Frontend:
  - Missing exports pada barrel files → ditambahkan sesuai struktur modul.
  - Unused imports/variables → dibersihkan di komponen dan pages.
  - Penyesuaian tipe untuk auth/router → diselaraskan agar aman dan konsisten.

Status akhir:
- `npm exec -w backend tsc --noemit` dan `npm exec -w frontend tsc --noemit` keduanya sukses tanpa error.

### Update Terbaru — Typecheck Scripts (Root, Backend, Frontend)

- Root monorepo: script "typecheck" tersedia di [package.json](package.json:30) untuk menjalankan pemeriksaan tipe pada backend dan frontend secara berurutan.
- Backend (NestJS): script "typecheck" ditambahkan di [backend/package.json](backend/package.json:17) untuk menjalankan TypeScript compiler tanpa output (tsc --noEmit).
- Frontend (React + Vite): script "typecheck" ditambahkan di [frontend/package.json](frontend/package.json:46) untuk menjalankan TypeScript compiler tanpa output (tsc --noEmit).

Penggunaan:
- Dari root: jalankan perintah berikut untuk memeriksa keduanya
  ```bash
  npm run typecheck
  ```
- Per workspace: jalankan salah satu perintah berikut
  ```bash
  npm run -w backend typecheck
  npm run -w frontend typecheck
  ```

Catatan:
- Script typecheck membantu memastikan kedua workspace lolos pemeriksaan tipe penuh sebelum proses build atau pengujian, sejalan dengan rekomendasi CI di bagian sebelumnya.

## Update Terbaru (Oktober 2025) — Operational Recovery Toolkit & NPM Root Scripts

- NPM scripts (root) diperbarui di [package.json](package.json:9-34):
  - E2E (Playwright): "test:e2e", "test:e2e:ui", "test:e2e:headed", "test:e2e:report", "test:e2e:codegen"
  - Production start: "start:prod", "start:prod:backend", "start:prod:frontend"
  - Typecheck gabungan: "typecheck"
  - Utilitas recovery: "activate-user", "diagnose-user", "reset-user"
- Dokumentasi operasional:
  - tutorial.md — panduan operasional lengkap (best practices, langkah umum, troubleshooting)
  - [emergency-admin-recovery.md](emergency-admin-recovery.md:1) — playbook "break‑glass" untuk pemulihan akses admin dengan perintah siap pakai dan SQL fallback

### Recovery Toolkit (CLI)

- [recovery-scripts.js](recovery-scripts.js:1)
  - Actions: find, verify, make-admin, reset-password, print-sql, print-shell, print-powershell, emit-shell, hash
  - Membaca environment otomatis dari backend/.env jika `DATABASE_URL` belum diset
  - Mengandalkan Prisma Client yang telah di‑generate; audit trail dicatat saat memungkinkan
  - Wrapper generator: "emit-shell" menghasilkan `recovery-linux.sh` dan `recovery-windows.ps1` ([recovery-scripts.js.emitShellFiles()](recovery-scripts.js:535-544))
- [activate-user.js](activate-user.js:1)
  - Operasi: `--activate`, `--diagnose`, `--reset` dengan opsi `--role` dan `--probe-http`
  - Diagnosis end‑to‑end: bcrypt compare, JWT generate/decode, optional HTTP probe ke `POST /api/auth/login`
  - Membaca backend/.env (fallback ke .env.example) dan menggunakan bcrypt/jsonwebtoken/axios sesuai kebutuhan

### Keamanan & Audit

- Password selalu di‑hash (bcrypt) dan `passwordHash` tidak pernah diekspor; konsisten dengan [AuthService.validateUser()](backend/src/auth/auth.service.ts:87) dan seleksi aman di [AuthService.login()](backend/src/auth/auth.service.ts:123)
- Operasi kritis menulis audit trail (aksi contoh: EMERGENCY_ADMIN_RECOVERY_MAKE_ADMIN, EMERGENCY_ADMIN_RECOVERY_PASSWORD_RESET, USER_STATUS_CHANGED)

### CRUD Users Management — Verifikasi Endpoint (Administrator)

- Controller: [UsersController](backend/src/users/users.controller.ts:1)
  - Create: [UsersController.create()](backend/src/users/users.controller.ts:29-34)
  - List: [UsersController.findAll()](backend/src/users/users.controller.ts:37-41)
  - Detail: [UsersController.findOne()](backend/src/users/users.controller.ts:44-48)
  - Update Status: [UsersController.updateStatus()](backend/src/users/users.controller.ts:51-63)
  - Update Role: [UsersController.updateRole()](backend/src/users/users.controller.ts:66-74)
  - Reset Password: [UsersController.resetPassword()](backend/src/users/users.controller.ts:77-85)
- RBAC ditegakkan via guard [RolesGuard](backend/src/common/guards/roles.guard.ts:10) dan dekorator [Roles(...)](backend/src/common/decorators/roles.decorator.ts:17)

### Catatan Operasional

- Pastikan Prisma Client telah di‑generate sebelum menjalankan skrip recovery:
  - `npm exec -w backend prisma generate`
- Jalankan skrip dari root repo agar resolusi modul bekerja dan environment terbaca
- Playwright E2E terintegrasi; laporan tersedia via "test:e2e:report" dan konfigurasi di [playwright.config.ts](playwright.config.ts:1)

## Update Terbaru — Authentication & TypeScript Status (Oktober 2025)

### Authentication Status ✅ RESOLVED
- **401 Unauthorized Issue**: Masalah 401 Unauthorized sudah diselesaikan dengan perbaikan JWT Guard Global conflict
- **JWT Guard Global Conflict**: Diperbaiki dengan proper guard chaining di [JwtAuthGuard](backend/src/common/guards/jwt-auth.guard.ts:7)
- **Frontend Axios Interceptor**: Diperkuat dengan localStorage fallback melalui fungsi [getAccessTokenSafe()](frontend/src/lib/axios.ts:80)
- **Token Refresh Mechanism**: Sekarang berfungsi dengan baik untuk menghindari expired session
- **Password Hash Protection**: Ditingkatkan dengan bcrypt dan tidak pernah diekspor ke klien

### TypeScript Status ✅ RESOLVED
- **Error TS5097 di frontend/main.tsx**: Diperbaiki
- **Warning TypeScript di backend**: Tentang file listing diperbaiki
- **Backend build error MODULE_NOT_FOUND**: Diperbaiki
- **Typecheck Scripts**: Tersedia di root, backend, dan frontend workspace
- **Kedua workspace sekarang lulus pemeriksaan type penuh** dengan perintah: `npx tsc --noemit`

### Development Server Status ✅ STABLE
- **npm run dev**: Berjalan normal untuk backend dan frontend tanpa startup errors
- **WebSocket Connection**: Stabil pada port 3001
- **Hot Reload**: Berfungsi dengan baik untuk kedua workspace

### Master Data Frontend ✅ IMPLEMENTED
- **MasterDataPage**: Ditambahkan untuk administrator di [frontend/src/pages/admin/MasterDataPage.tsx](frontend/src/pages/admin/MasterDataPage.tsx:1)
- **Menu Integration**: Menu "Master Data" sudah ada di [Sidebar.tsx](frontend/src/components/layout/Sidebar.tsx:36) untuk role administrator
- **API Integration**: Terintegrasi dengan backend API melalui [master.api.ts](frontend/src/services/api/master.api.ts:1) dengan fallback ke stub data

### Application Status ✅ PRODUCTION READY
- **All Endpoints**: Berfungsi dengan benar
- **Role-based Access**: Berfungsi sesuai desain
- **WebSocket Connection**: Stabil dan terpercaya
- **Authentication System**: Aman dan andal
- **TypeScript Compilation**: Bersih tanpa error
## Update Terbaru — Testing & PWA Enhancements (Oktober 2025)

### API Smoke Tests — Skrip Verifikasi Cepat (Baru Ditambahkan)
Untuk verifikasi cepat stabilitas API inti di lingkungan dev, disediakan skrip Node berbasis fetch yang melakukan login lalu memanggil endpoint master-data.
- Skrip:
  - [scripts/api-smoke/get-departments.js](scripts/api-smoke/get-departments.js:1) — Login ke `/api/auth/login` kemudian `GET /master-data/departments`, mencetak status dan body respons.
  - [scripts/api-smoke/create-department.js](scripts/api-smoke/create-department.js:1) — Login kemudian `POST /master-data/departments` dengan payload minimal; menangani konflik 409 sebagai kondisi non-fatal.
- Variabel lingkungan yang digunakan: `API_BASE_URL`, `ADMIN_NIK`, `ADMIN_PASSWORD`
- Cara pakai (contoh):
  - Windows CMD: `node scripts\\api-smoke\\get-departments.js` lalu `node scripts\\api-smoke\\create-department.js`
  - PowerShell/Bash: `node scripts/api-smoke/get-departments.js`

### E2E Testing — Playwright Diperluas
Cakupan pengujian end‑to‑end diperluas untuk memverifikasi alur bisnis lintas peran dan fitur kritis.
- Konfigurasi Playwright: [playwright.config.ts](playwright.config.ts:1)
- Test suites tersedia:
  - [tests/e2e/auth.spec.ts](tests/e2e/auth.spec.ts:1) — Autentikasi multi‑peran dan persistensi sesi
  - [tests/e2e/admin-workflow.spec.ts](tests/e2e/admin-workflow.spec.ts:1) — Alur administrator (Users Management, approval, laporan)
  - [tests/e2e/employee-workflow.spec.ts](tests/e2e/employee-workflow.spec.ts:1) — Alur karyawan (buat pesanan, status)
  - [tests/e2e/dapur-workflow.spec.ts](tests/e2e/dapur-workflow.spec.ts:1) — Alur dapur (kanban, update status, request approval)
  - [tests/e2e/delivery-workflow.spec.ts](tests/e2e/delivery-workflow.spec.ts:1) — Alur delivery (daftar pengiriman, update status)
- NPM scripts (root) untuk E2E:
  - Laporan, UI mode, headed, codegen — lihat [package.json](package.json:9-34)
- Praktik verifikasi:
  - Login, navigasi, guard RBAC, interaksi UI (klik, form), konsistensi state (Zustand persist)
  - Konsistensi PWA/offline: halaman offline dan indikator status ketika jaringan terganggu

### PWA Enhancements & Offline Support Improvements — Phase 9 (COMPLETED)
Service Worker dan UI PWA ditingkatkan untuk pengalaman offline yang lebih baik serta menghindari loop redirect.
- Service Worker (vite-plugin-pwa):
  - navigateFallback: [frontend/vite.config.ts](frontend/vite.config.ts:81-83)
  - Custom offline fallback untuk navigation requests (hindari redirect loop):
    - handlerDidError: [handlerDidError()](frontend/vite.config.ts:95-104) — menyajikan SPA shell cached `/index.html` bila tersedia, atau offline shell minimal sebagai fallback aman.
  - Runtime caching:
    - API dinamis (prioritas jaringan, fallback cache): [NetworkFirst](frontend/vite.config.ts:110-124)
    - API relatif statis (prioritas cache): [CacheFirst](frontend/vite.config.ts:126-139)
    - Asset & gambar (cache efisien): [CacheFirst](frontend/vite.config.ts:141-154)
- Komponen PWA UI:
  - Prompt instalasi kustom: [InstallPrompt.tsx](frontend/src/components/pwa/InstallPrompt.tsx:1) — default export [InstallPrompt()](frontend/src/components/pwa/InstallPrompt.tsx:40)
  - Prompt update service worker: [UpdatePrompt.tsx](frontend/src/components/pwa/UpdatePrompt.tsx:1) — default export [UpdatePrompt()](frontend/src/components/pwa/UpdatePrompt.tsx:17)
  - Indikator status offline: [OfflineIndicator.tsx](frontend/src/components/pwa/OfflineIndicator.tsx:1)
- Offline detection & UX:
  - Deteksi `navigator.onLine` dan event 'online'/'offline' dengan notifikasi toast, animasi slide‑in/out, dan badge/pill status — lihat [OfflineIndicator.tsx](frontend/src/components/pwa/OfflineIndicator.tsx:1)

### Offline Storage — IndexedDB Utilities (Offline‑first)
Utilitas penyimpanan offline menggunakan IndexedDB untuk cache pesanan dan profil user, dengan fallback yang aman ketika API tidak tersedia.
- Skema Database:
  - Nama: `bebang-pack-meal-offline`, Versi: `1`
  - Object Stores: `orders` (keyPath: `id`), `user-data` (keyPath: `id`)
- API utilitas:
  - [openDB()](frontend/src/utils/offline-storage.utils.ts:13) — membuka/upgrade DB, membuat stores jika belum ada; menangani `onblocked`, logging error terperinci
  - [saveOrdersToCache()](frontend/src/utils/offline-storage.utils.ts:52) — membersihkan cache, menyimpan batch pesanan, safety on error/abort/complete
  - [getOrdersFromCache()](frontend/src/utils/offline-storage.utils.ts:97) — membaca semua pesanan; fallback ke [] bila gagal
  - [saveUserDataToCache()](frontend/src/utils/offline-storage.utils.ts:123) — menyimpan profil user (validasi `id` wajib); logging error transaksi
  - [getUserDataFromCache()](frontend/src/utils/offline-storage.utils.ts:165) — membaca satu entri profil (first) atau `null` bila kosong/gagal
  - [clearOfflineCache()](frontend/src/utils/offline-storage.utils.ts:191) — membersihkan kedua stores dengan transaksi, aman terhadap error/abort
- Prinsip desain:
  - Fail gracefully (selalu return default aman), logging konsisten `[offline-storage]` untuk diagnosis
  - Meminimalkan blocking UI; operasi async dengan penyelesaian terjamin meski terjadi error pada sebagian record

### Status Migrasi TypeScript — Pola Bridging (Dipertegas)
Strategi bridging dipertahankan untuk transisi bertahap dari `.js` ke `.ts/.tsx` tanpa menghambat development.
- Kebijakan:
  - Modul TypeScript adalah sumber kebenaran; padanan `.js` dipertahankan sampai paritas fungsional/visual diverifikasi (lint, typecheck, E2E)
  - Penghapusan berkas `.js` legacy dilakukan pasca verifikasi penuh, bertahap per komponen/layanan
  - Strict typing dan barrel exports wajib diperbarui saat menambah/merefaktor modul
- Contoh pasangan berkas (aktif dan telah memiliki padanan TS):
  - [App.js](frontend/src/App.js:1) ↔ [App.tsx](frontend/src/App.tsx:1)
  - [ProtectedRoute.js](frontend/src/components/auth/ProtectedRoute.js:1) ↔ [ProtectedRoute.tsx](frontend/src/components/auth/ProtectedRoute.tsx:1)
  - [axios.js](frontend/src/lib/axios.js:1) ↔ [axios.ts](frontend/src/lib/axios.ts:1)
  - [router/index.js](frontend/src/router/index.js:1) ↔ [router/index.tsx](frontend/src/router/index.tsx:1)
  - [services/websocket/socket.manager.js](frontend/src/services/websocket/socket.manager.js:1) ↔ [services/websocket/socket.manager.ts](frontend/src/services/websocket/socket.manager.ts:1)
- Praktik operasional:
  - Jalankan pemeriksaan type rutin: `npm run typecheck` (root) atau workspace spesifik — lihat [package.json](package.json:30), [backend/package.json](backend/package.json:17), [frontend/package.json](frontend/package.json:46)
  - Pastikan E2E Playwright dan API Smoke Tests berjalan hijau sebelum cleanup `.js` untuk mencegah regresi
## Solusi Runtime Dev Backend — tsx (Pengganti ts-node-dev)

### Ringkasan
Backend kini berjalan dalam mode pengembangan menggunakan `tsx` dengan watch mode. Ini menggantikan `ts-node-dev` untuk reliabilitas yang lebih baik, startup lebih cepat, dan kompatibilitas Node.js terbaru. Skrip sudah dikonfigurasi di [backend/package.json](backend/package.json:7) sebagai:
- "start:dev": "tsx watch src/main.ts"

Alur monorepo menjalankan backend dan frontend bersamaan melalui `concurrently` di [package.json](package.json:11):
- "dev": "concurrently ... \"npm run dev:backend\" \"npm run dev:frontend\""
- "dev:backend": "npm run -w backend start:dev" [package.json](package.json:12)
- "dev:frontend": "npm run -w frontend dev" [package.json](package.json:13), skrip dev frontend tersedia di [frontend/package.json](frontend/package.json:39)

### 1) Mengapa tsx (dan perbedaan dari ts-node-dev)
- Stabil di Windows dan Unix, mendukung watch yang konsisten pada perubahan file TypeScript.
- Kompatibel dengan Node 18–22, tanpa perlu bootstrap tambahan.
- Integrasi sederhana via workspace script: lihat [backend/package.json](backend/package.json:7).

Jika Anda sebelumnya memakai `ts-node-dev`, cukup gunakan perintah workspace:
- npm run -w backend start:dev [package.json](package.json:12)

### 2) Panduan Setup Lokal Windows — Hindari Konflik Modul Global
Agar `npm run dev` selalu memakai binary lokal proyek (bukan versi global yang kadaluarsa), ikuti langkah berikut:

- Gunakan workspace script (disarankan):
  - Backend: `npm run -w backend start:dev` [package.json](package.json:12)
  - Frontend: `npm run -w frontend dev` [package.json](package.json:13)

- Jalankan langsung binary lokal dengan npm exec (opsional):
  - `npm exec -w backend tsx watch src/main.ts` (mengacu pada devDependency `tsx` di [backend/package.json](backend/package.json:54))

- Lepas instalasi global yang berpotensi menimpa resolusi:
  - Windows CMD: `npm uninstall -g ts-node-dev ts-node tsx`
  - Verifikasi resolusi: `where tsx` → pastikan mengarah ke `...\\backend\\node_modules\\.bin\\tsx`

- Hindari PATH bercampur (mis. yarn/pnpm global) yang meng-overwrite node_modules lokal. Pastikan terminal VS Code memakai Node versi proyek (lihat engines di [package.json](package.json:41-43)).

### 3) Cara Menjalankan Dev Monorepo yang Benar
- Jalankan kedua workspace secara bersamaan:
  - `npm run dev` [package.json](package.json:11)
  - Ini memanggil: backend → `npm run -w backend start:dev` [package.json](package.json:12), frontend → `npm run -w frontend dev` [package.json](package.json:13) (lihat juga panduan di README [README.md](README.md:75)).

- Alternatif: jalankan per workspace dalam terminal terpisah jika butuh isolasi log:
  - Terminal 1: `npm run -w backend start:dev` [package.json](package.json:12)
  - Terminal 2: `npm run -w frontend dev` [frontend/package.json](frontend/package.json:39)

### 4) Catatan Kompatibilitas Node.js 22
- `tsx` kompatibel dengan Node 22; watch mode bekerja baik di Windows.
- Proyek backend tetap menggunakan `CommonJS` pada `tsconfig.json` sesuai dokumentasi sebelumnya [backend/tsconfig.json](backend/tsconfig.json:1). Ini aman dengan `tsx`.
- Jika muncul mismatch tipe terkait API terbaru Node 22, pertimbangkan meng-upgrade `@types/node` ke versi yang sesuai.
- Serialisasi BigInt telah dipolyfill demi keamanan respons HTTP (mencegah error "Do not know how to serialize a BigInt"), lihat patch di [backend/src/main.ts](backend/src/main.ts:36).

### 5) Peringatan [DEP0060] dari concurrently — Penjelasan & Solusi
Pada Node.js 22, beberapa dependency transitive dapat memunculkan peringatan deprecation (contoh [DEP0060]) saat menjalankan `npm run dev` [package.json](package.json:11) dengan `concurrently` (versi saat ini: 8.2.2, lihat [package-lock.json](package-lock.json:7792)).

- Dampak: Peringatan ini bersifat non-fatal; layanan tetap berjalan. Namun, untuk menjaga kebersihan log, Anda bisa:
  - Menonaktifkan notifikasi deprecation untuk sesi terminal:
    - Windows CMD: `set NODE_OPTIONS=--no-deprecation && npm run dev` [package.json](package.json:11)
    - PowerShell: `$env:NODE_OPTIONS='--no-deprecation'; npm run dev` [package.json](package.json:11)
  - Alternatif singkat (menyembunyikan semua warning Node):
    - Windows CMD: `set NODE_NO_WARNINGS=1 && npm run dev` [package.json](package.json:11)
    - PowerShell: `$env:NODE_NO_WARNINGS='1'; npm run dev` [package.json](package.json:11)

- Rekomendasi:
  - Tetap gunakan versi `concurrently` terbaru (saat ini 8.2.2 di [package-lock.json](package-lock.json:7792)). Jika vendor merilis perbaikan terkait Node 22, update dependency melalui `npm update`.
  - Hindari menjalankan tooling dari instalasi global yang tidak sinkron; gunakan workspace scripts seperti di [package.json](package.json:11-13).

Catatan Tambahan:
- Frontend dev script tetap standar via Vite: lihat [frontend/package.json](frontend/package.json:39).
- WebSocket dedicated server tetap berjalan pada `WS_PORT` sesuai bootstrap backend [backend/src/main.ts](backend/src/main.ts:139).
