import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// frontend/src/pages/reports/ReportsPage.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import DatePicker from '@/components/ui/DatePicker';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { Table } from '@/components/ui/Table';
import Pagination from '@/components/ui/Pagination';
import { showError, showSuccess } from '@/components/ui/Toast';
import { getConsumptionReport, getDepartmentReport, getPerformanceReport, getRejectionReport, } from '@/services/api/reports.api';
import { getDepartments, getShifts } from '@/services/api/master.api';
import { downloadCSV } from '@/utils/download.utils';
import { formatDateTime, formatDuration } from '@/utils/date.utils';
// Recharts
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, BarChart, Bar, PieChart, Pie, Cell, } from 'recharts';
// Design system colors (emerald/amber/blue)
const COLORS = {
    emerald: '#10B981',
    emerald700: '#047857',
    amber: '#F59E0B',
    amber700: '#B45309',
    blue: '#3B82F6',
    blue700: '#1D4ED8',
    slate: '#64748B',
};
const GROUP_BY_OPTIONS = [
    { label: 'Harian', value: 'DAILY' },
    { label: 'Mingguan', value: 'WEEKLY' },
    { label: 'Bulanan', value: 'MONTHLY' },
];
const APPROVAL_OPTIONS = [
    { label: 'Pending', value: 'PENDING' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' },
];
const STATUS_OPTIONS = [
    { label: 'MENUNGGU', value: 'MENUNGGU' },
    { label: 'IN_PROGRESS', value: 'IN_PROGRESS' },
    { label: 'READY', value: 'READY' },
    { label: 'ON_DELIVERY', value: 'ON_DELIVERY' },
    { label: 'COMPLETE', value: 'COMPLETE' },
    { label: 'DITOLAK', value: 'DITOLAK' },
    { label: 'MENUNGGU_PERSETUJUAN', value: 'MENUNGGU_PERSETUJUAN' },
];
function SectionHeader({ title, description, right, }) {
    return (_jsxs("header", { className: "flex flex-col md:flex-row md:items-center md:justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-lg md:text-xl font-semibold text-slate-900 dark:text-slate-100", children: title }), description ? (_jsx("p", { className: "mt-1 text-sm text-slate-600 dark:text-slate-300", children: description })) : null] }), right] }));
}
export default function ReportsPage() {
    const [activeTab, setActiveTab] = useState('consumption');
    // Master data for selects
    const [departments, setDepartments] = useState([]);
    const [shifts, setShifts] = useState([]);
    const loadMaster = useCallback(async () => {
        try {
            const [dept, shf] = await Promise.all([getDepartments(), getShifts()]);
            setDepartments(dept ?? []);
            setShifts(shf ?? []);
        }
        catch {
            // stubs already handled in API
        }
    }, []);
    useEffect(() => {
        loadMaster();
    }, [loadMaster]);
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("header", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", children: _jsxs("div", { children: [_jsx("h1", { className: "text-xl font-semibold text-slate-900 dark:text-slate-100", children: "Laporan" }), _jsx("p", { className: "mt-1 text-sm text-slate-600 dark:text-slate-300", children: "Analitik konsumsi, departemen, kinerja, dan rekap penolakan/edit." })] }) }), _jsxs("div", { className: "flex flex-wrap gap-2", children: [_jsx(Button, { variant: activeTab === 'consumption' ? 'primary' : 'outline', onClick: () => setActiveTab('consumption'), children: "Konsumsi" }), _jsx(Button, { variant: activeTab === 'department' ? 'primary' : 'outline', onClick: () => setActiveTab('department'), children: "Departemen" }), _jsx(Button, { variant: activeTab === 'performance' ? 'primary' : 'outline', onClick: () => setActiveTab('performance'), children: "Kinerja" }), _jsx(Button, { variant: activeTab === 'rejections' ? 'primary' : 'outline', onClick: () => setActiveTab('rejections'), children: "Penolakan/Edit" })] }), activeTab === 'consumption' && _jsx(ConsumptionTab, { shifts: shifts }), activeTab === 'department' && (_jsx(DepartmentTab, { departments: departments, shifts: shifts })), activeTab === 'performance' && (_jsx(PerformanceTab, { departments: departments, shifts: shifts })), activeTab === 'rejections' && _jsx(RejectionsTab, { departments: departments })] }));
}
/* ===========================
 * Tab: Konsumsi
 * =========================== */
function ConsumptionTab({ shifts }) {
    const [query, setQuery] = useState({
        groupBy: 'DAILY',
    });
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const shiftOptions = useMemo(() => [{ label: '—', value: '' }, ...shifts.map((s) => ({ label: s.namaShift, value: s.id }))], [shifts]);
    const onApply = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getConsumptionReport(query);
            setItems(data ?? []);
        }
        catch (e) {
            showError(`Gagal memuat laporan konsumsi: ${e.message ?? String(e)}`);
        }
        finally {
            setIsLoading(false);
        }
    }, [query]);
    const onReset = () => {
        setQuery({ groupBy: 'DAILY' });
        setItems([]);
    };
    const onDownloadCsv = () => {
        if (!items?.length) {
            showError('Tidak ada data untuk diunduh');
            return;
        }
        const rows = items.map((i) => ({
            period: i.period,
            totalOrders: i.totalOrders,
            totalMeals: i.totalMeals,
        }));
        downloadCSV(rows, 'laporan-konsumsi.csv');
        showSuccess('CSV berhasil diunduh');
    };
    return (_jsxs("div", { className: "space-y-4", children: [_jsx(SectionHeader, { title: "Laporan Konsumsi", description: "Agregasi total orders dan total meals berdasarkan periode.", right: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { variant: "secondary", onClick: onApply, children: "Terapkan" }), _jsx(Button, { variant: "ghost", onClick: onReset, children: "Reset" }), _jsx(Button, { variant: "outline", onClick: onDownloadCsv, children: "Unduh CSV" })] }) }), _jsx(Card, { children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsx(DatePicker, { label: "Tanggal Mulai", value: query.tanggalMulai ?? '', onChange: (e) => setQuery((q) => ({ ...q, tanggalMulai: e.target.value || undefined })) }), _jsx(DatePicker, { label: "Tanggal Akhir", value: query.tanggalAkhir ?? '', onChange: (e) => setQuery((q) => ({ ...q, tanggalAkhir: e.target.value || undefined })) }), _jsx(Select, { label: "Group By", options: GROUP_BY_OPTIONS, value: query.groupBy ?? 'DAILY', onChange: (e) => setQuery((q) => ({ ...q, groupBy: e.target.value || 'DAILY' })) }), _jsx(Select, { label: "Shift (opsional)", options: shiftOptions, value: query.shiftId ?? '', onChange: (e) => setQuery((q) => ({
                                ...q,
                                shiftId: e.target.value ? Number(e.target.value) : undefined,
                            })) })] }) }), _jsx(Card, { children: isLoading ? (_jsx("div", { className: "min-h-[240px] grid place-items-center", children: _jsx(Spinner, { variant: "primary", size: "lg", label: "Memuat data..." }) })) : items.length === 0 ? (_jsx(EmptyState, { title: "Tidak ada data", description: "Sesuaikan filter lalu klik Terapkan." })) : (_jsx("div", { className: "h-[320px]", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(LineChart, { data: items, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "period" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Line, { type: "monotone", dataKey: "totalOrders", stroke: COLORS.blue, name: "Total Orders" }), _jsx(Line, { type: "monotone", dataKey: "totalMeals", stroke: COLORS.emerald, name: "Total Meals" })] }) }) })) })] }));
}
/* ===========================
 * Tab: Departemen
 * =========================== */
