// frontend/src/pages/orders/OrdersListPage.tsx

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import Table, { type Column } from '@/components/ui/Table';
import Pagination from '@/components/ui/Pagination';
import Select, { type SelectOption } from '@/components/ui/Select';
import DatePicker from '@/components/ui/DatePicker';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import Badge from '@/components/ui/Badge';

import { useAuthStore } from '@/stores/auth.store';

import {
  getOrders,
} from '@/services/api/orders.api';
import {
  getDepartments,
  getShifts,
} from '@/services/api/master.api';

import {
  StatusPesanan,
  type Order,
  type OrderStatus,
  type QueryOrdersParams,
} from '@/types/order.types';
import type { Role } from '@/types/auth.types';
import type { Paginated } from '@/types/report.types';

import {
  formatDate,
  toISODateOnly,
  isValidDateOnlyString,
} from '@/utils/date.utils';
import {
  getStatusLabel,
  getStatusBadgeVariant,
} from '@/utils/status.utils';

// Offline caching helpers (IndexedDB)
import { saveOrdersToCache, getOrdersFromCache } from '@/utils';
// Icon for offline indicator banner
import { SignalSlashIcon } from '@heroicons/react/24/outline';

import useWebSocket from '@/hooks/useWebSocket';
import { showError, showInfo } from '@/components/ui/Toast';

/**
 * OrdersListPage
 * - Role-based listing:
 *   - administrator: semua pesanan
 *   - employee: hanya pesanan milik karyawan tersebut
 *   - dapur: antrian proses (backend akan memfilter sesuai role)
 *   - delivery: pesanan siap diantar/sedang diantar (backend per role)
 *
 * Fitur:
 * - Filters: status, department, shift, tanggal (range), search (client-side for kodePesanan)
 * - Tabel dengan pagination
 * - Quick action: Create Order (employee only)
 * - Real-time updates via WebSocket (order.created, order.status.changed)
 * - Loading & error handling, responsive/mobile-friendly (overflow table)
 * - Offline mode dengan IndexedDB cache (fallback saat tidak ada koneksi)
 */

type DepartmentOption = { id: number; label: string };
type ShiftOption = { id: number; label: string };

// UI state untuk filters
interface FiltersState {
  status?: OrderStatus | '';
  departmentId?: number | '';
  shiftId?: number | '';
  tanggalMulai?: string; // 'yyyy-MM-dd'
  tanggalAkhir?: string; // 'yyyy-MM-dd'
  search?: string; // client-side filter untuk kodePesanan
}

const DEFAULT_LIMIT = 10;

