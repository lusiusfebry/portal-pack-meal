import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// frontend/src/pages/orders/KanbanBoardPage.tsx
import { useCallback, useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { getOrders, updateOrderStatus, requestRejection, requestEdit, } from '@/services/api/orders.api';
import { StatusPesanan, } from '@/types/order.types';
import { getStatusLabel, getStatusBadgeVariant, getAllowedTransitionsByRole } from '@/utils/status.utils';
import { formatDate } from '@/utils/date.utils';
import { showError, showSuccess, showInfo } from '@/components/ui/Toast';
import useWebSocket from '@/hooks/useWebSocket';
import { useAuthStore } from '@/stores/auth.store';
export default function KanbanBoardPage() {
    const { user } = useAuthStore();
    const role = user?.role;
    const isKitchen = role === 'dapur' || role === 'administrator'; // allow admin to view/manually operate if needed
    const [columns, setColumns] = useState({
        MENUNGGU: [],
        IN_PROGRESS: [],
        READY: [],
    });
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    // Selected order for actions
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [submittingAction, setSubmittingAction] = useState(false);
    const [rejectForm, setRejectForm] = useState({ catatanDapur: '' });
    const [editForm, setEditForm] = useState({ jumlahPesananBaru: '', catatanDapur: '' });
    // WebSocket subscriptions
    const wsCreated = useWebSocket('order.created', useCallback((payload) => {
        // Tambahkan ke kolom MENUNGGU jika relevan
        showInfo(`Pesanan baru dibuat${payload?.kodePesanan ? `: ${payload.kodePesanan}` : ''}`);
        void refetch();
    }, []), []);
    const wsStatusChanged = useWebSocket('order.status.changed', useCallback((payload) => {
        // Update posisi kartu sesuai status baru
        showInfo(`Status ${payload.kodePesanan ?? '#' + payload.orderId} → ${getStatusLabel(payload.newStatus)}`);
        void refetch();
    }, []), []);
    const refetch = useCallback(async () => {
        setLoading(true);
        setLoadError(null);
        try {
            // Ambil per status untuk dapur (server akan memfilter per role)
            const paramsBase = { page: 1, limit: 50 };
            const [menunggu, inProgress, ready] = await Promise.all([
                getOrders({ ...paramsBase, status: StatusPesanan.MENUNGGU }),
                getOrders({ ...paramsBase, status: StatusPesanan.IN_PROGRESS }),
                getOrders({ ...paramsBase, status: StatusPesanan.READY }),
            ]);
            setColumns({
                MENUNGGU: menunggu.data,
                IN_PROGRESS: inProgress.data,
                READY: ready.data,
            });
        }
        catch (error) {
            const message = error?.message ?? 'Gagal memuat kanban pesanan';
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
    const getColumnOrders = useCallback((key) => {
        return columns[key];
    }, [columns]);
    // Validasi transisi berdasarkan role
    const canTransition = useCallback((current, target) => {
        if (!role)
            return false;
        const allowed = getAllowedTransitionsByRole(role, current);
        return allowed.includes(target);
    }, [role]);
    // Handle drag-and-drop
    const onDragEnd = async (result) => {
        const { source, destination } = result;
        if (!destination)
            return;
        const sourceKey = source.droppableId;
        const destKey = destination.droppableId;
        if (sourceKey === destKey) {
            // Ignore reorder for simplicity; kanban does not require manual reordering by index
            return;
        }
        const sourceList = getColumnOrders(sourceKey);
        const movedOrder = sourceList[source.index];
        if (!movedOrder)
            return;
        // Map column key to target status
        const targetStatusMap = {
            MENUNGGU: StatusPesanan.MENUNGGU,
            IN_PROGRESS: StatusPesanan.IN_PROGRESS,
            READY: StatusPesanan.READY,
        };
        const targetStatus = targetStatusMap[destKey];
        // Prevent invalid transitions
        if (!canTransition(movedOrder.statusPesanan, targetStatus)) {
            showError('Transisi status tidak valid untuk peran ini');
            return;
        }
        try {
            const updated = await updateOrderStatus(movedOrder.id, targetStatus);
            // Move card between columns
            setColumns((prev) => {
                const next = {
                    MENUNGGU: [...prev.MENUNGGU],
                    IN_PROGRESS: [...prev.IN_PROGRESS],
                    READY: [...prev.READY],
                };
                // Remove from source
                next[sourceKey].splice(source.index, 1);
                // Insert to destination (at destination.index)
                next[destKey].splice(destination.index, 0, updated);
                return next;
            });
            showSuccess(`Status diubah: ${getStatusLabel(targetStatus)}`);
        }
        catch (error) {
            showError(error?.message ?? 'Gagal mengubah status');
        }
    };
    // Actions
    const openReject = (order) => {
        setSelectedOrder(order);
        setRejectForm({ catatanDapur: '' });
        setShowRejectModal(true);
    };
    const openEdit = (order) => {
        setSelectedOrder(order);
        setEditForm({ jumlahPesananBaru: '', catatanDapur: '' });
        setShowEditModal(true);
    };
    const submitReject = async () => {
        if (!selectedOrder)
            return;
        const note = rejectForm.catatanDapur.trim();
        if (!note) {
            showError('Catatan dapur wajib diisi');
            return;
        }
        setSubmittingAction(true);
        try {
            const updated = await requestRejection(selectedOrder.id, note);
            showSuccess(`Permintaan penolakan dikirim untuk ${updated.kodePesanan}`);
            setShowRejectModal(false);
            setSelectedOrder(null);
            // refresh lists to reflect MENUNGGU_PERSETUJUAN
            void refetch();
        }
        catch (error) {
            showError(error?.message ?? 'Gagal mengirim penolakan');
        }
        finally {
            setSubmittingAction(false);
        }
    };
    const submitEdit = async () => {
        if (!selectedOrder)
            return;
        const qty = Number(editForm.jumlahPesananBaru);
        if (!Number.isFinite(qty) || qty < 1) {
            showError('Jumlah pesanan baru minimal 1');
            return;
        }
        setSubmittingAction(true);
        try {
            const updated = await requestEdit(selectedOrder.id, qty, editForm.catatanDapur.trim() ? editForm.catatanDapur.trim() : undefined);
            showSuccess(`Permintaan edit dikirim untuk ${updated.kodePesanan}`);
            setShowEditModal(false);
            setSelectedOrder(null);
            // refresh lists to reflect MENUNGGU_PERSETUJUAN
            void refetch();
        }
        catch (error) {
            showError(error?.message ?? 'Gagal mengirim edit');
        }
        finally {
            setSubmittingAction(false);
        }
    };
    const Column = ({ columnKey, title }) => {
        const items = getColumnOrders(columnKey);
        return (_jsx("div", { className: "w-full md:w-1/3 min-w-[280px]", children: _jsxs("div", { className: "rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm", children: [_jsx("div", { className: "flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("h2", { className: "text-sm font-semibold text-slate-900 dark:text-slate-100", children: title }), _jsx(Badge, { variant: "info", size: "sm", children: items.length })] }) }), _jsx(Droppable, { droppableId: columnKey, children: (provided, snapshot) => (_jsxs("div", { ref: provided.innerRef, ...provided.droppableProps, className: [
                                'px-3 py-3 min-h-[120px]',
                                snapshot.isDraggingOver ? 'bg-slate-50 dark:bg-slate-800/50 rounded-b-xl' : '',
                            ].join(' '), children: [items.length === 0 ? (_jsx("div", { className: "px-3 py-6", children: _jsx(EmptyState, { title: "Kosong", description: "Belum ada pesanan di kolom ini." }) })) : (items.map((order, idx) => (_jsx(Draggable, { draggableId: `order-${order.id}`, index: idx, children: (dragProvided, dragSnapshot) => (_jsxs("div", { ref: dragProvided.innerRef, ...dragProvided.draggableProps, ...dragProvided.dragHandleProps, className: [
                                            'rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900',
                                            'px-3 py-3 mb-3 shadow-sm',
                                            dragSnapshot.isDragging ? 'ring-2 ring-primary-400' : '',
                                        ].join(' '), children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("div", { className: "text-sm font-semibold text-slate-900 dark:text-slate-100", children: order.kodePesanan }), _jsxs("div", { className: "text-xs text-slate-600 dark:text-slate-300", children: ["Departemen #", order.departmentPemesanId, " \u2022 Shift #", order.shiftId] })] }), _jsx(Badge, { variant: getStatusBadgeVariant(order.statusPesanan), size: "sm", children: getStatusLabel(order.statusPesanan) })] }), _jsxs("div", { className: "mt-2 grid grid-cols-3 gap-2", children: [_jsxs("div", { className: "text-xs text-slate-600 dark:text-slate-300", children: ["Jumlah: ", _jsx("span", { className: "font-medium", children: order.jumlahPesanan })] }), _jsxs("div", { className: "text-xs text-slate-600 dark:text-slate-300", children: ["Tanggal: ", _jsx("span", { className: "font-medium", children: formatDate(order.tanggalPesanan, 'yyyy-MM-dd') })] }), _jsxs("div", { className: "text-xs text-slate-600 dark:text-slate-300", children: ["Dibuat: ", _jsx("span", { className: "font-medium", children: formatDate(order.waktuDibuat, 'HH:mm') })] })] }), _jsxs("div", { className: "mt-3 flex items-center gap-2", children: [_jsx(Button, { variant: "danger", size: "sm", onClick: () => openReject(order), leftIcon: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", children: _jsx("path", { strokeWidth: "2", strokeLinecap: "round", d: "M6 6l12 12M18 6L6 18" }) }), children: "Reject" }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => openEdit(order), leftIcon: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: "h-4 w-4", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", children: _jsx("path", { strokeWidth: "2", strokeLinecap: "round", d: "M12 5v14M5 12h14" }) }), children: "Edit" })] })] })) }, order.id)))), provided.placeholder] })) })] }) }));
    };
    if (!isKitchen) {
        return (_jsx("div", { className: "px-6 py-6", children: _jsx(EmptyState, { title: "Akses ditolak", description: "Halaman Kanban hanya untuk peran Dapur." }) }));
    }
    if (loading) {
        return (_jsx("div", { className: "px-6 py-6", children: _jsx("div", { className: "w-full flex items-center justify-center py-16", children: _jsx(Spinner, { variant: "primary", size: "lg", label: "Memuat Kanban..." }) }) }));
    }
    if (loadError) {
        return (_jsx("div", { className: "px-6 py-6", children: _jsx(EmptyState, { title: "Gagal memuat Kanban", description: loadError, action: {
                    label: 'Coba Lagi',
                    onClick: () => void refetch(),
                    variant: 'primary',
                } }) }));
    }
    return (_jsxs("div", { className: "px-6 py-6", children: [_jsxs("div", { className: "mb-4", children: [_jsx("h1", { className: "text-2xl md:text-3xl font-display font-bold text-slate-900 dark:text-white", children: "Antrian Dapur" }), _jsx("p", { className: "text-sm text-slate-700 dark:text-slate-300", children: "Kelola pesanan dengan drag-and-drop antar kolom." }), _jsxs("p", { className: "text-xs text-slate-500 dark:text-slate-400", children: ["Realtime: order.created [", wsCreated, "] \u00B7 order.status.changed [", wsStatusChanged, "]"] })] }), _jsx(DragDropContext, { onDragEnd: onDragEnd, children: _jsxs("div", { className: "flex gap-4 overflow-x-auto", children: [_jsx(Column, { columnKey: "MENUNGGU", title: getStatusLabel(StatusPesanan.MENUNGGU) }), _jsx(Column, { columnKey: "IN_PROGRESS", title: getStatusLabel(StatusPesanan.IN_PROGRESS) }), _jsx(Column, { columnKey: "READY", title: getStatusLabel(StatusPesanan.READY) })] }) }), _jsx(Modal, { open: showRejectModal, onClose: () => setShowRejectModal(false), title: "Ajukan Penolakan", description: "Masukkan catatan dapur yang jelas untuk alasan penolakan.", children: _jsxs("div", { className: "space-y-3", children: [_jsx("label", { className: "text-sm text-slate-800 dark:text-slate-200", htmlFor: "reject-note", children: "Catatan Dapur" }), _jsx("textarea", { id: "reject-note", className: "w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200", rows: 4, value: rejectForm.catatanDapur, onChange: (e) => setRejectForm((s) => ({ ...s, catatanDapur: e.currentTarget.value })) }), _jsxs("div", { className: "flex items-center justify-end gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => setShowRejectModal(false), children: "Batal" }), _jsx(Button, { variant: "danger", onClick: () => void submitReject(), isLoading: submittingAction, children: "Kirim Penolakan" })] })] }) }), _jsx(Modal, { open: showEditModal, onClose: () => setShowEditModal(false), title: "Ajukan Edit Pesanan", description: "Masukkan jumlah pesanan baru dan catatan dapur (opsional).", children: _jsxs("div", { className: "space-y-3", children: [_jsx("label", { className: "text-sm text-slate-800 dark:text-slate-200", htmlFor: "edit-qty", children: "Jumlah Pesanan Baru" }), _jsx("input", { id: "edit-qty", type: "number", min: 1, className: "w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200", value: editForm.jumlahPesananBaru, onChange: (e) => setEditForm((s) => ({ ...s, jumlahPesananBaru: e.currentTarget.value })) }), _jsx("label", { className: "text-sm text-slate-800 dark:text-slate-200", htmlFor: "edit-note", children: "Catatan Dapur (opsional)" }), _jsx("textarea", { id: "edit-note", className: "w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200", rows: 4, value: editForm.catatanDapur, onChange: (e) => setEditForm((s) => ({ ...s, catatanDapur: e.currentTarget.value })) }), _jsxs("div", { className: "flex items-center justify-end gap-2", children: [_jsx(Button, { variant: "outline", onClick: () => setShowEditModal(false), children: "Batal" }), _jsx(Button, { variant: "primary", onClick: () => void submitEdit(), isLoading: submittingAction, children: "Kirim Permintaan Edit" })] })] }) })] }));
}