function DepartmentTab({ departments, shifts }) {
    const [query, setQuery] = useState({});
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const deptOptions = useMemo(() => [{ label: '—', value: '' }, ...departments.map((d) => ({ label: d.namaDivisi, value: d.id }))], [departments]);
    const shiftOptions = useMemo(() => [{ label: '—', value: '' }, ...shifts.map((s) => ({ label: s.namaShift, value: s.id }))], [shifts]);
    const statusOptions = useMemo(() => STATUS_OPTIONS, []);
    const onApply = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getDepartmentReport(query);
            setItems(data ?? []);
        }
        catch (e) {
            showError(`Gagal memuat laporan departemen: ${e.message ?? String(e)}`);
        }
        finally {
            setIsLoading(false);
        }
    }, [query]);
    const onReset = () => {
        setQuery({});
        setItems([]);
    };
    const onDownloadCsv = () => {
        if (!items?.length) {
            showError('Tidak ada data untuk diunduh');
            return;
        }
        const rows = items.map((i) => ({
            departmentId: i.departmentId,
            departmentName: i.departmentName,
            totalOrders: i.totalOrders,
            totalMeals: i.totalMeals,
            percentage: i.percentage,
        }));
        downloadCSV(rows, 'laporan-departemen.csv');
        showSuccess('CSV berhasil diunduh');
    };
    const pieColors = useMemo(() => [COLORS.emerald, COLORS.amber, COLORS.blue, COLORS.slate, COLORS.emerald700, COLORS.blue700], []);
    const columns = useMemo(() => [
        { id: 'dept', header: 'Departemen', accessor: (row) => row.departmentName, align: 'left' },
        { id: 'orders', header: 'Total Orders', accessor: (row) => row.totalOrders, align: 'right' },
        { id: 'meals', header: 'Total Meals', accessor: (row) => row.totalMeals, align: 'right' },
        {
            id: 'percentage',
            header: 'Persentase',
            accessor: (row) => `${row.percentage.toFixed(2)}%`,
            align: 'right',
        },
    ], []);
    return (_jsxs("div", { className: "space-y-4", children: [_jsx(SectionHeader, { title: "Laporan Departemen", description: "Distribusi pesanan dan meals per departemen.", right: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { variant: "secondary", onClick: onApply, children: "Terapkan" }), _jsx(Button, { variant: "ghost", onClick: onReset, children: "Reset" }), _jsx(Button, { variant: "outline", onClick: onDownloadCsv, children: "Unduh CSV" })] }) }), _jsx(Card, { children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-5 gap-4", children: [_jsx(DatePicker, { label: "Tanggal Mulai", value: query.tanggalMulai ?? '', onChange: (e) => setQuery((q) => ({ ...q, tanggalMulai: e.target.value || undefined })) }), _jsx(DatePicker, { label: "Tanggal Akhir", value: query.tanggalAkhir ?? '', onChange: (e) => setQuery((q) => ({ ...q, tanggalAkhir: e.target.value || undefined })) }), _jsx(Select, { label: "Departemen", options: deptOptions, value: query.departmentId ?? '', onChange: (e) => setQuery((q) => ({
                                ...q,
                                departmentId: e.target.value ? Number(e.target.value) : undefined,
                            })) }), _jsx(Select, { label: "Status (opsional)", options: [{ label: '—', value: '' }, ...statusOptions], value: query.status ?? '', onChange: (e) => setQuery((q) => ({
                                ...q,
                                status: e.target.value || undefined,
                            })) }), _jsx(Select, { label: "Shift (opsional)", options: shiftOptions, value: query.shiftId ?? '', onChange: (e) => setQuery((q) => ({
                                ...q,
                                shiftId: e.target.value ? Number(e.target.value) : undefined,
                            })) })] }) }), _jsxs("div", { className: "grid grid-cols-1 lg:grid-cols-2 gap-4", children: [_jsx(Card, { children: isLoading ? (_jsx("div", { className: "min-h-[240px] grid place-items-center", children: _jsx(Spinner, { variant: "primary", size: "lg", label: "Memuat data..." }) })) : items.length === 0 ? (_jsx(EmptyState, { title: "Tidak ada data", description: "Sesuaikan filter lalu Terapkan." })) : (_jsx("div", { className: "h-[320px]", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(PieChart, { children: [_jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Pie, { data: items, dataKey: "totalOrders", nameKey: "departmentName", cx: "50%", cy: "50%", outerRadius: 110, label: true, children: items.map((entry, index) => (_jsx(Cell, { fill: pieColors[index % pieColors.length] }, `cell-${index}`))) })] }) }) })) }), _jsx(Card, { children: _jsx(Table, { columns: columns, data: items, ariaLabel: "Tabel Laporan Departemen", emptyLabel: "Tidak ada data" }) })] })] }));
}
/* ===========================
 * Tab: Kinerja
 * =========================== */
