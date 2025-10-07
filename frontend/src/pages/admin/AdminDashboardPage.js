import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// frontend/src/pages/admin/AdminDashboardPage.tsx
import { useEffect, useMemo, useState } from 'react';
import { Card, Button, Badge, Table } from '@/components/ui';
import Spinner from '@/components/ui/Spinner';
import { showError } from '@/components/ui/Toast';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, } from 'recharts';
import { toISODateOnly, formatDateTime } from '@/utils/date.utils';
import { getStatusBadgeVariant, getStatusLabel } from '@/utils/status.utils';
import { getOrders, getPendingApprovals, } from '@/services/api/orders.api';
import { getDepartmentReport, getConsumptionReport, } from '@/services/api/reports.api';
import { StatusPesanan } from '@/types/order.types';
import { addDays } from 'date-fns';
const CHART_COLORS = ['#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#0EA5E9', '#64748B', '#C084FC', '#14B8A6'];
export default function AdminDashboardPage() {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(true);
    const [todayOrders, setTodayOrders] = useState([]);
    const [deptReport, setDeptReport] = useState([]);
    const [, setConsumption] = useState([]);
    const [pendingApprovals, setPendingApprovals] = useState([]);
    const [, setError] = useState(null);
    const todayISO = toISODateOnly(new Date());
    const weekStartISO = toISODateOnly(addDays(new Date(), -6));
    useEffect(() => {
        let mounted = true;
        async function load() {
            setIsLoading(true);
            setError(null);
            try {
                const [todayOrdersPage, deptItems, consumptionItems, pendingApprovalItems,] = await Promise.all([
                    getOrders({ tanggalMulai: todayISO, tanggalAkhir: todayISO, page: 1, limit: 1000 }),
                    getDepartmentReport({ tanggalMulai: todayISO, tanggalAkhir: todayISO }),
                    getConsumptionReport({ tanggalMulai: weekStartISO, tanggalAkhir: todayISO, groupBy: 'DAILY' }),
                    getPendingApprovals(),
                ]);
                if (!mounted)
                    return;
                setTodayOrders(todayOrdersPage.data ?? []);
                setDeptReport(deptItems ?? []);
                setConsumption(consumptionItems ?? []);
                setPendingApprovals(pendingApprovalItems ?? []);
            }
            catch (e) {
                const message = e?.message || 'Gagal memuat data dashboard';
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
    const totalOrdersToday = todayOrders.length;
    const inProgressCount = useMemo(() => todayOrders.filter((o) => o.statusPesanan === StatusPesanan.IN_PROGRESS).length, [todayOrders]);
    const completedTodayCount = useMemo(() => todayOrders.filter((o) => o.statusPesanan === StatusPesanan.COMPLETE).length, [todayOrders]);
    const pendingApprovalsCount = pendingApprovals.length;
    const statusCounts = useMemo(() => {
        const statuses = [
            { name: 'Menunggu', value: 0 },
            { name: 'Diproses', value: 0 },
            { name: 'Siap', value: 0 },
            { name: 'Diantar', value: 0 },
            { name: 'Selesai', value: 0 },
            { name: 'Ditolak', value: 0 },
        ];
        for (const o of todayOrders) {
            switch (o.statusPesanan) {
                case StatusPesanan.MENUNGGU:
                    statuses[0].value += 1;
                    break;
                case StatusPesanan.IN_PROGRESS:
                    statuses[1].value += 1;
                    break;
                case StatusPesanan.READY:
                    statuses[2].value += 1;
                    break;
                case StatusPesanan.ON_DELIVERY:
                    statuses[3].value += 1;
                    break;
                case StatusPesanan.COMPLETE:
                    statuses[4].value += 1;
                    break;
                case StatusPesanan.DITOLAK:
                    statuses[5].value += 1;
                    break;
                default:
                    break;
            }
        }
        return statuses;
    }, [todayOrders]);
    const recentOrders = useMemo(() => {
        const copy = [...todayOrders];
        copy.sort((a, b) => {
            const ta = a.waktuDibuat ?? a.tanggalPesanan;
            const tb = b.waktuDibuat ?? b.tanggalPesanan;
            return (tb || '').localeCompare(ta || '');
        });
        return copy.slice(0, 10);
    }, [todayOrders]);
    return (_jsxs("div", { className: "px-6 py-6 space-y-6", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("h1", { className: "text-3xl font-display font-bold text-slate-900 dark:text-white", children: "Dashboard Admin" }), _jsxs("div", { className: "flex gap-2", children: [_jsx(Button, { variant: "primary", onClick: () => navigate('/admin/approvals'), children: "Pusat Persetujuan" }), _jsx(Button, { variant: "secondary", onClick: () => navigate('/orders/new?emergency=1'), children: "Emergency Order" })] })] }), isLoading ? (_jsx("div", { className: "flex items-center justify-center py-16", children: _jsx(Spinner, { variant: "primary", size: "lg", label: "Memuat dashboard..." }) })) : (_jsxs(_Fragment, { children: [_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6", children: [_jsxs(Card, { hover: true, padding: "lg", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsx("h2", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: "Total Orders (Hari ini)" }) }), _jsx("p", { className: "mt-4 text-4xl font-bold text-slate-900 dark:text-white", children: totalOrdersToday }), _jsx("p", { className: "mt-1 text-xs text-slate-500 dark:text-slate-400", children: "Semua pesanan dibuat hari ini" })] }), _jsxs(Card, { hover: true, padding: "lg", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsx("h2", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: "Sedang Diproses" }) }), _jsx("p", { className: "mt-4 text-4xl font-bold text-sky-600 dark:text-sky-400", children: inProgressCount }), _jsx("p", { className: "mt-1 text-xs text-slate-500 dark:text-slate-400", children: "Status IN_PROGRESS" })] }), _jsxs(Card, { hover: true, padding: "lg", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsx("h2", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: "Selesai (Hari ini)" }) }), _jsx("p", { className: "mt-4 text-4xl font-bold text-emerald-600 dark:text-emerald-400", children: completedTodayCount }), _jsx("p", { className: "mt-1 text-xs text-slate-500 dark:text-slate-400", children: "Status COMPLETE" })] }), _jsxs(Card, { hover: true, padding: "lg", children: [_jsx("div", { className: "flex items-center justify-between", children: _jsx("h2", { className: "text-lg font-semibold text-slate-900 dark:text-white", children: "Menunggu Persetujuan" }) }), _jsx("p", { className: "mt-4 text-4xl font-bold text-amber-600 dark:text-amber-400", children: pendingApprovalsCount }), _jsx("p", { className: "mt-1 text-xs text-slate-500 dark:text-slate-400", children: "Permintaan approval dari dapur" })] })] }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-6", children: [_jsxs(Card, { hover: true, padding: "lg", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-900 dark:text-white mb-4", children: "Distribusi Pesanan per Departemen (Hari ini)" }), _jsx("div", { className: "h-72 w-full", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(PieChart, { children: [_jsx(Pie, { data: deptReport, dataKey: "totalOrders", nameKey: "departmentName", cx: "50%", cy: "50%", outerRadius: 100, label: true, children: deptReport.map((entry, idx) => (_jsx(Cell, { fill: CHART_COLORS[idx % CHART_COLORS.length] }, `cell-${entry.departmentId}-${idx}`))) }), _jsx(Tooltip, {}), _jsx(Legend, {})] }) }) })] }), _jsxs(Card, { hover: true, padding: "lg", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-900 dark:text-white mb-4", children: "Status Pesanan Hari Ini" }), _jsx("div", { className: "h-72 w-full", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: statusCounts, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "name" }), _jsx(YAxis, { allowDecimals: false }), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Bar, { dataKey: "value", name: "Jumlah", fill: "#3B82F6" })] }) }) })] })] }), _jsxs(Card, { hover: true, padding: "lg", className: "w-full", children: [_jsx("h2", { className: "text-lg font-semibold text-slate-900 dark:text-white mb-4", children: "Aktivitas Terbaru (10 Pesanan)" }), _jsx(Table, { ariaLabel: "Aktivitas pesanan terbaru", dense: true, columns: [
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
                                ], data: recentOrders, getRowId: (row) => row.id, emptyLabel: "Tidak ada pesanan hari ini" })] })] }))] }));
}