export default function OrdersListPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const role: Role | undefined = user?.role;

  // Connection status untuk informasi kecil di header
  const wsStatusCreated = useWebSocket('order.created', useCallback((payload) => {
    // Event sederhana: lakukan refresh list
    showInfo(`Pesanan baru dibuat${payload?.kodePesanan ? `: ${payload.kodePesanan}` : ''}`);
    // Refetch halaman aktif
    refetch();
  }, []));
  const wsStatusChanged = useWebSocket('order.status.changed', useCallback((payload) => {
    showInfo(`Status ${payload.kodePesanan ?? '#'+payload.orderId} berubah menjadi ${getStatusLabel(payload.newStatus)}`);
    refetch();
  }, []));

  const [filters, setFilters] = useState<FiltersState>({
    status: '',
    departmentId: '',
    shiftId: '',
    tanggalMulai: '',
    tanggalAkhir: '',
    search: '',
  });

  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(DEFAULT_LIMIT);
  const [dataSet, setDataSet] = useState<Paginated<Order> | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Offline mode indicator
  const [isOffline, setIsOffline] = useState<boolean>(false);

  // Master options
  const [departmentOptions, setDepartmentOptions] = useState<DepartmentOption[]>([]);
  const [shiftOptions, setShiftOptions] = useState<ShiftOption[]>([]);

  // Derived UI data (client-side search by kodePesanan)
  const filteredData = useMemo(() => {
    const items = dataSet?.data ?? [];
    const q = (filters.search ?? '').trim().toLowerCase();
    if (!q) return items;
    return items.filter((o) => (o.kodePesanan ?? '').toLowerCase().includes(q));
  }, [dataSet, filters.search]);

  const totalPages = useMemo(() => dataSet?.totalPages ?? 1, [dataSet]);

  // Mapping id→label untuk dept/shift
  const departmentLabelById = useMemo(() => {
    const map = new Map<number, string>();
    departmentOptions.forEach((d) => map.set(d.id, d.label));
    return map;
  }, [departmentOptions]);
  const shiftLabelById = useMemo(() => {
    const map = new Map<number, string>();
    shiftOptions.forEach((s) => map.set(s.id, s.label));
    return map;
  }, [shiftOptions]);

  // Status options
  const statusOptions: SelectOption[] = useMemo(
    () => [
      { label: 'Semua Status', value: '' },
      { label: getStatusLabel(StatusPesanan.MENUNGGU), value: StatusPesanan.MENUNGGU },
      { label: getStatusLabel(StatusPesanan.IN_PROGRESS), value: StatusPesanan.IN_PROGRESS },
      { label: getStatusLabel(StatusPesanan.READY), value: StatusPesanan.READY },
      { label: getStatusLabel(StatusPesanan.ON_DELIVERY), value: StatusPesanan.ON_DELIVERY },
      { label: getStatusLabel(StatusPesanan.COMPLETE), value: StatusPesanan.COMPLETE },
      { label: getStatusLabel(StatusPesanan.DITOLAK), value: StatusPesanan.DITOLAK },
      { label: getStatusLabel(StatusPesanan.MENUNGGU_PERSETUJUAN), value: StatusPesanan.MENUNGGU_PERSETUJUAN },
    ],
    [],
  );

  const buildQueryParams = useCallback((): QueryOrdersParams => {
    const params: QueryOrdersParams = {
      page,
      limit,
    };
    if (filters.status && typeof filters.status === 'string' && filters.status.length > 0) {
      params.status = filters.status as OrderStatus;
    }
    if (typeof filters.departmentId === 'number') {
      params.departmentId = filters.departmentId;
    }
    if (typeof filters.shiftId === 'number') {
      params.shiftId = filters.shiftId;
    }
    if (isValidDateOnlyString(filters.tanggalMulai ?? '')) {
      params.tanggalMulai = filters.tanggalMulai!;
    }
    if (isValidDateOnlyString(filters.tanggalAkhir ?? '')) {
      params.tanggalAkhir = filters.tanggalAkhir!;
    }
    // Catatan: search tidak ada di API → client-side filter
    return params;
  }, [filters, page, limit]);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const params = buildQueryParams();
      // DEBUG: log query params during development to verify 'status' and other filters
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.debug('[OrdersListPage] Query params:', params);
      }
      const pageData = await getOrders(params);
      setDataSet(pageData);
      // Berhasil fetch dari jaringan → simpan cache & reset offline indicator
      setIsOffline(false);
      // Simpan list pesanan ke IndexedDB untuk fallback offline
      await saveOrdersToCache(pageData.data);
    } catch (error: any) {
      const message = (error?.message as string) ?? 'Gagal memuat daftar pesanan';
      setLoadError(message);
      // Jika perangkat offline, fallback ke cache IndexedDB
      if (!navigator.onLine) {
        try {
          const cached = await getOrdersFromCache();
          if (cached.length > 0) {
            // Bangun data paginated dari cache sesuai page & limit saat ini
            const total = cached.length;
            const startIdx = (page - 1) * limit;
            const slice = cached.slice(Math.max(0, startIdx), Math.max(0, startIdx) + limit);
            const totalPagesCalc = Math.max(1, Math.ceil(total / limit));
            setDataSet({
              data: slice,
              total,
              page,
              limit,
              totalPages: totalPagesCalc,
            });
            setIsOffline(true);
            setLoadError(null);
            showInfo('Menampilkan data offline. Beberapa pesanan mungkin tidak terbaru.');
          }
        } catch (cacheErr) {
          // Jika gagal membaca cache, tetap tampilkan error awal
          // eslint-disable-next-line no-console
          console.error('[OrdersListPage] Offline cache read error', cacheErr);
        }
      } else {
        // Online namun gagal → tampilkan error biasa
        showError(message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [buildQueryParams, page, limit]);

  const applyFilters = useCallback(() => {
    // Reset ke page 1 saat filter berubah
    setPage(1);
    // Refetch
    void refetch();
  }, [refetch]);

  const resetFilters = useCallback(() => {
    setFilters({
      status: '',
      departmentId: '',
      shiftId: '',
      tanggalMulai: '',
      tanggalAkhir: '',
      search: '',
    });
    setPage(1);
    void refetch();
  }, [refetch]);

  // Load master options
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [depts, shifts] = await Promise.all([getDepartments(), getShifts()]);
        if (!mounted) return;
        setDepartmentOptions(depts.map((d) => ({ id: d.id, label: d.namaDivisi })));
        setShiftOptions(shifts.map((s) => ({ id: s.id, label: s.namaShift })));
      } catch {
        // Fallback ke stub sudah dilakukan di service
      }
    })();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initial fetch + whenever page/limit changes
  useEffect(() => {
    void refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  // Table columns
  const columns: Array<Column<Order>> = useMemo(() => {
    return [
      {
        id: 'kode',
        header: 'Kode',
        accessor: (row) => (
          <span className="font-medium text-slate-900 dark:text-slate-100">{row.kodePesanan}</span>
        ),
      },
      {
        id: 'dept',
        header: 'Departemen',
        accessor: (row) => (
          <span className="text-slate-700 dark:text-slate-300">
            {row.departemen?.namaDivisi ?? departmentLabelById.get(row.departmentPemesanId) ?? `Dept #${row.departmentPemesanId}`}
          </span>
        ),
      },
      {
        id: 'shift',
        header: 'Shift',
        accessor: (row) => (
          <span className="text-slate-700 dark:text-slate-300">
            {row.shift ? `${row.shift.namaShift} (${row.shift.jamMulai?.slice(0,5)}-${row.shift.jamSelesai?.slice(0,5)})` : shiftLabelById.get(row.shiftId) ?? `Shift #${row.shiftId}`}
          </span>
        ),
      },
      {
        id: 'jumlah',
        header: 'Jumlah',
        accessor: (row) => <span>{row.jumlahPesanan}</span>,
        align: 'right',
        width: 'w-24',
      },
      {
        id: 'tanggal',
        header: 'Tanggal',
        accessor: (row) => (
          <span className="text-slate-700 dark:text-slate-300">
            {formatDate(row.tanggalPesanan, 'yyyy-MM-dd')}
          </span>
        ),
      },
      {
        id: 'status',
        header: 'Status',
        accessor: (row) => (
          <Badge variant={getStatusBadgeVariant(row.statusPesanan)}>
            {getStatusLabel(row.statusPesanan)}
          </Badge>
        ),
        align: 'center',
        width: 'w-40',
      },
    ];
  }, [departmentLabelById, shiftLabelById]);

  const onRowClick = useCallback(
    (row: Order) => {
      navigate(`/orders/${row.id}`);
    },
    [navigate],
  );

  const headerSubtitle = useMemo(() => {
    switch (role) {
      case 'administrator':
        return 'Semua pesanan (peran: Administrator)';
      case 'employee':
        return 'Pesanan Anda (peran: Employee)';
      case 'dapur':
        return 'Antrian dapur (peran: Dapur)';
      case 'delivery':
        return 'Daftar pengantaran (peran: Delivery)';
      default:
        return 'Daftar pesanan';
    }
  }, [role]);

  const renderHeader = () => (
    <div className="mb-4 flex flex-col gap-1">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900 dark:text-white">
            Pesanan
          </h1>
          <p className="text-sm text-slate-700 dark:text-slate-300">{headerSubtitle}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Realtime: order.created [{wsStatusCreated}] · order.status.changed [{wsStatusChanged}]
          </p>
        </div>
        {role === 'employee' ? (
          <Button
            variant="primary"
            onClick={() => navigate('/orders/new')}
            leftIcon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                <path strokeWidth="2" strokeLinecap="round" d="M12 5v14M5 12h14" />
              </svg>
            }
          >
            Buat Pesanan
          </Button>
        ) : null}
      </div>
    </div>
  );

  const renderOfflineBanner = () =>
    isOffline ? (
      <div className="mb-4 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-100 dark:bg-amber-900/20 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-200">
            <SignalSlashIcon className="h-5 w-5" aria-hidden="true" />
            <span className="text-sm font-medium">Mode Offline - Menampilkan data yang di-cache</span>
          </div>
          <Button variant="outline" onClick={() => void refetch()}>
            Coba Lagi
          </Button>
        </div>
      </div>
    ) : null;

  const offlineTooltip = isOffline ? 'Filter tidak tersedia saat offline' : undefined;

  const renderFilters = () => (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4 md:p-5 shadow-sm mb-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        <Select
          label="Status"
          options={statusOptions}
          value={filters.status ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, status: (e.target.value as OrderStatus) || '' }))}
          placeholder="Pilih status"
          disabled={isOffline}
          title={offlineTooltip}
        />
        <Select
          label="Departemen"
          options={[
            { label: 'Semua Departemen', value: '' },
            ...departmentOptions.map((d) => ({ label: d.label, value: d.id })),
          ]}
          value={typeof filters.departmentId === 'number' ? filters.departmentId : ''}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              departmentId: e.target.value ? Number(e.target.value) : '',
            }))
          }
          placeholder="Pilih departemen"
          disabled={isOffline}
          title={offlineTooltip}
        />
        <Select
          label="Shift"
          options={[
            { label: 'Semua Shift', value: '' },
            ...shiftOptions.map((s) => ({ label: s.label, value: s.id })),
          ]}
          value={typeof filters.shiftId === 'number' ? filters.shiftId : ''}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              shiftId: e.target.value ? Number(e.target.value) : '',
            }))
          }
          placeholder="Pilih shift"
          disabled={isOffline}
          title={offlineTooltip}
        />
        <DatePicker
          label="Tanggal Mulai"
          value={filters.tanggalMulai ?? ''}
          onChange={(e) => {
            const v = e.currentTarget.value;
            setFilters((f) => ({ ...f, tanggalMulai: v ? toISODateOnly(v) : '' }));
          }}
          helperText="Format: yyyy-MM-dd"
          disabled={isOffline}
          title={offlineTooltip}
        />
        <DatePicker
          label="Tanggal Akhir"
          value={filters.tanggalAkhir ?? ''}
          onChange={(e) => {
            const v = e.currentTarget.value;
            setFilters((f) => ({ ...f, tanggalAkhir: v ? toISODateOnly(v) : '' }));
          }}
          helperText="Format: yyyy-MM-dd"
          disabled={isOffline}
          title={offlineTooltip}
        />
        <Input
          label="Cari Kode Pesanan"
          placeholder="Misal: PM-20251002-001"
          value={filters.search ?? ''}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.currentTarget.value }))}
          disabled={isOffline}
          title={offlineTooltip}
        />
      </div>

      <div className="mt-4 flex items-center gap-2">
        <Button variant="primary" onClick={applyFilters} disabled={isOffline} title={offlineTooltip}>
          Terapkan Filter
        </Button>
        <Button variant="outline" onClick={resetFilters} disabled={isOffline} title={offlineTooltip}>
          Reset
        </Button>
        <div className="ml-auto flex items-center gap-2">
          <label htmlFor="limit" className="text-sm text-slate-700 dark:text-slate-300">Tampilkan</label>
          <select
            id="limit"
            className="px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-sm"
            value={limit}
            onChange={(e) => {
              const n = Number(e.target.value);
              setLimit(Number.isFinite(n) && n > 0 ? n : DEFAULT_LIMIT);
              setPage(1);
            }}
            disabled={isOffline}
            title={offlineTooltip}
          >
            {[10, 20, 50].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <span className="text-sm text-slate-700 dark:text-slate-300">per halaman</span>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="w-full flex items-center justify-center py-12">
          <Spinner variant="primary" size="lg" label="Memuat pesanan..." />
        </div>
      );
    }
    if (loadError) {
      return (
        <EmptyState
          title="Gagal memuat data"
          description={loadError}
          action={{
            label: 'Coba Lagi',
            onClick: () => void refetch(),
            variant: 'primary',
          }}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" d="M12 9v4M12 17h.01M4.93 4.93l14.14 14.14" />
            </svg>
          }
        />
      );
    }
    if (!dataSet || (dataSet.data.length === 0 && !filters.search)) {
      return (
        <EmptyState
          title="Belum ada pesanan"
          description="Coba buat pesanan baru atau ubah filter untuk melihat data."
          action={
            role === 'employee'
              ? {
                  label: 'Buat Pesanan',
                  onClick: () => navigate('/orders/new'),
                  variant: 'primary',
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                      <path strokeWidth="2" strokeLinecap="round" d="M12 5v14M5 12h14" />
                    </svg>
                  ),
                }
              : undefined
          }
        />
      );
    }

    // Jika ada pencarian client-side dan hasil filter menjadi kosong
    if (dataSet && filteredData.length === 0 && (filters.search ?? '').trim().length > 0) {
      return (
        <EmptyState
          title="Tidak ada hasil"
          description="Ubah kata kunci pencarian atau reset filter untuk menampilkan data."
        />
      );
    }

    return (
      <>
        <Table<Order>
          columns={columns}
          data={filteredData}
          getRowId={(row) => row.id}
          onRowClick={onRowClick}
          ariaLabel="Daftar pesanan"
          emptyLabel="Tidak ada pesanan"
        />
        <div className="mt-4 flex items-center justify-between">
          <div className="text-sm text-slate-700 dark:text-slate-300">
            Total: {dataSet?.total ?? 0} • Halaman {page} dari {totalPages}
          </div>
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={(p) => {
              setPage(p);
              // Fetch triggered by effect on page change
            }}
            showEdges
            compact
          />
        </div>
      </>
    );
  };

  return (
    <div className="px-6 py-6">
      {renderOfflineBanner()}
      {renderHeader()}
      {renderFilters()}
      {renderContent()}
    </div>
  );
}