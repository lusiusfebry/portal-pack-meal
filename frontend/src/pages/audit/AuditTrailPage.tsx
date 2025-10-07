// frontend/src/pages/audit/AuditTrailPage.tsx
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
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { showError, showSuccess } from '@/components/ui/Toast';

import {
  getAuditTrail,
  getAuditTrailActionTypes,
  getAuditTrailByOrder,
} from '@/services/api/reports.api';

import { downloadCSV } from '@/utils/download.utils';
import { formatDateTime } from '@/utils/date.utils';

import type {
  AuditTrailEntry,
  AuditTrailPage,
  AuditTrailQuery,
} from '@/types/report.types';

const QUICK_ACTIONS = [
  'LOGIN_FAILURE',
  'ORDER_STATUS_CHANGED',
  'APPROVAL_DECISION',
  'USER_CREATED',
  'USER_STATUS_CHANGED',
];

// Regex untuk mendeteksi kode pesanan format PM-YYYYMMDD-XXX
const ORDER_CODE_REGEX = /PM-\d{8}-\d{3}/i;

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
        <h2 className="text-lg md:text-xl font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            {description}
          </p>
        ) : null}
      </div>
      {right}
    </header>
  );
}

export default function AuditTrailPage() {
  // Query server-side
  const [query, setQuery] = useState<AuditTrailQuery>({
    page: 1,
    limit: 10,
  });

  // Client-side search (aksi/detail/user)
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [nikTerm, setNikTerm] = useState<string>('');

  // Data & loading
  const [pageData, setPageData] = useState<AuditTrailPage | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Actions list
  const [actionTypes, setActionTypes] = useState<string[]>([]);

  // Modal Riwayat Pesanan
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyCode, setHistoryCode] = useState('');
  const [historyEntries, setHistoryEntries] = useState<AuditTrailEntry[]>([]);

  // Load action types
  const loadActionTypes = useCallback(async () => {
    try {
      const types = await getAuditTrailActionTypes();
      setActionTypes(types ?? []);
    } catch (e: any) {
      // non-blocking
    }
  }, []);

  useEffect(() => {
    loadActionTypes();
  }, [loadActionTypes]);

  // Fetch audit trail
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getAuditTrail(query);
      setPageData(data ?? null);
    } catch (e: any) {
      showError(`Gagal memuat audit trail: ${e.message ?? String(e)}`);
    } finally {
      setIsLoading(false);
    }
  }, [query]);

  // Apply
  const onApply = useCallback(() => {
    // Reset ke page 1 saat apply filter
    setQuery((q) => ({ ...q, page: 1 }));
  }, []);

  // Trigger fetch saat query berubah
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset
  const onReset = () => {
    setQuery({ page: 1, limit: 10 });
    setSearchTerm('');
    setNikTerm('');
    setPageData(null);
  };

  // Export CSV dari data yang sedang tampil (client-side)
  const onDownloadCsv = () => {
    const rows = (filteredRows ?? []).map((row) => ({
      timestamp: formatDateTime(row.timestamp),
      user_nama: row.user?.namaLengkap ?? '',
      user_nik: row.user?.nomorIndukKaryawan ?? '',
      user_role: row.user?.roleAccess ?? '',
      aksi: row.aksi,
      detail: row.detail ?? '',
    }));
    if (rows.length === 0) {
      showError('Tidak ada data untuk diunduh');
      return;
    }
    downloadCSV(rows, `audit-trail-p${pageData?.page ?? query.page ?? 1}.csv`);
    showSuccess('CSV berhasil diunduh');
  };

  // Action select options
  const actionOptions: SelectOption[] = useMemo(
    () => [{ label: '—', value: '' }, ...actionTypes.map((a) => ({ label: a, value: a }))],
    [actionTypes],
  );

  // Columns untuk tabel
  const columns: Column<AuditTrailEntry>[] = useMemo(
    () => [
      {
        id: 'ts',
        header: 'Timestamp',
        accessor: (row) => (
          <span className="text-sm">{formatDateTime(row.timestamp)}</span>
        ),
        align: 'left',
      },
      {
        id: 'user',
        header: 'User',
        accessor: (row) => {
          const name = row.user?.namaLengkap ?? '—';
          const nik = row.user?.nomorIndukKaryawan ?? '—';
          const role = row.user?.roleAccess ?? '';
          return (
            <div className="flex items-center gap-2">
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{name}</div>
                <div className="text-xs text-slate-600 dark:text-slate-400">
                  {nik}
                </div>
              </div>
              {role ? <Badge size="sm" variant="info">{role}</Badge> : null}
            </div>
          );
        },
        align: 'left',
      },
      {
        id: 'aksi',
        header: 'Aksi',
        accessor: (row) => (
          <div className="flex items-center gap-2">
            <Badge size="sm" variant="neutral">{row.aksi}</Badge>
          </div>
        ),
        align: 'left',
      },
      {
        id: 'detail',
        header: 'Detail',
        accessor: (row) => (
          <div className="text-sm max-w-[420px] truncate" title={row.detail ?? ''}>
            {row.detail ?? '—'}
          </div>
        ),
        align: 'left',
      },
      {
        id: 'riwayat',
        header: 'Riwayat',
        accessor: (row) => {
          const detectedCode = extractOrderCode(row.detail ?? '');
          const disabled = !detectedCode;
          return (
            <div className="flex justify-center">
              <Button
                size="sm"
                variant="outline"
                disabled={disabled}
                aria-disabled={disabled}
                onClick={() => {
                  if (!disabled && detectedCode) {
                    openHistoryFor(detectedCode);
                  }
                }}
                title={
                  disabled
                    ? 'Kode pesanan tidak terdeteksi di detail'
                    : `Lihat riwayat ${detectedCode}`
                }
              >
                Riwayat
              </Button>
            </div>
          );
        },
        align: 'center',
      },
    ],
    [],
  );

  // Client-side filter dari searchTerm & nikTerm
  const filteredRows: AuditTrailEntry[] = useMemo(() => {
    const base = pageData?.data ?? [];
    if (!searchTerm && !nikTerm) return base;
    const s = (searchTerm ?? '').toLowerCase();
    const nk = (nikTerm ?? '').toLowerCase();
    return base.filter((row) => {
      const inSearch =
        !s ||
        row.aksi.toLowerCase().includes(s) ||
        (row.detail ?? '').toLowerCase().includes(s);
      const inNik =
        !nk ||
        (row.user?.nomorIndukKaryawan ?? '').toLowerCase().includes(nk);
      return inSearch && inNik;
    });
  }, [pageData, searchTerm, nikTerm]);

  // Quick action chips
  const isQuickSelected = (a: string) => query.action === a;
  const onQuickAction = (a: string) =>
    setQuery((q) => ({ ...q, action: q.action === a ? undefined : a, page: 1 }));

  // Open modal history (manual or from row)
  const openHistoryFor = async (code: string) => {
    setHistoryCode(code);
    setHistoryOpen(true);
    setHistoryLoading(true);
    try {
      const entries = await getAuditTrailByOrder(code);
      setHistoryEntries(entries ?? []);
    } catch (e: any) {
      showError(`Gagal memuat riwayat pesanan: ${e.message ?? String(e)}`);
      setHistoryEntries([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Manual open via input
  const [manualCode, setManualCode] = useState('');

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Audit Trail
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Riwayat aksi pengguna dan sistem untuk keperluan audit dan analisis.
          </p>
        </div>
      </header>

      <Card>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
          <Input
            label="Cari (aksi/detail)"
            placeholder="Ketik untuk mencari…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Select
            label="Aksi"
            options={actionOptions}
            value={query.action ?? ''}
            onChange={(e) =>
              setQuery((q) => ({
                ...q,
                action: e.target.value || undefined,
              }))
            }
          />
          <Input
            label="User ID (opsional)"
            type="number"
            inputMode="numeric"
            value={String(query.userId ?? '')}
            onChange={(e) =>
              setQuery((q) => ({
                ...q,
                userId: e.target.value ? Number(e.target.value) : undefined,
              }))
            }
          />
          <Input
            label="NIK (client filter)"
            placeholder="Filter lokal berdasarkan NIK"
            value={nikTerm}
            onChange={(e) => setNikTerm(e.target.value)}
          />
          <DatePicker
            label="Tanggal Mulai"
            value={query.tanggalMulai ?? ''}
            onChange={(e) =>
              setQuery((q) => ({
                ...q,
                tanggalMulai: e.target.value || undefined,
              }))
            }
          />
          <DatePicker
            label="Tanggal Akhir"
            value={query.tanggalAkhir ?? ''}
            onChange={(e) =>
              setQuery((q) => ({
                ...q,
                tanggalAkhir: e.target.value || undefined,
              }))
            }
          />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button variant="secondary" onClick={onApply}>
            Terapkan
          </Button>
          <Button variant="ghost" onClick={onReset}>
            Reset
          </Button>
          <Button variant="outline" onClick={onDownloadCsv}>
            Unduh CSV
          </Button>

          <div className="hidden md:block h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

          <div className="flex flex-wrap gap-2">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a}
                type="button"
                className={[
                  'px-2.5 py-1 rounded-full text-xs font-medium border',
                  isQuickSelected(a)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-600',
                ].join(' ')}
                onClick={() => onQuickAction(a)}
                aria-pressed={isQuickSelected(a)}
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      </Card>

      <Card>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <SectionHeader
            title="Data Audit Trail"
            description="Gunakan pencarian dan filter untuk mempersempit hasil."
          />
          <div className="flex items-end gap-2">
            <Input
              label="Kode Pesanan"
              placeholder="PM-YYYYMMDD-XXX"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
            />
            <Button
              variant="outline"
              onClick={() => {
                const code = (manualCode ?? '').trim();
                if (!ORDER_CODE_REGEX.test(code)) {
                  showError('Format kode pesanan tidak valid. Contoh: PM-20251001-001');
                  return;
                }
                openHistoryFor(code);
              }}
            >
              Riwayat Pesanan
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="min-h-[260px] grid place-items-center">
            <Spinner variant="primary" size="lg" label="Memuat data..." />
          </div>
        ) : !pageData || (filteredRows?.length ?? 0) === 0 ? (
          <EmptyState
            title="Tidak ada data"
            description="Sesuaikan filter lalu klik Terapkan."
          />
        ) : (
          <>
            <Table
              columns={columns}
              data={filteredRows}
              ariaLabel="Tabel Audit Trail"
              emptyLabel="Tidak ada entri"
            />
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <span>
                  Menampilkan {filteredRows.length} dari {pageData.total} entri
                </span>
                <span className="hidden sm:inline">•</span>
                <label className="flex items-center gap-2">
                  <span>Per halaman</span>
                  <Input
                    type="number"
                    min={1}
                    max={200}
                    value={String(query.limit ?? 10)}
                    onChange={(e) =>
                      setQuery((q) => ({
                        ...q,
                        limit: Math.max(1, Number(e.target.value || 10)),
                        page: 1,
                      }))
                    }
                  />
                </label>
              </div>
              <Pagination
                currentPage={pageData.page}
                totalPages={pageData.totalPages}
                onPageChange={(p) => setQuery((q) => ({ ...q, page: p }))}
              />
            </div>
          </>
        )}
      </Card>

      <Modal
        title={`Riwayat Pesanan ${historyCode || ''}`}
        open={historyOpen}
        onClose={() => {
          setHistoryOpen(false);
          setHistoryEntries([]);
          setHistoryCode('');
        }}
      >
        {historyLoading ? (
          <div className="min-h-[200px] grid place-items-center">
            <Spinner variant="primary" size="lg" label="Memuat riwayat..." />
          </div>
        ) : historyEntries.length === 0 ? (
          <EmptyState
            title="Tidak ada riwayat"
            description="Tidak ditemukan entri audit untuk kode pesanan ini."
          />
        ) : (
          <div className="space-y-3">
            {historyEntries.map((e) => (
              <div
                key={e.id}
                className="rounded-md border border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-900"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">
                    {formatDateTime(e.timestamp)}
                  </div>
                  <Badge size="sm" variant="neutral">
                    {e.aksi}
                  </Badge>
                </div>
                <div className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                  {e.detail ?? '—'}
                </div>
                <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                  {e.user?.namaLengkap ?? '—'} ({e.user?.nomorIndukKaryawan ?? '—'}){' '}
                  {e.user?.roleAccess ? `• ${e.user?.roleAccess}` : ''}
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  );
}

function extractOrderCode(detail: string): string | null {
  const m = (detail ?? '').match(ORDER_CODE_REGEX);
  return m?.[0] ?? null;
}