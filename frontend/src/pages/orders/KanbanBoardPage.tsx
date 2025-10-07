// frontend/src/pages/orders/KanbanBoardPage.tsx

import { useCallback, useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';

import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';

import {
  getOrders,
  updateOrderStatus,
  requestRejection,
  requestEdit,
} from '@/services/api/orders.api';

import {
  StatusPesanan,
  type Order,
  type OrderStatus,
  type QueryOrdersParams,
} from '@/types/order.types';
import type { Role } from '@/types/auth.types';

import { getStatusLabel, getStatusBadgeVariant, getAllowedTransitionsByRole } from '@/utils/status.utils';
import { formatDate } from '@/utils/date.utils';
import { showError, showSuccess, showInfo } from '@/components/ui/Toast';

import useWebSocket from '@/hooks/useWebSocket';
import { useAuthStore } from '@/stores/auth.store';

/**
 * KanbanBoardPage (Dapur)
 * - Columns: MENUNGGU, IN_PROGRESS, READY
 * - Drag-and-drop untuk transisi status (validasi MENUNGGU → IN_PROGRESS → READY)
 * - Action buttons pada kartu: Reject, Edit
 * - Real-time updates via WebSocket: order.created, order.status.changed
 * - Mobile responsive (horizontal scroll untuk kolom)
 */

type ColumnKey = 'MENUNGGU' | 'IN_PROGRESS' | 'READY';

interface ColumnsState {
  MENUNGGU: Order[];
  IN_PROGRESS: Order[];
  READY: Order[];
}

interface RejectFormState {
  catatanDapur: string;
}

interface EditFormState {
  jumlahPesananBaru: string;
  catatanDapur: string;
}

export default function KanbanBoardPage() {
  const { user } = useAuthStore();
  const role: Role | undefined = user?.role;
  const isKitchen = role === 'dapur' || role === 'administrator'; // allow admin to view/manually operate if needed

  const [columns, setColumns] = useState<ColumnsState>({
    MENUNGGU: [],
    IN_PROGRESS: [],
    READY: [],
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Selected order for actions
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);

  const [rejectForm, setRejectForm] = useState<RejectFormState>({ catatanDapur: '' });
  const [editForm, setEditForm] = useState<EditFormState>({ jumlahPesananBaru: '', catatanDapur: '' });

  // WebSocket subscriptions
  const wsCreated = useWebSocket(
    'order.created',
    useCallback((payload) => {
      // Tambahkan ke kolom MENUNGGU jika relevan
      showInfo(`Pesanan baru dibuat${payload?.kodePesanan ? `: ${payload.kodePesanan}` : ''}`);
      void refetch();
    }, []),
    [],
  );

  const wsStatusChanged = useWebSocket(
    'order.status.changed',
    useCallback((payload) => {
      // Update posisi kartu sesuai status baru
      showInfo(`Status ${payload.kodePesanan ?? '#' + payload.orderId} → ${getStatusLabel(payload.newStatus)}`);
      void refetch();
    }, []),
    [],
  );

  const refetch = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      // Ambil per status untuk dapur (server akan memfilter per role)
      const paramsBase: QueryOrdersParams = { page: 1, limit: 50 };
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
    } catch (error: any) {
      const message = (error?.message as string) ?? 'Gagal memuat kanban pesanan';
      setLoadError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getColumnOrders = useCallback(
    (key: ColumnKey): Order[] => {
      return columns[key];
    },
    [columns],
  );

  // Validasi transisi berdasarkan role
  const canTransition = useCallback(
    (current: OrderStatus, target: OrderStatus): boolean => {
      if (!role) return false;
      const allowed = getAllowedTransitionsByRole(role, current);
      return allowed.includes(target);
    },
    [role],
  );

  // Handle drag-and-drop
  const onDragEnd = async (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;

    const sourceKey = source.droppableId as ColumnKey;
    const destKey = destination.droppableId as ColumnKey;
    if (sourceKey === destKey) {
      // Ignore reorder for simplicity; kanban does not require manual reordering by index
      return;
    }

    const sourceList = getColumnOrders(sourceKey);
    const movedOrder = sourceList[source.index];
    if (!movedOrder) return;

    // Map column key to target status
    const targetStatusMap: Record<ColumnKey, OrderStatus> = {
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
        const next: ColumnsState = {
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
    } catch (error: any) {
      showError((error?.message as string) ?? 'Gagal mengubah status');
    }
  };

  // Actions
  const openReject = (order: Order) => {
    setSelectedOrder(order);
    setRejectForm({ catatanDapur: '' });
    setShowRejectModal(true);
  };
  const openEdit = (order: Order) => {
    setSelectedOrder(order);
    setEditForm({ jumlahPesananBaru: '', catatanDapur: '' });
    setShowEditModal(true);
  };

  const submitReject = async () => {
    if (!selectedOrder) return;
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
    } catch (error: any) {
      showError((error?.message as string) ?? 'Gagal mengirim penolakan');
    } finally {
      setSubmittingAction(false);
    }
  };

  const submitEdit = async () => {
    if (!selectedOrder) return;
    const qty = Number(editForm.jumlahPesananBaru);
    if (!Number.isFinite(qty) || qty < 1) {
      showError('Jumlah pesanan baru minimal 1');
      return;
    }
    setSubmittingAction(true);
    try {
      const updated = await requestEdit(
        selectedOrder.id,
        qty,
        editForm.catatanDapur.trim() ? editForm.catatanDapur.trim() : undefined,
      );
      showSuccess(`Permintaan edit dikirim untuk ${updated.kodePesanan}`);
      setShowEditModal(false);
      setSelectedOrder(null);
      // refresh lists to reflect MENUNGGU_PERSETUJUAN
      void refetch();
    } catch (error: any) {
      showError((error?.message as string) ?? 'Gagal mengirim edit');
    } finally {
      setSubmittingAction(false);
    }
  };

  const Column = ({ columnKey, title }: { columnKey: ColumnKey; title: string }) => {
    const items = getColumnOrders(columnKey);
    return (
      <div className="w-full md:w-1/3 min-w-[280px]">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
              <Badge variant="info" size="sm">{items.length}</Badge>
            </div>
          </div>

          <Droppable droppableId={columnKey}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={[
                  'px-3 py-3 min-h-[120px]',
                  snapshot.isDraggingOver ? 'bg-slate-50 dark:bg-slate-800/50 rounded-b-xl' : '',
                ].join(' ')}
              >
                {items.length === 0 ? (
                  <div className="px-3 py-6">
                    <EmptyState title="Kosong" description="Belum ada pesanan di kolom ini." />
                  </div>
                ) : (
                  items.map((order, idx) => (
                    <Draggable key={order.id} draggableId={`order-${order.id}`} index={idx}>
                      {(dragProvided, dragSnapshot) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          {...dragProvided.dragHandleProps}
                          className={[
                            'rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900',
                            'px-3 py-3 mb-3 shadow-sm',
                            dragSnapshot.isDragging ? 'ring-2 ring-primary-400' : '',
                          ].join(' ')}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                {order.kodePesanan}
                              </div>
                              <div className="text-xs text-slate-600 dark:text-slate-300">
                                Departemen {order.departemen?.namaDivisi ?? `#${order.departmentPemesanId}`} • Shift {order.shift ? `${order.shift.namaShift} (${order.shift.jamMulai?.slice(0,5)}-${order.shift.jamSelesai?.slice(0,5)})` : `#${order.shiftId}`}
                              </div>
                            </div>
                            <Badge variant={getStatusBadgeVariant(order.statusPesanan)} size="sm">
                              {getStatusLabel(order.statusPesanan)}
                            </Badge>
                          </div>

                          <div className="mt-2 grid grid-cols-3 gap-2">
                            <div className="text-xs text-slate-600 dark:text-slate-300">
                              Jumlah: <span className="font-medium">{order.jumlahPesanan}</span>
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-300">
                              Tanggal: <span className="font-medium">{formatDate(order.tanggalPesanan, 'yyyy-MM-dd')}</span>
                            </div>
                            <div className="text-xs text-slate-600 dark:text-slate-300">
                              Dibuat: <span className="font-medium">{formatDate(order.waktuDibuat, 'HH:mm')}</span>
                            </div>
                          </div>

                          <div className="mt-3 flex items-center gap-2">
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => openReject(order)}
                              leftIcon={
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path strokeWidth="2" strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                                </svg>
                              }
                            >
                              Reject
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openEdit(order)}
                              leftIcon={
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                  <path strokeWidth="2" strokeLinecap="round" d="M12 5v14M5 12h14" />
                                </svg>
                              }
                            >
                              Edit
                            </Button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))
                )}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </div>
    );
  };

  if (!isKitchen) {
    return (
      <div className="px-6 py-6">
        <EmptyState
          title="Akses ditolak"
          description="Halaman Kanban hanya untuk peran Dapur."
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="px-6 py-6">
        <div className="w-full flex items-center justify-center py-16">
          <Spinner variant="primary" size="lg" label="Memuat Kanban..." />
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="px-6 py-6">
        <EmptyState
          title="Gagal memuat Kanban"
          description={loadError}
          action={{
            label: 'Coba Lagi',
            onClick: () => void refetch(),
            variant: 'primary',
          }}
        />
      </div>
    );
  }

  return (
    <div className="px-6 py-6">
      <div className="mb-4">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900 dark:text-white">
          Antrian Dapur
        </h1>
        <p className="text-sm text-slate-700 dark:text-slate-300">
          Kelola pesanan dengan drag-and-drop antar kolom.
        </p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Realtime: order.created [{wsCreated}] · order.status.changed [{wsStatusChanged}]
        </p>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto">
          <Column columnKey="MENUNGGU" title={getStatusLabel(StatusPesanan.MENUNGGU)} />
          <Column columnKey="IN_PROGRESS" title={getStatusLabel(StatusPesanan.IN_PROGRESS)} />
          <Column columnKey="READY" title={getStatusLabel(StatusPesanan.READY)} />
        </div>
      </DragDropContext>

      {/* Reject Modal */}
      <Modal
        open={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        title="Ajukan Penolakan"
        description="Masukkan catatan dapur yang jelas untuk alasan penolakan."
      >
        <div className="space-y-3">
          <label className="text-sm text-slate-800 dark:text-slate-200" htmlFor="reject-note">
            Catatan Dapur
          </label>
          <textarea
            id="reject-note"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200"
            rows={4}
            value={rejectForm.catatanDapur}
            onChange={(e) => setRejectForm((s) => ({ ...s, catatanDapur: e.currentTarget.value }))}
          />
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>
              Batal
            </Button>
            <Button variant="danger" onClick={() => void submitReject()} isLoading={submittingAction}>
              Kirim Penolakan
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        open={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Ajukan Edit Pesanan"
        description="Masukkan jumlah pesanan baru dan catatan dapur (opsional)."
      >
        <div className="space-y-3">
          <label className="text-sm text-slate-800 dark:text-slate-200" htmlFor="edit-qty">
            Jumlah Pesanan Baru
          </label>
          <input
            id="edit-qty"
            type="number"
            min={1}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200"
            value={editForm.jumlahPesananBaru}
            onChange={(e) => setEditForm((s) => ({ ...s, jumlahPesananBaru: e.currentTarget.value }))}
          />
          <label className="text-sm text-slate-800 dark:text-slate-200" htmlFor="edit-note">
            Catatan Dapur (opsional)
          </label>
          <textarea
            id="edit-note"
            className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200"
            rows={4}
            value={editForm.catatanDapur}
            onChange={(e) => setEditForm((s) => ({ ...s, catatanDapur: e.currentTarget.value }))}
          />
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Batal
            </Button>
            <Button variant="primary" onClick={() => void submitEdit()} isLoading={submittingAction}>
              Kirim Permintaan Edit
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}