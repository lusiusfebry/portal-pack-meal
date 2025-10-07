// frontend/src/pages/DashboardPage.tsx

import Spinner from '@/components/ui/Spinner';
import { useAuthStore } from '@/stores/auth.store';
import type { Role } from '@/types/auth.types';

import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import EmployeeDashboardPage from '@/pages/employee/EmployeeDashboardPage';
import DapurDashboardPage from '@/pages/dapur/DapurDashboardPage';
import DeliveryDashboardPage from '@/pages/delivery/DeliveryDashboardPage';

function renderDashboardByRole(role?: Role) {
  switch (role) {
    case 'administrator':
      return <AdminDashboardPage />;
    case 'employee':
      return <EmployeeDashboardPage />;
    case 'dapur':
      return <DapurDashboardPage />;
    case 'delivery':
      return <DeliveryDashboardPage />;
    default:
      return (
        <div className="px-6 py-6">
          <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-2">
            Dashboard
          </h1>
          <p className="text-slate-700 dark:text-slate-300">
            Peran pengguna tidak dikenali. Hubungi administrator sistem.
          </p>
        </div>
      );
  }
}

export default function DashboardPage() {
  const { user } = useAuthStore();
  const role = user?.role;

  if (!role) {
    return (
      <div className="w-full h-full flex items-center justify-center py-20">
        <Spinner variant="primary" size="lg" label="Memuat dashboard..." />
      </div>
    );
  }

  return renderDashboardByRole(role);
}