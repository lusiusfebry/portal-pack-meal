# Bebang Pack Meal Portal — Frontend (React + Vite)

Dokumentasi frontend untuk aplikasi Bebang Pack Meal Portal menggunakan React 18, TypeScript, Vite, Tailwind CSS, dan PWA.

## Ikhtisar

- Framework: React 18 + TypeScript
- Bundler/Dev Server: Vite 7.1.7
- Styling: Tailwind CSS + PostCSS + Autoprefixer
- PWA: vite-plugin-pwa dengan manifest (theme color emerald green)
- Linting & Format: ESLint + Prettier
- State: Zustand
- Routing: react-router-dom
- Realtime: socket.io-client

## Persyaratan

- Node.js LTS (disarankan v18 atau v20)
- NPM/PNPM/Yarn (sesuai preferensi)
- Backend berjalan lokal (opsional) pada http://localhost:3000

## Struktur Direktori

Struktur setelah implementasi Phase 8 (pages, services, hooks, utils):

```
frontend/
├── src/
│   ├── main.tsx              # Application entry point
│   ├── App.tsx               # Root component (router + providers)
│   ├── router/
│   │   └── index.tsx         # Route configuration & guards
│   ├── pages/                # Page components
│   │   ├── LoginPage.tsx
│   │   ├── DashboardPage.tsx
│   │   ├── UnauthorizedPage.tsx
│   │   ├── NotFoundPage.tsx
│   │   ├── admin/
│   │   │   └── AdminDashboardPage.tsx
│   │   ├── employee/
│   │   │   └── EmployeeDashboardPage.tsx
│   │   ├── dapur/
│   │   │   └── DapurDashboardPage.tsx
│   │   ├── delivery/
│   │   │   └── DeliveryDashboardPage.tsx
│   │   ├── orders/
│   │   │   ├── OrdersListPage.tsx
│   │   │   ├── OrderDetailPage.tsx
│   │   │   ├── CreateOrderPage.tsx
│   │   │   ├── KanbanBoardPage.tsx
│   │   │   └── DeliveryListPage.tsx
│   │   ├── approvals/
│   │   │   └── ApprovalCenterPage.tsx
│   │   ├── users/
│   │   │   └── UsersManagementPage.tsx
│   │   ├── reports/
│   │   │   └── ReportsPage.tsx
│   │   └── audit/
│   │       └── AuditTrailPage.tsx
│   ├── components/
│   │   ├── ui/               # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── DatePicker.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Spinner.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   └── Pagination.tsx
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── Topbar.tsx
│   │   └── auth/
│   │       └── ProtectedRoute.tsx
│   ├── services/
│   │   ├── api/
│   │   │   ├── orders.api.ts
│   │   │   ├── users.api.ts
│   │   │   ├── reports.api.ts
│   │   │   ├── master.api.ts
│   │   │   └── index.ts
│   │   └── websocket/
│   │       └── socket.manager.ts
│   ├── hooks/
│   │   ├── useTheme.ts
│   │   ├── useWebSocket.ts
│   │   └── useNotifications.ts
│   ├── utils/
│   │   ├── status.utils.ts
│   │   ├── date.utils.ts
│   │   ├── download.utils.ts
│   │   └── index.ts
│   ├── stores/               # Zustand stores
│   │   └── auth.store.ts
│   ├── lib/                  # Utilities
│   │   └── axios.ts          # Configured API client
│   ├── types/                # TypeScript types
│   │   ├── auth.types.ts
│   │   ├── order.types.ts
│   │   ├── report.types.ts
│   │   ├── user.types.ts
│   │   └── index.ts
│   ├── styles/
│   │   └── index.css
│   └── assets/               # Static assets
├── public/
│   └── icons/                # PWA icons
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── tailwind.config.js
├── postcss.config.js
├── .eslintrc.cjs
├── .prettierrc
├── .env.example
├── .env
└── .gitignore
```

## Environment Variables

File [.env.example](frontend/.env.example) dan [.env](frontend/.env) berisi variabel berikut:

```
VITE_API_BASE_URL=http://localhost:3000/api
VITE_WS_URL=http://localhost:3001
VITE_APP_NAME=Bebang Pack Meal Portal
VITE_APP_VERSION=1.0.0
VITE_NODE_ENV=development
```

