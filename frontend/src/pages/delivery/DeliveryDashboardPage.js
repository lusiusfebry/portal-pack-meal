import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// frontend/src/pages/delivery/DeliveryDashboardPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { Card, Button, Badge, Table } from '@/components/ui';
import Spinner from '@/components/ui/Spinner';
import { showError } from '@/components/ui/Toast';
import { useNavigate } from 'react-router-dom';
import { getOrders } from '@/services/api/orders.api';
import { StatusPesanan } from '@/types/order.types';
import { formatDateTime, toISODateOnly } from '@/utils/date.utils';
import { getStatusBadgeVariant, getStatusLabel } from '@/utils/status.utils';
export default function DeliveryDashboardPage() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [todayOrders, setTodayOrders] = useState([]);
    const [, setError] = useState(null);
    const todayISO = toISODateOnly(new Date());
    useEffect(() => {
        let mounted = true;
        async function load() {
            setIsLoading(true);
            setError(null);
            try {
                // Ambil pesanan hari ini; delivery fokus pada READY/ON_DELIVERY/COMPLETE
                const page = await getOrders({ tanggalMulai: todayISO, tanggalAkhir: todayISO, page: 1, limit: 1000 });
                if (!mounted)
                    return;
                setTodayOrders(page.data ?? []);
            }
            catch (e) {
                const message = e?.message || 'Gagal memuat data dashboard delivery';
                setError(message);
                showError(message);
            }
            finally {
                if (mounted)
                    setIsLoading(false);
            }
        }
        load();
        return () => {
            mounted = false;
        };
    }, [todayISO]);
    const readyOrders = useMemo(() => todayOrders.filter((o) => o.statusPesanan === StatusPesanan.READY), [todayOrders]);
    const onDeliveryOrders = useMemo(() => todayOrders.filter((o) => o.statusPesanan === StatusPesanan.ON_DELIVERY), [todayOrders]);
    const completedTodayOrders = useMemo(() => todayOrders.filter((o) => o.statusPesanan === StatusPesanan.COMPLETE), [todayOrders]);
    return (_jsxs("div", { className: "px-4 py-4 space-y-6 sm:px-6 sm:py-6", children: [_jsxs("div", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white", children: "Dashboard Delivery" }), _jsx("p", { className: "mt-1 text-sm text-slate-600 dark:text-slate-300", children: "Fokus pada pesanan siap diantar dan pengiriman berjalan." })] }), _jsx("div", { className: "grid grid-cols-1 sm:flex gap-3", children: _jsx(Button, { variant: "primary", size: "lg", className: "w-full sm:w-auto", onClick: () => navigate('/delivery/ready'), children: "Lihat Pesanan Siap" }) })] }), isLoading ? (_jsx("div", { className: "flex items-center justify-center py-16", children: _jsx(Spinner, { variant: "primary", size: "lg", label: "Memuat dashboard delivery..." }) })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6", children: [_jsxs(Card, { hover: true, padding: "lg", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: "Siap Diantar" }), _jsx("p", { className: "mt-4 text-4xl font-bold text-violet-600 dark:text-violet-400", children: readyOrders.length }), _jsx("p", { className: "mt-1 text-xs text-slate-500 dark:text-slate-400", children: "Status READY" })] }), _jsxs(Card, { hover: true, padding: "lg", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: "Dalam Pengantaran" }), _jsx("p", { className: "mt-4 text-4xl font-bold text-blue-600 dark:text-blue-400", children: onDeliveryOrders.length }), _jsx("p", { className: "mt-1 text-xs text-slate-500 dark:text-slate-400", children: "Status ON_DELIVERY" })] }), _jsxs(Card, { hover: true, padding: "lg", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: "Selesai Hari Ini" }), _jsx("p", { className: "mt-4 text-4xl font-bold text-emerald-600 dark:text-emerald-400", children: completedTodayOrders.length }), _jsx("p", { className: "mt-1 text-xs text-slate-500 dark:text-slate-400", children: "Status COMPLETE" })] })] }), _jsxs(Card, { hover: true, padding: "lg", className: "w-full", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-900 dark:text-white mb-4", children: "Pesanan Siap" }), _jsx(Table, { ariaLabel: "Pesanan siap diantar", dense: true, columns: [
                                    { id: 'kode', header: 'Kode', field: 'kodePesanan', width: 'w-28' },
                                    {
                                        id: 'status',
                                        header: 'Status',
                                        accessor: (row) => (_jsx(Badge, { variant: getStatusBadgeVariant(row.statusPesanan), children: getStatusLabel(row.statusPesanan) })),
                                        width: 'w-40',
                                    },
                                    { id: 'jumlah', header: 'Jumlah', field: 'jumlahPesanan', align: 'right', width: 'w-20' },
                                    {
                                        id: 'waktu',
                                        header: 'Siap Sejak',
                                        accessor: (row) => formatDateTime(row.waktuSiap ?? row.waktuDibuat ?? row.tanggalPesanan, 'yyyy-MM-dd HH:mm'),
                                        width: 'w-48',
                                    },
                                ], data: readyOrders.slice(0, 8), getRowId: (row) => row.id, emptyLabel: "Tidak ada pesanan siap saat ini" }), _jsx("div", { className: "mt-4", children: _jsx(Button, { variant: "secondary", size: "lg", className: "w-full sm:w-auto", onClick: () => navigate('/delivery/ready'), children: "Buka Daftar Lengkap" }) })] }), _jsxs(Card, { hover: true, padding: "lg", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: "Alur Kerja Delivery" }), _jsxs("ol", { className: "mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300 list-decimal pl-5", children: [_jsx("li", { children: "Ambil pesanan berstatus Siap." }), _jsx("li", { children: "Ubah status menjadi Dalam Pengantaran saat pickup." }), _jsx("li", { children: "Konfirmasi pengantaran dengan mengubah status menjadi Selesai." })] })] })] }))] }));
}
