// frontend/src/pages/users/UsersManagementPage.tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Table, type Column } from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select, { type SelectOption } from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import Card from '@/components/ui/Card';

import { showError, showSuccess, showInfo } from '@/components/ui/Toast';

import { formatDateTime } from '@/utils/date.utils';

import {
  getUsers,
  createUser,
  updateUserStatus,
  updateUserRole,
  resetUserPassword,
  updateUserProfile,
  type CreateUserPayload,
} from '@/services/api/users.api';

import { getDepartments, getJabatan } from '@/services/api/master.api';

import type {
  KaryawanProfile,
  UpdateUserStatusPayload,
  UpdateUserRolePayload,
  Department,
  Jabatan,
} from '@/types/user.types';
import type { Role } from '@/types/auth.types';

// Role options for Select
const ROLE_OPTIONS: SelectOption[] = [
  { label: 'Administrator', value: 'administrator' },
  { label: 'Employee', value: 'employee' },
  { label: 'Dapur', value: 'dapur' },
  { label: 'Delivery', value: 'delivery' },
];

// Status options for Select
const STATUS_OPTIONS: SelectOption[] = [
  { label: 'Aktif', value: 'active' },
  { label: 'Nonaktif', value: 'inactive' },
];

const DEFAULT_PAGE_SIZE = 10;

interface CreateUserFormState {
  nik: string;
  namaLengkap: string;
  password: string;
  roleAccess: Role | '';
  departmentId?: number | null;
  jabatanId?: number | null;
  keterangan?: string | null;
}

export default function UsersManagementPage() {
  // Data and derived state
  const [users, setUsers] = useState<KaryawanProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Filters
  const [searchText, setSearchText] = useState('');
  const [filterRole, setFilterRole] = useState<Role | ''>('');
  const [filterStatus, setFilterStatus] = useState<'active' | 'inactive' | ''>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);

  // Master data for form
  const [departments, setDepartments] = useState<Department[]>([]);
  const [jabatans, setJabatans] = useState<Jabatan[]>([]);

  // Create User Modal
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState<CreateUserFormState>({
    nik: '',
    namaLengkap: '',
    password: '',
    roleAccess: '',
    departmentId: null,
    jabatanId: null,
    keterangan: '',
  });
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [isCreating, setIsCreating] = useState(false);

  // Reset Password Modal
  const [openResetModal, setOpenResetModal] = useState(false);
  const [resetTarget, setResetTarget] = useState<KaryawanProfile | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const [resetResult, setResetResult] = useState<{ tempPassword: string } | null>(null);