Penjelasan:
- VITE_API_BASE_URL: Base URL API, digunakan untuk proxy dev server dan panggilan HTTP.
- VITE_WS_URL: URL WebSocket (mis. socket.io).
- VITE_APP_NAME: Nama aplikasi untuk metadata/manifes.
- VITE_APP_VERSION: Versi aplikasi.
- VITE_NODE_ENV: Lingkungan (development/production).

Catatan:
- Semua variabel yang dibaca di klien harus diawali dengan `VITE_` (aturan Vite).

## Instalasi

Di direktori `frontend/`:

```bash
npm install
# atau
pnpm install
# atau
yarn
```

## Menjalankan Development

```bash
npm run dev
```

- Dev server berjalan pada port 5173 (konfigurasi di [vite.config.ts](frontend/vite.config.ts)).
- Secara default membuka browser otomatis.

## Phase 8 Features (Implemented)

Implementasi lengkap fitur fase 8 sesuai kebutuhan peran dan alur bisnis:

- Role-Specific Dashboards:
  - Administrator: KPI, grafik (Recharts), aktivitas terbaru ([AdminDashboardPage.tsx](frontend/src/pages/admin/AdminDashboardPage.tsx))
  - Employee: Ringkasan pesanan, tombol cepat buat pesanan, pesanan terbaru ([EmployeeDashboardPage.tsx](frontend/src/pages/employee/EmployeeDashboardPage.tsx))
  - Dapur: Statistik pesanan, jumlah persetujuan tertunda, panduan workflow ([DapurDashboardPage.tsx](frontend/src/pages/dapur/DapurDashboardPage.tsx))
  - Delivery: Pesanan siap, sedang diantar, statistik selesai (mobile-first) ([DeliveryDashboardPage.tsx](frontend/src/pages/delivery/DeliveryDashboardPage.tsx))
- Order Management:
  - Orders list dengan filter, pencarian, pagination ([OrdersListPage.tsx](frontend/src/pages/orders/OrdersListPage.tsx))
  - Order detail + timeline + aksi berbasis peran ([OrderDetailPage.tsx](frontend/src/pages/orders/OrderDetailPage.tsx))
  - Form pembuatan pesanan (Employee) ([CreateOrderPage.tsx](frontend/src/pages/orders/CreateOrderPage.tsx))
  - Kanban board (Dapur) drag-and-drop dengan @hello-pangea/dnd ([KanbanBoardPage.tsx](frontend/src/pages/orders/KanbanBoardPage.tsx))
  - Delivery list (mobile-first) dengan aksi besar ([DeliveryListPage.tsx](frontend/src/pages/orders/DeliveryListPage.tsx))
- Approval Workflow:
  - Approval Center (Admin) dengan modal keputusan ([ApprovalCenterPage.tsx](frontend/src/pages/approvals/ApprovalCenterPage.tsx))
- Admin Tools:
  - Manajemen pengguna: CRUD, ubah role, toggle status, reset password ([UsersManagementPage.tsx](frontend/src/pages/users/UsersManagementPage.tsx))
  - Reports: consumption/department/performance/rejections (grafik + CSV export) ([ReportsPage.tsx](frontend/src/pages/reports/ReportsPage.tsx))
  - Audit Trail: viewer dengan filter & CSV ([AuditTrailPage.tsx](frontend/src/pages/audit/AuditTrailPage.tsx))
- Real-Time:
  - WebSocket via Socket.IO client, toast notifications, auto-update UI (socket manager + hooks)
- UI Components Baru:
  - Table, Modal, Select, DatePicker, Toast, Spinner, EmptyState, Pagination ([index.ts](frontend/src/components/ui/index.ts))

## Authentication & Routing

**Authentication Flow:**
- Login page di `/login` menggunakan NIK (Nomor Induk Karyawan) dan password
- JWT access token disimpan di memory (Zustand store)
- Refresh token diatur oleh backend sebagai httpOnly cookie
- Refresh otomatis pada 401 via interceptor axios ([axios.ts](frontend/src/lib/axios.ts))
- Validasi session saat page load via `/api/auth/me`

**Protected Routes & Role-Based Access:**
- Semua route (kecuali `/login`) dilindungi oleh komponen [ProtectedRoute.tsx](frontend/src/components/auth/ProtectedRoute.tsx)
- Role-based guard via prop `allowedRoles`:
  - Admin-only: `/users`, `/reports`, `/audit`
  - Approvals: `/approvals` (administrator, dapur)
  - Create order: `/orders/new` (employee)

