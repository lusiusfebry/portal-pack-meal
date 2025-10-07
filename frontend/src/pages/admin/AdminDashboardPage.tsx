// frontend/src/pages/admin/AdminDashboardPage.tsx

import { useEffect, useMemo, useState } from 'react';
import { Card, Button, Badge, Table } from '@/components/ui';
import Spinner from '@/components/ui/Spinner';
import { showError } from '@/components/ui/Toast';
import { useNavigate } from 'react-router-dom';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { toISODateOnly, formatDateTime } from '@/utils/date.utils';
import { getStatusBadgeVariant, getStatusLabel } from '@/utils/status.utils';
import {
  getOrders,
  getPendingApprovals,
} from '@/services/api/orders.api';
import {
  getDepartmentReport,
  getConsumptionReport,
} from '@/services/api/reports.api';
import type { Order } from '@/types/order.types';
import type { DepartmentReportItem, ConsumptionReportItem } from '@/types/report.types';
import { StatusPesanan } from '@/types/order.types';
import { addDays } from 'date-fns';

const CHART_COLORS = ['#10B981', '#F59E0B', '#3B82F6', '#8B5CF6', '#0EA5E9', '#64748B', '#C084FC', '#14B8A6'];

interface StatusCount {
  name: string;
  value: number;
}

export default function AdminDashboardPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [todayOrders, setTodayOrders] = useState<Order[]>([]);
  const [deptReport, setDeptReport] = useState<DepartmentReportItem[]>([]);
  const [, setConsumption] = useState<ConsumptionReportItem[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<Order[]>([]);
  const [, setError] = useState<string | null>(null);

  const todayISO = toISODateOnly(new Date());
  const weekStartISO = toISODateOnly(addDays(new Date(), -6));

  useEffect(() => {
    let mounted = true;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [
          todayOrdersPage,
          deptItems,
          consumptionItems,
          pendingApprovalItems,
        ] = await Promise.all([
          getOrders({ tanggalMulai: todayISO, tanggalAkhir: todayISO, page: 1, limit: 1000 }),
          getDepartmentReport({ tanggalMulai: todayISO, tanggalAkhir: todayISO }),
          getConsumptionReport({ tanggalMulai: weekStartISO, tanggalAkhir: todayISO, groupBy: 'DAILY' }),
          getPendingApprovals(),
        ]);

        if (!mounted) return;

        setTodayOrders(todayOrdersPage.data ?? []);
        setDeptReport(deptItems ?? []);
        setConsumption(consumptionItems ?? []);
        setPendingApprovals(pendingApprovalItems ?? []);
      } catch (e: any) {
        const message: string = e?.message || 'Gagal memuat data dashboard';
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

  const totalOrdersToday = todayOrders.length;
  const inProgressCount = useMemo(
    () => todayOrders.filter((o) => o.statusPesanan === StatusPesanan.IN_PROGRESS).length,
    [todayOrders],
  );
  const completedTodayCount = useMemo(
    () => todayOrders.filter((o) => o.statusPesanan === StatusPesanan.COMPLETE).length,
    [todayOrders],
  );
  const pendingApprovalsCount = pendingApprovals.length;

  const statusCounts: StatusCount[] = useMemo(() => {
    const statuses: StatusCount[] = [
      { name: 'Menunggu', value: 0 },
      { name: 'Diproses', value: 0 },
      { name: 'Siap', value: 0 },
      { name: 'Diantar', value: 0 },
      { name: 'Selesai', value: 0 },
      { name: 'Ditolak', value: 0 },
    ];
    for (const o of todayOrders) {
      switch (o.statusPesanan) {
        case StatusPesanan.MENUNGGU:
          statuses[0].value += 1;
          break;
        case StatusPesanan.IN_PROGRESS:
          statuses[1].value += 1;
          break;
        case StatusPesanan.READY:
          statuses[2].value += 1;
          break;
        case StatusPesanan.ON_DELIVERY:
          statuses[3].value += 1;
          break;
        case StatusPesanan.COMPLETE:
          statuses[4].value += 1;
          break;
        case StatusPesanan.DITOLAK:
          statuses[5].value += 1;
          break;
        default:
          break;
      }
    }
    return statuses;
  }, [todayOrders]);

  const recentOrders = useMemo(() => {
    const copy = [...todayOrders];
    copy.sort((a, b) => {
      const ta = a.waktuDibuat ?? a.tanggalPesanan;
      const tb = b.waktuDibuat ?? b.tanggalPesanan;
      return (tb || '').localeCompare(ta || '');
    });
    return copy.slice(0, 10);
  }, [todayOrders]);

  return (
    <div className="px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white">
          Dashboard Admin
        </h1>
        <div className="flex gap-2">
          <Button variant="primary" onClick={() => navigate('/admin/approvals')}>
            Pusat Persetujuan
          </Button>
          <Button variant="secondary" onClick={() => navigate('/orders/new?emergency=1')}>
            Emergency Order
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner variant="primary" size="lg" label="Memuat dashboard..." />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card hover padding="lg">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Total Orders (Hari ini)</h2>
              </div>
              <p className="mt-4 text-4xl font-bold text-slate-900 dark:text-white">{totalOrdersToday}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Semua pesanan dibuat hari ini</p>
            </Card>

            <Card hover padding="lg">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Sedang Diproses</h2>
              </div>
              <p className="mt-4 text-4xl font-bold text-sky-600 dark:text-sky-400">{inProgressCount}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Status IN_PROGRESS</p>
            </Card>

            <Card hover padding="lg">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Selesai (Hari ini)</h2>
              </div>
              <p className="mt-4 text-4xl font-bold text-emerald-600 dark:text-emerald-400">{completedTodayCount}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Status COMPLETE</p>
            </Card>

            <Card hover padding="lg">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Menunggu Persetujuan</h2>
              </div>
              <p className="mt-4 text-4xl font-bold text-amber-600 dark:text-amber-400">{pendingApprovalsCount}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Permintaan approval dari dapur</p>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card hover padding="lg">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Distribusi Pesanan per Departemen (Hari ini)
              </h2>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={deptReport}
                      dataKey="totalOrders"
                      nameKey="departmentName"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {deptReport.map((entry, idx) => (
                        <Cell key={`cell-${entry.departmentId}-${idx}`} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card hover padding="lg">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                Status Pesanan Hari Ini
              </h2>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={statusCounts}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" name="Jumlah" fill="#3B82F6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Recent Activity Table */}
          <Card hover padding="lg" className="w-full">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Aktivitas Terbaru (10 Pesanan)
            </h2>
            <Table<Order>
              ariaLabel="Aktivitas pesanan terbaru"
              dense
              columns={[
                { id: 'kode', header: 'Kode', field: 'kodePesanan', width: 'w-32' },
                {
                  id: 'status',
                  header: 'Status',
                  accessor: (row) => (
                    <Badge variant={getStatusBadgeVariant(row.statusPesanan)}>{getStatusLabel(row.statusPesanan)}</Badge>
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
              emptyLabel="Tidak ada pesanan hari ini"
            />
          </Card>
        </>
      )}
    </div>
  );
}