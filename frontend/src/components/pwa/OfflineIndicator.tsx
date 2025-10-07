/* frontend/src/components/pwa/OfflineIndicator.tsx */
import React, { useEffect, useState } from 'react';
import { WifiIcon, SignalSlashIcon } from '@heroicons/react/24/outline';
import { showSuccess, showInfo } from '@/components/ui/Toast';

/**
 * OfflineIndicator — Indikator status offline (badge/pill)
 * - Fixed top-right, tampil saat offline
 * - Notifikasi toast saat perubahan online/offline
 * - Animasi slide-in/out dari kanan + pulse
 */

const TRANSITION_MS = 300;

export default function OfflineIndicator(): JSX.Element | null {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [visible, setVisible] = useState<boolean>(false);
  const [entered, setEntered] = useState<boolean>(false);

  useEffect(() => {
    const initialOnline = navigator.onLine;
    setIsOnline(initialOnline);
    if (!initialOnline) {
      setVisible(true);
      const t = window.setTimeout(() => setEntered(true), 20);
      return () => window.clearTimeout(t);
    }
    return;
  }, []);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      showSuccess('Koneksi kembali online', {
        icon: React.createElement(WifiIcon, { className: 'h-5 w-5', 'aria-hidden': true }),
      });
      setEntered(false);
      window.setTimeout(() => setVisible(false), TRANSITION_MS);
    }
    function handleOffline() {
      setIsOnline(false);
      showInfo('Anda sedang offline. Beberapa fitur mungkin terbatas.', {
        icon: React.createElement(SignalSlashIcon, { className: 'h-5 w-5', 'aria-hidden': true }),
        style: {
          background: '#92400e', // amber-700 approx
          color: '#ffffff',
          border: '1px solid #f59e0b', // amber-500
          boxShadow: '0 8px 24px rgba(2,6,23,0.35)',
        },
      });
      setVisible(true);
      window.setTimeout(() => setEntered(true), 20);
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!visible) return null;

  const containerClasses = [
    'fixed top-20 right-4 z-50',
    'transition-transform transition-opacity duration-300 ease-out',
    entered ? 'translate-x-0 opacity-100' : 'translate-x-6 opacity-0',
  ].join(' ');

  return (
    <div className={containerClasses} role="status" aria-live="polite" aria-label={isOnline ? 'Online' : 'Offline'}>
      <div className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-full shadow-lg animate-pulse">
        <SignalSlashIcon className="h-5 w-5" aria-hidden="true" />
        <span className="text-sm font-medium">Offline</span>
      </div>
    </div>
  );
}