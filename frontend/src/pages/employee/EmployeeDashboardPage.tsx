// frontend/src/pages/employee/EmployeeDashboardPage.tsx

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
import { addDays } from 'date-fns';
import { useAuthStore } from '@/stores/auth.store';

export default function EmployeeDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [, setError] = useState<string | null>(null);

  // Ambil 7 hari terakhir agar statistik lebih bermakna
  const todayISO = toISODateOnly(new Date());
  const weekStartISO = toISODateOnly(addDays(new Date(), -6));

  useEffect(() => {
    let mounted = true;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        // Untuk role employee, endpoint GET /orders mengembalikan pesanan milik user
        const page = await getOrders({
          tanggalMulai: weekStartISO,
          tanggalAkhir: todayISO,
          page: 1,
          limit: 200,
        });
        if (!mounted) return;
        setOrders(page.data ?? []);
      } catch (e: any) {
        const message: string = e?.message || 'Gagal memuat pesanan';
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
  }, [todayISO, weekStartISO]);

  const totalCount = orders.length;
  const pendingInProgressCount = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.statusPesanan === StatusPesanan.MENUNGGU ||
          o.statusPesanan === StatusPesanan.IN_PROGRESS,
      ).length,
    [orders],
  );
  const completedCount = useMemo(
    () => orders.filter((o) => o.statusPesanan === StatusPesanan.COMPLETE).length,
    [orders],
  );

  const recentOrders = useMemo(() => {
    const copy = [...orders];
    copy.sort((a, b) => {
      const ta = a.waktuDibuat ?? a.tanggalPesanan;
      const tb = b.waktuDibuat ?? b.tanggalPesanan;
      return (tb || '').localeCompare(ta || '');
    });
    return copy.slice(0, 5);
  }, [orders]);

  return (
    <div className="px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">
            Dashboard Karyawan
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Halo, {user?.nama ?? 'Pengguna'} — pantau pesanan dan buat pesanan baru dengan mudah.
          </p>
        </div>
        <Button
          variant="primary"
          size="lg"
          onClick={() => navigate('/orders/new')}
          className="whitespace-nowrap"
        >
          Buat Pesanan Baru
        </Button>
      </div>
      {/* Profil Karyawan */}
      <Card hover padding="lg" className="mt-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Profil Karyawan</h2>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">NIK</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {user?.nik || '-'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Departemen</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {user?.departmentName ?? 'Belum ditetapkan'}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500 dark:text-slate-400">Jabatan</p>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {user?.jabatanName ?? 'Belum ditetapkan'}
            </p>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner variant="primary" size="lg" label="Memuat dashboard..." />
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card hover padding="lg">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Total Pesanan</h2>
              <p className="mt-4 text-4xl font-bold text-slate-900 dark:text-white">{totalCount}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                7 hari terakhir
              </p>
            </Card>
            <Card hover padding="lg">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Pending / Diproses</h2>
              <p className="mt-4 text-4xl font-bold text-amber-600 dark:text-amber-400">{pendingInProgressCount}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Status MENUNGGU & IN_PROGRESS
              </p>
            </Card>
            <Card hover padding="lg">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Selesai</h2>
              <p className="mt-4 text-4xl font-bold text-emerald-600 dark:text-emerald-400">{completedCount}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Status COMPLETE</p>
            </Card>
          </div>

          {/* Recent Orders */}
          <Card hover padding="lg">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Pesanan Terakhir (5)
            </h2>
            <Table<Order>
              ariaLabel="Pesanan terakhir"
              dense
              columns={[
                { id: 'kode', header: 'Kode', field: 'kodePesanan', width: 'w-32' },
                {
                  id: 'status',
                  header: 'Status',
                  accessor: (row) => (
                    <Badge variant={getStatusBadgeVariant(row.statusPesanan)}>
                      {getStatusLabel(row.statusPesanan)}
                    </Badge>
                  ),
                  width: 'w-40',
                },
                { id: 'jumlah', header: 'Jumlah', field: 'jumlahPesanan', align: 'right', width: 'w-24' },
                {
                  id: 'waktu',
                  header: 'Waktu Dibuat',
                  accessor: (row) => formatDateTime(row.waktuDibuat ?? row.tanggalPesanan, 'yyyy-MM-dd HH:mm'),
                  width: 'w-48',
                },
              ]}
              data={recentOrders}
              getRowId={(row) => row.id}
              emptyLabel="Belum ada pesanan"
            />
          </Card>

          {/* Info Card: Cara Memesan */}
          <Card hover padding="lg">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Cara Memesan Pack Meal
            </h2>
            <ol className="mt-3 space-y-2 text-sm text-slate-700 dark:text-slate-300 list-decimal pl-5">
              <li>Pilih shift yang sesuai dengan jadwal Anda.</li>
              <li>Masukkan jumlah pack meal yang dibutuhkan.</li>
              <li>Tambahkan catatan bila diperlukan.</li>
              <li>Kirim pesanan dan pantau status secara real-time di dashboard ini.</li>
            </ol>
            <div className="mt-4">
              <Button variant="outline" onClick={() => navigate('/orders/new')}>
                Buat Pesanan Baru
              </Button>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}