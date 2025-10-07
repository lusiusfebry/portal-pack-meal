// frontend/src/pages/admin/MasterDataPage.tsx

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, Table } from '@/components/ui';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { showError, showSuccess } from '@/components/ui/Toast';
import { DepartmentForm, JabatanForm, ShiftForm, LokasiForm } from '@/components/forms';

import {
  getDepartments,
  getJabatan,
  getShifts,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  createJabatan,
  updateJabatan,
  deleteJabatan,
  createShift,
  updateShift,
  deleteShift,
  getLokasi,
  createLokasi,
  updateLokasi,
  deleteLokasi,
  type CreateDepartmentPayload,
  type UpdateDepartmentPayload,
  type CreateJabatanPayload,
  type UpdateJabatanPayload,
  type CreateShiftPayload,
  type UpdateShiftPayload,
  type CreateLokasiPayload,
  type UpdateLokasiPayload,
} from '@/services/api/master.api';

import useAuthStore from '@/stores/auth.store';
import type { Department, Jabatan, Shift, Lokasi } from '@/types/user.types';

/**
 * MasterDataPage (Administrator only for CRUD)
 * Menampilkan & mengelola Master Data (Departments, Jabatan, Shifts, Lokasi) dalam satu halaman.
 * - Read untuk semua role (di-backend), namun tombol aksi CRUD hanya terlihat untuk administrator.
 * - Menggunakan Modal untuk create/edit dan konfirmasi sebelum delete.
 * - Validasi di form (client-side), notifikasi sukses/error melalui Toast.
 */