**Route Structure (Utama):**
```
/login              - Login (public)
/                   - Redirects to /dashboard
/dashboard          - Role-specific dashboard
/orders             - Wrapper by role:
                     - administrator/employee → OrdersListPage
                     - dapur → KanbanBoardPage
                     - delivery → DeliveryListPage
/orders/new         - Create new order (employee)
/orders/:id         - Order detail
/users              - Users management (admin)
/approvals          - Approval center (admin, dapur)
/reports            - Reports (admin)
/audit              - Audit trail (admin)
/unauthorized       - Access denied
*                   - 404 Not Found
```

**Layout Structure:**
- `AppShell` membungkus seluruh route terautentikasi: sidebar (role-based menu) + topbar + konten
- Sidebar 256px, topbar sticky, area konten scrollable
- Dark mode mendukung seluruh komponen

**State Management:**
- Auth Store (Zustand): profil user, access token, operasi auth ([auth.store.ts](frontend/src/stores/auth.store.ts))
- Theme: Hook dengan persist localStorage ([useTheme.ts](frontend/src/hooks/useTheme.ts))
- API Client: Axios instance dengan interceptors ([axios.ts](frontend/src/lib/axios.ts))

## WebSocket Integration

Koneksi realtime menggunakan Socket.IO ke namespace `/notifications`. Manager terpusat dan hooks untuk subscription UI.

- Socket Manager: [socket.manager.ts](frontend/src/services/websocket/socket.manager.ts)
- Hook subscription: [useWebSocket.ts](frontend/src/hooks/useWebSocket.ts)
- Notifikasi global (toast): [useNotifications.ts](frontend/src/hooks/useNotifications.ts), [Toast.tsx](frontend/src/components/ui/Toast.tsx)

Contoh penggunaan hook subscription:

```ts
// Contoh: dengarkan perubahan status pesanan
// File: src/hooks/useWebSocket.ts (lihat implementasi di repo)
import { useWebSocket } from '@/hooks/useWebSocket';

useWebSocket('order:status-changed', (event) => {
  console.log('Order status changed:', event.data);
  // TODO: update state / refetch data
}, []);
```

- URL diatur melalui env: `VITE_WS_URL=http://localhost:3001`
- Autentikasi saat handshake menggunakan JWT access token
- Reconnection otomatis & error handling

## PWA Features (Phase 9)

**Progressive Web App Capabilities:**

**Installation:**
- Custom install prompt with emerald-themed design
- Appears after 3 seconds on first visit (if not dismissed)
- Can be dismissed for 7 days
- Shows benefits: offline access, real-time notifications, faster performance
- Detects if already installed and hides prompt

**Offline Support:**
- Service worker caches static assets (HTML, CSS, JS, images)
- Runtime caching for API responses:
  - Orders API: NetworkFirst strategy (5-minute cache)
  - Master data: CacheFirst strategy (1-hour cache)
  - User profile: NetworkFirst strategy
- IndexedDB storage for order history (accessible offline)
- Offline indicator shows when network is unavailable
- Offline fallback page for uncached content

**Update Notifications:**
- Automatic detection of new app versions
- Custom update prompt with "Update Sekarang" button
- Seamless update without losing user state

