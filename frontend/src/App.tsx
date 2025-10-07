import { useEffect } from 'react';
import { AppRouter } from '@/router/index.tsx';
import { useAuthStore } from '@/stores/auth.store';
import ToastProvider from '@/components/ui/Toast';

export default function App() {
  const fetchUser = useAuthStore((s) => s.fetchUser);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('bebang-auth-storage');
      if (raw) {
        const persisted = JSON.parse(raw);
        if (persisted?.state?.user) {
          fetchUser?.();
        }
      }
    } catch {
      // ignore JSON parsing/localStorage errors
    }
  }, [fetchUser]);

  return (
    <>
      <ToastProvider />
      <AppRouter />
    </>
  );
}