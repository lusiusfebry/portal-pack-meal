import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// frontend/src/pages/orders/DeliveryListPage.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { getOrders, updateOrderStatus } from '@/services/api/orders.api';
import { StatusPesanan, } from '@/types/order.types';
import { getStatusBadgeVariant, getStatusLabel } from '@/utils/status.utils';
import { formatDate } from '@/utils/date.utils';
import { showError, showSuccess, showInfo } from '@/components/ui/Toast';
import useWebSocket from '@/hooks/useWebSocket';
import { useAuthStore } from '@/stores/auth.store';
export default function DeliveryListPage() {
    const { user } = useAuthStore();
    const role = user?.role;
    const isDelivery = role === 'delivery' || role === 'administrator'; // admin dapat mengoperasikan untuk keperluan kontrol
    const [activeTab, setActiveTab] = useState('READY');
    const [readyOrders, setReadyOrders] = useState([]);
    const [onDeliveryOrders, setOnDeliveryOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    // WebSocket: refetch on status change
    const wsStatusChanged = useWebSocket('order.status.changed', useCallback((payload) => {
        showInfo(`Status ${payload.kodePesanan ?? '#' + payload.orderId} berubah menjadi ${getStatusLabel(payload.newStatus)}`);
        void refetch();
    }, []), []);
    const refetch = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            const paramsBase = { page: 1, limit: 50 };
            const [ready, onDelivery] = await Promise.all([
                getOrders({ ...paramsBase, status: StatusPesanan.READY }),
                getOrders({ ...paramsBase, status: StatusPesanan.ON_DELIVERY }),
            ]);
            setReadyOrders(ready.data);
            setOnDeliveryOrders(onDelivery.data);
        }
        catch (error) {
            const message = error?.message ?? 'Gagal memuat daftar pengantaran';
            setLoadError(message);
            showError(message);
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => {
        void refetch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const activeItems = useMemo(() => {
        return activeTab === 'READY' ? readyOrders : onDeliveryOrders;
    }, [activeTab, readyOrders, onDeliveryOrders]);
    const pickup = async (order) => {
        setSubmitting(true);
        try {
            const updated = await updateOrderStatus(order.id, StatusPesanan.ON_DELIVERY);
            showSuccess(`Pickup: ${updated.kodePesanan} sekarang sedang diantar`);
            void refetch();
        }
        catch (error) {
            showError(error?.message ?? 'Gagal melakukan pickup');
        }
        finally {
            setSubmitting(false);
        }
    };
    const complete = async (order) => {
        setSubmitting(true);
        try {
            const updated = await updateOrderStatus(order.id, StatusPesanan.COMPLETE);
            showSuccess(`Selesai: ${updated.kodePesanan} pengantaran lengkap`);
            void refetch();
        }
        catch (error) {
            showError(error?.message ?? 'Gagal menyelesaikan pengantaran');
        }
        finally {
            setSubmitting(false);
        }
    };
    if (!isDelivery) {
        return (_jsx("div", { className: "px-4 py-4 md:px-6 md:py-6", children: _jsx(EmptyState, { title: "Akses ditolak", description: "Halaman pengantaran hanya untuk peran Delivery." }) }));
    }
    return (_jsxs("div", { className: "px-4 py-4 md:px-6 md:py-6", children: [_jsxs("div", { className: "mb-3 md:mb-4", children: [_jsx("h1", { className: "text-xl md:text-2xl font-display font-bold text-slate-900 dark:text-white", children: "Daftar Pengantaran" }), _jsx("p", { className: "text-sm text-slate-700 dark:text-slate-300", children: "Kelola pesanan untuk diambil dan diselesaikan." }), _jsxs("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: ["Realtime: order.status.changed [", wsStatusChanged, "]"] })] }), _jsx("div", { className: "sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700 p-1 mb-4", children: _jsxs("div", { className: "grid grid-cols-2 gap-1", children: [_jsx("button", { type: "button", className: [
                                'rounded-lg px-3 py-2 text-center text-sm',
                                activeTab === 'READY'
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700',
                            ].join(' '), onClick: () => setActiveTab('READY'), "aria-pressed": activeTab === 'READY', children: "Siap Diambil" }), _jsx("button", { type: "button", className: [
                                'rounded-lg px-3 py-2 text-center text-sm',
                                activeTab === 'ON_DELIVERY'
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700',
                            ].join(' '), onClick: () => setActiveTab('ON_DELIVERY'), "aria-pressed": activeTab === 'ON_DELIVERY', children: "Sedang Diantar" })] }) }), loading ? (_jsx("div", { className: "w-full flex items-center justify-center py-12", children: _jsx(Spinner, { variant: "primary", size: "lg", label: "Memuat daftar pengantaran..." }) })) : loadError ? (_jsx(EmptyState, { title: "Gagal memuat data", description: loadError, action: {
                    label: 'Coba Lagi',
                    onClick: () => void refetch(),
                    variant: 'primary',
                }, icon: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-8 w-8", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", children: _jsx("path", { strokeWidth: "2", strokeLinecap: "round", d: "M12 9v4M12 17h.01M4.93 4.93l14.14 14.14" }) }) })) : activeItems.length === 0 ? (_jsx(EmptyState, { title: activeTab === 'READY' ? 'Tidak ada pesanan siap diambil' : 'Tidak ada pesanan sedang diantar', description: activeTab === 'READY'
                    ? 'Tunggu notifikasi pesanan siap untuk pickup.'
                    : 'Tidak ada pesanan yang sedang diantar saat ini.' })) : (_jsx("div", { className: "grid grid-cols-1 gap-3", children: activeItems.map((order) => (_jsx("div", { className: "rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm", children: _jsxs("div", { className: "p-4 md:p-5", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100", children: order.kodePesanan }), _jsxs("div", { className: "mt-0.5 text-xs md:text-sm text-slate-600 dark:text-slate-300", children: ["Departemen #", order.departmentPemesanId, " \u2022 Shift #", order.shiftId] })] }), _jsx(Badge, { variant: getStatusBadgeVariant(order.statusPesanan), size: "md", children: getStatusLabel(order.statusPesanan) })] }), _jsxs("div", { className: "mt-3 grid grid-cols-2 gap-2", children: [_jsxs("div", { className: "text-xs md:text-sm text-slate-600 dark:text-slate-300", children: ["Jumlah: ", _jsx("span", { className: "font-medium", children: order.jumlahPesanan })] }), _jsxs("div", { className: "text-xs md:text-sm text-slate-600 dark:text-slate-300 text-right", children: ["Tanggal: ", _jsx("span", { className: "font-medium", children: formatDate(order.tanggalPesanan, 'yyyy-MM-dd') })] }), _jsxs("div", { className: "text-xs md:text-sm text-slate-600 dark:text-slate-300", children: ["Dibuat: ", _jsx("span", { className: "font-medium", children: formatDate(order.waktuDibuat, 'HH:mm') })] }), _jsx("div", { className: "text-xs md:text-sm text-slate-600 dark:text-slate-300 text-right", children: order.waktuSiap ? (_jsxs(_Fragment, { children: ["Siap: ", _jsx("span", { className: "font-medium", children: formatDate(order.waktuSiap, 'HH:mm') })] })) : null })] }), _jsx("div", { className: "mt-4", children: activeTab === 'READY' ? (_jsx(Button, { variant: "primary", size: "lg", className: "w-full md:w-auto", onClick: () => void pickup(order), isLoading: submitting, leftIcon: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "aria-hidden": "true", children: _jsx("path", { strokeWidth: "2", strokeLinecap: "round", d: "M5 12h14M12 5l7 7-7 7" }) }), children: "Pickup" })) : (_jsx(Button, { variant: "secondary", size: "lg", className: "w-full md:w-auto", onClick: () => void complete(order), isLoading: submitting, leftIcon: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-5 w-5", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "aria-hidden": "true", children: _jsx("path", { strokeWidth: "2", strokeLinecap: "round", d: "M9 5l7 7-7 7" }) }), children: "Complete" })) })] }) }, order.id))) }))] }));
}
