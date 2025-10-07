import { useCallback, useEffect, useMemo, useState } from 'react';

import type { Order, ApprovalDecision } from '@/types/order.types';
import { ApprovalStatus } from '@/types/order.types';

import { Table, type Column } from '@/components/ui/Table';
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

  const [pendingApprovals, setPendingApprovals] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
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
    } catch (e: any) {
      showError(`Gagal memuat pending approvals: ${e.message ?? String(e)}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadApprovals();
  }, [loadApprovals]);

  // Subscribe event 'order.approval.requested' untuk refetch dan menampilkan toast
  useWebSocket(
    'order.approval.requested',
    (payload) => {
      showInfo(
        `Permintaan ${payload.requestType === 'REJECT' ? 'Penolakan' : 'Edit'} untuk ${payload.kodePesanan}`,
        { icon: '⚠️' },
      );
      // Refetch untuk sinkronisasi daftar
      loadApprovals();
    },
    [loadApprovals],
  );

  // Opsional: refetch setelah ada keputusan admin (untuk jaga konsistensi UI)
  useWebSocket(
    'order.approval.decided',
    (payload) => {
      if (payload.decision === 'APPROVED') {
        showSuccess(`Approval disetujui: ${payload.kodePesanan}`);
      } else if (payload.decision === 'REJECTED') {
        showError(`Approval ditolak: ${payload.kodePesanan}`);
      } else {
        showInfo(`Approval pending: ${payload.kodePesanan}`);
      }
      loadApprovals();
    },
    [loadApprovals],
  );

  function getRequestType(order: Order): 'REJECT' | 'EDIT' {
    // Heuristik:
    // - Jika jumlahPesananAwal ada (non-null), diasumsikan permintaan EDIT
    // - Jika hanya ada catatanDapur dan requiresApproval, diasumsikan REJECT
    return order.jumlahPesananAwal !== null && order.jumlahPesananAwal !== undefined ? 'EDIT' : 'REJECT';
  }

  const columns: Column<Order>[] = useMemo(
    () => [
      {
        id: 'kode',
        header: 'Kode',
        accessor: (row) => (
          <span className="font-mono text-sm">{row.kodePesanan}</span>
        ),
        align: 'left',
      },
      {
        id: 'tanggal',
        header: 'Tanggal',
        accessor: (row) => (
          <span className="text-sm">{formatDateTime(row.waktuDibuat)}</span>
        ),
        align: 'left',
      },
      {
        id: 'jumlah',
        header: 'Jumlah',
        accessor: (row) => {
          const awal = row.jumlahPesananAwal;
          const baru = row.jumlahPesanan;
          if (awal !== null && awal !== undefined && awal !== baru) {
            return (
              <div className="flex items-center gap-2">
                <span className="font-mono">{awal}</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-slate-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
                <span className="font-mono">{baru}</span>
              </div>
            );
          }
          return <span className="font-mono">{baru}</span>;
        },
        align: 'center',
      },
      {
        id: 'status',
        header: 'Status',
        accessor: (row) => (
          <Badge variant={getStatusBadgeVariant(row.statusPesanan)} size="sm">
            {getStatusLabel(row.statusPesanan)}
          </Badge>
        ),
        align: 'center',
      },
      {
        id: 'tipe',
        header: 'Tipe Permintaan',
        accessor: (row) => {
          const type = getRequestType(row);
          const variant = type === 'REJECT' ? 'error' : 'warning';
          return <Badge variant={variant} size="sm">{type}</Badge>;
        },
        align: 'center',
      },
      {
        id: 'catatan',
        header: 'Catatan Dapur',
        accessor: (row) => (
          <span className="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
            {row.catatanDapur ?? '—'}
          </span>
        ),
        align: 'left',
      },
      {
        id: 'aksi',
        header: 'Aksi',
        accessor: (row) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedOrder(row);
              setCatatanAdmin('');
              setShowApprovalModal(true);
            }}
          >
            Tinjau
          </Button>
        ),
        align: 'center',
      },
    ],
    [],
  );

  async function handleDecision(decision: ApprovalDecision) {
    if (!selectedOrder) return;
    setIsSubmitting(true);
    try {
      const catatan = catatanAdmin.trim();
      await approveRejectOrder(selectedOrder.id, decision, catatan.length ? catatan : undefined);
      showSuccess('Keputusan berhasil diterapkan');
      setShowApprovalModal(false);
      setSelectedOrder(null);
      setCatatanAdmin('');
      await loadApprovals();
    } catch (e: any) {
      showError(`Gagal menyimpan keputusan: ${e.message ?? String(e)}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Pusat Persetujuan</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Kelola permintaan penolakan/edit dari dapur. Real-time updates aktif.
          </p>
        </div>
      </header>

      {isLoading ? (
        <div className="min-h-[30vh] grid place-items-center">
          <Spinner variant="primary" size="lg" label="Memuat pending approvals..." />
        </div>
      ) : pendingApprovals.length === 0 ? (
        <EmptyState
          title="Tidak ada permintaan persetujuan"
          description="Belum ada permintaan penolakan atau edit dari dapur."
          action={{
            label: 'Muat ulang',
            variant: 'outline',
            onClick: () => loadApprovals(),
          }}
        />
      ) : (
        <Table
          columns={columns}
          data={pendingApprovals}
          ariaLabel="Tabel Pending Approvals"
          emptyLabel="Tidak ada data"
        />
      )}

      <Modal
        open={showApprovalModal}
        onClose={() => {
          if (!isSubmitting) {
            setShowApprovalModal(false);
            setSelectedOrder(null);
            setCatatanAdmin('');
          }
        }}
        title="Tinjau Permintaan"
        description={
          selectedOrder ? (
            <span>
              Pesanan<span className="font-mono ml-1">{selectedOrder.kodePesanan}</span> —{' '}
              {getRequestType(selectedOrder) === 'REJECT' ? 'Penolakan' : 'Edit'} ({getStatusLabel(selectedOrder.statusPesanan)})
            </span>
          ) : undefined
        }
        size="lg"
      >
        {selectedOrder ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Kode Pesanan</p>
                <p className="font-mono text-sm">{selectedOrder.kodePesanan}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Status</p>
                <p className="text-sm">
                  <Badge variant={getStatusBadgeVariant(selectedOrder.statusPesanan)} size="sm">
                    {getStatusLabel(selectedOrder.statusPesanan)}
                  </Badge>
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Jumlah</p>
                <p className="text-sm">
                  {selectedOrder.jumlahPesananAwal !== null && selectedOrder.jumlahPesananAwal !== undefined ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="font-mono">{selectedOrder.jumlahPesananAwal}</span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 text-slate-500"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path strokeWidth="2" d="M9 5l7 7-7 7" />
                      </svg>
                      <span className="font-mono">{selectedOrder.jumlahPesanan}</span>
                    </span>
                  ) : (
                    <span className="font-mono">{selectedOrder.jumlahPesanan}</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Catatan Dapur</p>
                <p className="text-sm">{selectedOrder.catatanDapur ?? '—'}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Dibuat</p>
                <p className="text-sm">{formatDateTime(selectedOrder.waktuDibuat)}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Catatan Admin (opsional)
              </label>
              <textarea
                rows={3}
                className="block w-full px-4 py-2.5 text-sm border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1 border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:border-primary-500 focus:ring-primary-400"
                placeholder="Tambahkan catatan keputusan jika diperlukan"
                value={catatanAdmin}
                onChange={(e) => setCatatanAdmin(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => handleDecision(ApprovalStatus.REJECTED as ApprovalDecision)}
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                Tolak
              </Button>
              <Button
                variant="primary"
                onClick={() => handleDecision(ApprovalStatus.APPROVED as ApprovalDecision)}
                isLoading={isSubmitting}
                disabled={isSubmitting}
              >
                Setujui
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-300">Tidak ada pesanan terpilih.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}