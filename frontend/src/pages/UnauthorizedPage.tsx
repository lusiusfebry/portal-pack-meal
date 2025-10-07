// frontend/src/pages/UnauthorizedPage.tsx

import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/ui';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50 dark:bg-slate-900">
      <Card padding="lg" className="max-w-lg w-full">
        <div className="flex flex-col items-center text-center">
          <ShieldExclamationIcon
            className="h-16 w-16 text-amber-500"
            aria-hidden="true"
          />
          <h1 className="mt-4 text-2xl font-display font-bold text-slate-900 dark:text-white">
            Akses Ditolak
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">
            Anda tidak memiliki izin untuk mengakses halaman ini.
          </p>

          <div className="mt-6 flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate(-1)}>
              Kembali
            </Button>
            <Button variant="primary" onClick={() => navigate('/dashboard')}>
              Dashboard
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}