**Manifest:**
- App name: "Bebang Pack Meal Portal"
- Theme color: Emerald Green (#10B981)
- Display mode: Standalone (fullscreen app experience)
- Icons: 192x192, 512x512, maskable icon

**Testing PWA:**
```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Open in Chrome
# Check PWA installability in DevTools > Application > Manifest
# Test offline mode in DevTools > Network > Offline
```

**Lighthouse PWA Score:**
Run Lighthouse audit in Chrome DevTools to verify PWA compliance:
- Installable: ✓
- PWA optimized: ✓
- Offline support: ✓
- Fast and reliable: ✓
## Testing

**End-to-End Tests (Playwright):**

Comprehensive E2E tests covering all user roles and workflows.

**Test Suites:**
- `auth.spec.ts` - Authentication flow (login, logout, session restore)
- `employee-workflow.spec.ts` - Employee order creation and tracking
- `dapur-workflow.spec.ts` - Kitchen Kanban board and approval requests
- `delivery-workflow.spec.ts` - Delivery pickup and completion
- `admin-workflow.spec.ts` - User management, reports, audit trail, approval center
- `order-detail.spec.ts` - Order detail page and approval decisions

**Running Tests:**
```bash
# From root directory
npm run test:e2e              # Run all tests
npm run test:e2e:ui           # Run in UI mode (debugging)
npm run test:e2e:headed       # Run with visible browser
npm run test:e2e:report       # View HTML report
```

**Test Requirements:**
- Backend must be running on http://localhost:3000
- Frontend must be running on http://localhost:5173
- Database must be seeded with test data

**Test Coverage:**
## Production Build

**Build for Production:**
```bash
# Build frontend
npm run build

# Output: frontend/dist/
# Contains: index.html, assets/, icons/, manifest.webmanifest, sw.js
```

**Build Optimizations:**
- Code splitting by route (React.lazy)
- Tree shaking (unused code removed)
- Minification (Terser for JS, cssnano for CSS)
- Asset optimization (images compressed)
- Service worker with Workbox
- Gzip compression ready

**Preview Production Build:**
```bash
npm run preview
# Opens http://localhost:4173
```

**Environment Variables:**
- Copy `.env.production.example` to `.env.production`
- Update `VITE_API_BASE_URL` to production backend URL
- Update `VITE_WS_URL` to production WebSocket URL

**Deployment:**
See `DEPLOYMENT.md` in root directory for complete deployment guide.
- ✅ Authentication (all roles)
- ✅ Order creation (employee)
- ✅ Order status transitions (dapur, delivery)
- ✅ Approval workflow (dapur → admin)
- ✅ User management (admin)
- ✅ Reports and CSV export (admin)
- ✅ Audit trail viewer (admin)
- ✅ Real-time WebSocket updates
- ✅ Role-based access control
## UI Components

Reusable components di `src/components/ui/`:

- `Button` - Primary, secondary, outline, ghost, danger variants
- `Card` - Content container dengan opsi padding
- `Input` - Form input dengan label, error, icons
- `Badge` - Status indicators dengan semantic colors
- `Table` - Tabel generik (loading, empty state, hover, striped)
- `Modal` - Dialog berbasis Headless UI
- `Select` - Dropdown berbasis Headless UI Listbox
- `DatePicker` - Input tanggal styled (native)
- `Toast` - Notifikasi via react-hot-toast (Provider global)
- `Spinner` - Indikator loading
- `EmptyState` - Tampilan kosong dengan CTA opsional
- `Pagination` - Navigasi halaman dengan responsif

Semua komponen mendukung dark mode dan mengikuti pedoman UX (aksen emerald/amber, sudut membulat, bayangan lembut).

## Build dan Preview

```bash
npm run build
npm run preview
```

- Hasil build berada di `dist/`.
- `preview` menjalankan server statis untuk verifikasi produksi lokal.

## Script NPM

Didefinisikan di [package.json](frontend/package.json):

- `dev`: Menjalankan Vite dev server.
- `build`: Build produksi.
- `preview`: Preview hasil build.
- `lint`: Jalankan ESLint untuk file ts/tsx di src/.
- `lint:fix`: Jalankan ESLint dengan perbaikan otomatis.
- `format`: Format seluruh proyek dengan Prettier.
- `format:check`: Cek format Prettier tanpa mengubah file.

## Konfigurasi Utama

### Vite Config

File [vite.config.ts](frontend/vite.config.ts) mencakup:
- Plugin React: `@vitejs/plugin-react`
- Plugin PWA: `vite-plugin-pwa` dengan manifest (theme color emerald `#10B981`)
- Alias path: `@` menunjuk ke `src/`
- Dev server port: `5173`
- Proxy:
  - `/api` → mengarah ke origin dari `VITE_API_BASE_URL`
  - WebSocket: `/socket.io` dan `/ws` → `VITE_WS_URL`

Catatan Proxy:
- Jika `VITE_API_BASE_URL=http://localhost:3000/api`, maka permintaan `/api/...` di dev akan diarahkan ke origin `http://localhost:3000` dan direwrite sesuai prefix path (`/api`).
- WebSocket path `/socket.io`/`/ws` diteruskan ke origin `VITE_WS_URL`.

### TypeScript

- [tsconfig.json](frontend/tsconfig.json):
  - Target: ES2020
  - `jsx`: `react-jsx`
  - `paths`: `@/*` → `./src/*`
  - `types`: `vite/client`
  - Strict mode diaktifkan
- [tsconfig.node.json](frontend/tsconfig.node.json):
  - Digunakan untuk konfigurasi Vite (Node), `types: ["node"]`

### ESLint

File [.eslintrc.cjs](frontend/.eslintrc.cjs) mengaktifkan rule untuk:
- React, React Hooks, TypeScript, Prettier
- Integrasi fast refresh (`react-refresh/only-export-components`)
- Modern JS best practices (no-var, prefer-const)
- Ignore build dan cache: node_modules, dist, build, .vite

### Prettier

File [.prettierrc](frontend/.prettierrc) diselaraskan dengan backend:
- `singleQuote: true`
- `trailingComma: all`
- `printWidth: 80`
- `tabWidth: 2`
- `semi: true`
- `arrowParens: "always"`
- `endOfLine: "lf"`
- `jsxSingleQuote: false`
- `bracketSpacing: true`

### Tailwind CSS

File [tailwind.config.js](frontend/tailwind.config.js):
- `content`: index.html dan semua file src (ts/tsx/js/jsx)
- `darkMode: "class"`
- `colors` kustom:
  - `primary` emerald (DEFAULT `#10B981`)
  - `accent` amber (DEFAULT `#F59E0B`)
- `fontFamily`:
  - `sans`: Inter (fallback system fonts)
  - `display`: Poppins (fallback Inter + system fonts)

File [postcss.config.js](frontend/postcss.config.js):
- Plugin: `tailwindcss` dan `autoprefixer`

### PWA

- Manifest diatur melalui `vite-plugin-pwa`:
  - `name`: Bebang Pack Meal Portal
  - `short_name`: BPM Portal
  - `theme_color`: `#10B981` (emerald)
  - `icons`: 192x192, 512x512, maskable 512x512
  - `display`: `standalone`, `start_url`: `/`
- Asset umum: `favicon.ico`, `apple-touch-icon.png`, `robots.txt`, ikon PWA di `public/icons/`

Di [index.html](frontend/index.html):
- Meta tags PWA: `theme-color`, Apple meta, manifest link
- Preconnect fonts Google untuk `Inter` dan `Poppins`

## Penggunaan Tailwind

Contoh penggunaan warna dan font:
```tsx
export function ExampleCard() {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm dark:bg-neutral-900">
      <h2 className="font-display text-2xl text-primary-600">Judul</h2>
      <p className="font-sans text-neutral-700">
        Konten dengan font sans dan aksen <span className="text-accent-500">amber</span>.
      </p>
      <button className="mt-3 rounded-md bg-primary-500 px-3 py-2 text-white hover:bg-primary-600">
        Aksi
      </button>
    </div>
  );
}
```

## Test Credentials

Gunakan seed data dari backend:
- Admin: NIK `ADM001`, password `admin123`
- Employee: NIK `EMP001`, password `emp123`
- Kitchen: NIK `KIT001`, password `kitchen123`
- Delivery: NIK `DEL001`, password `delivery123`

## Development Status

- ✅ Phase 7: Auth flow, routing, layout shell, UI components
- ✅ Phase 8: Role-specific dashboards, order management, approval workflow, real-time features
- ✅ Phase 9: PWA enhancements, offline support, E2E testing, production deployment

**Application Status: Production Ready! 🚀**

## Troubleshooting

- TypeScript error "Cannot find module 'vite' / '@vitejs/plugin-react' / 'vite-plugin-pwa'":
  - Pastikan `npm install` sudah dijalankan di direktori `frontend/`.
- PWA tidak aktif saat dev:
  - `vite-plugin-pwa` mengaktifkan opsi `devOptions.enabled: true`; pastikan service worker tidak diblokir oleh browser.
- Proxy API tidak berfungsi:
  - Periksa nilai `VITE_API_BASE_URL` dan penulisan path (misal `/api`). Pastikan backend berjalan dan mengizinkan CORS bila diakses langsung.
- Font Google tidak tampil:
  - Periksa konektivitas ke `fonts.googleapis.com` dan `fonts.gstatic.com`.
- WebSocket tidak terhubung:
  - Verifikasi `VITE_WS_URL`, token JWT aktif, dan namespace `/notifications` (lihat [socket.manager.ts](frontend/src/services/websocket/socket.manager.ts)).

## Lisensi

Hak cipta Bebang Pack Meal. Penggunaan internal sesuai kebutuhan proyek.