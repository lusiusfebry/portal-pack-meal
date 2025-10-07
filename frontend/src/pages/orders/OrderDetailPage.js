import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// frontend/src/pages/orders/OrderDetailPage.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Badge from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { getOrderById, updateOrderStatus, requestRejection, requestEdit, approveRejectOrder, } from '@/services/api/orders.api';
import { StatusPesanan, } from '@/types/order.types';
import { getStatusLabel, getStatusBadgeVariant, getAllowedTransitionsByRole, } from '@/utils/status.utils';
import { formatDate } from '@/utils/date.utils';
import { useAuthStore } from '@/stores/auth.store';
import useWebSocket from '@/hooks/useWebSocket';
import { showError, showInfo, showSuccess } from '@/components/ui/Toast';
export default function OrderDetailPage() {
    const { id: idParam } = useParams();
    const id = Number(idParam);
    const { user } = useAuthStore();
    const role = user?.role;
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    // WebSocket subscriptions
    const wsStatusChanged = useWebSocket('order.status.changed', useCallback((payload) => {
        if (payload?.orderId === id) {
            showInfo(`Status ${payload.kodePesanan ?? '#' + payload.orderId} berubah menjadi ${getStatusLabel(payload.newStatus)}`);
            void refetch();
        }
    }, [id]), [id]);
    useWebSocket('order.approval.requested', useCallback((payload) => {
        if (payload?.orderId === id) {
            showInfo(`Permintaan approval untuk pesanan ${payload.kodePesanan} dikirim ke admin`);
            void refetch();
        }
    }, [id]), [id]);
    useWebSocket('order.approval.decided', useCallback((payload) => {
        if (payload?.orderId === id) {
            showInfo(`Keputusan admin untuk ${payload.kodePesanan}: ${payload.decision}`);
            void refetch();
        }
    }, [id]), [id]);
    // Modals state
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showApprovalModal, setShowApprovalModal] = useState(false);
    // Form states
    const [rejectForm, setRejectForm] = useState({ catatanDapur: '' });
    const [editForm, setEditForm] = useState({ jumlahPesananBaru: '', catatanDapur: '' });
    const [approvalForm, setApprovalForm] = useState({
        decision: '',
        catatanAdmin: '',
    });
    // Submitting flags
    const [submittingAction, setSubmittingAction] = useState(false);
    const refetch = useCallback(async () => {
        if (!Number.isFinite(id)) {
            setLoadError('ID pesanan tidak valid');
            setLoading(false);
            return;
        }
        setLoading(true);
        setLoadError(null);
        try {
            const detail = await getOrderById(id);
            setOrder(detail);
        }
        catch (error) {
            const message = error?.message ?? 'Gagal memuat detail pesanan';
            setLoadError(message);
            showError(message);
        }
        finally {
            setLoading(false);
        }
    }, [id]);
    useEffect(() => {
        void refetch();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id]);
    // Derived: allowed transitions
    const allowedTransitions = useMemo(() => {
        if (!order || !role)
            return [];
        return getAllowedTransitionsByRole(role, order.statusPesanan);
    }, [order, role]);
    const transitionOptions = useMemo(() => allowedTransitions.map((st) => ({
        label: getStatusLabel(st),
        value: st,
    })), [allowedTransitions]);
    // Action handlers
    const onUpdateStatus = useCallback(async (next) => {
        if (!order)
            return;
        setSubmittingAction(true);
        try {
            const updated = await updateOrderStatus(order.id, next);
            setOrder(updated);
            showSuccess(`Status berhasil diubah menjadi ${getStatusLabel(next)}`);
        }
        catch (error) {
            showError(error?.message ?? 'Gagal mengubah status');
        }
        finally {
            setSubmittingAction(false);
        }
    }, [order]);
    const onSubmitReject = useCallback(async () => {
        if (!order)
            return;
        if (!rejectForm.catatanDapur.trim()) {
            showError('Catatan dapur wajib diisi untuk penolakan');
            return;
        }
        setSubmittingAction(true);
        try {
            const updated = await requestRejection(order.id, rejectForm.catatanDapur.trim());
            setOrder(updated);
            showSuccess(`Permintaan penolakan dikirim untuk ${updated.kodePesanan}`);
            setShowRejectModal(false);
            setRejectForm({ catatanDapur: '' });
        }
        catch (error) {
            showError(error?.message ?? 'Gagal mengirim permintaan penolakan');
        }
        finally {
            setSubmittingAction(false);
        }
    }, [order, rejectForm]);
    const onSubmitEdit = useCallback(async () => {
        if (!order)
            return;
        const jumlahBaru = Number(editForm.jumlahPesananBaru);
        if (!Number.isFinite(jumlahBaru) || jumlahBaru < 1) {
            showError('Jumlah pesanan baru harus >= 1');
            return;
        }
        setSubmittingAction(true);
        try {
            const updated = await requestEdit(order.id, jumlahBaru, editForm.catatanDapur.trim() ? editForm.catatanDapur.trim() : undefined);
            setOrder(updated);
            showSuccess(`Permintaan edit (jumlah: ${jumlahBaru}) dikirim untuk ${updated.kodePesanan}`);
            setShowEditModal(false);
            setEditForm({ jumlahPesananBaru: '', catatanDapur: '' });
        }
        catch (error) {
            showError(error?.message ?? 'Gagal mengirim permintaan edit');
        }
        finally {
            setSubmittingAction(false);
        }
    }, [order, editForm]);
    const onSubmitApproval = useCallback(async () => {
        if (!order)
            return;
        if (!approvalForm.decision) {
            showError('Keputusan wajib dipilih (APPROVED atau REJECTED)');
            return;
        }
        setSubmittingAction(true);
        try {
            const updated = await approveRejectOrder(order.id, approvalForm.decision, approvalForm.catatanAdmin.trim() ? approvalForm.catatanAdmin.trim() : undefined);
            setOrder(updated);
            showSuccess(`Keputusan admin dikirim untuk ${updated.kodePesanan}`);
            setShowApprovalModal(false);
            setApprovalForm({ decision: '', catatanAdmin: '' });
        }
        catch (error) {
            showError(error?.message ?? 'Gagal mengirim keputusan admin');
        }
        finally {
            setSubmittingAction(false);
        }
    }, [order, approvalForm]);
    // UI helpers
    const header = () => {
        return (_jsx("div", { className: "mb-4 flex flex-col gap-1", children: _jsxs("div", { className: "flex items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl md:text-3xl font-display font-bold text-slate-900 dark:text-white", children: "Detail Pesanan" }), _jsxs("p", { className: "text-sm text-slate-700 dark:text-slate-300", children: ["ID: ", order?.id ?? id, " \u2022 Kode: ", order?.kodePesanan ?? '-'] }), _jsxs("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: ["Realtime: status.changed [", wsStatusChanged, "] \u00B7 approval.requested \u00B7 approval.decided"] })] }), order ? (_jsx(Badge, { variant: getStatusBadgeVariant(order.statusPesanan), children: getStatusLabel(order.statusPesanan) })) : null] }) }));
    };
    const infoCards = () => {
        if (!order)
            return null;
        return (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-4 mb-4", children: [_jsxs("div", { className: "rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm", children: [_jsx("h3", { className: "text-sm font-semibold text-slate-900 dark:text-slate-100", children: "Informasi Utama" }), _jsxs("div", { className: "mt-2 text-sm text-slate-700 dark:text-slate-300 space-y-1", children: [_jsxs("div", { children: ["Kode Pesanan: ", order.kodePesanan] }), _jsxs("div", { children: ["Departemen: #", order.departmentPemesanId] }), _jsxs("div", { children: ["Shift: #", order.shiftId] }), _jsxs("div", { children: ["Jumlah: ", order.jumlahPesanan] }), order.jumlahPesananAwal ? _jsxs("div", { children: ["Jumlah Awal: ", order.jumlahPesananAwal] }) : null, _jsxs("div", { children: ["Tanggal Pesanan: ", formatDate(order.tanggalPesanan, 'yyyy-MM-dd')] })] })] }), _jsxs("div", { className: "rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm", children: [_jsx("h3", { className: "text-sm font-semibold text-slate-900 dark:text-slate-100", children: "Approval" }), _jsxs("div", { className: "mt-2 text-sm text-slate-700 dark:text-slate-300 space-y-1", children: [_jsxs("div", { children: ["Requires Approval: ", order.requiresApproval ? 'Ya' : 'Tidak'] }), _jsxs("div", { children: ["Status Approval: ", order.approvalStatus ?? '-'] }), order.catatanDapur ? _jsxs("div", { children: ["Catatan Dapur: ", order.catatanDapur] }) : null, order.catatanAdmin ? _jsxs("div", { children: ["Catatan Admin: ", order.catatanAdmin] }) : null, order.approvedById ? _jsxs("div", { children: ["Approved By: #", order.approvedById] }) : null] })] }), _jsxs("div", { className: "rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm", children: [_jsx("h3", { className: "text-sm font-semibold text-slate-900 dark:text-slate-100", children: "Timestamps" }), _jsxs("div", { className: "mt-2 text-sm text-slate-700 dark:text-slate-300 space-y-1", children: [_jsxs("div", { children: ["Dibuat: ", formatDate(order.waktuDibuat, 'yyyy-MM-dd HH:mm')] }), _jsxs("div", { children: ["Diproses: ", order.waktuDiproses ? formatDate(order.waktuDiproses, 'yyyy-MM-dd HH:mm') : '-'] }), _jsxs("div", { children: ["Siap: ", order.waktuSiap ? formatDate(order.waktuSiap, 'yyyy-MM-dd HH:mm') : '-'] }), _jsxs("div", { children: ["Diantar: ", order.waktuDiantar ? formatDate(order.waktuDiantar, 'yyyy-MM-dd HH:mm') : '-'] }), _jsxs("div", { children: ["Selesai: ", order.waktuSelesai ? formatDate(order.waktuSelesai, 'yyyy-MM-dd HH:mm') : '-'] })] })] })] }));
    };
    const timeline = () => {
        if (!order)
            return null;
        const items = [
            {
                key: 'created',
                label: 'Dibuat',
                time: order.waktuDibuat,
                active: true,
            },
            {
                key: 'in_progress',
                label: 'Diproses',
                time: order.waktuDiproses,
                active: order.statusPesanan === StatusPesanan.IN_PROGRESS || !!order.waktuDiproses,
            },
            {
                key: 'ready',
                label: 'Siap',
                time: order.waktuSiap,
                active: order.statusPesanan === StatusPesanan.READY || !!order.waktuSiap,
            },
            {
                key: 'on_delivery',
                label: 'Diantar',
                time: order.waktuDiantar,
                active: order.statusPesanan === StatusPesanan.ON_DELIVERY || !!order.waktuDiantar,
            },
            {
                key: 'complete',
                label: 'Selesai',
                time: order.waktuSelesai,
                active: order.statusPesanan === StatusPesanan.COMPLETE || !!order.waktuSelesai,
            },
            {
                key: 'awaiting_approval',
                label: 'Menunggu Persetujuan',
                time: null,
                active: order.statusPesanan === StatusPesanan.MENUNGGU_PERSETUJUAN,
            },
            {
                key: 'rejected',
                label: 'Ditolak',
                time: null,
                active: order.statusPesanan === StatusPesanan.DITOLAK,
            },
        ];
        return (_jsxs("div", { className: "rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm mb-4", children: [_jsx("h3", { className: "text-sm font-semibold text-slate-900 dark:text-slate-100", children: "Timeline" }), _jsx("ol", { className: "mt-3 space-y-2", children: items.map((it) => (_jsxs("li", { className: "flex items-center gap-3", children: [_jsx("span", { className: [
                                    'inline-flex h-2.5 w-2.5 rounded-full',
                                    it.active ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-700',
                                ].join(' '), "aria-hidden": "true" }), _jsx("span", { className: "text-sm text-slate-800 dark:text-slate-200", children: it.label }), _jsx("span", { className: "text-xs text-slate-500 dark:text-slate-400", children: it.time ? formatDate(it.time, 'yyyy-MM-dd HH:mm') : '' })] }, it.key))) })] }));
    };
    const actions = () => {
        if (!order || !role)
            return null;
        const isKitchen = role === 'dapur';
        const isDelivery = role === 'delivery';
        const isAdmin = role === 'administrator';
        return (_jsxs("div", { className: "rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm mb-4", children: [_jsx("h3", { className: "text-sm font-semibold text-slate-900 dark:text-slate-100", children: "Aksi" }), isKitchen ? (_jsxs("div", { className: "mt-3 grid grid-cols-1 md:grid-cols-2 gap-3", children: [_jsx("div", { className: "flex items-center gap-2", children: _jsx(Select, { label: "Ubah Status", options: transitionOptions, value: "", onChange: (e) => {
                                    const next = e.currentTarget.value;
                                    if (!next)
                                        return;
                                    void onUpdateStatus(next);
                                }, placeholder: "Pilih status" }) }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { variant: "danger", onClick: () => setShowRejectModal(true), disabled: submittingAction, leftIcon: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", children: _jsx("path", { strokeWidth: "2", strokeLinecap: "round", d: "M6 6l12 12M18 6L6 18" }) }), children: "Ajukan Penolakan" }), _jsx(Button, { variant: "outline", onClick: () => setShowEditModal(true), disabled: submittingAction, leftIcon: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", children: _jsx("path", { strokeWidth: "2", strokeLinecap: "round", d: "M12 5v14M5 12h14" }) }), children: "Ajukan Edit" })] })] })) : null, isDelivery ? (_jsxs("div", { className: "mt-3 flex items-center gap-2", children: [order.statusPesanan === StatusPesanan.READY ? (_jsx(Button, { variant: "primary", onClick: () => void onUpdateStatus(StatusPesanan.ON_DELIVERY), disabled: submittingAction, children: "Pickup (Mulai Diantar)" })) : null, order.statusPesanan === StatusPesanan.ON_DELIVERY ? (_jsx(Button, { variant: "primary", onClick: () => void onUpdateStatus(StatusPesanan.COMPLETE), disabled: submittingAction, children: "Selesaikan Pengantaran" })) : null] })) : null, isAdmin ? (_jsxs("div", { className: "mt-3 grid grid-cols-1 md:grid-cols-2 gap-3", children: [_jsx("div", { className: "flex items-center gap-2", children: _jsx(Select, { label: "Override Status", options: transitionOptions, value: "", onChange: (e) => {
                                    const next = e.currentTarget.value;
                                    if (!next)
                                        return;
                                    void onUpdateStatus(next);
                                }, placeholder: "Pilih status" }) }), _jsx("div", { className: "flex items-center gap-2", children: _jsx(Button, { variant: "secondary", onClick: () => setShowApprovalModal(true), disabled: submittingAction, children: "Keputusan Approval" }) })] })) : null] }));
    };
    // Modals
    const rejectModal = () => (_jsx(Modal, { open: showRejectModal, onClose: () => setShowRejectModal(false), title: "Ajukan Penolakan", description: "Masukkan catatan dapur yang jelas untuk alasan penolakan.", children: _jsxs("div", { className: "space-y-3", children: [_jsx("label", { className: "text-sm text-slate-800 dark:text-slate-200", htmlFor: "reject-note", children: "Catatan Dapur" }), _jsx("textarea", { id: "reject-note", className: "w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200", rows: 4, value: rejectForm.catatanDapur, onChange: (e) => setRejectForm((s) => ({ ...s, catatanDapur: e.currentTarget.value })) }), _jsxs("div", { className: "flex items-center justify-end gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => setShowRejectModal(false), children: "Batal" }), _jsx(Button, { variant: "danger", onClick: () => void onSubmitReject(), isLoading: submittingAction, children: "Kirim Penolakan" })] })] }) }));
    const editModal = () => (_jsx(Modal, { open: showEditModal, onClose: () => setShowEditModal(false), title: "Ajukan Edit Pesanan", description: "Masukkan jumlah pesanan baru dan catatan dapur (opsional).", children: _jsxs("div", { className: "space-y-3", children: [_jsx(Input, { label: "Jumlah Pesanan Baru", type: "number", min: 1, value: editForm.jumlahPesananBaru, onChange: (e) => setEditForm((s) => ({ ...s, jumlahPesananBaru: e.currentTarget.value })), helperText: "Minimal 1" }), _jsx("label", { className: "text-sm text-slate-800 dark:text-slate-200", htmlFor: "edit-note", children: "Catatan Dapur (opsional)" }), _jsx("textarea", { id: "edit-note", className: "w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200", rows: 4, value: editForm.catatanDapur, onChange: (e) => setEditForm((s) => ({ ...s, catatanDapur: e.currentTarget.value })) }), _jsxs("div", { className: "flex items-center justify-end gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => setShowEditModal(false), children: "Batal" }), _jsx(Button, { variant: "primary", onClick: () => void onSubmitEdit(), isLoading: submittingAction, children: "Kirim Permintaan Edit" })] })] }) }));
    const approvalModal = () => (_jsx(Modal, { open: showApprovalModal, onClose: () => setShowApprovalModal(false), title: "Keputusan Approval Admin", description: "Pilih keputusan dan masukkan catatan admin (opsional).", children: _jsxs("div", { className: "space-y-3", children: [_jsx(Select, { label: "Keputusan", options: [
                        { label: 'APPROVED', value: 'APPROVED' },
                        { label: 'REJECTED', value: 'REJECTED' },
                    ], value: approvalForm.decision, onChange: (e) => setApprovalForm((s) => ({ ...s, decision: e.currentTarget.value })), placeholder: "Pilih keputusan" }), _jsx("label", { className: "text-sm text-slate-800 dark:text-slate-200", htmlFor: "approval-note", children: "Catatan Admin (opsional)" }), _jsx("textarea", { id: "approval-note", className: "w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200", rows: 4, value: approvalForm.catatanAdmin, onChange: (e) => setApprovalForm((s) => ({ ...s, catatanAdmin: e.currentTarget.value })) }), _jsxs("div", { className: "flex items-center justify-end gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => setShowApprovalModal(false), children: "Batal" }), _jsx(Button, { variant: "secondary", onClick: () => void onSubmitApproval(), isLoading: submittingAction, children: "Kirim Keputusan" })] })] }) }));
    const backBar = () => (_jsx("div", { className: "mb-3", children: _jsx(Button, { variant: "ghost", onClick: () => navigate('/orders'), leftIcon: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", children: _jsx("path", { strokeWidth: "2", strokeLinecap: "round", d: "M15 19l-7-7 7-7" }) }), children: "Kembali ke Daftar" }) }));
    // Render
    if (loading) {
        return (_jsx("div", { className: "px-6 py-6", children: _jsx("div", { className: "w-full flex items-center justify-center py-16", children: _jsx(Spinner, { variant: "primary", size: "lg", label: "Memuat detail pesanan..." }) }) }));
    }
    if (loadError || !order) {
        return (_jsxs("div", { className: "px-6 py-6", children: [backBar(), _jsx(EmptyState, { title: "Gagal memuat detail", description: loadError ?? 'Tidak ditemukan', action: {
                        label: 'Coba Lagi',
                        onClick: () => void refetch(),
                        variant: 'primary',
                    } })] }));
    }
    return (_jsxs("div", { className: "px-6 py-6", children: [backBar(), header(), infoCards(), timeline(), actions(), rejectModal(), editModal(), approvalModal()] }));
}
