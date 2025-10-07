// frontend/src/pages/reports/ReportsPage.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select, { type SelectOption } from '@/components/ui/Select';
import DatePicker from '@/components/ui/DatePicker';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { Table, type Column } from '@/components/ui/Table';
import Pagination from '@/components/ui/Pagination';
import { showError, showSuccess } from '@/components/ui/Toast';

import {
  getConsumptionReport,
  getDepartmentReport,
  getPerformanceReport,
  getRejectionReport,
} from '@/services/api/reports.api';

import { getDepartments, getShifts } from '@/services/api/master.api';
import { downloadCSV } from '@/utils/download.utils';
import { formatDateTime, formatDuration } from '@/utils/date.utils';

import type {
  ConsumptionReportItem,
  ConsumptionReportQuery,
  DepartmentReportItem,
  DepartmentReportQuery,
  PerformanceReportQuery,
  PerformanceReportResult,
  RejectionReportQuery,
  RejectionReportPage,
} from '@/types/report.types';

import type { Department, Shift } from '@/types/user.types';
import type { OrderStatus, ApprovalDecision } from '@/types/order.types';

// Recharts
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

// Design system colors (emerald/amber/blue)
const COLORS = {
  emerald: '#10B981',
  emerald700: '#047857',
  amber: '#F59E0B',
  amber700: '#B45309',
  blue: '#3B82F6',
  blue700: '#1D4ED8',
  slate: '#64748B',
};

type TabKey = 'consumption' | 'department' | 'performance' | 'rejections';

const GROUP_BY_OPTIONS: SelectOption[] = [
  { label: 'Harian', value: 'DAILY' },
  { label: 'Mingguan', value: 'WEEKLY' },
  { label: 'Bulanan', value: 'MONTHLY' },
];

const APPROVAL_OPTIONS: SelectOption[] = [
  { label: 'Pending', value: 'PENDING' },
  { label: 'Approved', value: 'APPROVED' },
  { label: 'Rejected', value: 'REJECTED' },
];

const STATUS_OPTIONS: SelectOption[] = [
  { label: 'MENUNGGU', value: 'MENUNGGU' },
  { label: 'IN_PROGRESS', value: 'IN_PROGRESS' },
  { label: 'READY', value: 'READY' },
  { label: 'ON_DELIVERY', value: 'ON_DELIVERY' },
  { label: 'COMPLETE', value: 'COMPLETE' },
  { label: 'DITOLAK', value: 'DITOLAK' },
  { label: 'MENUNGGU_PERSETUJUAN', value: 'MENUNGGU_PERSETUJUAN' },
];

function SectionHeader({
  title,
  description,
  right,
}: {
  title: string;
  description?: string;
  right?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h2 className="text-lg md:text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{description}</p>
        ) : null}
      </div>
      {right}
    </header>
  );
}

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('consumption');

  // Master data for selects
  const [departments, setDepartments] = useState<Department[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);

  const loadMaster = useCallback(async () => {
    try {
      const [dept, shf] = await Promise.all([getDepartments(), getShifts()]);
      setDepartments(dept ?? []);
      setShifts(shf ?? []);
    } catch {
      // stubs already handled in API
    }
  }, []);

  useEffect(() => {
    loadMaster();
  }, [loadMaster]);

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Laporan</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Analitik konsumsi, departemen, kinerja, dan rekap penolakan/edit.
          </p>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={activeTab === 'consumption' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('consumption')}
        >
          Konsumsi
        </Button>
        <Button
          variant={activeTab === 'department' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('department')}
        >
          Departemen
        </Button>
        <Button
          variant={activeTab === 'performance' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('performance')}
        >
          Kinerja
        </Button>
        <Button
          variant={activeTab === 'rejections' ? 'primary' : 'outline'}
          onClick={() => setActiveTab('rejections')}
        >
          Penolakan/Edit
        </Button>
      </div>

      {activeTab === 'consumption' && <ConsumptionTab shifts={shifts} />}
      {activeTab === 'department' && (
        <DepartmentTab departments={departments} shifts={shifts} />
      )}
      {activeTab === 'performance' && (
        <PerformanceTab departments={departments} shifts={shifts} />
      )}
      {activeTab === 'rejections' && <RejectionsTab departments={departments} />}
    </div>
  );
}

