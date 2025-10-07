import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// frontend/src/pages/audit/AuditTrailPage.tsx
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
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { showError, showSuccess } from '@/components/ui/Toast';
import { getAuditTrail, getAuditTrailActionTypes, getAuditTrailByOrder, } from '@/services/api/reports.api';
import { downloadCSV } from '@/utils/download.utils';
import { formatDateTime } from '@/utils/date.utils';
const QUICK_ACTIONS = [
    'LOGIN_FAILURE',
    'ORDER_STATUS_CHANGED',
    'APPROVAL_DECISION',
    'USER_CREATED',
    'USER_STATUS_CHANGED',
];
// Regex untuk mendeteksi kode pesanan format PM-YYYYMMDD-XXX
const ORDER_CODE_REGEX = /PM-\d{8}-\d{3}/i;
function SectionHeader({ title, description, right, }) {
    return (_jsxs("header", { className: "flex flex-col md:flex-row md:items-center md:justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h2", { className: "text-lg md:text-xl font-semibold text-slate-900 dark:text-slate-100", children: title }), description ? (_jsx("p", { className: "mt-1 text-sm text-slate-600 dark:text-slate-300", children: description })) : null] }), right] }));
}
export default function AuditTrailPage() {
    // Query server-side
    const [query, setQuery] = useState({
        page: 1,
        limit: 10,
    });
    // Client-side search (aksi/detail/user)
    const [searchTerm, setSearchTerm] = useState('');
    const [nikTerm, setNikTerm] = useState('');
    // Data & loading
    const [pageData, setPageData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    // Actions list
    const [actionTypes, setActionTypes] = useState([]);
    // Modal Riwayat Pesanan
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyCode, setHistoryCode] = useState('');
    const [historyEntries, setHistoryEntries] = useState([]);
    // Load action types
    const loadActionTypes = useCallback(async () => {
        try {
            const types = await getAuditTrailActionTypes();
            setActionTypes(types ?? []);
        }
        catch (e) {
            // non-blocking
        }
    }, []);
    useEffect(() => {
        loadActionTypes();
    }, [loadActionTypes]);
    // Fetch audit trail
    const loadData = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await getAuditTrail(query);
            setPageData(data ?? null);
        }
        catch (e) {
            showError(`Gagal memuat audit trail: ${e.message ?? String(e)}`);
        }
        finally {
            setIsLoading(false);
        }
    }, [query]);
    // Apply
    const onApply = useCallback(() => {
        // Reset ke page 1 saat apply filter
        setQuery((q) => ({ ...q, page: 1 }));
    }, []);
    // Trigger fetch saat query berubah
    useEffect(() => {
        loadData();
    }, [loadData]);
    // Reset
    const onReset = () => {
        setQuery({ page: 1, limit: 10 });
        setSearchTerm('');
        setNikTerm('');
        setPageData(null);
    };
    // Export CSV dari data yang sedang tampil (client-side)
    const onDownloadCsv = () => {
        const rows = (filteredRows ?? []).map((row) => ({
            timestamp: formatDateTime(row.timestamp),
            user_nama: row.user?.namaLengkap ?? '',
            user_nik: row.user?.nomorIndukKaryawan ?? '',
            user_role: row.user?.roleAccess ?? '',
            aksi: row.aksi,
            detail: row.detail ?? '',
        }));
        if (rows.length === 0) {
            showError('Tidak ada data untuk diunduh');
            return;
        }
        downloadCSV(rows, `audit-trail-p${pageData?.page ?? query.page ?? 1}.csv`);
        showSuccess('CSV berhasil diunduh');
    };
    // Action select options
    const actionOptions = useMemo(() => [{ label: '—', value: '' }, ...actionTypes.map((a) => ({ label: a, value: a }))], [actionTypes]);
    // Columns untuk tabel
    const columns = useMemo(() => [
        {
            id: 'ts',
            header: 'Timestamp',
            accessor: (row) => (_jsx("span", { className: "text-sm", children: formatDateTime(row.timestamp) })),
            align: 'left',
        },
        {
            id: 'user',
            header: 'User',
            accessor: (row) => {
                const name = row.user?.namaLengkap ?? '—';
                const nik = row.user?.nomorIndukKaryawan ?? '—';
                const role = row.user?.roleAccess ?? '';
                return (_jsxs("div", { className: "flex items-center gap-2", children: [_jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "text-sm font-medium truncate", children: name }), _jsx("div", { className: "text-xs text-slate-600 dark:text-slate-400", children: nik })] }), role ? _jsx(Badge, { size: "sm", variant: "info", children: role }) : null] }));
            },
            align: 'left',
        },
        {
            id: 'aksi',
            header: 'Aksi',
            accessor: (row) => (_jsx("div", { className: "flex items-center gap-2", children: _jsx(Badge, { size: "sm", variant: "neutral", children: row.aksi }) })),
            align: 'left',
        },
        {
            id: 'detail',
            header: 'Detail',
            accessor: (row) => (_jsx("div", { className: "text-sm max-w-[420px] truncate", title: row.detail ?? '', children: row.detail ?? '—' })),
            align: 'left',
        },
        {
            id: 'riwayat',
            header: 'Riwayat',
            accessor: (row) => {
                const detectedCode = extractOrderCode(row.detail ?? '');
                const disabled = !detectedCode;
                return (_jsx("div", { className: "flex justify-center", children: _jsx(Button, { size: "sm", variant: "outline", disabled: disabled, "aria-disabled": disabled, onClick: () => {
                            if (!disabled && detectedCode) {
                                openHistoryFor(detectedCode);
                            }
                        }, title: disabled
                            ? 'Kode pesanan tidak terdeteksi di detail'
                            : `Lihat riwayat ${detectedCode}`, children: "Riwayat" }) }));
            },
            align: 'center',
        },
    ], []);
    // Client-side filter dari searchTerm & nikTerm
    const filteredRows = useMemo(() => {
        const base = pageData?.data ?? [];
        if (!searchTerm && !nikTerm)
            return base;
        const s = (searchTerm ?? '').toLowerCase();
        const nk = (nikTerm ?? '').toLowerCase();
        return base.filter((row) => {
            const inSearch = !s ||
                row.aksi.toLowerCase().includes(s) ||
                (row.detail ?? '').toLowerCase().includes(s);
            const inNik = !nk ||
                (row.user?.nomorIndukKaryawan ?? '').toLowerCase().includes(nk);
            return inSearch && inNik;
        });
    }, [pageData, searchTerm, nikTerm]);
    // Quick action chips
    const isQuickSelected = (a) => query.action === a;
    const onQuickAction = (a) => setQuery((q) => ({ ...q, action: q.action === a ? undefined : a, page: 1 }));
    // Open modal history (manual or from row)
    const openHistoryFor = async (code) => {
        setHistoryCode(code);
        setHistoryOpen(true);
        setHistoryLoading(true);
        try {
            const entries = await getAuditTrailByOrder(code);
            setHistoryEntries(entries ?? []);
        }
        catch (e) {
            showError(`Gagal memuat riwayat pesanan: ${e.message ?? String(e)}`);
            setHistoryEntries([]);
        }
        finally {
            setHistoryLoading(false);
        }
    };
    // Manual open via input
    const [manualCode, setManualCode] = useState('');
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("header", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", children: _jsxs("div", { children: [_jsx("h1", { className: "text-xl font-semibold text-slate-900 dark:text-slate-100", children: "Audit Trail" }), _jsx("p", { className: "mt-1 text-sm text-slate-600 dark:text-slate-300", children: "Riwayat aksi pengguna dan sistem untuk keperluan audit dan analisis." })] }) }), _jsxs(Card, { children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-6 gap-4", children: [_jsx(Input, { label: "Cari (aksi/detail)", placeholder: "Ketik untuk mencari\u2026", value: searchTerm, onChange: (e) => setSearchTerm(e.target.value) }), _jsx(Select, { label: "Aksi", options: actionOptions, value: query.action ?? '', onChange: (e) => setQuery((q) => ({
                                    ...q,
                                    action: e.target.value || undefined,
                                })) }), _jsx(Input, { label: "User ID (opsional)", type: "number", inputMode: "numeric", value: String(query.userId ?? ''), onChange: (e) => setQuery((q) => ({
                                    ...q,
                                    userId: e.target.value ? Number(e.target.value) : undefined,
                                })) }), _jsx(Input, { label: "NIK (client filter)", placeholder: "Filter lokal berdasarkan NIK", value: nikTerm, onChange: (e) => setNikTerm(e.target.value) }), _jsx(DatePicker, { label: "Tanggal Mulai", value: query.tanggalMulai ?? '', onChange: (e) => setQuery((q) => ({
                                    ...q,
                                    tanggalMulai: e.target.value || undefined,
                                })) }), _jsx(DatePicker, { label: "Tanggal Akhir", value: query.tanggalAkhir ?? '', onChange: (e) => setQuery((q) => ({
                                    ...q,
                                    tanggalAkhir: e.target.value || undefined,
                                })) })] }), _jsxs("div", { className: "mt-4 flex flex-wrap items-center gap-2", children: [_jsx(Button, { variant: "secondary", onClick: onApply, children: "Terapkan" }), _jsx(Button, { variant: "ghost", onClick: onReset, children: "Reset" }), _jsx(Button, { variant: "outline", onClick: onDownloadCsv, children: "Unduh CSV" }), _jsx("div", { className: "hidden md:block h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1" }), _jsx("div", { className: "flex flex-wrap gap-2", children: QUICK_ACTIONS.map((a) => (_jsx("button", { type: "button", className: [
                                        'px-2.5 py-1 rounded-full text-xs font-medium border',
                                        isQuickSelected(a)
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600',
                                    ].join(' '), onClick: () => onQuickAction(a), "aria-pressed": isQuickSelected(a), children: a }, a))) })] })] }), _jsxs(Card, { children: [_jsxs("div", { className: "flex flex-col md:flex-row md:items-center md:justify-between gap-3", children: [_jsx(SectionHeader, { title: "Data Audit Trail", description: "Gunakan pencarian dan filter untuk mempersempit hasil." }), _jsxs("div", { className: "flex items-end gap-2", children: [_jsx(Input, { label: "Kode Pesanan", placeholder: "PM-YYYYMMDD-XXX", value: manualCode, onChange: (e) => setManualCode(e.target.value) }), _jsx(Button, { variant: "outline", onClick: () => {
                                            const code = (manualCode ?? '').trim();
                                            if (!ORDER_CODE_REGEX.test(code)) {
                                                showError('Format kode pesanan tidak valid. Contoh: PM-20251001-001');
                                                return;
                                            }
                                            openHistoryFor(code);
                                        }, children: "Riwayat Pesanan" })] })] }), isLoading ? (_jsx("div", { className: "min-h-[260px] grid place-items-center", children: _jsx(Spinner, { variant: "primary", size: "lg", label: "Memuat data..." }) })) : !pageData || (filteredRows?.length ?? 0) === 0 ? (_jsx(EmptyState, { title: "Tidak ada data", description: "Sesuaikan filter lalu klik Terapkan." })) : (_jsxs(_Fragment, { children: [_jsx(Table, { columns: columns, data: filteredRows, ariaLabel: "Tabel Audit Trail", emptyLabel: "Tidak ada entri" }), _jsxs("div", { className: "mt-4 flex flex-col sm:flex-row items-center justify-between gap-3", children: [_jsxs("div", { className: "flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300", children: [_jsxs("span", { children: ["Menampilkan ", filteredRows.length, " dari ", pageData.total, " entri"] }), _jsx("span", { className: "hidden sm:inline", children: "\u2022" }), _jsxs("label", { className: "flex items-center gap-2", children: [_jsx("span", { children: "Per halaman" }), _jsx(Input, { type: "number", min: 1, max: 200, value: String(query.limit ?? 10), onChange: (e) => setQuery((q) => ({
                                                            ...q,
                                                            limit: Math.max(1, Number(e.target.value || 10)),
                                                            page: 1,
                                                        })) })] })] }), _jsx(Pagination, { currentPage: pageData.page, totalPages: pageData.totalPages, onPageChange: (p) => setQuery((q) => ({ ...q, page: p })) })] })] }))] }), _jsx(Modal, { title: `Riwayat Pesanan ${historyCode || ''}`, open: historyOpen, onClose: () => {
                    setHistoryOpen(false);
                    setHistoryEntries([]);
                    setHistoryCode('');
                }, children: historyLoading ? (_jsx("div", { className: "min-h-[200px] grid place-items-center", children: _jsx(Spinner, { variant: "primary", size: "lg", label: "Memuat riwayat..." }) })) : historyEntries.length === 0 ? (_jsx(EmptyState, { title: "Tidak ada riwayat", description: "Tidak ditemukan entri audit untuk kode pesanan ini." })) : (_jsx("div", { className: "space-y-3", children: historyEntries.map((e) => (_jsxs("div", { className: "rounded-md border border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-900", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsx("div", { className: "text-sm font-medium", children: formatDateTime(e.timestamp) }), _jsx(Badge, { size: "sm", variant: "neutral", children: e.aksi })] }), _jsx("div", { className: "mt-1 text-sm text-slate-700 dark:text-slate-300", children: e.detail ?? '—' }), _jsxs("div", { className: "mt-2 text-xs text-slate-600 dark:text-slate-400", children: [e.user?.namaLengkap ?? '—', " (", e.user?.nomorIndukKaryawan ?? '—', ")", ' ', e.user?.roleAccess ? `• ${e.user?.roleAccess}` : ''] })] }, e.id))) })) })] }));
}
function extractOrderCode(detail) {
    const m = (detail ?? '').match(ORDER_CODE_REGEX);
    return m?.[0] ?? null;
}
