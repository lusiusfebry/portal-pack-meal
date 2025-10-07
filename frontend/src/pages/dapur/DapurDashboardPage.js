import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// frontend/src/pages/dapur/DapurDashboardPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { Card, Button, Badge, Table } from '@/components/ui';
import Spinner from '@/components/ui/Spinner';
import { showError } from '@/components/ui/Toast';
import { useNavigate } from 'react-router-dom';
import { getOrders, getPendingApprovals } from '@/services/api/orders.api';
import { StatusPesanan } from '@/types/order.types';
import { formatDateTime, toISODateOnly } from '@/utils/date.utils';
import { getStatusBadgeVariant, getStatusLabel } from '@/utils/status.utils';
export default function DapurDashboardPage() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [todayOrders, setTodayOrders] = useState([]);
    const [pendingApprovals, setPendingApprovals] = useState([]);
    const [, setError] = useState(null);
    const todayISO = toISODateOnly(new Date());
    useEffect(() => {
        let mounted = true;
        async function load() {
            setIsLoading(true);
            setError(null);
            try {
                const [ordersPage, approvals] = await Promise.all([
                    getOrders({ tanggalMulai: todayISO, tanggalAkhir: todayISO, page: 1, limit: 1000 }),
                    getPendingApprovals(),
                ]);
                if (!mounted)
                    return;
                setTodayOrders(ordersPage.data ?? []);
                setPendingApprovals(approvals ?? []);
            }
            catch (e) {
                const message = e?.message || 'Gagal memuat data dashboard dapur';
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
    const menungguCount = useMemo(() => todayOrders.filter((o) => o.statusPesanan === StatusPesanan.MENUNGGU).length, [todayOrders]);
    const inProgressCount = useMemo(() => todayOrders.filter((o) => o.statusPesanan === StatusPesanan.IN_PROGRESS).length, [todayOrders]);
    const readyCount = useMemo(() => todayOrders.filter((o) => o.statusPesanan === StatusPesanan.READY).length, [todayOrders]);
    const pendingApprovalsCount = pendingApprovals.length;
    const queuePreview = useMemo(() => {
        const items = todayOrders
            .filter((o) => o.statusPesanan === StatusPesanan.MENUNGGU ||
            o.statusPesanan === StatusPesanan.IN_PROGRESS ||
            o.statusPesanan === StatusPesanan.READY)
            .slice(0, 8);
        // sort by status and time
        items.sort((a, b) => {
            const statusOrder = (s) => {
                switch (s) {
                    case StatusPesanan.MENUNGGU:
                        return 1;
                    case StatusPesanan.IN_PROGRESS:
                        return 2;
                    case StatusPesanan.READY:
                        return 3;
                    default:
                        return 99;
                }
            };
            const sa = statusOrder(a.statusPesanan);
            const sb = statusOrder(b.statusPesanan);
            if (sa !== sb)
                return sa - sb;
            const ta = a.waktuDiproses ?? a.waktuDibuat ?? a.tanggalPesanan;
            const tb = b.waktuDiproses ?? b.waktuDibuat ?? b.tanggalPesanan;
            return (ta || '').localeCompare(tb || '');
        });
        return items;
    }, [todayOrders]);
    return (_jsxs("div", { className: "px-4 py-4 sm:px-6 sm:py-6 space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white", children: "Dashboard Dapur" }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "primary", size: "md", onClick: () => navigate('/orders/queue'), className: "whitespace-nowrap", children: "Lihat Antrian" }), _jsx(Button, { variant: "secondary", size: "md", onClick: () => navigate('/orders/pending-approvals'), className: "whitespace-nowrap", children: "Persetujuan Tertunda" })] })] }), isLoading ? (_jsx("div", { className: "flex items-center justify-center py-16", children: _jsx(Spinner, { variant: "primary", size: "lg", label: "Memuat dashboard dapur..." }) })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6", children: [_jsxs(Card, { hover: true, padding: "lg", children: [_jsx("h2", { className: "text-base sm:text-lg font-semibold text-slate-900 dark:text-white", children: "Menunggu" }), _jsx("p", { className: "mt-2 sm:mt-4 text-3xl sm:text-4xl font-bold text-amber-600 dark:text-amber-400", children: menungguCount }), _jsx("p", { className: "mt-1 text-xs text-slate-500 dark:text-slate-400", children: "Siap ditindaklanjuti" })] }), _jsxs(Card, { hover: true, padding: "lg", children: [_jsx("h2", { className: "text-base sm:text-lg font-semibold text-slate-900 dark:text-white", children: "Diproses" }), _jsx("p", { className: "mt-2 sm:mt-4 text-3xl sm:text-4xl font-bold text-sky-600 dark:text-sky-400", children: inProgressCount }), _jsx("p", { className: "mt-1 text-xs text-slate-500 dark:text-slate-400", children: "Sedang dikerjakan" })] }), _jsxs(Card, { hover: true, padding: "lg", children: [_jsx("h2", { className: "text-base sm:text-lg font-semibold text-slate-900 dark:text-white", children: "Siap" }), _jsx("p", { className: "mt-2 sm:mt-4 text-3xl sm:text-4xl font-bold text-violet-600 dark:text-violet-400", children: readyCount }), _jsx("p", { className: "mt-1 text-xs text-slate-500 dark:text-slate-400", children: "Siap untuk diantar" })] }), _jsxs(Card, { hover: true, padding: "lg", children: [_jsx("h2", { className: "text-base sm:text-lg font-semibold text-slate-900 dark:text-white", children: "Menunggu Persetujuan" }), _jsx("p", { className: "mt-2 sm:mt-4 text-3xl sm:text-4xl font-bold text-amber-600 dark:text-amber-400", children: pendingApprovalsCount }), _jsx("p", { className: "mt-1 text-xs text-slate-500 dark:text-slate-400", children: "Permintaan dari dapur" })] })] }), _jsxs(Card, { hover: true, padding: "lg", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-900 dark:text-white mb-4", children: "Preview Antrian Hari Ini" }), _jsx(Table, { ariaLabel: "Antrian pesanan dapur", dense: true, columns: [
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
                                        header: 'Mulai Diproses / Dibuat',
                                        accessor: (row) => formatDateTime(row.waktuDiproses ?? row.waktuDibuat ?? row.tanggalPesanan, 'yyyy-MM-dd HH:mm'),
                                        width: 'w-48',
                                    },
                                ], data: queuePreview, getRowId: (row) => row.id, emptyLabel: "Tidak ada antrian hari ini" })] }), _jsxs(Card, { hover: true, padding: "lg", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: "Alur Kerja Dapur" }), _jsxs("ol", { className: "mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300 list-decimal pl-5", children: [_jsx("li", { children: "Ambil pesanan berstatus Menunggu." }), _jsx("li", { children: "Ubah status menjadi Diproses saat mulai mengerjakan." }), _jsx("li", { children: "Jika siap, ubah status menjadi Siap." }), _jsx("li", { children: "Jika perlu penolakan atau perubahan jumlah, ajukan persetujuan (Menunggu Persetujuan) dengan catatan yang jelas." })] }), _jsxs("div", { className: "mt-4 flex gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => navigate('/orders/queue'), children: "Buka Antrian" }), _jsx(Button, { variant: "ghost", onClick: () => navigate('/orders/pending-approvals'), children: "Lihat Persetujuan" })] })] }), _jsxs(Card, { hover: true, padding: "lg", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: "Tips Penolakan/Edit Persetujuan" }), _jsxs("ul", { className: "mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300 list-disc pl-5", children: [_jsx("li", { children: "Sertakan alasan yang spesifik (stok, kualitas, kebijakan)." }), _jsx("li", { children: "Gunakan jumlah baru yang realistis dan sesuai kapasitas." }), _jsx("li", { children: "Komunikasikan dengan admin jika kasus tidak umum." })] })] })] }))] }));
}