export default function MasterDataPage() {
  const { user } = useAuthStore();
  const isAdmin = (user?.role ?? '') === 'administrator';

  const [loading, setLoading] = useState<boolean>(true);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [jabatans, setJabatans] = useState<Jabatan[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [lokasis, setLokasis] = useState<Lokasi[]>([]);

  const [error, setError] = useState<string | null>(null);

  // Create/Edit state — Department
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [deptModalMode, setDeptModalMode] = useState<'create' | 'edit'>('create');
  const [deptEditing, setDeptEditing] = useState<Department | null>(null);
  const [deptSubmitting, setDeptSubmitting] = useState(false);

  // Create/Edit state — Jabatan
  const [jabModalOpen, setJabModalOpen] = useState(false);
  const [jabModalMode, setJabModalMode] = useState<'create' | 'edit'>('create');
  const [jabEditing, setJabEditing] = useState<Jabatan | null>(null);
  const [jabSubmitting, setJabSubmitting] = useState(false);

  // Create/Edit state — Shift
  const [shiftModalOpen, setShiftModalOpen] = useState(false);
  const [shiftModalMode, setShiftModalMode] = useState<'create' | 'edit'>('create');
  const [shiftEditing, setShiftEditing] = useState<Shift | null>(null);
  const [shiftSubmitting, setShiftSubmitting] = useState(false);

  // Create/Edit state — Lokasi
  const [lokasiModalOpen, setLokasiModalOpen] = useState(false);
  const [lokasiModalMode, setLokasiModalMode] = useState<'create' | 'edit'>('create');
  const [lokasiEditing, setLokasiEditing] = useState<Lokasi | null>(null);
  const [lokasiSubmitting, setLokasiSubmitting] = useState(false);

  // Delete confirmation
  type DeleteTarget =
    | { type: 'department'; id: number; name: string }
    | { type: 'jabatan'; id: number; name: string }
    | { type: 'shift'; id: number; name: string }
    | { type: 'lokasi'; id: number; name: string }
    | null;
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);

  const refreshAll = useCallback(async () => {
    setError(null);
    try {
      const [deps, jabs, shf, loks] = await Promise.all([
        getDepartments(),
        getJabatan(),
        getShifts(),
        getLokasi(),
      ]);
      setDepartments(deps ?? []);
      setJabatans(jabs ?? []);
      setShifts(shf ?? []);
      setLokasis(loks ?? []);
    } catch (e: any) {
      const message: string = e?.message || 'Gagal memuat master data';
      setError(message);
      showError(message);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      try {
        await refreshAll();
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [refreshAll]);

  const departmentCount = useMemo(() => departments.length, [departments]);
  const jabatanCount = useMemo(() => jabatans.length, [jabatans]);
  const shiftCount = useMemo(() => shifts.length, [shifts]);
  const lokasiCount = useMemo(() => lokasis.length, [lokasis]);

  // Department actions
  function openCreateDepartment() {
    setDeptEditing(null);
    setDeptModalMode('create');
    setDeptModalOpen(true);
  }
  function openEditDepartment(row: Department) {
    setDeptEditing(row);
    setDeptModalMode('edit');
    setDeptModalOpen(true);
  }
  async function onSubmitDepartment(payload: CreateDepartmentPayload | UpdateDepartmentPayload) {
    if (!isAdmin) return;
    try {
      setDeptSubmitting(true);
      if (deptModalMode === 'create') {
        await createDepartment(payload as CreateDepartmentPayload);
        showSuccess('Departemen berhasil dibuat');
      } else if (deptEditing) {
        await updateDepartment(deptEditing.id, payload as UpdateDepartmentPayload);
        showSuccess('Departemen berhasil diperbarui');
      }
      setDeptModalOpen(false);
      setDeptEditing(null);
      await refreshAll();
    } catch (e: any) {
      showError(e?.message ?? 'Gagal menyimpan departemen');
    } finally {
      setDeptSubmitting(false);
    }
  }
  function requestDeleteDepartment(row: Department) {
    setDeleteTarget({ type: 'department', id: row.id, name: row.namaDivisi });
    setDeleteConfirmOpen(true);
  }

  // Jabatan actions
  function openCreateJabatan() {
    setJabEditing(null);
    setJabModalMode('create');
    setJabModalOpen(true);
  }
  function openEditJabatan(row: Jabatan) {
    setJabEditing(row);
    setJabModalMode('edit');
    setJabModalOpen(true);
  }
  async function onSubmitJabatan(payload: CreateJabatanPayload | UpdateJabatanPayload) {
    if (!isAdmin) return;
    try {
      setJabSubmitting(true);
      if (jabModalMode === 'create') {
        await createJabatan(payload as CreateJabatanPayload);
        showSuccess('Jabatan berhasil dibuat');
      } else if (jabEditing) {
        await updateJabatan(jabEditing.id, payload as UpdateJabatanPayload);
        showSuccess('Jabatan berhasil diperbarui');
      }
      setJabModalOpen(false);
      setJabEditing(null);
      await refreshAll();
    } catch (e: any) {
      showError(e?.message ?? 'Gagal menyimpan jabatan');
    } finally {
      setJabSubmitting(false);
    }
  }
  function requestDeleteJabatan(row: Jabatan) {
    setDeleteTarget({ type: 'jabatan', id: row.id, name: row.namaJabatan });
    setDeleteConfirmOpen(true);
  }

  // Shift actions
  function openCreateShift() {
    setShiftEditing(null);
    setShiftModalMode('create');
    setShiftModalOpen(true);
  }
  function openEditShift(row: Shift) {
    setShiftEditing(row);
    setShiftModalMode('edit');
    setShiftModalOpen(true);
  }
  async function onSubmitShift(payload: CreateShiftPayload | UpdateShiftPayload) {
    if (!isAdmin) return;
    try {
      setShiftSubmitting(true);
      if (shiftModalMode === 'create') {
        await createShift(payload as CreateShiftPayload);
        showSuccess('Shift berhasil dibuat');
      } else if (shiftEditing) {
        await updateShift(shiftEditing.id, payload as UpdateShiftPayload);
        showSuccess('Shift berhasil diperbarui');
      }
      setShiftModalOpen(false);
      setShiftEditing(null);
      await refreshAll();
    } catch (e: any) {
      showError(e?.message ?? 'Gagal menyimpan shift');
    } finally {
      setShiftSubmitting(false);
    }
  }
  function requestDeleteShift(row: Shift) {
    setDeleteTarget({ type: 'shift', id: row.id, name: row.namaShift });
    setDeleteConfirmOpen(true);
  }

  // Lokasi actions
  function openCreateLokasi() {
    setLokasiEditing(null);
    setLokasiModalMode('create');
    setLokasiModalOpen(true);
  }
  function openEditLokasi(row: Lokasi) {
    setLokasiEditing(row);
    setLokasiModalMode('edit');
    setLokasiModalOpen(true);
  }
  async function onSubmitLokasi(payload: CreateLokasiPayload | UpdateLokasiPayload) {
    if (!isAdmin) return;
    try {
      setLokasiSubmitting(true);
      if (lokasiModalMode === 'create') {
        await createLokasi(payload as CreateLokasiPayload);
        showSuccess('Lokasi berhasil dibuat');
      } else if (lokasiEditing) {
        await updateLokasi(lokasiEditing.id, payload as UpdateLokasiPayload);
        showSuccess('Lokasi berhasil diperbarui');
      }
      setLokasiModalOpen(false);
      setLokasiEditing(null);
      await refreshAll();
    } catch (e: any) {
      showError(e?.message ?? 'Gagal menyimpan lokasi');
    } finally {
      setLokasiSubmitting(false);
    }
  }
  function requestDeleteLokasi(row: Lokasi) {
    setDeleteTarget({ type: 'lokasi', id: row.id, name: row.namaLokasi });
    setDeleteConfirmOpen(true);
  }

  async function confirmDelete() {
    if (!isAdmin || !deleteTarget) return;
    try {
      setDeleteSubmitting(true);
      if (deleteTarget.type === 'department') {
        await deleteDepartment(deleteTarget.id);
        showSuccess('Departemen berhasil dihapus');
      } else if (deleteTarget.type === 'jabatan') {
        await deleteJabatan(deleteTarget.id);
        showSuccess('Jabatan berhasil dihapus');
      } else if (deleteTarget.type === 'shift') {
        await deleteShift(deleteTarget.id);
        showSuccess('Shift berhasil dihapus');
      } else if (deleteTarget.type === 'lokasi') {
        await deleteLokasi(deleteTarget.id);
        showSuccess('Lokasi berhasil dihapus');
      }
      setDeleteConfirmOpen(false);
      setDeleteTarget(null);
      await refreshAll();
    } catch (e: any) {
      showError(e?.message ?? 'Gagal menghapus data');
    } finally {
      setDeleteSubmitting(false);
    }
  }

  // Derived map for department name lookup for jabatan table
  const deptNameById = useMemo(() => {
    const map = new Map<number, string>();
    for (const d of departments) map.set(d.id, d.namaDivisi);
    return map;
  }, [departments]);

  return (
    <div className="px-6 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl md:text-3xl font-display font-bold text-slate-900 dark:text-white">
          Master Data
        </h1>
        <div className="text-sm text-slate-600 dark:text-slate-300">
          {isAdmin ? 'Kelola master data (administrator)' : 'Lihat master data'}
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <Card hover padding="lg">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Departments</h2>
            {isAdmin ? (
              <Button size="sm" data-testid="add-department-btn" aria-label="Tambah Departemen" onClick={openCreateDepartment}>Tambah</Button>
            ) : null}
          </div>
          <p className="mt-4 text-4xl font-bold text-slate-900 dark:text-white">{departmentCount}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Total departemen terdaftar
          </p>
        </Card>

        <Card hover padding="lg">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Jabatan</h2>
            {isAdmin ? (
              <Button size="sm" data-testid="add-jabatan-btn" aria-label="Tambah Jabatan" onClick={openCreateJabatan}>Tambah</Button>
            ) : null}
          </div>
          <p className="mt-4 text-4xl font-bold text-slate-900 dark:text-white">{jabatanCount}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Total jabatan beserta departemen terkait
          </p>
        </Card>

        <Card hover padding="lg">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Shifts</h2>
            {isAdmin ? (
              <Button size="sm" data-testid="add-shift-btn" aria-label="Tambah Shift" onClick={openCreateShift}>Tambah</Button>
            ) : null}
          </div>
          <p className="mt-4 text-4xl font-bold text-slate-900 dark:text-white">{shiftCount}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Total shift operasional
          </p>
        </Card>

        <Card hover padding="lg">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Lokasi</h2>
            {isAdmin ? (
              <Button size="sm" data-testid="add-lokasi-btn" aria-label="Tambah Lokasi" onClick={openCreateLokasi}>Tambah</Button>
            ) : null}
          </div>
          <p className="mt-4 text-4xl font-bold text-slate-900 dark:text-white">{lokasiCount}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Total lokasi aktif & non-aktif
          </p>
        </Card>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Spinner variant="primary" size="lg" label="Memuat master data..." />
        </div>
      ) : error ? (
        <div className="py-10">
          <EmptyState
            title="Gagal memuat Master Data"
            description={error}
          />
        </div>
      ) : (
        <>
          {/* Departments Table */}
          <Card hover padding="lg" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Daftar Departemen
              </h2>
              {isAdmin ? <Button size="sm" data-testid="add-department-header-btn" aria-label="Tambah Departemen" onClick={openCreateDepartment}>Tambah Departemen</Button> : null}
            </div>
            <Table<Department & { actions?: React.ReactNode }>
              ariaLabel="Tabel departemen"
              dense
              columns={[
                { id: 'id', header: 'ID', field: 'id', width: 'w-20' },
                { id: 'namaDivisi', header: 'Nama Divisi', field: 'namaDivisi', width: 'w-64' },
                {
                  id: 'keterangan',
                  header: 'Keterangan',
                  accessor: (row) => (row.keterangan ?? '-') as any,
                },
                ...(isAdmin
                  ? [
                      {
                        id: 'actions',
                        header: 'Aksi',
                        width: 'w-48',
                        accessor: (row: any) => (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              data-testid="edit-department-btn"
                              aria-label={`Edit Departemen ${String((row as Department).namaDivisi ?? '')}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditDepartment(row as Department);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              data-testid="delete-department-btn"
                              aria-label={`Hapus Departemen ${String((row as Department).namaDivisi ?? '')}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                requestDeleteDepartment(row as Department);
                              }}
                            >
                              Hapus
                            </Button>
                          </div>
                        ),
                      } as const,
                    ]
                  : []),
              ]}
              data={departments as any[]}
              getRowId={(row) => (row as any).id}
              emptyLabel="Tidak ada data departemen"
            />
          </Card>

          {/* Jabatan Table */}
          <Card hover padding="lg" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Daftar Jabatan
              </h2>
              {isAdmin ? <Button size="sm" data-testid="add-jabatan-header-btn" aria-label="Tambah Jabatan" onClick={openCreateJabatan}>Tambah Jabatan</Button> : null}
            </div>
            <Table<Jabatan & { departmentName?: string }>
              ariaLabel="Tabel jabatan"
              dense
              columns={[
                { id: 'id', header: 'ID', field: 'id', width: 'w-20' },
                { id: 'namaJabatan', header: 'Nama Jabatan', field: 'namaJabatan', width: 'w-64' },
                {
                  id: 'department',
                  header: 'Departemen',
                  accessor: (row) => (row.departmentId ? (deptNameById.get(row.departmentId) ?? '-') : '-'),
                  width: 'w-64',
                },
                {
                  id: 'keterangan',
                  header: 'Keterangan',
                  accessor: (row) => (row.keterangan ?? '-') as any,
                },
                ...(isAdmin
                  ? [
                      {
                        id: 'actions',
                        header: 'Aksi',
                        width: 'w-48',
                        accessor: (row: any) => (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              data-testid="edit-jabatan-btn"
                              aria-label={`Edit Jabatan ${String((row as Jabatan).namaJabatan ?? '')}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditJabatan(row as Jabatan);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              data-testid="delete-jabatan-btn"
                              aria-label={`Hapus Jabatan ${String((row as Jabatan).namaJabatan ?? '')}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                requestDeleteJabatan(row as Jabatan);
                              }}
                            >
                              Hapus
                            </Button>
                          </div>
                        ),
                      } as const,
                    ]
                  : []),
              ]}
              data={jabatans as any[]}
              getRowId={(row) => (row as any).id}
              emptyLabel="Tidak ada data jabatan"
            />
          </Card>

          {/* Shifts Table */}
          <Card hover padding="lg" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Daftar Shifts
              </h2>
              {isAdmin ? <Button size="sm" data-testid="add-shift-header-btn" aria-label="Tambah Shift" onClick={openCreateShift}>Tambah Shift</Button> : null}
            </div>
            <Table<Shift & { actions?: React.ReactNode }>
              ariaLabel="Tabel shifts"
              dense
              columns={[
                { id: 'id', header: 'ID', field: 'id', width: 'w-20' },
                { id: 'namaShift', header: 'Nama Shift', field: 'namaShift', width: 'w-64' },
                {
                  id: 'jamMulai',
                  header: 'Jam Mulai',
                  accessor: (row) => (row.jamMulai ?? '').slice(0, 5),
                  width: 'w-32',
                },
                {
                  id: 'jamSelesai',
                  header: 'Jam Selesai',
                  accessor: (row) => (row.jamSelesai ?? '').slice(0, 5),
                  width: 'w-32',
                },
                {
                  id: 'keterangan',
                  header: 'Keterangan',
                  accessor: (row) => (row.keterangan ?? '-') as any,
                },
                ...(isAdmin
                  ? [
                      {
                        id: 'actions',
                        header: 'Aksi',
                        width: 'w-48',
                        accessor: (row: any) => (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              data-testid="edit-shift-btn"
                              aria-label={`Edit Shift ${String((row as Shift).namaShift ?? '')}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditShift(row as Shift);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              data-testid="delete-shift-btn"
                              aria-label={`Hapus Shift ${String((row as Shift).namaShift ?? '')}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                requestDeleteShift(row as Shift);
                              }}
                            >
                              Hapus
                            </Button>
                          </div>
                        ),
                      } as const,
                    ]
                  : []),
              ]}
              data={shifts as any[]}
              getRowId={(row) => (row as any).id}
              emptyLabel="Tidak ada data shift"
            />
          </Card>

          {/* Lokasi Table */}
          <Card hover padding="lg" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                Daftar Lokasi
              </h2>
              {isAdmin ? <Button size="sm" data-testid="add-lokasi-header-btn" aria-label="Tambah Lokasi" onClick={openCreateLokasi}>Tambah Lokasi</Button> : null}
            </div>
            <Table<Lokasi & { actions?: React.ReactNode }>
              ariaLabel="Tabel lokasi"
              dense
              columns={[
                { id: 'id', header: 'ID', field: 'id', width: 'w-20' },
                { id: 'namaLokasi', header: 'Nama Lokasi', field: 'namaLokasi', width: 'w-64' },
                {
                  id: 'alamat',
                  header: 'Alamat',
                  accessor: (row) => (row.alamat ?? '-') as any,
                  width: 'w-[28rem]',
                },
                {
                  id: 'isActive',
                  header: 'Status',
                  accessor: (row) => ((row.isActive ? 'Aktif' : 'Non-aktif') as any),
                  width: 'w-28',
                },
                {
                  id: 'keterangan',
                  header: 'Keterangan',
                  accessor: (row) => (row.keterangan ?? '-') as any,
                },
                ...(isAdmin
                  ? [
                      {
                        id: 'actions',
                        header: 'Aksi',
                        width: 'w-48',
                        accessor: (row: any) => (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              data-testid="edit-lokasi-btn"
                              aria-label={`Edit Lokasi ${String((row as Lokasi).namaLokasi ?? '')}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditLokasi(row as Lokasi);
                              }}
                            >
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="danger"
                              data-testid="delete-lokasi-btn"
                              aria-label={`Hapus Lokasi ${String((row as Lokasi).namaLokasi ?? '')}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                requestDeleteLokasi(row as Lokasi);
                              }}
                            >
                              Hapus
                            </Button>
                          </div>
                        ),
                      } as const,
                    ]
                  : []),
              ]}
              data={lokasis as any[]}
              getRowId={(row) => (row as any).id}
              emptyLabel="Tidak ada data lokasi"
            />
          </Card>
        </>
      )}

      {/* Department Modal */}
      <Modal
        open={deptModalOpen}
        onClose={() => (!deptSubmitting ? setDeptModalOpen(false) : undefined)}
        title={deptModalMode === 'create' ? 'Tambah Departemen' : 'Edit Departemen'}
        ariaLabel="Dialog Departemen"
      >
        <DepartmentForm
          mode={deptModalMode}
          initial={deptEditing ?? undefined}
          submitting={deptSubmitting}
          onCancel={() => (!deptSubmitting ? setDeptModalOpen(false) : undefined)}
          onSubmit={onSubmitDepartment}
        />
      </Modal>

      {/* Jabatan Modal */}
      <Modal
        open={jabModalOpen}
        onClose={() => (!jabSubmitting ? setJabModalOpen(false) : undefined)}
        title={jabModalMode === 'create' ? 'Tambah Jabatan' : 'Edit Jabatan'}
        ariaLabel="Dialog Jabatan"
      >
        <JabatanForm
          mode={jabModalMode}
          initial={jabEditing ?? undefined}
          departments={departments}
          submitting={jabSubmitting}
          onCancel={() => (!jabSubmitting ? setJabModalOpen(false) : undefined)}
          onSubmit={onSubmitJabatan}
        />
      </Modal>

      {/* Shift Modal */}
      <Modal
        open={shiftModalOpen}
        onClose={() => (!shiftSubmitting ? setShiftModalOpen(false) : undefined)}
        title={shiftModalMode === 'create' ? 'Tambah Shift' : 'Edit Shift'}
        ariaLabel="Dialog Shift"
      >
        <ShiftForm
          mode={shiftModalMode}
          initial={shiftEditing ?? undefined}
          submitting={shiftSubmitting}
          onCancel={() => (!shiftSubmitting ? setShiftModalOpen(false) : undefined)}
          onSubmit={onSubmitShift}
        />
      </Modal>

      {/* Lokasi Modal */}
      <Modal
        open={lokasiModalOpen}
        onClose={() => (!lokasiSubmitting ? setLokasiModalOpen(false) : undefined)}
        title={lokasiModalMode === 'create' ? 'Tambah Lokasi' : 'Edit Lokasi'}
        ariaLabel="Dialog Lokasi"
      >
        <LokasiForm
          mode={lokasiModalMode}
          initial={lokasiEditing ?? undefined}
          submitting={lokasiSubmitting}
          onCancel={() => (!lokasiSubmitting ? setLokasiModalOpen(false) : undefined)}
          onSubmit={onSubmitLokasi}
        />
      </Modal>

      {/* Delete Confirmation */}
      <Modal
        open={deleteConfirmOpen}
        onClose={() => (!deleteSubmitting ? setDeleteConfirmOpen(false) : undefined)}
        title="Konfirmasi Hapus"
        ariaLabel="Dialog Konfirmasi Hapus"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            Apakah Anda yakin ingin menghapus{' '}
            <span className="font-semibold">
              {deleteTarget?.name ?? 'item ini'}
            </span>
            ? Tindakan ini tidak dapat dibatalkan.
          </p>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              disabled={deleteSubmitting}
            >
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={confirmDelete}
              isLoading={deleteSubmitting}
              disabled={deleteSubmitting}
              data-testid="confirm-delete-btn"
              aria-label="Konfirmasi Hapus"
            >
              Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}