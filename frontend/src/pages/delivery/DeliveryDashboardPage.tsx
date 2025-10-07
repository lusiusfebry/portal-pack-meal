// frontend/src/pages/delivery/DeliveryDashboardPage.tsx

import { useEffect, useMemo, useState } from 'react';
import { Card, Button, Badge, Table } from '@/components/ui';
import Spinner from '@/components/ui/Spinner';
import { showError } from '@/components/ui/Toast';
import { useNavigate } from 'react-router-dom';
import { getOrders } from '@/services/api/orders.api';
import type { Order } from '@/types/order.types';
import { StatusPesanan } from '@/types/order.types';
import { formatDateTime, toISODateOnly } from '@/utils/date.utils';
import { getStatusBadgeVariant, getStatusLabel } from '@/utils/status.utils';

export default function DeliveryDashboardPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [todayOrders, setTodayOrders] = useState<Order[]>([]);
  const [, setError] = useState<string | null>(null);

  const todayISO = toISODateOnly(new Date());

  useEffect(() => {
    let mounted = true;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        // Ambil pesanan hari ini; delivery fokus pada READY/ON_DELIVERY/COMPLETE
        const page = await getOrders({ tanggalMulai: todayISO, tanggalAkhir: todayISO, page: 1, limit: 1000 });
        if (!mounted) return;
        setTodayOrders(page.data ?? []);
      } catch (e: any) {
        const message: string = e?.message || 'Gagal memuat data dashboard delivery';
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

  const readyOrders = useMemo(
    () => todayOrders.filter((o) => o.statusPesanan === StatusPesanan.READY),
    [todayOrders],
  );
  const onDeliveryOrders = useMemo(
    () => todayOrders.filter((o) => o.statusPesanan === StatusPesanan.ON_DELIVERY),
    [todayOrders],
  );
  const completedTodayOrders = useMemo(
    () => todayOrders.filter((o) => o.statusPesanan === StatusPesanan.COMPLETE),
    [todayOrders],
  );

  return (
    <div className="px-4 py-4 space-y-6 sm:px-6 sm:py-6">
      {/* Header + Quick Actions (Mobile-first large buttons) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white">
            Dashboard Delivery
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Fokus pada pesanan siap diantar dan pengiriman berjalan.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:flex gap-3">
          <Button
            variant="primary"
            size="lg"
            className="w-full sm:w-auto"
            onClick={() => navigate('/delivery/ready')}
          >
            Lihat Pesanan Siap
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner variant="primary" size="lg" label="Memuat dashboard delivery..." />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <Card hover padding="lg">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Siap Diantar</h2>
              <p className="mt-4 text-4xl font-bold text-violet-600 dark:text-violet-400">{readyOrders.length}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Status READY</p>
            </Card>

            <Card hover padding="lg">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Dalam Pengantaran</h2>
              <p className="mt-4 text-4xl font-bold text-blue-600 dark:text-blue-400">{onDeliveryOrders.length}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Status ON_DELIVERY</p>
            </Card>

            <Card hover padding="lg">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Selesai Hari Ini</h2>
              <p className="mt-4 text-4xl font-bold text-emerald-600 dark:text-emerald-400">
                {completedTodayOrders.length}
              </p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Status COMPLETE</p>
            </Card>
          </div>

          {/* List ringkas (mobile-friendly) pesanan siap */}
          <Card hover padding="lg" className="w-full">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Pesanan Siap</h2>
            <Table<Order>
              ariaLabel="Pesanan siap diantar"
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
                  header: 'Siap Sejak',
                  accessor: (row) => formatDateTime(row.waktuSiap ?? row.waktuDibuat ?? row.tanggalPesanan, 'yyyy-MM-dd HH:mm'),
                  width: 'w-48',
                },
              ]}
              data={readyOrders.slice(0, 8)}
              getRowId={(row) => row.id}
              emptyLabel="Tidak ada pesanan siap saat ini"
            />
            <div className="mt-4">
              <Button
                variant="secondary"
                size="lg"
                className="w-full sm:w-auto"
                onClick={() => navigate('/delivery/ready')}
              >
                Buka Daftar Lengkap
              </Button>
            </div>
          </Card>

          {/* Info Workflow Card */}
          <Card hover padding="lg">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Alur Kerja Delivery</h2>
            <ol className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300 list-decimal pl-5">
              <li>Ambil pesanan berstatus Siap.</li>
              <li>Ubah status menjadi Dalam Pengantaran saat pickup.</li>
              <li>Konfirmasi pengantaran dengan mengubah status menjadi Selesai.</li>
            </ol>
          </Card>
        </>
      )}
    </div>
  );
}