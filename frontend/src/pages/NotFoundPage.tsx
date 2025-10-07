// frontend/src/pages/NotFoundPage.tsx

import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/ui';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50 dark:bg-slate-900">
      <Card padding="lg" className="max-w-[500px] w-full">
        <div className="flex flex-col items-center text-center">
          <ExclamationTriangleIcon
            className="h-16 w-16 text-emerald-500"
            aria-hidden="true"
          />
          <p className="mt-4 text-6xl font-display font-extrabold text-emerald-500">
            404
          </p>
          <h1 className="mt-2 text-2xl font-display font-bold text-slate-900 dark:text-white">
            Halaman Tidak Ditemukan
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Halaman yang Anda cari tidak ada atau telah dipindahkan.
          </p>

          <div className="mt-6">
            <Button variant="primary" onClick={() => navigate('/dashboard')}>
              Kembali ke Dashboard
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}