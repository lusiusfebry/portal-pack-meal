import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ApprovalStatus } from '@/types/order.types';
import { Table } from '@/components/ui/Table';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import Spinner from '@/components/ui/Spinner';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import { formatDateTime } from '@/utils/date.utils';
import { getStatusLabel, getStatusBadgeVariant } from '@/utils/status.utils';
import { showError, showInfo, showSuccess } from '@/components/ui/Toast';
import { getPendingApprovals, approveRejectOrder } from '@/services/api/orders.api';
import { useWebSocket } from '@/hooks/useWebSocket';
/**
 * ApprovalCenterPage
 * - Menampilkan daftar pesanan yang membutuhkan persetujuan admin (requiresApproval=true)
 * - Admin dapat melakukan keputusan (APPROVED/REJECTED) dengan catatan opsional
 * - Dapur melihat daftar permintaannya (menggunakan komponen yang sama; filter dapat dilakukan oleh backend)
 * - Real-time: subscribe 'order.approval.requested' untuk refetch dan menampilkan toast
 */
export default function ApprovalCenterPage() {
    const [pendingApprovals, setPendingApprovals] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    // Modal local state
    const [catatanAdmin, setCatatanAdmin] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const loadApprovals = useCallback(async () => {
        setIsLoading(true);
        try {
            const list = await getPendingApprovals();
            // Catatan: Jika perlu filter sisi-klien untuk 'dapur', lakukan di sini.
            // Tidak ada field 'requestedBy' pada Order, sehingga filter spesifik requester tidak tersedia.
            // Asumsikan backend sudah filter sesuai akses peran.
            setPendingApprovals(list);
        }
        catch (e) {
            showError(`Gagal memuat pending approvals: ${e.message ?? String(e)}`);
        }
        finally {
            setIsLoading(false);
        }
    }, []);
    useEffect(() => {
        loadApprovals();
    }, [loadApprovals]);
    // Subscribe event 'order.approval.requested' untuk refetch dan menampilkan toast
    useWebSocket('order.approval.requested', (payload) => {
        showInfo(`Permintaan ${payload.requestType === 'REJECT' ? 'Penolakan' : 'Edit'} untuk ${payload.kodePesanan}`, { icon: '⚠️' });
        // Refetch untuk sinkronisasi daftar
        loadApprovals();
    }, [loadApprovals]);
    // Opsional: refetch setelah ada keputusan admin (untuk jaga konsistensi UI)
    useWebSocket('order.approval.decided', (payload) => {
        if (payload.decision === 'APPROVED') {
            showSuccess(`Approval disetujui: ${payload.kodePesanan}`);
        }
        else if (payload.decision === 'REJECTED') {
            showError(`Approval ditolak: ${payload.kodePesanan}`);
        }
        else {
            showInfo(`Approval pending: ${payload.kodePesanan}`);
        }
        loadApprovals();
    }, [loadApprovals]);
    function getRequestType(order) {
        // Heuristik:
        // - Jika jumlahPesananAwal ada (non-null), diasumsikan permintaan EDIT
        // - Jika hanya ada catatanDapur dan requiresApproval, diasumsikan REJECT
        return order.jumlahPesananAwal !== null && order.jumlahPesananAwal !== undefined ? 'EDIT' : 'REJECT';
    }
    const columns = useMemo(() => [
        {
            id: 'kode',
            header: 'Kode',
            accessor: (row) => (_jsx("span", { className: "font-mono text-sm", children: row.kodePesanan })),
            align: 'left',
        },
        {
            id: 'tanggal',
            header: 'Tanggal',
            accessor: (row) => (_jsx("span", { className: "text-sm", children: formatDateTime(row.waktuDibuat) })),
            align: 'left',
        },
        {
            id: 'jumlah',
            header: 'Jumlah',
            accessor: (row) => {
                const awal = row.jumlahPesananAwal;
                const baru = row.jumlahPesanan;
                if (awal !== null && awal !== undefined && awal !== baru) {
                    return (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "font-mono", children: awal }), _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4 text-slate-500", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "aria-hidden": "true", children: _jsx("path", { strokeWidth: "2", d: "M9 5l7 7-7 7" }) }), _jsx("span", { className: "font-mono", children: baru })] }));
                }
                return _jsx("span", { className: "font-mono", children: baru });
            },
            align: 'center',
        },
        {
            id: 'status',
            header: 'Status',
            accessor: (row) => (_jsx(Badge, { variant: getStatusBadgeVariant(row.statusPesanan), size: "sm", children: getStatusLabel(row.statusPesanan) })),
            align: 'center',
        },
        {
            id: 'tipe',
            header: 'Tipe Permintaan',
            accessor: (row) => {
                const type = getRequestType(row);
                const variant = type === 'REJECT' ? 'error' : 'warning';
                return _jsx(Badge, { variant: variant, size: "sm", children: type });
            },
            align: 'center',
        },
        {
            id: 'catatan',
            header: 'Catatan Dapur',
            accessor: (row) => (_jsx("span", { className: "line-clamp-2 text-sm text-slate-600 dark:text-slate-300", children: row.catatanDapur ?? '—' })),
            align: 'left',
        },
        {
            id: 'aksi',
            header: 'Aksi',
            accessor: (row) => (_jsx(Button, { variant: "outline", size: "sm", onClick: () => {
                    setSelectedOrder(row);
                    setCatatanAdmin('');
                    setShowApprovalModal(true);
                }, children: "Tinjau" })),
            align: 'center',
        },
    ], []);
    async function handleDecision(decision) {
        if (!selectedOrder)
            return;
        setIsSubmitting(true);
        try {
            const catatan = catatanAdmin.trim();
            await approveRejectOrder(selectedOrder.id, decision, catatan.length ? catatan : undefined);
            showSuccess('Keputusan berhasil diterapkan');
            setShowApprovalModal(false);
            setSelectedOrder(null);
            setCatatanAdmin('');
            await loadApprovals();
        }
        catch (e) {
            showError(`Gagal menyimpan keputusan: ${e.message ?? String(e)}`);
        }
        finally {
            setIsSubmitting(false);
        }
    }
    return (_jsxs("div", { className: "space-y-6", children: [_jsx("header", { className: "flex items-center justify-between", children: _jsxs("div", { children: [_jsx("h1", { className: "text-xl font-semibold text-slate-900 dark:text-slate-100", children: "Pusat Persetujuan" }), _jsx("p", { className: "mt-1 text-sm text-slate-600 dark:text-slate-300", children: "Kelola permintaan penolakan/edit dari dapur. Real-time updates aktif." })] }) }), isLoading ? (_jsx("div", { className: "min-h-[30vh] grid place-items-center", children: _jsx(Spinner, { variant: "primary", size: "lg", label: "Memuat pending approvals..." }) })) : pendingApprovals.length === 0 ? (_jsx(EmptyState, { title: "Tidak ada permintaan persetujuan", description: "Belum ada permintaan penolakan atau edit dari dapur.", action: {
                    label: 'Muat ulang',
                    variant: 'outline',
                    onClick: () => loadApprovals(),
                } })) : (_jsx(Table, { columns: columns, data: pendingApprovals, ariaLabel: "Tabel Pending Approvals", emptyLabel: "Tidak ada data" })), _jsx(Modal, { open: showApprovalModal, onClose: () => {
                    if (!isSubmitting) {
                        setShowApprovalModal(false);
                        setSelectedOrder(null);
                        setCatatanAdmin('');
                    }
                }, title: "Tinjau Permintaan", description: selectedOrder ? (_jsxs("span", { children: ["Pesanan", _jsx("span", { className: "font-mono ml-1", children: selectedOrder.kodePesanan }), " \u2014", ' ', getRequestType(selectedOrder) === 'REJECT' ? 'Penolakan' : 'Edit', " (", getStatusLabel(selectedOrder.statusPesanan), ")"] })) : undefined, size: "lg", children: selectedOrder ? (_jsxs("div", { className: "space-y-4", children: [_jsxs("div", { className: "grid grid-cols-1 sm:grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400", children: "Kode Pesanan" }), _jsx("p", { className: "font-mono text-sm", children: selectedOrder.kodePesanan })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400", children: "Status" }), _jsx("p", { className: "text-sm", children: _jsx(Badge, { variant: getStatusBadgeVariant(selectedOrder.statusPesanan), size: "sm", children: getStatusLabel(selectedOrder.statusPesanan) }) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400", children: "Jumlah" }), _jsx("p", { className: "text-sm", children: selectedOrder.jumlahPesananAwal !== null && selectedOrder.jumlahPesananAwal !== undefined ? (_jsxs("span", { className: "inline-flex items-center gap-2", children: [_jsx("span", { className: "font-mono", children: selectedOrder.jumlahPesananAwal }), _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4 text-slate-500", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "aria-hidden": "true", children: _jsx("path", { strokeWidth: "2", d: "M9 5l7 7-7 7" }) }), _jsx("span", { className: "font-mono", children: selectedOrder.jumlahPesanan })] })) : (_jsx("span", { className: "font-mono", children: selectedOrder.jumlahPesanan })) })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400", children: "Catatan Dapur" }), _jsx("p", { className: "text-sm", children: selectedOrder.catatanDapur ?? '—' })] }), _jsxs("div", { children: [_jsx("p", { className: "text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400", children: "Dibuat" }), _jsx("p", { className: "text-sm", children: formatDateTime(selectedOrder.waktuDibuat) })] })] }), _jsxs("div", { className: "grid grid-cols-1 gap-2", children: [_jsx("label", { className: "text-sm font-medium text-slate-700 dark:text-slate-300", children: "Catatan Admin (opsional)" }), _jsx("textarea", { rows: 3, className: "block w-full px-4 py-2.5 text-sm border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:border-primary-500 focus:ring-primary-400", placeholder: "Tambahkan catatan keputusan jika diperlukan", value: catatanAdmin, onChange: (e) => setCatatanAdmin(e.target.value), disabled: isSubmitting })] }), _jsxs("div", { className: "flex items-center justify-end gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => handleDecision(ApprovalStatus.REJECTED), isLoading: isSubmitting, disabled: isSubmitting, children: "Tolak" }), _jsx(Button, { variant: "primary", onClick: () => handleDecision(ApprovalStatus.APPROVED), isLoading: isSubmitting, disabled: isSubmitting, children: "Setujui" })] })] })) : (_jsx("div", { className: "py-6 text-center", children: _jsx("p", { className: "text-sm text-slate-600 dark:text-slate-300", children: "Tidak ada pesanan terpilih." }) })) })] }));
}