function PerformanceTab({ departments, shifts }) {
    const [query, setQuery] = useState({});
    const [data, setData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const deptOptions = useMemo(() => [{ label: '—', value: '' }, ...departments.map((d) => ({ label: d.namaDivisi, value: d.id }))], [departments]);
    const shiftOptions = useMemo(() => [{ label: '—', value: '' }, ...shifts.map((s) => ({ label: s.namaShift, value: s.id }))], [shifts]);
    const onApply = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await getPerformanceReport(query);
            setData(res ?? null);
        }
        catch (e) {
            showError(`Gagal memuat laporan kinerja: ${e.message ?? String(e)}`);
        }
        finally {
            setIsLoading(false);
        }
    }, [query]);
    const onReset = () => {
        setQuery({});
        setData(null);
    };
    const onDownloadCsv = () => {
        if (!data) {
            showError('Tidak ada data untuk diunduh');
            return;
        }
        const rows = [
            {
                metric: 'Rata-rata Total Durasi (menit)',
                value: data.overall.avgTotalDurationMinutes ?? '',
            },
            { metric: 'Rata-rata Processing (menit)', value: data.overall.avgProcessingTimeMinutes ?? '' },
            { metric: 'Rata-rata Preparation (menit)', value: data.overall.avgPreparationTimeMinutes ?? '' },
            { metric: 'Rata-rata Delivery (menit)', value: data.overall.avgDeliveryTimeMinutes ?? '' },
        ];
        downloadCSV(rows, 'laporan-kinerja.csv');
        showSuccess('CSV berhasil diunduh');
    };
    return (_jsxs("div", { className: "space-y-4", children: [_jsx(SectionHeader, { title: "Laporan Kinerja", description: "Rata-rata durasi proses per tahap, breakdown per departemen dan shift.", right: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { variant: "secondary", onClick: onApply, children: "Terapkan" }), _jsx(Button, { variant: "ghost", onClick: onReset, children: "Reset" }), _jsx(Button, { variant: "outline", onClick: onDownloadCsv, children: "Unduh CSV" })] }) }), _jsx(Card, { children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsx(DatePicker, { label: "Tanggal Mulai", value: query.tanggalMulai ?? '', onChange: (e) => setQuery((q) => ({ ...q, tanggalMulai: e.target.value || undefined })) }), _jsx(DatePicker, { label: "Tanggal Akhir", value: query.tanggalAkhir ?? '', onChange: (e) => setQuery((q) => ({ ...q, tanggalAkhir: e.target.value || undefined })) }), _jsx(Select, { label: "Departemen (opsional)", options: deptOptions, value: query.departmentId ?? '', onChange: (e) => setQuery((q) => ({
                                ...q,
                                departmentId: e.target.value ? Number(e.target.value) : undefined,
                            })) }), _jsx(Select, { label: "Shift (opsional)", options: shiftOptions, value: query.shiftId ?? '', onChange: (e) => setQuery((q) => ({
                                ...q,
                                shiftId: e.target.value ? Number(e.target.value) : undefined,
                            })) })] }) }), _jsxs("div", { className: "grid grid-cols-1 xl:grid-cols-3 gap-4", children: [_jsx(Card, { children: isLoading ? (_jsx("div", { className: "min-h-[160px] grid place-items-center", children: _jsx(Spinner, { variant: "primary", size: "lg", label: "Memuat KPI..." }) })) : !data ? (_jsx(EmptyState, { title: "Belum ada data", description: "Sesuaikan filter lalu Terapkan." })) : (_jsxs("div", { className: "grid grid-cols-1 gap-4", children: [_jsx(KpiItem, { label: "Rata-rata Total Durasi", value: formatDuration(data.overall.avgTotalDurationMinutes) }), _jsx(KpiItem, { label: "Rata-rata Processing", value: formatDuration(data.overall.avgProcessingTimeMinutes) }), _jsx(KpiItem, { label: "Rata-rata Preparation", value: formatDuration(data.overall.avgPreparationTimeMinutes) }), _jsx(KpiItem, { label: "Rata-rata Delivery", value: formatDuration(data.overall.avgDeliveryTimeMinutes) })] })) }), _jsx(Card, { className: "xl:col-span-2", children: isLoading ? (_jsx("div", { className: "min-h-[240px] grid place-items-center", children: _jsx(Spinner, { variant: "primary", size: "lg", label: "Memuat grafik..." }) })) : !data ? (_jsx(EmptyState, { title: "Belum ada data", description: "Sesuaikan filter lalu Terapkan." })) : (_jsx("div", { className: "h-[320px]", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: data.byDepartment, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "departmentName" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Bar, { dataKey: "avgTotalDurationMinutes", name: "Total", fill: COLORS.blue }), _jsx(Bar, { dataKey: "avgProcessingTimeMinutes", name: "Processing", fill: COLORS.emerald }), _jsx(Bar, { dataKey: "avgPreparationTimeMinutes", name: "Preparation", fill: COLORS.amber }), _jsx(Bar, { dataKey: "avgDeliveryTimeMinutes", name: "Delivery", fill: COLORS.slate })] }) }) })) }), _jsx(Card, { className: "xl:col-span-3", children: isLoading ? (_jsx("div", { className: "min-h-[240px] grid place-items-center", children: _jsx(Spinner, { variant: "primary", size: "lg", label: "Memuat grafik shift..." }) })) : !data ? (_jsx(EmptyState, { title: "Belum ada data", description: "Sesuaikan filter lalu Terapkan." })) : (_jsx("div", { className: "h-[320px]", children: _jsx(ResponsiveContainer, { width: "100%", height: "100%", children: _jsxs(BarChart, { data: data.byShift, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "shiftName" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Legend, {}), _jsx(Bar, { dataKey: "avgTotalDurationMinutes", name: "Total", fill: COLORS.blue }), _jsx(Bar, { dataKey: "avgProcessingTimeMinutes", name: "Processing", fill: COLORS.emerald }), _jsx(Bar, { dataKey: "avgPreparationTimeMinutes", name: "Preparation", fill: COLORS.amber }), _jsx(Bar, { dataKey: "avgDeliveryTimeMinutes", name: "Delivery", fill: COLORS.slate })] }) }) })) })] })] }));
}
function KpiItem({ label, value }) {
    return (_jsxs("div", { className: "rounded-lg border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900", children: [_jsx("p", { className: "text-sm text-slate-600 dark:text-slate-300", children: label }), _jsx("p", { className: "mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100", children: value })] }));
}
/* ===========================
 * Tab: Penolakan/Edit
 * =========================== */
