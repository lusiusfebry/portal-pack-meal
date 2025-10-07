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
        enabled: false,
      },
      includeAssets: [
          'favicon.svg',
          'apple-touch-icon.png',
          'icons/icon-192.png',
          'icons/icon-512.png',
          'icons/icon-512-maskable.png'
        ],
      manifest: {
        name: 'Bebang Pack Meal Portal',
        short_name: 'BPM Portal',
        description:
          'Operational portal for Bebang Pack Meal with real-time updates, offline-first PWA capabilities, and role-based dashboards.',
        theme_color: '#10B981', // emerald green
        background_color: '#ffffff',
        display: 'standalone',
        scope: '/',
        start_url: '/',
        orientation: 'any',
        categories: ['productivity', 'business'],
        icons: [
          {
            src: 'favicon.svg',
            sizes: '64x64',
            type: 'image/svg+xml',
            purpose: 'any'
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        maximumFileSizeToCacheInBytes: 3145728, // 3MB
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            // Navigation requests: fallback to OfflinePage route when offline
            // Strategy: try network; if it fails, redirect to '/offline'.
            // The SW will then serve '/index.html' via navigateFallback and the SPA will render OfflinePage at '/offline'.
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkOnly',
            options: {
              cacheName: 'navigation',
              plugins: [
                {
                  // Provide a fallback response when the network is unavailable
                  handlerDidError: async () => {
                  // Serve cached SPA shell to avoid redirect loops when offline
                  const cachedShell = await caches.match('/index.html');
                  if (cachedShell) return cachedShell;
                  // Minimal offline shell as a safe fallback when cache is unavailable
                  return new Response('<!doctype html><html><head><meta charset="utf-8"><title>Offline</title><meta name="viewport" content="width=device-width, initial-scale=1" /></head><body><div id="root"></div><script>/* Offline placeholder */</script></body></html>', {
                    headers: { 'Content-Type': 'text/html' },
                    status: 200,
                  });
                },
                },
              ],
            },
          },
          {
            // Dynamic API endpoints that should prefer network but fallback to cache
            urlPattern: /^\/api\/(orders|auth\/me)(\/.*)?$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-dynamic',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60, // 5 minutes
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Relatively static API data - prefer cache
            urlPattern: /^\/api\/(shifts|departments)(\/.*)?$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'api-static',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60, // 1 hour
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Images and static assets
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico|avif)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          {
            // Google Fonts stylesheets
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'google-fonts-stylesheets',
            },
          },
        ],
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