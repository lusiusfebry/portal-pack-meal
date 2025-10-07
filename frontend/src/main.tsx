import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './styles/index.css';

// Dev-only cleanup: unregister any previously installed service workers and clear caches.
// This prevents stale Workbox SW from intercepting requests and causing a white page in development.
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  (async () => {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const reg of regs) {
        await reg.unregister();
      }
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
      console.info('[dev-sw-cleanup] Service workers unregistered and caches cleared.');
    } catch (err) {
      console.warn('[dev-sw-cleanup] Failed to cleanup service workers/caches:', err);
    }
  })();
}
const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root element #root not found');
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);