function RejectionsTab({ departments }) {
    const [query, setQuery] = useState({ page: 1, limit: 10 });
    const [pageData, setPageData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const deptOptions = useMemo(() => [{ label: '—', value: '' }, ...departments.map((d) => ({ label: d.namaDivisi, value: d.id }))], [departments]);
    const approvalOptions = useMemo(() => [{ label: '—', value: '' }, ...APPROVAL_OPTIONS], []);
    const onApply = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getRejectionReport(query);
            setPageData(data ?? null);
        }
        catch (e) {
            showError(`Gagal memuat laporan penolakan/edit: ${e.message ?? String(e)}`);
        }
        finally {
            setIsLoading(false);
        }
    }, [query]);
    const onReset = () => {
        setQuery({ page: 1, limit: 10 });
        setPageData(null);
    };
    const onDownloadCsv = () => {
        const rows = (pageData?.data ?? []).map((i) => ({
            kode: i.kodePesanan,
            tanggal: formatDateTime(i.waktuDibuat),
            departemen: i.departmentName,
            tipe: i.requestType,
            jumlah_awal: i.jumlahPesananAwal ?? '',
            jumlah_baru: i.jumlahPesanan,
            catatan_dapur: i.catatanDapur ?? '',
            approval_status: i.approvalStatus ?? '',
            catatan_admin: i.catatanAdmin ?? '',
        }));
        if (rows.length === 0) {
            showError('Tidak ada data untuk diunduh');
            return;
        }
        downloadCSV(rows, `laporan-penolakan-edit-p${query.page ?? 1}.csv`);
        showSuccess('CSV berhasil diunduh');
    };
    const columns = useMemo(() => [
        {
            id: 'kode',
            header: 'Kode',
            accessor: (row) => _jsx("span", { className: "font-mono text-sm", children: row.kodePesanan }),
            align: 'left',
        },
        {
            id: 'tanggal',
            header: 'Tanggal',
            accessor: (row) => _jsx("span", { className: "text-sm", children: formatDateTime(row.waktuDibuat) }),
            align: 'left',
        },
        {
            id: 'dept',
            header: 'Departemen',
            accessor: (row) => row.departmentName,
            align: 'left',
        },
        {
            id: 'tipe',
            header: 'Tipe',
            accessor: (row) => row.requestType,
            align: 'center',
        },
        {
            id: 'jumlah',
            header: 'Jumlah',
            accessor: (row) => {
                const awal = row.jumlahPesananAwal;
                const baru = row.jumlahPesanan;
                if (awal != null && awal !== baru) {
                    return (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "font-mono", children: awal }), _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4 text-slate-500", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "aria-hidden": "true", children: _jsx("path", { strokeWidth: "2", d: "M9 5l7 7-7 7" }) }), _jsx("span", { className: "font-mono", children: baru })] }));
                }
                return _jsx("span", { className: "font-mono", children: baru });
            },
            align: 'center',
        },
        {
            id: 'catatanDapur',
            header: 'Catatan Dapur',
            accessor: (row) => _jsx("span", { className: "text-sm", children: row.catatanDapur ?? '—' }),
            align: 'left',
        },
        {
            id: 'approval',
            header: 'Approval',
            accessor: (row) => row.approvalStatus ?? '—',
            align: 'center',
        },
        {
            id: 'catatanAdmin',
            header: 'Catatan Admin',
            accessor: (row) => _jsx("span", { className: "text-sm", children: row.catatanAdmin ?? '—' }),
            align: 'left',
        },
    ], []);
    return (_jsxs("div", { className: "space-y-4", children: [_jsx(SectionHeader, { title: "Laporan Penolakan/Edit", description: "Daftar permintaan yang melalui approval admin (paginated).", right: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { variant: "secondary", onClick: onApply, children: "Terapkan" }), _jsx(Button, { variant: "ghost", onClick: onReset, children: "Reset" }), _jsx(Button, { variant: "outline", onClick: onDownloadCsv, children: "Unduh CSV" })] }) }), _jsx(Card, { children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-5 gap-4", children: [_jsx(DatePicker, { label: "Tanggal Mulai", value: query.tanggalMulai ?? '', onChange: (e) => setQuery((q) => ({ ...q, tanggalMulai: e.target.value || undefined })) }), _jsx(DatePicker, { label: "Tanggal Akhir", value: query.tanggalAkhir ?? '', onChange: (e) => setQuery((q) => ({ ...q, tanggalAkhir: e.target.value || undefined })) }), _jsx(Select, { label: "Departemen", options: deptOptions, value: query.departmentId ?? '', onChange: (e) => setQuery((q) => ({
                                ...q,
                                departmentId: e.target.value ? Number(e.target.value) : undefined,
                            })) }), _jsx(Select, { label: "Approval Status", options: approvalOptions, value: query.approvalStatus ?? '', onChange: (e) => setQuery((q) => ({
                                ...q,
                                approvalStatus: e.target.value || undefined,
                            })) }), _jsx(Input, { label: "Limit", type: "number", min: 1, max: 200, value: String(query.limit ?? 10), onChange: (e) => setQuery((q) => ({ ...q, limit: Math.max(1, Number(e.target.value || 10)) })) })] }) }), _jsx(Card, { children: isLoading ? (_jsx("div", { className: "min-h-[240px] grid place-items-center", children: _jsx(Spinner, { variant: "primary", size: "lg", label: "Memuat data..." }) })) : !pageData || pageData.data.length === 0 ? (_jsx(EmptyState, { title: "Tidak ada data", description: "Sesuaikan filter lalu klik Terapkan." })) : (_jsxs(_Fragment, { children: [_jsx(Table, { columns: columns, data: pageData.data, ariaLabel: "Tabel Rejections" }), _jsx("div", { className: "mt-4 flex justify-end", children: _jsx(Pagination, { currentPage: pageData.page, totalPages: pageData.totalPages, onPageChange: (p) => setQuery((q) => ({ ...q, page: p })) }) })] })) })] }));
}
