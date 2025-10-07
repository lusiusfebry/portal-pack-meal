// frontend/src/pages/dapur/DapurDashboardPage.tsx

import { useEffect, useMemo, useState } from 'react';
import { Card, Button, Badge, Table } from '@/components/ui';
import Spinner from '@/components/ui/Spinner';
import { showError } from '@/components/ui/Toast';
import { useNavigate } from 'react-router-dom';
import { getOrders, getPendingApprovals } from '@/services/api/orders.api';
import type { Order } from '@/types/order.types';
import { StatusPesanan } from '@/types/order.types';
import { formatDateTime, toISODateOnly } from '@/utils/date.utils';
import { getStatusBadgeVariant, getStatusLabel } from '@/utils/status.utils';

export default function DapurDashboardPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [todayOrders, setTodayOrders] = useState<Order[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<Order[]>([]);
  const [, setError] = useState<string | null>(null);

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

        if (!mounted) return;

        setTodayOrders(ordersPage.data ?? []);
        setPendingApprovals(approvals ?? []);
      } catch (e: any) {
        const message: string = e?.message || 'Gagal memuat data dashboard dapur';
        setError(message);
        showError(message);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [todayISO]);

  const menungguCount = useMemo(
    () => todayOrders.filter((o) => o.statusPesanan === StatusPesanan.MENUNGGU).length,
    [todayOrders],
  );
  const inProgressCount = useMemo(
    () => todayOrders.filter((o) => o.statusPesanan === StatusPesanan.IN_PROGRESS).length,
    [todayOrders],
  );
  const readyCount = useMemo(
    () => todayOrders.filter((o) => o.statusPesanan === StatusPesanan.READY).length,
    [todayOrders],
  );
  const pendingApprovalsCount = pendingApprovals.length;

  const queuePreview = useMemo(() => {
    const items = todayOrders
      .filter(
        (o) =>
          o.statusPesanan === StatusPesanan.MENUNGGU ||
          o.statusPesanan === StatusPesanan.IN_PROGRESS ||
          o.statusPesanan === StatusPesanan.READY,
      )
      .slice(0, 8);
    // sort by status and time
    items.sort((a, b) => {
      const statusOrder = (s: string) => {
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
      if (sa !== sb) return sa - sb;
      const ta = a.waktuDiproses ?? a.waktuDibuat ?? a.tanggalPesanan;
      const tb = b.waktuDiproses ?? b.waktuDibuat ?? b.tanggalPesanan;
      return (ta || '').localeCompare(tb || '');
    });
    return items;
  }, [todayOrders]);

  return (
    <div className="px-4 py-4 sm:px-6 sm:py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white">
          Dashboard Dapur
        </h1>
        <div className="flex gap-2">
          <Button variant="primary" size="md" onClick={() => navigate('/orders/queue')} className="whitespace-nowrap">
            Lihat Antrian
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => navigate('/orders/pending-approvals')}
            className="whitespace-nowrap"
          >
            Persetujuan Tertunda
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner variant="primary" size="lg" label="Memuat dashboard dapur..." />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <Card hover padding="lg">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Menunggu</h2>
              <p className="mt-2 sm:mt-4 text-3xl sm:text-4xl font-bold text-amber-600 dark:text-amber-400">
                {menungguCount}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Siap ditindaklanjuti</p>
            </Card>
            <Card hover padding="lg">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Diproses</h2>
              <p className="mt-2 sm:mt-4 text-3xl sm:text-4xl font-bold text-sky-600 dark:text-sky-400">
                {inProgressCount}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Sedang dikerjakan</p>
            </Card>
            <Card hover padding="lg">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Siap</h2>
              <p className="mt-2 sm:mt-4 text-3xl sm:text-4xl font-bold text-violet-600 dark:text-violet-400">
                {readyCount}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Siap untuk diantar</p>
            </Card>
            <Card hover padding="lg">
              <h2 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
                Menunggu Persetujuan
              </h2>
              <p className="mt-2 sm:mt-4 text-3xl sm:text-4xl font-bold text-amber-600 dark:text-amber-400">
                {pendingApprovalsCount}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Permintaan dari dapur</p>
            </Card>
          </div>

          {/* Queue Preview */}
          <Card hover padding="lg">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Preview Antrian Hari Ini</h2>
            <Table<Order>
              ariaLabel="Antrian pesanan dapur"
              dense
              columns={[
                { id: 'kode', header: 'Kode', field: 'kodePesanan', width: 'w-28' },
                {
                  id: 'status',
                  header: 'Status',
                  accessor: (row) => (
                    <Badge variant={getStatusBadgeVariant(row.statusPesanan)}>{getStatusLabel(row.statusPesanan)}</Badge>
                  ),
                  width: 'w-40',
                },
                { id: 'jumlah', header: 'Jumlah', field: 'jumlahPesanan', align: 'right', width: 'w-20' },
                {
                  id: 'waktu',
                  header: 'Mulai Diproses / Dibuat',
                  accessor: (row) =>
                    formatDateTime(row.waktuDiproses ?? row.waktuDibuat ?? row.tanggalPesanan, 'yyyy-MM-dd HH:mm'),
                  width: 'w-48',
                },
              ]}
              data={queuePreview}
              getRowId={(row) => row.id}
              emptyLabel="Tidak ada antrian hari ini"
            />
          </Card>

          {/* Info Workflow Card */}
          <Card hover padding="lg">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Alur Kerja Dapur</h2>
            <ol className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300 list-decimal pl-5">
              <li>Ambil pesanan berstatus Menunggu.</li>
              <li>Ubah status menjadi Diproses saat mulai mengerjakan.</li>
              <li>Jika siap, ubah status menjadi Siap.</li>
              <li>
                Jika perlu penolakan atau perubahan jumlah, ajukan persetujuan (Menunggu Persetujuan) dengan catatan
                yang jelas.
              </li>
            </ol>
            <div className="mt-4 flex gap-2">
              <Button variant="outline" onClick={() => navigate('/orders/queue')}>
                Buka Antrian
              </Button>
              <Button variant="ghost" onClick={() => navigate('/orders/pending-approvals')}>
                Lihat Persetujuan
              </Button>
            </div>
          </Card>

          {/* Tips Card */}
          <Card hover padding="lg">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Tips Penolakan/Edit Persetujuan</h2>
            <ul className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300 list-disc pl-5">
              <li>Sertakan alasan yang spesifik (stok, kualitas, kebijakan).</li>
              <li>Gunakan jumlah baru yang realistis dan sesuai kapasitas.</li>
              <li>Komunikasikan dengan admin jika kasus tidak umum.</li>
            </ul>
          </Card>
        </>
      )}
    </div>
  );
}