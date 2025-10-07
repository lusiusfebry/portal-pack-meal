// frontend/src/pages/orders/OrderDetailPage.tsx

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import Badge from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import Modal from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import Select, { type SelectOption } from '@/components/ui/Select';

import {
  getOrderById,
  updateOrderStatus,
  requestRejection,
  requestEdit,
  approveRejectOrder,
} from '@/services/api/orders.api';

import {
  StatusPesanan,
  type Order,
  type OrderStatus,
  type ApprovalDecision,
} from '@/types/order.types';
import type { Role } from '@/types/auth.types';

import {
  getStatusLabel,
  getStatusBadgeVariant,
  getAllowedTransitionsByRole,
} from '@/utils/status.utils';
import { formatDate } from '@/utils/date.utils';

import { useAuthStore } from '@/stores/auth.store';
import useWebSocket from '@/hooks/useWebSocket';
import { showError, showInfo, showSuccess } from '@/components/ui/Toast';

/**
 * OrderDetailPage
 * - Menampilkan informasi lengkap pesanan dan timeline lifecycle
 * - Role-based action buttons:
 *   - Dapur: update status (MENUNGGU → IN_PROGRESS → READY), reject, edit
 *   - Delivery: pickup (READY → ON_DELIVERY), complete (ON_DELIVERY → COMPLETE)
 *   - Admin: override status, approve/reject
 * - Modals untuk rejection, edit, dan approval forms
 * - Real-time updates via WebSocket (status changed, approval requested/decided)
 */

interface EditFormState {
  jumlahPesananBaru: string;
  catatanDapur: string;
}

interface RejectFormState {
  catatanDapur: string;
}

interface ApprovalFormState {
  decision: ApprovalDecision | '';
  catatanAdmin: string;
}

