import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Helper to derive proxy targets from .env values
const API_BASE = process.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api';
const WS_BASE = process.env.VITE_WS_URL ?? 'http://localhost:3001';

let apiOrigin = 'http://localhost:3000';
let apiPathPrefix = '/api';
try {
  const u = new URL(API_BASE);
  apiOrigin = `${u.protocol}//${u.host}`;
  apiPathPrefix = u.pathname.replace(/\/$/, '') || '/api';
} catch {
  // fallback defaults already set
}

let wsOrigin = 'http://localhost:3001';
try {
  const u = new URL(WS_BASE);
  wsOrigin = `${u.protocol}//${u.host}`;
} catch {
  // fallback default already set
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      devOptions: {
        enabled: true,
      },
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'robots.txt',
        'icons/icon-192.png',
        'icons/icon-512.png',
      ],
      manifest: {
        name: 'Bebang Pack Meal Portal',
        short_name: 'BPM Portal',
        description:
          'Frontend portal for Bebang Pack Meal with real-time updates and PWA support.',
        theme_color: '#10B981', // emerald green
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icons/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      // API proxy:
      // Maps requests starting with /api to the origin derived from VITE_API_BASE_URL
      // and rewrites the path to match the provided API base path (defaults to /api).
      '/api': {
        target: apiOrigin,
        changeOrigin: true,
        secure: false,
        rewrite: (path: string) => path.replace(/^\/api/, apiPathPrefix),
      },
      // WebSocket proxy (socket.io or custom WS endpoints)
      '/socket.io': {
        target: wsOrigin,
        ws: true,
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: wsOrigin,
        ws: true,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});