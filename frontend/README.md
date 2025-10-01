# Bebang Pack Meal Portal — Frontend (React + Vite)

Dokumentasi frontend untuk aplikasi Bebang Pack Meal Portal menggunakan React 18, TypeScript, Vite, Tailwind CSS, dan PWA.

## Ikhtisar

- Framework: React 18 + TypeScript
- Bundler/Dev Server: Vite 5
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

```
frontend/
├─ src/
│  ├─ styles/
│  ├─ ... (komponen, pages, hooks)
├─ public/
│  └─ icons/ (ikon PWA)
├─ index.html
├─ vite.config.ts
├─ tsconfig.json
├─ tsconfig.node.json
├─ tailwind.config.js
├─ postcss.config.js
├─ .eslintrc.cjs
├─ .prettierrc
├─ .env.example
├─ .env
└─ .gitignore
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

- Dev server berjalan pada port 5173 (konfigurasi di vite.config.ts).
- Secara default membuka browser otomatis.

## Build dan Preview

```bash
npm run build
npm run preview
```

- Hasil build berada di `dist/`.
- `preview` menjalankan server statis untuk memverifikasi produksi lokal.

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
  - `/api` → mengarah ke origin yang diambil dari `VITE_API_BASE_URL`
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

## .gitignore

File [.gitignore](frontend/.gitignore) mengabaikan:
- `.env`, `.env.local`, `.env.*.local`
- `node_modules/`
- `dist/`, `build/`, `.vite/`
- `logs/`, `*.log`
- `.vscode/`, `.idea/`
- `coverage/`, `.nyc_output/`
- PWA files: `dev-dist/`, `sw.js`, `workbox-*.js`
- File OS: `.DS_Store`, `Thumbs.db`, dll.

## Praktik Terbaik

- Gunakan komponen terstruktur dan modular
- Manfaatkan alias `@/` untuk impor dari src
- Jaga konsistensi code style dengan ESLint + Prettier
- Gunakan Tailwind utility untuk styling, hindari inline style berlebihan
- Pastikan aksesibilitas (kontras, ARIA, keyboard navigable)

## Deployment

Langkah umum:
1. Set variabel environment produksi di sistem build/deploy
2. Build:
   ```bash
   npm run build
   ```
3. Sajikan direktori `dist/` via server statis (Nginx/Node serve)
4. Pastikan header caching untuk asset static dan service worker (PWA)

## Troubleshooting

- TypeScript error "Cannot find module 'vite' / '@vitejs/plugin-react' / 'vite-plugin-pwa'":
  - Pastikan `npm install` sudah dijalankan di direktori `frontend/`.
- PWA tidak aktif saat dev:
  - `vite-plugin-pwa` mengaktifkan opsi `devOptions.enabled: true`; pastikan service worker tidak diblokir oleh browser.
- Proxy API tidak berfungsi:
  - Periksa nilai `VITE_API_BASE_URL` dan penulisan path (misal `/api`). Pastikan backend berjalan dan mengizinkan CORS bila diakses langsung.
- Font Google tidak tampil:
  - Periksa konektivitas ke `fonts.googleapis.com` dan `fonts.gstatic.com`.

## Lisensi

Hak cipta Bebang Pack Meal. Penggunaan internal sesuai kebutuhan proyek.