export default function OrderDetailPage() {
  const { id: idParam } = useParams<{ id: string }>();
  const id = Number(idParam);

  const { user } = useAuthStore();
  const role: Role | undefined = user?.role;

  const navigate = useNavigate();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // WebSocket subscriptions
  const wsStatusChanged = useWebSocket(
    'order.status.changed',
    useCallback(
      (payload) => {
        if (payload?.orderId === id) {
          showInfo(
            `Status ${payload.kodePesanan ?? '#' + payload.orderId} berubah menjadi ${getStatusLabel(
              payload.newStatus,
            )}`,
          );
          void refetch();
        }
      },
      [id],
    ),
    [id],
  );

  useWebSocket(
    'order.approval.requested',
    useCallback(
      (payload) => {
        if (payload?.orderId === id) {
          showInfo(`Permintaan approval untuk pesanan ${payload.kodePesanan} dikirim ke admin`);
          void refetch();
        }
      },
      [id],
    ),
    [id],
  );

  useWebSocket(
    'order.approval.decided',
    useCallback(
      (payload) => {
        if (payload?.orderId === id) {
          showInfo(`Keputusan admin untuk ${payload.kodePesanan}: ${payload.decision}`);
          void refetch();
        }
      },
      [id],
    ),
    [id],
  );

  // Modals state
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showApprovalModal, setShowApprovalModal] = useState<boolean>(false);

  // Form states
  const [rejectForm, setRejectForm] = useState<RejectFormState>({ catatanDapur: '' });
  const [editForm, setEditForm] = useState<EditFormState>({ jumlahPesananBaru: '', catatanDapur: '' });
  const [approvalForm, setApprovalForm] = useState<ApprovalFormState>({
    decision: '',
    catatanAdmin: '',
  });

  // Submitting flags
  const [submittingAction, setSubmittingAction] = useState<boolean>(false);

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
    } catch (error: any) {
      const message = (error?.message as string) ?? 'Gagal memuat detail pesanan';
      setLoadError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Derived: allowed transitions
  const allowedTransitions: OrderStatus[] = useMemo(() => {
    if (!order || !role) return [];
    return getAllowedTransitionsByRole(role, order.statusPesanan);
  }, [order, role]);

  const transitionOptions: SelectOption[] = useMemo(
    () =>
      allowedTransitions.map((st) => ({
        label: getStatusLabel(st),
        value: st,
      })),
    [allowedTransitions],
  );

  // Action handlers
  const onUpdateStatus = useCallback(
    async (next: OrderStatus) => {
      if (!order) return;
      setSubmittingAction(true);
      try {
        const updated = await updateOrderStatus(order.id, next);
        setOrder(updated);
        showSuccess(`Status berhasil diubah menjadi ${getStatusLabel(next)}`);
      } catch (error: any) {
        showError((error?.message as string) ?? 'Gagal mengubah status');
      } finally {
        setSubmittingAction(false);
      }
    },
    [order],
  );

  const onSubmitReject = useCallback(async () => {
    if (!order) return;
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
    } catch (error: any) {
      showError((error?.message as string) ?? 'Gagal mengirim permintaan penolakan');
    } finally {
      setSubmittingAction(false);
    }
  }, [order, rejectForm]);

  const onSubmitEdit = useCallback(async () => {
    if (!order) return;
    const jumlahBaru = Number(editForm.jumlahPesananBaru);
    if (!Number.isFinite(jumlahBaru) || jumlahBaru < 1) {
      showError('Jumlah pesanan baru harus >= 1');
      return;
    }
    setSubmittingAction(true);
    try {
      const updated = await requestEdit(
        order.id,
        jumlahBaru,
        editForm.catatanDapur.trim() ? editForm.catatanDapur.trim() : undefined,
      );
      setOrder(updated);
      showSuccess(`Permintaan edit (jumlah: ${jumlahBaru}) dikirim untuk ${updated.kodePesanan}`);
      setShowEditModal(false);
      setEditForm({ jumlahPesananBaru: '', catatanDapur: '' });
    } catch (error: any) {
      showError((error?.message as string) ?? 'Gagal mengirim permintaan edit');
    } finally {
      setSubmittingAction(false);
    }
  }, [order, editForm]);

  const onSubmitApproval = useCallback(async () => {
    if (!order) return;
    if (!approvalForm.decision) {
      showError('Keputusan wajib dipilih (APPROVED atau REJECTED)');
      return;
    }
    setSubmittingAction(true);
    try {
      const updated = await approveRejectOrder(
        order.id,
        approvalForm.decision as ApprovalDecision,
        approvalForm.catatanAdmin.trim() ? approvalForm.catatanAdmin.trim() : undefined,
      );
      setOrder(updated);
      showSuccess(`Keputusan admin dikirim untuk ${updated.kodePesanan}`);
      setShowApprovalModal(false);
      setApprovalForm({ decision: '', catatanAdmin: '' });
    } catch (error: any) {
      showError((error?.message as string) ?? 'Gagal mengirim keputusan admin');
    } finally {
      setSubmittingAction(false);
    }
  }, [order, approvalForm]);

  // UI helpers
  const header = () => {
    return (
      <div className="mb-4 flex flex-col gap-1">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900 dark:text-white">
              Detail Pesanan
            </h1>
            <p className="text-sm text-slate-700 dark:text-slate-300">
              ID: {order?.id ?? id} • Kode: {order?.kodePesanan ?? '-'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Realtime: status.changed [{wsStatusChanged}] · approval.requested · approval.decided
            </p>
          </div>
          {order ? (
            <Badge variant={getStatusBadgeVariant(order.statusPesanan)}>
              {getStatusLabel(order.statusPesanan)}
            </Badge>
          ) : null}
        </div>
      </div>
    );
  };

  const infoCards = () => {
    if (!order) return null;
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Informasi Utama</h3>
          <div className="mt-2 text-sm text-slate-700 dark:text-slate-300 space-y-1">
            <div>Kode Pesanan: {order.kodePesanan}</div>
            <div>Departemen: {order.departemen?.namaDivisi ?? `Dept #${order.departmentPemesanId}`}</div>
            <div>Shift: {order.shift ? `${order.shift.namaShift} (${order.shift.jamMulai?.slice(0,5)}-${order.shift.jamSelesai?.slice(0,5)})` : `Shift #${order.shiftId}`}</div>
            <div>Jumlah: {order.jumlahPesanan}</div>
            {order.jumlahPesananAwal ? <div>Jumlah Awal: {order.jumlahPesananAwal}</div> : null}
            <div>Tanggal Pesanan: {formatDate(order.tanggalPesanan, 'yyyy-MM-dd')}</div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Approval</h3>
          <div className="mt-2 text-sm text-slate-700 dark:text-slate-300 space-y-1">
            <div>Requires Approval: {order.requiresApproval ? 'Ya' : 'Tidak'}</div>
            <div>Status Approval: {order.approvalStatus ?? '-'}</div>
            {order.catatanDapur ? <div>Catatan Dapur: {order.catatanDapur}</div> : null}
            {order.catatanAdmin ? <div>Catatan Admin: {order.catatanAdmin}</div> : null}
            {order.approvedById ? <div>Approved By: #{order.approvedById}</div> : null}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Timestamps</h3>
          <div className="mt-2 text-sm text-slate-700 dark:text-slate-300 space-y-1">
            <div>Dibuat: {formatDate(order.waktuDibuat, 'yyyy-MM-dd HH:mm')}</div>
            <div>Diproses: {order.waktuDiproses ? formatDate(order.waktuDiproses, 'yyyy-MM-dd HH:mm') : '-'}</div>
            <div>Siap: {order.waktuSiap ? formatDate(order.waktuSiap, 'yyyy-MM-dd HH:mm') : '-'}</div>
            <div>Diantar: {order.waktuDiantar ? formatDate(order.waktuDiantar, 'yyyy-MM-dd HH:mm') : '-'}</div>
            <div>Selesai: {order.waktuSelesai ? formatDate(order.waktuSelesai, 'yyyy-MM-dd HH:mm') : '-'}</div>
          </div>
        </div>
      </div>
    );
  };

  const timeline = () => {
    if (!order) return null;
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

    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm mb-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Timeline</h3>
        <ol className="mt-3 space-y-2">
          {items.map((it) => (
            <li key={it.key} className="flex items-center gap-3">
              <span
                className={[
                  'inline-flex h-2.5 w-2.5 rounded-full',
                  it.active ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-700',
                ].join(' ')}
                aria-hidden="true"
              />
              <span className="text-sm text-slate-800 dark:text-slate-200">{it.label}</span>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {it.time ? formatDate(it.time, 'yyyy-MM-dd HH:mm') : ''}
              </span>
            </li>
          ))}
        </ol>
      </div>
    );
  };

  const actions = () => {
    if (!order || !role) return null;

    const isKitchen = role === 'dapur';
    const isDelivery = role === 'delivery';
    const isAdmin = role === 'administrator';

    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 shadow-sm mb-4">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Aksi</h3>

        {/* Kitchen actions */}
        {isKitchen ? (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Update status (only show transitions from allowedTransitions excluding approval sentinel) */}
            <div className="flex items-center gap-2">
              <Select
                label="Ubah Status"
                options={transitionOptions}
                value=""
                onChange={(e) => {
                  const next = e.currentTarget.value as OrderStatus;
                  if (!next) return;
                  void onUpdateStatus(next);
                }}
                placeholder="Pilih status"
              />
            </div>

            {/* Reject & Edit buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="danger"
                onClick={() => setShowRejectModal(true)}
                disabled={submittingAction}
                leftIcon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeWidth="2" strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                  </svg>
                }
              >
                Ajukan Penolakan
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowEditModal(true)}
                disabled={submittingAction}
                leftIcon={
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeWidth="2" strokeLinecap="round" d="M12 5v14M5 12h14" />
                  </svg>
                }
              >
                Ajukan Edit
              </Button>
            </div>
          </div>
        ) : null}

        {/* Delivery actions */}
        {isDelivery ? (
          <div className="mt-3 flex items-center gap-2">
            {order.statusPesanan === StatusPesanan.READY ? (
              <Button variant="primary" onClick={() => void onUpdateStatus(StatusPesanan.ON_DELIVERY)} disabled={submittingAction}>
                Pickup (Mulai Diantar)
              </Button>
            ) : null}
            {order.statusPesanan === StatusPesanan.ON_DELIVERY ? (
              <Button variant="primary" onClick={() => void onUpdateStatus(StatusPesanan.COMPLETE)} disabled={submittingAction}>
                Selesaikan Pengantaran
              </Button>
            ) : null}
          </div>
        ) : null}

        {/* Admin actions */}
        {isAdmin ? (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex items-center gap-2">
              <Select
                label="Override Status"
                options={transitionOptions}
                value=""
                onChange={(e) => {
                  const next = e.currentTarget.value as OrderStatus;
                  if (!next) return;
                  void onUpdateStatus(next);
                }}
                placeholder="Pilih status"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => setShowApprovalModal(true)} disabled={submittingAction}>
                Keputusan Approval
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  // Modals
  const rejectModal = () => (
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
          <Button variant="danger" onClick={() => void onSubmitReject()} isLoading={submittingAction}>
            Kirim Penolakan
          </Button>
        </div>
      </div>
    </Modal>
  );

  const editModal = () => (
    <Modal
      open={showEditModal}
      onClose={() => setShowEditModal(false)}
      title="Ajukan Edit Pesanan"
      description="Masukkan jumlah pesanan baru dan catatan dapur (opsional)."
    >
      <div className="space-y-3">
        <Input
          label="Jumlah Pesanan Baru"
          type="number"
          min={1}
          value={editForm.jumlahPesananBaru}
          onChange={(e) =>
            setEditForm((s) => ({ ...s, jumlahPesananBaru: e.currentTarget.value }))
          }
          helperText="Minimal 1"
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
          <Button variant="primary" onClick={() => void onSubmitEdit()} isLoading={submittingAction}>
            Kirim Permintaan Edit
          </Button>
        </div>
      </div>
    </Modal>
  );

  const approvalModal = () => (
    <Modal
      open={showApprovalModal}
      onClose={() => setShowApprovalModal(false)}
      title="Keputusan Approval Admin"
      description="Pilih keputusan dan masukkan catatan admin (opsional)."
    >
      <div className="space-y-3">
        <Select
          label="Keputusan"
          options={[
            { label: 'APPROVED', value: 'APPROVED' },
            { label: 'REJECTED', value: 'REJECTED' },
          ]}
          value={approvalForm.decision}
          onChange={(e) =>
            setApprovalForm((s) => ({ ...s, decision: e.currentTarget.value as ApprovalDecision }))
          }
          placeholder="Pilih keputusan"
        />
        <label className="text-sm text-slate-800 dark:text-slate-200" htmlFor="approval-note">
          Catatan Admin (opsional)
        </label>
        <textarea
          id="approval-note"
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm text-slate-800 dark:text-slate-200"
          rows={4}
          value={approvalForm.catatanAdmin}
          onChange={(e) =>
            setApprovalForm((s) => ({ ...s, catatanAdmin: e.currentTarget.value }))
          }
        />
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => setShowApprovalModal(false)}>
            Batal
          </Button>
          <Button variant="secondary" onClick={() => void onSubmitApproval()} isLoading={submittingAction}>
            Kirim Keputusan
          </Button>
        </div>
      </div>
    </Modal>
  );

  const backBar = () => (
    <div className="mb-3">
      <Button
        variant="ghost"
        onClick={() => navigate('/orders')}
        leftIcon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeWidth="2" strokeLinecap="round" d="M15 19l-7-7 7-7" />
          </svg>
        }
      >
        Kembali ke Daftar
      </Button>
    </div>
  );

  // Render
  if (loading) {
    return (
      <div className="px-6 py-6">
        <div className="w-full flex items-center justify-center py-16">
          <Spinner variant="primary" size="lg" label="Memuat detail pesanan..." />
        </div>
      </div>
    );
  }

  if (loadError || !order) {
    return (
      <div className="px-6 py-6">
        {backBar()}
        <EmptyState
          title="Gagal memuat detail"
          description={loadError ?? 'Tidak ditemukan'}
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
      {backBar()}
      {header()}
      {infoCards()}
      {timeline()}
      {actions()}

      {/* Modals */}
      {rejectModal()}
      {editModal()}
      {approvalModal()}
    </div>
  );
}