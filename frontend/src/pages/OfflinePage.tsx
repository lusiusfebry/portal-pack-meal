// frontend/src/pages/OfflinePage.tsx


import { useNavigate } from 'react-router-dom';
import { Card, Button } from '@/components/ui';
import { SignalSlashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

export default function OfflinePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50 dark:bg-slate-900">
      <Card padding="lg" className="max-w-[500px] w-full">
        <div className="flex flex-col items-center text-center">
          <SignalSlashIcon
            className="h-24 w-24 text-amber-500"
            aria-hidden="true"
          />
          <h1 className="mt-4 text-2xl font-display font-bold text-slate-900 dark:text-white">
            Anda Sedang Offline
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Koneksi internet tidak tersedia. Beberapa fitur mungkin tidak dapat diakses.
          </p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Anda masih dapat melihat riwayat pesanan yang telah di-cache.
          </p>

          <div className="mt-6 flex items-center gap-3">
            <Button
              variant="primary"
              onClick={() => window.location.reload()}
              leftIcon={<ArrowPathIcon className="h-5 w-5" aria-hidden="true" />}
              aria-label="Coba lagi memuat halaman"
            >
              Coba Lagi
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate('/dashboard')}
            >
              Kembali ke Dashboard
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}