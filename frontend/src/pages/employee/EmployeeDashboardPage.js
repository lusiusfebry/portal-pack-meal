import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// frontend/src/pages/employee/EmployeeDashboardPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { Card, Button, Badge, Table } from '@/components/ui';
import Spinner from '@/components/ui/Spinner';
import { showError } from '@/components/ui/Toast';
import { useNavigate } from 'react-router-dom';
import { getOrders } from '@/services/api/orders.api';
import { StatusPesanan } from '@/types/order.types';
import { formatDateTime, toISODateOnly } from '@/utils/date.utils';
import { getStatusBadgeVariant, getStatusLabel } from '@/utils/status.utils';
import { addDays } from 'date-fns';
import { useAuthStore } from '@/stores/auth.store';
export default function EmployeeDashboardPage() {
    const navigate = useNavigate();
    const { user } = useAuthStore();
    const [isLoading, setIsLoading] = useState(true);
    const [orders, setOrders] = useState([]);
    const [, setError] = useState(null);
    // Ambil 7 hari terakhir agar statistik lebih bermakna
    const todayISO = toISODateOnly(new Date());
    const weekStartISO = toISODateOnly(addDays(new Date(), -6));
    useEffect(() => {
        let mounted = true;
        async function load() {
            setIsLoading(true);
            setError(null);
            try {
                // Untuk role employee, endpoint GET /orders mengembalikan pesanan milik user
                const page = await getOrders({
                    tanggalMulai: weekStartISO,
                    tanggalAkhir: todayISO,
                    page: 1,
                    limit: 200,
                });
                if (!mounted)
                    return;
                setOrders(page.data ?? []);
            }
            catch (e) {
                const message = e?.message || 'Gagal memuat pesanan';
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
    }, [todayISO, weekStartISO]);
    const totalCount = orders.length;
    const pendingInProgressCount = useMemo(() => orders.filter((o) => o.statusPesanan === StatusPesanan.MENUNGGU ||
        o.statusPesanan === StatusPesanan.IN_PROGRESS).length, [orders]);
    const completedCount = useMemo(() => orders.filter((o) => o.statusPesanan === StatusPesanan.COMPLETE).length, [orders]);
    const recentOrders = useMemo(() => {
        const copy = [...orders];
        copy.sort((a, b) => {
            const ta = a.waktuDibuat ?? a.tanggalPesanan;
            const tb = b.waktuDibuat ?? b.tanggalPesanan;
            return (tb || '').localeCompare(ta || '');
        });
        return copy.slice(0, 5);
    }, [orders]);
    return (_jsxs("div", { className: "px-6 py-6 space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-display font-bold text-slate-900 dark:text-white", children: "Dashboard Karyawan" }), _jsxs("p", { className: "mt-1 text-sm text-slate-600 dark:text-slate-300", children: ["Halo, ", user?.nama ?? 'Pengguna', " \u2014 pantau pesanan dan buat pesanan baru dengan mudah."] })] }), _jsx(Button, { variant: "primary", size: "lg", onClick: () => navigate('/orders/new'), className: "whitespace-nowrap", children: "Buat Pesanan Baru" })] }), isLoading ? (_jsx("div", { className: "flex items-center justify-center py-16", children: _jsx(Spinner, { variant: "primary", size: "lg", label: "Memuat dashboard..." }) })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-3 gap-6", children: [_jsxs(Card, { hover: true, padding: "lg", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: "Total Pesanan" }), _jsx("p", { className: "mt-4 text-4xl font-bold text-slate-900 dark:text-white", children: totalCount }), _jsx("p", { className: "mt-1 text-xs text-slate-500 dark:text-slate-400", children: "7 hari terakhir" })] }), _jsxs(Card, { hover: true, padding: "lg", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: "Pending / Diproses" }), _jsx("p", { className: "mt-4 text-4xl font-bold text-amber-600 dark:text-amber-400", children: pendingInProgressCount }), _jsx("p", { className: "mt-1 text-xs text-slate-500 dark:text-slate-400", children: "Status MENUNGGU & IN_PROGRESS" })] }), _jsxs(Card, { hover: true, padding: "lg", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: "Selesai" }), _jsx("p", { className: "mt-4 text-4xl font-bold text-emerald-600 dark:text-emerald-400", children: completedCount }), _jsx("p", { className: "mt-1 text-xs text-slate-500 dark:text-slate-400", children: "Status COMPLETE" })] })] }), _jsxs(Card, { hover: true, padding: "lg", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-900 dark:text-white mb-4", children: "Pesanan Terakhir (5)" }), _jsx(Table, { ariaLabel: "Pesanan terakhir", dense: true, columns: [
                                    { id: 'kode', header: 'Kode', field: 'kodePesanan', width: 'w-32' },
                                    {
                                        id: 'status',
                                        header: 'Status',
                                        accessor: (row) => (_jsx(Badge, { variant: getStatusBadgeVariant(row.statusPesanan), children: getStatusLabel(row.statusPesanan) })),
                                        width: 'w-40',
                                    },
                                    { id: 'jumlah', header: 'Jumlah', field: 'jumlahPesanan', align: 'right', width: 'w-24' },
                                    {
                                        id: 'waktu',
                                        header: 'Waktu Dibuat',
                                        accessor: (row) => formatDateTime(row.waktuDibuat ?? row.tanggalPesanan, 'yyyy-MM-dd HH:mm'),
                                        width: 'w-48',
                                    },
                                ], data: recentOrders, getRowId: (row) => row.id, emptyLabel: "Belum ada pesanan" })] }), _jsxs(Card, { hover: true, padding: "lg", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: "Cara Memesan Pack Meal" }), _jsxs("ol", { className: "mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300 list-decimal pl-5", children: [_jsx("li", { children: "Pilih shift yang sesuai dengan jadwal Anda." }), _jsx("li", { children: "Masukkan jumlah pack meal yang dibutuhkan." }), _jsx("li", { children: "Tambahkan catatan bila diperlukan." }), _jsx("li", { children: "Kirim pesanan dan pantau status secara real-time di dashboard ini." })] }), _jsx("div", { className: "mt-4", children: _jsx(Button, { variant: "outline", onClick: () => navigate('/orders/new'), children: "Buat Pesanan Baru" }) })] })] }))] }));
}
