import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// frontend/src/pages/DashboardPage.tsx
import Spinner from '@/components/ui/Spinner';
import { useAuthStore } from '@/stores/auth.store';
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage';
import EmployeeDashboardPage from '@/pages/employee/EmployeeDashboardPage';
import DapurDashboardPage from '@/pages/dapur/DapurDashboardPage';
import DeliveryDashboardPage from '@/pages/delivery/DeliveryDashboardPage';
function renderDashboardByRole(role) {
    switch (role) {
        case 'administrator':
            return _jsx(AdminDashboardPage, {});
        case 'employee':
            return _jsx(EmployeeDashboardPage, {});
        case 'dapur':
            return _jsx(DapurDashboardPage, {});
        case 'delivery':
            return _jsx(DeliveryDashboardPage, {});
        default:
            return (_jsxs("div", { className: "px-6 py-6", children: [_jsx("h1", { className: "text-3xl font-display font-bold text-slate-900 dark:text-white mb-2", children: "Dashboard" }), _jsx("p", { className: "text-slate-700 dark:text-slate-300", children: "Peran pengguna tidak dikenali. Hubungi administrator sistem." })] }));
    }
}
export default function DashboardPage() {
    const { user } = useAuthStore();
    const role = user?.role;
    if (!role) {
        return (_jsx("div", { className: "w-full h-full flex items-center justify-center py-20", children: _jsx(Spinner, { variant: "primary", size: "lg", label: "Memuat dashboard..." }) }));
    }
    return renderDashboardByRole(role);
}