/* ===========================
 * Tab: Konsumsi
 * =========================== */
function ConsumptionTab({ shifts }: { shifts: Shift[] }) {
  const [query, setQuery] = useState<ConsumptionReportQuery>({
    groupBy: 'DAILY',
  });
  const [items, setItems] = useState<ConsumptionReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const shiftOptions: SelectOption[] = useMemo(
    () => [{ label: '—', value: '' }, ...shifts.map((s) => ({ label: s.namaShift, value: s.id }))],
    [shifts],
  );

  const onApply = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getConsumptionReport(query);
      setItems(data ?? []);
    } catch (e: any) {
      showError(`Gagal memuat laporan konsumsi: ${e.message ?? String(e)}`);
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  const onReset = () => {
    setQuery({ groupBy: 'DAILY' });
    setItems([]);
  };

  const onDownloadCsv = () => {
    if (!items?.length) {
      showError('Tidak ada data untuk diunduh');
      return;
    }
    const rows = items.map((i) => ({
      period: i.period,
      totalOrders: i.totalOrders,
      totalMeals: i.totalMeals,
    }));
    downloadCSV(rows, 'laporan-konsumsi.csv');
    showSuccess('CSV berhasil diunduh');
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Laporan Konsumsi"
        description="Agregasi total orders dan total meals berdasarkan periode."
        right={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onApply}>
              Terapkan
            </Button>
            <Button variant="ghost" onClick={onReset}>
              Reset
            </Button>
            <Button variant="outline" onClick={onDownloadCsv}>
              Unduh CSV
            </Button>
          </div>
        }
      />

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <DatePicker
            label="Tanggal Mulai"
            value={query.tanggalMulai ?? ''}
            onChange={(e) =>
              setQuery((q) => ({ ...q, tanggalMulai: e.target.value || undefined }))
            }
          />
          <DatePicker
            label="Tanggal Akhir"
            value={query.tanggalAkhir ?? ''}
            onChange={(e) =>
              setQuery((q) => ({ ...q, tanggalAkhir: e.target.value || undefined }))
            }
          />
          <Select
            label="Group By"
            options={GROUP_BY_OPTIONS}
            value={query.groupBy ?? 'DAILY'}
            onChange={(e) =>
              setQuery((q) => ({ ...q, groupBy: (e.target.value as any) || 'DAILY' }))
            }
          />
          <Select
            label="Shift (opsional)"
            options={shiftOptions}
            value={query.shiftId ?? ''}
            onChange={(e) =>
              setQuery((q) => ({
                ...q,
                shiftId: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
          />
        </div>
      </Card>

      <Card>
        {isLoading ? (
          <div className="min-h-[240px] grid place-items-center">
            <Spinner variant="primary" size="lg" label="Memuat data..." />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="Tidak ada data"
            description="Sesuaikan filter lalu klik Terapkan."
          />
        ) : (
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={items}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="totalOrders"
                  stroke={COLORS.blue}
                  name="Total Orders"
                />
                <Line
                  type="monotone"
                  dataKey="totalMeals"
                  stroke={COLORS.emerald}
                  name="Total Meals"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>
    </div>
  );
}

/* ===========================
 * Tab: Departemen
 * =========================== */
function DepartmentTab({ departments, shifts }: { departments: Department[]; shifts: Shift[] }) {
  const [query, setQuery] = useState<DepartmentReportQuery>({});
  const [items, setItems] = useState<DepartmentReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const deptOptions: SelectOption[] = useMemo(
    () => [{ label: '—', value: '' }, ...departments.map((d) => ({ label: d.namaDivisi, value: d.id }))],
    [departments],
  );

  const shiftOptions: SelectOption[] = useMemo(
    () => [{ label: '—', value: '' }, ...shifts.map((s) => ({ label: s.namaShift, value: s.id }))],
    [shifts],
  );

  const statusOptions: SelectOption[] = useMemo(() => STATUS_OPTIONS, []);

  const onApply = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getDepartmentReport(query);
      setItems(data ?? []);
    } catch (e: any) {
      showError(`Gagal memuat laporan departemen: ${e.message ?? String(e)}`);
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  const onReset = () => {
    setQuery({});
    setItems([]);
  };

  const onDownloadCsv = () => {
    if (!items?.length) {
      showError('Tidak ada data untuk diunduh');
      return;
    }
    const rows = items.map((i) => ({
      departmentId: i.departmentId,
      departmentName: i.departmentName,
      totalOrders: i.totalOrders,
      totalMeals: i.totalMeals,
      percentage: i.percentage,
    }));
    downloadCSV(rows, 'laporan-departemen.csv');
    showSuccess('CSV berhasil diunduh');
  };

  const pieColors = useMemo(
    () => [COLORS.emerald, COLORS.amber, COLORS.blue, COLORS.slate, COLORS.emerald700, COLORS.blue700],
    [],
  );

  const columns: Column<DepartmentReportItem>[] = useMemo(
    () => [
      { id: 'dept', header: 'Departemen', accessor: (row) => row.departmentName, align: 'left' },
      { id: 'orders', header: 'Total Orders', accessor: (row) => row.totalOrders, align: 'right' },
      { id: 'meals', header: 'Total Meals', accessor: (row) => row.totalMeals, align: 'right' },
      {
        id: 'percentage',
        header: 'Persentase',
        accessor: (row) => `${row.percentage.toFixed(2)}%`,
        align: 'right',
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Laporan Departemen"
        description="Distribusi pesanan dan meals per departemen."
        right={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onApply}>
              Terapkan
            </Button>
            <Button variant="ghost" onClick={onReset}>
              Reset
            </Button>
            <Button variant="outline" onClick={onDownloadCsv}>
              Unduh CSV
            </Button>
          </div>
        }
      />

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <DatePicker
            label="Tanggal Mulai"
            value={query.tanggalMulai ?? ''}
            onChange={(e) => setQuery((q) => ({ ...q, tanggalMulai: e.target.value || undefined }))}
          />
          <DatePicker
            label="Tanggal Akhir"
            value={query.tanggalAkhir ?? ''}
            onChange={(e) => setQuery((q) => ({ ...q, tanggalAkhir: e.target.value || undefined }))}
          />
          <Select
            label="Departemen"
            options={deptOptions}
            value={query.departmentId ?? ''}
            onChange={(e) =>
              setQuery((q) => ({
                ...q,
                departmentId: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
          />
          <Select
            label="Status (opsional)"
            options={[{ label: '—', value: '' }, ...statusOptions]}
            value={query.status ?? ''}
            onChange={(e) =>
              setQuery((q) => ({
                ...q,
                status: (e.target.value as OrderStatus) || undefined,
              }))
            }
          />
          <Select
            label="Shift (opsional)"
            options={shiftOptions}
            value={query.shiftId ?? ''}
            onChange={(e) =>
              setQuery((q) => ({
                ...q,
                shiftId: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          {isLoading ? (
            <div className="min-h-[240px] grid place-items-center">
              <Spinner variant="primary" size="lg" label="Memuat data..." />
            </div>
          ) : items.length === 0 ? (
            <EmptyState title="Tidak ada data" description="Sesuaikan filter lalu Terapkan." />
          ) : (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip />
                  <Legend />
                  <Pie
                    data={items}
                    dataKey="totalOrders"
                    nameKey="departmentName"
                    cx="50%"
                    cy="50%"
                    outerRadius={110}
                    label
                  >
                    {items.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card>
          <Table columns={columns} data={items} ariaLabel="Tabel Laporan Departemen" emptyLabel="Tidak ada data" />
        </Card>
      </div>
    </div>
  );
}

/* ===========================
 * Tab: Kinerja
 * =========================== */
function PerformanceTab({ departments, shifts }: { departments: Department[]; shifts: Shift[] }) {
  const [query, setQuery] = useState<PerformanceReportQuery>({});
  const [data, setData] = useState<PerformanceReportResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const deptOptions: SelectOption[] = useMemo(
    () => [{ label: '—', value: '' }, ...departments.map((d) => ({ label: d.namaDivisi, value: d.id }))],
    [departments],
  );

  const shiftOptions: SelectOption[] = useMemo(
    () => [{ label: '—', value: '' }, ...shifts.map((s) => ({ label: s.namaShift, value: s.id }))],
    [shifts],
  );

  const onApply = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getPerformanceReport(query);
      setData(res ?? null);
    } catch (e: any) {
      showError(`Gagal memuat laporan kinerja: ${e.message ?? String(e)}`);
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  const onReset = () => {
    setQuery({});
    setData(null);
  };

  const onDownloadCsv = () => {
    if (!data) {
      showError('Tidak ada data untuk diunduh');
      return;
    }
    const rows = [
      {
        metric: 'Rata-rata Total Durasi (menit)',
        value: data.overall.avgTotalDurationMinutes ?? '',
      },
      { metric: 'Rata-rata Processing (menit)', value: data.overall.avgProcessingTimeMinutes ?? '' },
      { metric: 'Rata-rata Preparation (menit)', value: data.overall.avgPreparationTimeMinutes ?? '' },
      { metric: 'Rata-rata Delivery (menit)', value: data.overall.avgDeliveryTimeMinutes ?? '' },
    ];
    downloadCSV(rows, 'laporan-kinerja.csv');
    showSuccess('CSV berhasil diunduh');
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Laporan Kinerja"
        description="Rata-rata durasi proses per tahap, breakdown per departemen dan shift."
        right={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onApply}>
              Terapkan
            </Button>
            <Button variant="ghost" onClick={onReset}>
              Reset
            </Button>
            <Button variant="outline" onClick={onDownloadCsv}>
              Unduh CSV
            </Button>
          </div>
        }
      />

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <DatePicker
            label="Tanggal Mulai"
            value={query.tanggalMulai ?? ''}
            onChange={(e) => setQuery((q) => ({ ...q, tanggalMulai: e.target.value || undefined }))}
          />
          <DatePicker
            label="Tanggal Akhir"
            value={query.tanggalAkhir ?? ''}
            onChange={(e) => setQuery((q) => ({ ...q, tanggalAkhir: e.target.value || undefined }))}
          />
          <Select
            label="Departemen (opsional)"
            options={deptOptions}
            value={query.departmentId ?? ''}
            onChange={(e) =>
              setQuery((q) => ({
                ...q,
                departmentId: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
          />
          <Select
            label="Shift (opsional)"
            options={shiftOptions}
            value={query.shiftId ?? ''}
            onChange={(e) =>
              setQuery((q) => ({
                ...q,
                shiftId: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card>
          {isLoading ? (
            <div className="min-h-[160px] grid place-items-center">
              <Spinner variant="primary" size="lg" label="Memuat KPI..." />
            </div>
          ) : !data ? (
            <EmptyState title="Belum ada data" description="Sesuaikan filter lalu Terapkan." />
          ) : (
            <div className="grid grid-cols-1 gap-4">
              <KpiItem label="Rata-rata Total Durasi" value={formatDuration(data.overall.avgTotalDurationMinutes)} />
              <KpiItem label="Rata-rata Processing" value={formatDuration(data.overall.avgProcessingTimeMinutes)} />
              <KpiItem label="Rata-rata Preparation" value={formatDuration(data.overall.avgPreparationTimeMinutes)} />
              <KpiItem label="Rata-rata Delivery" value={formatDuration(data.overall.avgDeliveryTimeMinutes)} />
            </div>
          )}
        </Card>

        <Card className="xl:col-span-2">
          {isLoading ? (
            <div className="min-h-[240px] grid place-items-center">
              <Spinner variant="primary" size="lg" label="Memuat grafik..." />
            </div>
          ) : !data ? (
            <EmptyState title="Belum ada data" description="Sesuaikan filter lalu Terapkan." />
          ) : (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byDepartment}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="departmentName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avgTotalDurationMinutes" name="Total" fill={COLORS.blue} />
                  <Bar dataKey="avgProcessingTimeMinutes" name="Processing" fill={COLORS.emerald} />
                  <Bar dataKey="avgPreparationTimeMinutes" name="Preparation" fill={COLORS.amber} />
                  <Bar dataKey="avgDeliveryTimeMinutes" name="Delivery" fill={COLORS.slate} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="xl:col-span-3">
          {isLoading ? (
            <div className="min-h-[240px] grid place-items-center">
              <Spinner variant="primary" size="lg" label="Memuat grafik shift..." />
            </div>
          ) : !data ? (
            <EmptyState title="Belum ada data" description="Sesuaikan filter lalu Terapkan." />
          ) : (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.byShift}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="shiftName" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="avgTotalDurationMinutes" name="Total" fill={COLORS.blue} />
                  <Bar dataKey="avgProcessingTimeMinutes" name="Processing" fill={COLORS.emerald} />
                  <Bar dataKey="avgPreparationTimeMinutes" name="Preparation" fill={COLORS.amber} />
                  <Bar dataKey="avgDeliveryTimeMinutes" name="Delivery" fill={COLORS.slate} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function KpiItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-4 bg-white dark:bg-slate-900">
      <p className="text-sm text-slate-600 dark:text-slate-300">{label}</p>
      <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-100">{value}</p>
    </div>
  );
}

/* ===========================
 * Tab: Penolakan/Edit
 * =========================== */
function RejectionsTab({ departments }: { departments: Department[] }) {
  const [query, setQuery] = useState<RejectionReportQuery>({ page: 1, limit: 10 });
  const [pageData, setPageData] = useState<RejectionReportPage | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const deptOptions: SelectOption[] = useMemo(
    () => [{ label: '—', value: '' }, ...departments.map((d) => ({ label: d.namaDivisi, value: d.id }))],
    [departments],
  );

  const approvalOptions: SelectOption[] = useMemo(
    () => [{ label: '—', value: '' }, ...APPROVAL_OPTIONS],
    [],
  );

  const onApply = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getRejectionReport(query);
      setPageData(data ?? null);
    } catch (e: any) {
      showError(`Gagal memuat laporan penolakan/edit: ${e.message ?? String(e)}`);
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  const onReset = () => {
    setQuery({ page: 1, limit: 10 });
    setPageData(null);
  };

  const onDownloadCsv = () => {
    const rows = (pageData?.data ?? []).map((i) => ({
      kode: i.kodePesanan,
      tanggal: formatDateTime(i.waktuDibuat),
      departemen: i.departmentName,
      tipe: i.requestType,
      jumlah_awal: i.jumlahPesananAwal ?? '',
      jumlah_baru: i.jumlahPesanan,
      catatan_dapur: i.catatanDapur ?? '',
      approval_status: i.approvalStatus ?? '',
      catatan_admin: i.catatanAdmin ?? '',
    }));
    if (rows.length === 0) {
      showError('Tidak ada data untuk diunduh');
      return;
    }
    downloadCSV(rows, `laporan-penolakan-edit-p${query.page ?? 1}.csv`);
    showSuccess('CSV berhasil diunduh');
  };

  const columns: Column<any>[] = useMemo(
    () => [
      {
        id: 'kode',
        header: 'Kode',
        accessor: (row) => <span className="font-mono text-sm">{row.kodePesanan}</span>,
        align: 'left',
      },
      {
        id: 'tanggal',
        header: 'Tanggal',
        accessor: (row) => <span className="text-sm">{formatDateTime(row.waktuDibuat)}</span>,
        align: 'left',
      },
      {
        id: 'dept',
        header: 'Departemen',
        accessor: (row) => row.departmentName,
        align: 'left',
      },
      {
        id: 'tipe',
        header: 'Tipe',
        accessor: (row) => row.requestType,
        align: 'center',
      },
      {
        id: 'jumlah',
        header: 'Jumlah',
        accessor: (row) => {
          const awal = row.jumlahPesananAwal;
          const baru = row.jumlahPesanan;
          if (awal != null && awal !== baru) {
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
        id: 'catatanDapur',
        header: 'Catatan Dapur',
        accessor: (row) => <span className="text-sm">{row.catatanDapur ?? '—'}</span>,
        align: 'left',
      },
      {
        id: 'approval',
        header: 'Approval',
        accessor: (row) => row.approvalStatus ?? '—',
        align: 'center',
      },
      {
        id: 'catatanAdmin',
        header: 'Catatan Admin',
        accessor: (row) => <span className="text-sm">{row.catatanAdmin ?? '—'}</span>,
        align: 'left',
      },
    ],
    [],
  );

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Laporan Penolakan/Edit"
        description="Daftar permintaan yang melalui approval admin (paginated)."
        right={
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onApply}>
              Terapkan
            </Button>
            <Button variant="ghost" onClick={onReset}>
              Reset
            </Button>
            <Button variant="outline" onClick={onDownloadCsv}>
              Unduh CSV
            </Button>
          </div>
        }
      />

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <DatePicker
            label="Tanggal Mulai"
            value={query.tanggalMulai ?? ''}
            onChange={(e) => setQuery((q) => ({ ...q, tanggalMulai: e.target.value || undefined }))}
          />
          <DatePicker
            label="Tanggal Akhir"
            value={query.tanggalAkhir ?? ''}
            onChange={(e) => setQuery((q) => ({ ...q, tanggalAkhir: e.target.value || undefined }))}
          />
          <Select
            label="Departemen"
            options={deptOptions}
            value={query.departmentId ?? ''}
            onChange={(e) =>
              setQuery((q) => ({
                ...q,
                departmentId: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
          />
          <Select
            label="Approval Status"
            options={approvalOptions}
            value={query.approvalStatus ?? ''}
            onChange={(e) =>
              setQuery((q) => ({
                ...q,
                approvalStatus: (e.target.value as ApprovalDecision) || undefined,
              }))
            }
          />
          <Input
            label="Limit"
            type="number"
            min={1}
            max={200}
            value={String(query.limit ?? 10)}
            onChange={(e) =>
              setQuery((q) => ({ ...q, limit: Math.max(1, Number(e.target.value || 10)) }))
            }
          />
        </div>
      </Card>

      <Card>
        {isLoading ? (
          <div className="min-h-[240px] grid place-items-center">
            <Spinner variant="primary" size="lg" label="Memuat data..." />
          </div>
        ) : !pageData || pageData.data.length === 0 ? (
          <EmptyState title="Tidak ada data" description="Sesuaikan filter lalu klik Terapkan." />
        ) : (
          <>
            <Table columns={columns} data={pageData.data} ariaLabel="Tabel Rejections" />
            <div className="mt-4 flex justify-end">
              <Pagination
                currentPage={pageData.page}
                totalPages={pageData.totalPages}
                onPageChange={(p) => setQuery((q) => ({ ...q, page: p }))}
              />
            </div>
          </>
        )}
      </Card>
    </div>
  );
}