/* frontend/src/hooks/useWebSocket.ts */

import { useEffect, useMemo, useState } from 'react';
import socketManager, { type ConnectionStatus } from '@/services/websocket/socket.manager';
import type { NotificationsEventMap, NotificationEventHandler } from '@/types/websocket.types';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Custom hook: useWebSocket
 * - Mengelola koneksi Socket.IO ke namespace /notifications
 * - Autentikasi dengan JWT accessToken dari auth store
 * - Auto re-connect saat accessToken berubah
 * - Mendaftarkan handler untuk event tertentu
 * - Cleanup otomatis saat unmount
 *
 * API:
 * useWebSocket(event, handler, deps?):
 *  - event: nama event (keyof NotificationsEventMap)
 *  - handler: fungsi handler(type-safe) untuk payload event
 *  - deps: dependency array untuk re-registrasi handler (opsional)
 *
 * Return:
 *  - ConnectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error'
 */
export function useWebSocket<K extends keyof NotificationsEventMap>(
  event: K,
  handler: NotificationEventHandler<K>,
  deps: unknown[] = [],
): ConnectionStatus {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  const departmentId = user?.departmentId;

  const [status, setStatus] = useState<ConnectionStatus>(socketManager.getConnectionStatus());

  // Subscribe perubahan status koneksi
  useEffect(() => {
    const unsubscribe = socketManager.subscribeStatus(setStatus);
    return () => unsubscribe();
  }, []);

  // Kelola koneksi berdasarkan accessToken/departmentId
  useEffect(() => {
    let cancelled = false;
    async function ensureTokenAndConnect() {
      const state = useAuthStore.getState();
      const currentUser = state.user;
      let token = state.accessToken;

      // Jika user ada tetapi token kosong/expired, coba refresh dulu
      if (!token && currentUser && state.refreshAuth) {
        try {
          await state.refreshAuth();
          token = useAuthStore.getState().accessToken;
        } catch {
          // abaikan error refresh
        }
      }

      if (token) {
        if (!cancelled) socketManager.connect(token, departmentId);
      } else {
        // Tanpa token, pastikan disconnect
        socketManager.disconnect();
      }
    }

    ensureTokenAndConnect();

    return () => {
      cancelled = true;
    };
    // Reconnect saat token/department berubah
  }, [accessToken, departmentId, user]);// Registrasi handler untuk event yang diberikan
  const memoHandler = useMemo(() => handler, deps);

  useEffect(() => {
    socketManager.on(event, memoHandler as any);

    return () => {
      socketManager.off(event, memoHandler as any);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event, memoHandler]);

  return status;
}

export default useWebSocket;