// Edit User Modal state
const [openEditModal, setOpenEditModal] = useState(false);
const [editTarget, setEditTarget] = useState<KaryawanProfile | null>(null);
interface EditUserFormState {
  namaLengkap: string;
  departmentId?: number | null;
  jabatanId?: number | null;
}
const [editForm, setEditForm] = useState<EditUserFormState>({
  namaLengkap: '',
  departmentId: null,
  jabatanId: null,
});
const [editErrors, setEditErrors] = useState<Record<string, string>>({});
const [isEditing, setIsEditing] = useState(false);

  // Data loading
  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const list = await getUsers();
      setUsers(list ?? []);
    } catch (e: any) {
      const msg = e?.message ?? String(e);
      setLoadError(msg);
      showError(`Gagal memuat pengguna: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMasterData = useCallback(async () => {
    try {
      const [deptList, jabList] = await Promise.all([getDepartments(), getJabatan()]);
      setDepartments(deptList ?? []);
      setJabatans(jabList ?? []);
    } catch {
      // Fallback stub handled in master.api; just ignore errors
    }
  }, []);

  useEffect(() => {
    loadUsers();
    loadMasterData();
  }, [loadUsers, loadMasterData]);

  // Client-side filtering
  const filteredUsers = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    return (users ?? []).filter((u) => {
      const matchesText =
        !q ||
        u.nomorIndukKaryawan.toLowerCase().includes(q) ||
        u.namaLengkap.toLowerCase().includes(q);

      const matchesRole = !filterRole || u.roleAccess === filterRole;

      const matchesStatus =
        !filterStatus ||
        (filterStatus === 'active' ? u.isActive === true : u.isActive === false);

      return matchesText && matchesRole && matchesStatus;
    });
  }, [users, searchText, filterRole, filterStatus]);

  // Pagination slicing
  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  }, [filteredUsers.length, pageSize]);

  const paginatedUsers = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return filteredUsers.slice(startIdx, startIdx + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  useEffect(() => {
    // Reset to page 1 when filters change to keep UX consistent
    setCurrentPage(1);
  }, [searchText, filterRole, filterStatus, pageSize]);

  // Helpers
  function getRoleBadgeVariant(role: Role): BadgeProps['variant'] {
    switch (role) {
      case 'administrator':
        return 'info';
      case 'employee':
        return 'neutral';
      case 'dapur':
        return 'warning';
      case 'delivery':
        return 'success';
      default:
        return 'neutral';
    }
  }

  // Inline Actions
  async function handleChangeRole(row: KaryawanProfile, newRole: Role) {
    const karyawanId = row.id;
    if (!karyawanId) {
      showError('Karyawan ID tidak tersedia untuk perubahan role');
      return;
    }

    const payload: UpdateUserRolePayload = { userId: karyawanId, role: newRole };
    try {
      const updated = await updateUserRole(payload);
      showSuccess('Role pengguna berhasil diperbarui');
      // Update local state
      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? { ...u, roleAccess: updated.roleAccess } : u)),
      );
    } catch (e: any) {
      showError(`Gagal mengubah role: ${e.message ?? String(e)}`);
    }
  }

  async function handleToggleStatus(row: KaryawanProfile) {
    const karyawanId = row.id;
    if (!karyawanId) {
      showError('Karyawan ID tidak tersedia untuk perubahan status');
      return;
    }
    const newStatus = row.isActive ? 'inactive' : 'active';
    const payload: UpdateUserStatusPayload = { userId: karyawanId, status: newStatus };
    try {
      const updated = await updateUserStatus(payload);
      showSuccess(`Status pengguna diubah menjadi ${updated.isActive ? 'Aktif' : 'Nonaktif'}`);
      setUsers((prev) =>
        prev.map((u) => (u.id === updated.id ? { ...u, isActive: updated.isActive } : u)),
      );
    } catch (e: any) {
      showError(`Gagal mengubah status: ${e.message ?? String(e)}`);
    }
  }

  function openResetPassword(row: KaryawanProfile) {
    setResetTarget(row);
    setResetResult(null);
    setOpenResetModal(true);
  }

  async function confirmResetPassword() {
    if (!resetTarget) return;
    const karyawanId = resetTarget.id;
    if (!karyawanId) {
      showError('Karyawan ID tidak tersedia untuk reset password');
      return;
    }
    setIsResetting(true);
    try {
      const res = await resetUserPassword(karyawanId);
      setResetResult({ tempPassword: res.tempPassword });
      showSuccess('Password sementara telah dibuat');
    } catch (e: any) {
      showError(`Gagal reset password: ${e.message ?? String(e)}`);
    } finally {
      setIsResetting(false);
    }
  }

  // Create user form handlers
  function validateCreateForm(state: CreateUserFormState): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!state.nik || state.nik.trim().length < 3) {
      errors.nik = 'NIK minimal 3 karakter';
    }
    if (!state.namaLengkap || state.namaLengkap.trim().length === 0) {
      errors.namaLengkap = 'Nama lengkap wajib diisi';
    }
    if (!state.password || state.password.trim().length < 6) {
      errors.password = 'Password minimal 6 karakter';
    }
    if (!state.roleAccess) {
      errors.roleAccess = 'Role wajib dipilih';
    }
    return errors;
  }

  function handleCreateFormChange<K extends keyof CreateUserFormState>(
    key: K,
    value: CreateUserFormState[K],
  ) {
    setCreateForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submitCreateUser() {
    const errors = validateCreateForm(createForm);
    setCreateErrors(errors);
    if (Object.keys(errors).length > 0) return;

    const payload: CreateUserPayload = {
      nik: createForm.nik.trim(),
      namaLengkap: createForm.namaLengkap.trim(),
      password: createForm.password.trim(),
      roleAccess: createForm.roleAccess as Role,
      departmentId: createForm.departmentId ?? null,
      jabatanId: createForm.jabatanId ?? null,
      keterangan: createForm.keterangan?.trim() || null,
    };

    setIsCreating(true);
    try {
      const created = await createUser(payload);
      showSuccess('Pengguna baru berhasil dibuat');
      setUsers((prev) => [created, ...prev]);
      setOpenCreateModal(false);
      setCreateForm({
        nik: '',
        namaLengkap: '',
        password: '',
        roleAccess: '',
        departmentId: null,
        jabatanId: null,
        keterangan: '',
      });
      setCreateErrors({});
    } catch (e: any) {
      showError(`Gagal membuat pengguna: ${e.message ?? String(e)}`);
    } finally {
      setIsCreating(false);
    }
  }
// Edit user helpers
function validateEditForm(state: EditUserFormState): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!state.namaLengkap || state.namaLengkap.trim().length === 0) {
    errors.namaLengkap = 'Nama lengkap wajib diisi';
  }
  return errors;
}

function handleEditFormChange<K extends keyof EditUserFormState>(
  key: K,
  value: EditUserFormState[K],
) {
  setEditForm((prev) => ({ ...prev, [key]: value }));
}

function openEditUser(row: KaryawanProfile) {
  setEditTarget(row);
  setEditErrors({});
  setEditForm({
    namaLengkap: row.namaLengkap ?? '',
    // Prefer existing primitive ids; fallback to relation if missing
    departmentId:
      typeof row.departmentId !== 'undefined'
        ? row.departmentId ?? null
        : (row.department?.id ?? null),
    jabatanId:
      typeof row.jabatanId !== 'undefined'
        ? row.jabatanId ?? null
        : (row.jabatan?.id ?? null),
  });
  setOpenEditModal(true);
}

async function submitEditUser() {
  if (!editTarget) {
    showError('Target pengguna tidak tersedia untuk diedit');
    return;
  }
  const errs = validateEditForm(editForm);
  setEditErrors(errs);
  if (Object.keys(errs).length > 0) return;

  const karyawanId = editTarget.id;
  const payload = {
    userId: karyawanId,
    namaLengkap: editForm.namaLengkap.trim(),
    // Kirim null untuk menghapus, atau number untuk set; biarkan undefined jika tidak ingin mengubah (tidak digunakan disini)
    departmentId:
      typeof editForm.departmentId !== 'undefined'
        ? editForm.departmentId ?? null
        : undefined,
    jabatanId:
      typeof editForm.jabatanId !== 'undefined'
        ? editForm.jabatanId ?? null
        : undefined,
  };

  setIsEditing(true);
  try {
    const updated = await updateUserProfile(payload as any);
    showSuccess('Profil pengguna berhasil diperbarui');

    // Update local state dari hasil backend (dengan relasi)
    setUsers((prev) =>
      prev.map((u) =>
        u.id === updated.id
          ? {
              ...u,
              namaLengkap: updated.namaLengkap,
              departmentId: updated.departmentId ?? null,
              jabatanId: updated.jabatanId ?? null,
              department: updated.department ?? null,
              jabatan: updated.jabatan ?? null,
            }
          : u,
      ),
    );

    setOpenEditModal(false);
    setEditTarget(null);
  } catch (e: any) {
    showError(`Gagal memperbarui profil: ${e?.message ?? String(e)}`);
  } finally {
    setIsEditing(false);
  }
}

// Table columns
  const columns: Column<KaryawanProfile>[] = useMemo(
    () => [
      {
        id: 'nik',
        header: 'NIK',
        accessor: (row) => (
          <span className="font-mono text-sm">{row.nomorIndukKaryawan}</span>
        ),
        align: 'left',
      },
      {
        id: 'nama',
        header: 'Nama',
        accessor: (row) => <span className="text-sm">{row.namaLengkap}</span>,
        align: 'left',
      },
      {
        id: 'role',
        header: 'Role',
        accessor: (row) => (
          <div className="flex items-center gap-2">
            <Badge variant={getRoleBadgeVariant(row.roleAccess)} size="sm">
              {row.roleAccess}
            </Badge>
            <Select
              aria-label="Ubah role"
              options={ROLE_OPTIONS}
              value={row.roleAccess}
              onChange={(e) => handleChangeRole(row, e.target.value as Role)}
              className="w-[140px]"
            />
          </div>
        ),
        align: 'left',
      },
      {
        id: 'department',
        header: 'Department',
        accessor: (row) => (
          <span className="text-sm">
            {row.department?.namaDivisi ?? '—'}
          </span>
        ),
        align: 'left',
      },
      {
        id: 'jabatan',
        header: 'Jabatan',
        accessor: (row) => (
          <span className="text-sm">
            {row.jabatan?.namaJabatan ?? '—'}
          </span>
        ),
        align: 'left',
      },
      {
        id: 'status',
        header: 'Status',
        accessor: (row) => (
          <div className="flex items-center gap-2 justify-center">
            <Badge variant={row.isActive ? 'success' : 'error'} size="sm">
              {row.isActive ? 'Aktif' : 'Nonaktif'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleToggleStatus(row)}
            >
              {row.isActive ? 'Nonaktifkan' : 'Aktifkan'}
            </Button>
          </div>
        ),
        align: 'center',
      },
      {
        id: 'created',
        header: 'Dibuat',
        accessor: (row) => (
          <span className="text-sm">{row.createdAt ? formatDateTime(row.createdAt) : '—'}</span>
        ),
        align: 'left',
      },
      {
        id: 'aksi',
        header: 'Aksi',
        accessor: (row) => (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openEditUser(row)}
            >
              Edit
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => openResetPassword(row)}
            >
              Reset Password
            </Button>
          </div>
        ),
        align: 'center',
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Manajemen Pengguna</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Kelola pengguna: role, status, dan reset password. Tambah pengguna baru melalui modal.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={() => setOpenCreateModal(true)}>
            Buat Pengguna Baru
          </Button>
          <Button variant="outline" onClick={() => loadUsers()}>
            Muat Ulang
          </Button>
        </div>
      </header>

      {/* Filters */}
      <Card padding="md">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            label="Cari (NIK atau Nama)"
            placeholder="Masukkan NIK atau nama..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
          <Select
            label="Role"
            placeholder="Pilih role"
            options={ROLE_OPTIONS}
            value={filterRole || ''}
            onChange={(e) => setFilterRole((e.target.value as Role) || '')}
          />
          <Select
            label="Status"
            placeholder="Pilih status"
            options={STATUS_OPTIONS}
            value={filterStatus || ''}
            onChange={(e) =>
              setFilterStatus((e.target.value as 'active' | 'inactive') || '')
            }
          />
          <div className="flex items-end gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                // Apply: do nothing, filters already reactive
                showInfo('Filter diterapkan');
              }}
            >
              Terapkan
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setSearchText('');
                setFilterRole('');
                setFilterStatus('');
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      </Card>

      {/* Content */}
      {isLoading ? (
        <div className="min-h-[30vh] grid place-items-center">
          <Spinner variant="primary" size="lg" label="Memuat pengguna..." />
        </div>
      ) : loadError ? (
        <EmptyState
          title="Gagal memuat data pengguna"
          description={loadError}
          action={{
            label: 'Coba lagi',
            variant: 'outline',
            onClick: () => loadUsers(),
          }}
        />
      ) : filteredUsers.length === 0 ? (
        <EmptyState
          title="Tidak ada pengguna"
          description="Coba ubah filter atau buat pengguna baru."
          action={{
            label: 'Buat Pengguna Baru',
            variant: 'primary',
            onClick: () => setOpenCreateModal(true),
          }}
        />
      ) : (
        <>
          <Table
            columns={columns}
            data={paginatedUsers}
            ariaLabel="Tabel Pengguna"
            emptyLabel="Tidak ada data"
          />
          {filteredUsers.length > pageSize && (
            <div className="flex justify-end">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={(p) => setCurrentPage(p)}
                ariaLabel="Navigasi halaman pengguna"
              />
            </div>
          )}
        </>
      )}

      {/* Create User Modal */}
      <Modal
        open={openCreateModal}
        onClose={() => {
          if (!isCreating) setOpenCreateModal(false);
        }}
        title="Buat Pengguna Baru"
        description="Lengkapi form berikut untuk menambahkan pengguna baru."
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="NIK"
            placeholder="Contoh: EMP001"
            value={createForm.nik}
            onChange={(e) => handleCreateFormChange('nik', e.target.value)}
            error={createErrors.nik}
          />
          <Input
            label="Nama Lengkap"
            placeholder="Nama lengkap pengguna"
            value={createForm.namaLengkap}
            onChange={(e) => handleCreateFormChange('namaLengkap', e.target.value)}
            error={createErrors.namaLengkap}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Password sementara"
            value={createForm.password}
            onChange={(e) => handleCreateFormChange('password', e.target.value)}
            error={createErrors.password}
          />
          <Select
            label="Role"
            placeholder="Pilih role"
            options={ROLE_OPTIONS}
            value={createForm.roleAccess || ''}
            onChange={(e) =>
              handleCreateFormChange('roleAccess', (e.target.value as Role) || '')
            }
          />
          <Select
            label="Department (opsional)"
            placeholder="Pilih department"
            options={[
              { label: '—', value: '' },
              ...departments.map((d) => ({ label: d.namaDivisi, value: d.id })),
            ]}
            value={createForm.departmentId ?? ''}
            onChange={(e) =>
              handleCreateFormChange(
                'departmentId',
                e.target.value ? Number(e.target.value) : null,
              )
            }
          />
          <Select
            label="Jabatan (opsional)"
            placeholder="Pilih jabatan"
            options={[
              { label: '—', value: '' },
              ...jabatans.map((j) => ({ label: j.namaJabatan, value: j.id })),
            ]}
            value={createForm.jabatanId ?? ''}
            onChange={(e) =>
              handleCreateFormChange(
                'jabatanId',
                e.target.value ? Number(e.target.value) : null,
              )
            }
          />
          <Input
            label="Keterangan (opsional)"
            placeholder="Catatan tambahan"
            value={createForm.keterangan ?? ''}
            onChange={(e) => handleCreateFormChange('keterangan', e.target.value)}
          />
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => setOpenCreateModal(false)}
            disabled={isCreating}
          >
            Batal
          </Button>
          <Button
            variant="primary"
            onClick={submitCreateUser}
            isLoading={isCreating}
            disabled={isCreating}
          >
            Simpan
          </Button>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        open={openEditModal}
        onClose={() => {
          if (!isEditing) {
            setOpenEditModal(false);
            setEditTarget(null);
            setEditErrors({});
          }
        }}
        title="Edit Profil Pengguna"
        description={
          editTarget ? (
            <span>
              Ubah profil untuk{' '}
              <span className="font-semibold">{editTarget.namaLengkap}</span>{' '}
              (<span className="font-mono">{editTarget.nomorIndukKaryawan}</span>)
            </span>
          ) : undefined
        }
        size="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Nama Lengkap"
            placeholder="Nama lengkap pengguna"
            value={editForm.namaLengkap}
            onChange={(e) => handleEditFormChange('namaLengkap', e.target.value)}
            error={editErrors.namaLengkap}
          />
          <Select
            label="Department (opsional)"
            placeholder="Pilih department"
            options={[
              { label: '—', value: '' },
              ...departments.map((d) => ({ label: d.namaDivisi, value: d.id })),
            ]}
            value={editForm.departmentId ?? ''}
            onChange={(e) =>
              handleEditFormChange(
                'departmentId',
                e.target.value ? Number(e.target.value) : null,
              )
            }
          />
          <Select
            label="Jabatan (opsional)"
            placeholder="Pilih jabatan"
            options={[
              { label: '—', value: '' },
              ...jabatans.map((j) => ({ label: j.namaJabatan, value: j.id })),
            ]}
            value={editForm.jabatanId ?? ''}
            onChange={(e) =>
              handleEditFormChange(
                'jabatanId',
                e.target.value ? Number(e.target.value) : null,
              )
            }
          />
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <Button
            variant="ghost"
            onClick={() => setOpenEditModal(false)}
            disabled={isEditing}
          >
            Batal
          </Button>
          <Button
            variant="primary"
            onClick={submitEditUser}
            isLoading={isEditing}
            disabled={isEditing}
          >
            Simpan
          </Button>
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <Modal
        open={openResetModal}
        onClose={() => {
          if (!isResetting) {
            setOpenResetModal(false);
            setResetTarget(null);
            setResetResult(null);
          }
        }}
        title="Reset Password Pengguna"
        description={
          resetTarget ? (
            <span>
              Reset password untuk{' '}
              <span className="font-semibold">{resetTarget.namaLengkap}</span>{' '}
              (<span className="font-mono">{resetTarget.nomorIndukKaryawan}</span>)
            </span>
          ) : undefined
        }
        size="md"
      >
        {resetResult ? (
          <div className="space-y-4">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              Password sementara berhasil dibuat. Berikan informasi ini kepada pengguna dan sarankan untuk segera mengganti password.
            </p>
            <Card padding="sm" className="bg-slate-50 dark:bg-slate-800/60">
              <p className="text-sm">
                Password sementara:{' '}
                <span className="font-mono text-base">{resetResult.tempPassword}</span>
              </p>
            </Card>
            <div className="flex items-center justify-end">
              <Button
                variant="primary"
                onClick={() => {
                  setOpenResetModal(false);
                  setResetTarget(null);
                  setResetResult(null);
                }}
              >
                Tutup
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => setOpenResetModal(false)} disabled={isResetting}>
              Batal
            </Button>
            <Button
              variant="danger"
              onClick={confirmResetPassword}
              isLoading={isResetting}
              disabled={isResetting}
            >
              Konfirmasi Reset
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

// Types for Badge props mapping
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'success' | 'warning' | 'error' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}