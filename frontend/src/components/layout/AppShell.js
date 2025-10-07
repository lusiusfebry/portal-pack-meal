import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import useNotifications from '@/hooks/useNotifications';
import InstallPrompt from '@/components/pwa/InstallPrompt';
import UpdatePrompt from '@/components/pwa/UpdatePrompt';
import OfflineIndicator from '@/components/pwa/OfflineIndicator';
/**
 * AppShell
 * Layout utama aplikasi yang menggabungkan Sidebar (kiri) dan Topbar (atas),
 * serta area konten yang scrollable secara independen.
 *
 * Struktur:
 * - Root: flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900
 * - Sidebar: posisi fixed (komponen Sidebar mengontrol tampilannya)
 * - Main: flex-1 flex flex-col overflow-hidden
 *   - Topbar: sticky di bagian atas
 *   - Content: flex-1 overflow-y-auto p-6
 *
 * Responsiveness:
 * - Desktop (>= md): main memiliki ml-64 untuk mengimbangi lebar sidebar (256px)
 * - Mobile (< md): ml-64 dihilangkan (sidebar diharapkan menjadi overlay)
 */
const AppShell = ({ children }) => {
    useNotifications();
    const navigate = useNavigate();
    const location = useLocation();
    // Redirect ke halaman offline saat koneksi internet terputus dan user mengakses halaman lain
    React.useEffect(() => {
        const redirectToOffline = () => {
            if (location.pathname !== '/offline') {
                navigate('/offline', { replace: true, state: { from: location.pathname } });
            }
        };
        // Initial check on mount
        if (!navigator.onLine) {
            redirectToOffline();
        }
        // Listen only for offline to avoid unexpected auto-navigation on online
        window.addEventListener('offline', redirectToOffline);
        return () => {
            window.removeEventListener('offline', redirectToOffline);
        };
    }, [navigate, location.pathname]);
    return (_jsxs("div", { className: "flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-900", children: [_jsx(Sidebar, {}), _jsxs("div", { className: "flex-1 flex flex-col overflow-hidden md:ml-64", children: [_jsx("div", { className: "sticky top-0 z-20", children: _jsx(Topbar, {}) }), _jsx("main", { className: "flex-1 overflow-y-auto p-6", children: children ? children : _jsx(Outlet, {}) })] }), _jsx(InstallPrompt, {}), _jsx(UpdatePrompt, {}), _jsx(OfflineIndicator, {})] }));
};
export default AppShell;
