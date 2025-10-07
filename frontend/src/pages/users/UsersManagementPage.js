import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
// frontend/src/pages/users/UsersManagementPage.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Table } from '@/components/ui/Table';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import Pagination from '@/components/ui/Pagination';
import Card from '@/components/ui/Card';
import { showError, showSuccess, showInfo } from '@/components/ui/Toast';
import { formatDateTime } from '@/utils/date.utils';
import { getUsers, createUser, updateUserStatus, updateUserRole, resetUserPassword, updateUserProfile, } from '@/services/api/users.api';
import { getDepartments, getJabatan } from '@/services/api/master.api';
// Role options for Select
const ROLE_OPTIONS = [
    { label: 'Administrator', value: 'administrator' },
    { label: 'Employee', value: 'employee' },
    { label: 'Dapur', value: 'dapur' },
    { label: 'Delivery', value: 'delivery' },
];
// Status options for Select
const STATUS_OPTIONS = [
    { label: 'Aktif', value: 'active' },
    { label: 'Nonaktif', value: 'inactive' },
];
const DEFAULT_PAGE_SIZE = 10;
export default function UsersManagementPage() {
    // Data and derived state
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [loadError, setLoadError] = useState(null);
    // Filters
    const [searchText, setSearchText] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(DEFAULT_PAGE_SIZE);
    // Master data for form
    const [departments, setDepartments] = useState([]);
    const [jabatans, setJabatans] = useState([]);
    // Create User Modal
    const [openCreateModal, setOpenCreateModal] = useState(false);
    const [createForm, setCreateForm] = useState({
        nik: '',
        namaLengkap: '',
        password: '',
        roleAccess: '',
        departmentId: null,
        jabatanId: null,
        keterangan: '',
    });
    const [createErrors, setCreateErrors] = useState({});
    const [isCreating, setIsCreating] = useState(false);
    // Reset Password Modal
    const [openResetModal, setOpenResetModal] = useState(false);
    const [resetTarget, setResetTarget] = useState(null);
    const [isResetting, setIsResetting] = useState(false);
    const [resetResult, setResetResult] = useState(null);
    // Edit User Modal state
    const [openEditModal, setOpenEditModal] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [editForm, setEditForm] = useState({
        namaLengkap: '',
        departmentId: null,
        jabatanId: null,
    });
    const [editErrors, setEditErrors] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    // Data loading
    const loadUsers = useCallback(async () => {
        setIsLoading(true);
        setLoadError(null);
        try {
            const list = await getUsers();
            setUsers(list ?? []);
        }
        catch (e) {
            const msg = e?.message ?? String(e);
            setLoadError(msg);
            showError(`Gagal memuat pengguna: ${msg}`);
        }
        finally {
            setIsLoading(false);
        }
    }, []);
    const loadMasterData = useCallback(async () => {
        try {
            const [deptList, jabList] = await Promise.all([getDepartments(), getJabatan()]);
            setDepartments(deptList ?? []);
            setJabatans(jabList ?? []);
        }
        catch {
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
            const matchesText = !q ||
                u.nomorIndukKaryawan.toLowerCase().includes(q) ||
                u.namaLengkap.toLowerCase().includes(q);
            const matchesRole = !filterRole || u.roleAccess === filterRole;
            const matchesStatus = !filterStatus ||
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
    function getRoleBadgeVariant(role) {
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
    async function handleChangeRole(row, newRole) {
        const karyawanId = row.id;
        if (!karyawanId) {
            showError('Karyawan ID tidak tersedia untuk perubahan role');
            return;
        }
        const payload = { userId: karyawanId, role: newRole };
        try {
            const updated = await updateUserRole(payload);
            showSuccess('Role pengguna berhasil diperbarui');
            // Update local state
            setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, roleAccess: updated.roleAccess } : u)));
        }
        catch (e) {
            showError(`Gagal mengubah role: ${e.message ?? String(e)}`);
        }
    }
    async function handleToggleStatus(row) {
        const karyawanId = row.id;
        if (!karyawanId) {
            showError('Karyawan ID tidak tersedia untuk perubahan status');
            return;
        }
        const newStatus = row.isActive ? 'inactive' : 'active';
        const payload = { userId: karyawanId, status: newStatus };
        try {
            const updated = await updateUserStatus(payload);
            showSuccess(`Status pengguna diubah menjadi ${updated.isActive ? 'Aktif' : 'Nonaktif'}`);
            setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, isActive: updated.isActive } : u)));
        }
        catch (e) {
            showError(`Gagal mengubah status: ${e.message ?? String(e)}`);
        }
    }
    function openResetPassword(row) {
        setResetTarget(row);
        setResetResult(null);
        setOpenResetModal(true);
    }
    async function confirmResetPassword() {
        if (!resetTarget)
            return;
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
        }
        catch (e) {
            showError(`Gagal reset password: ${e.message ?? String(e)}`);
        }
        finally {
            setIsResetting(false);
        }
    }
    // Create user form handlers
    function validateCreateForm(state) {
        const errors = {};
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
    function handleCreateFormChange(key, value) {
        setCreateForm((prev) => ({ ...prev, [key]: value }));
    }
    async function submitCreateUser() {
        const errors = validateCreateForm(createForm);
        setCreateErrors(errors);
        if (Object.keys(errors).length > 0)
            return;
        const payload = {
            nik: createForm.nik.trim(),
            namaLengkap: createForm.namaLengkap.trim(),
            password: createForm.password.trim(),
            roleAccess: createForm.roleAccess,
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
        }
        catch (e) {
            showError(`Gagal membuat pengguna: ${e.message ?? String(e)}`);
        }
        finally {
            setIsCreating(false);
        }
    }
    // Edit user helpers
    function validateEditForm(state) {
        const errors = {};
        if (!state.namaLengkap || state.namaLengkap.trim().length === 0) {
            errors.namaLengkap = 'Nama lengkap wajib diisi';
        }
        return errors;
    }
    function handleEditFormChange(key, value) {
        setEditForm((prev) => ({ ...prev, [key]: value }));
    }
    function openEditUser(row) {
        setEditTarget(row);
        setEditErrors({});
        setEditForm({
            namaLengkap: row.namaLengkap ?? '',
            // Prefer existing primitive ids; fallback to relation if missing
            departmentId: typeof row.departmentId !== 'undefined'
                ? row.departmentId ?? null
                : (row.department?.id ?? null),
            jabatanId: typeof row.jabatanId !== 'undefined'
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
        if (Object.keys(errs).length > 0)
            return;
        const karyawanId = editTarget.id;
        const payload = {
            userId: karyawanId,
            namaLengkap: editForm.namaLengkap.trim(),
            // Kirim null untuk menghapus, atau number untuk set; biarkan undefined jika tidak ingin mengubah (tidak digunakan disini)
            departmentId: typeof editForm.departmentId !== 'undefined'
                ? editForm.departmentId ?? null
                : undefined,
            jabatanId: typeof editForm.jabatanId !== 'undefined'
                ? editForm.jabatanId ?? null
                : undefined,
        };
        setIsEditing(true);
        try {
            const updated = await updateUserProfile(payload);
            showSuccess('Profil pengguna berhasil diperbarui');
            // Update local state dari hasil backend (dengan relasi)
            setUsers((prev) => prev.map((u) => u.id === updated.id
                ? {
                    ...u,
                    namaLengkap: updated.namaLengkap,
                    departmentId: updated.departmentId ?? null,
                    jabatanId: updated.jabatanId ?? null,
                    department: updated.department ?? null,
                    jabatan: updated.jabatan ?? null,
                }
                : u));
            setOpenEditModal(false);
            setEditTarget(null);
        }
        catch (e) {
            showError(`Gagal memperbarui profil: ${e?.message ?? String(e)}`);
        }
        finally {
            setIsEditing(false);
        }
    }
    // Table columns
    const columns = useMemo(() => [
        {
            id: 'nik',
            header: 'NIK',
            accessor: (row) => (_jsx("span", { className: "font-mono text-sm", children: row.nomorIndukKaryawan })),
            align: 'left',
        },
        {
            id: 'nama',
            header: 'Nama',
            accessor: (row) => _jsx("span", { className: "text-sm", children: row.namaLengkap }),
            align: 'left',
        },
        {
            id: 'role',
            header: 'Role',
            accessor: (row) => (_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Badge, { variant: getRoleBadgeVariant(row.roleAccess), size: "sm", children: row.roleAccess }), _jsx(Select, { "aria-label": "Ubah role", options: ROLE_OPTIONS, value: row.roleAccess, onChange: (e) => handleChangeRole(row, e.target.value), className: "w-[140px]" })] })),
            align: 'left',
        },
        {
            id: 'department',
            header: 'Department',
            accessor: (row) => (_jsx("span", { className: "text-sm", children: row.department?.namaDivisi ?? '—' })),
            align: 'left',
        },
        {
            id: 'jabatan',
            header: 'Jabatan',
            accessor: (row) => (_jsx("span", { className: "text-sm", children: row.jabatan?.namaJabatan ?? '—' })),
            align: 'left',
        },
        {
            id: 'status',
            header: 'Status',
            accessor: (row) => (_jsxs("div", { className: "flex items-center gap-2 justify-center", children: [_jsx(Badge, { variant: row.isActive ? 'success' : 'error', size: "sm", children: row.isActive ? 'Aktif' : 'Nonaktif' }), _jsx(Button, { variant: "outline", size: "sm", onClick: () => handleToggleStatus(row), children: row.isActive ? 'Nonaktifkan' : 'Aktifkan' })] })),
            align: 'center',
        },
        {
            id: 'created',
            header: 'Dibuat',
            accessor: (row) => (_jsx("span", { className: "text-sm", children: row.createdAt ? formatDateTime(row.createdAt) : '—' })),
            align: 'left',
        },
        {
            id: 'aksi',
            header: 'Aksi',
            accessor: (row) => (_jsxs("div", { className: "flex items-center justify-center gap-2", children: [_jsx(Button, { variant: "outline", size: "sm", onClick: () => openEditUser(row), children: "Edit" }), _jsx(Button, { variant: "ghost", size: "sm", onClick: () => openResetPassword(row), children: "Reset Password" })] })),
            align: 'center',
        },
    ], 
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []);
    return (_jsxs("div", { className: "space-y-6", children: [_jsxs("header", { className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-xl font-semibold text-slate-900 dark:text-slate-100", children: "Manajemen Pengguna" }), _jsx("p", { className: "mt-1 text-sm text-slate-600 dark:text-slate-300", children: "Kelola pengguna: role, status, dan reset password. Tambah pengguna baru melalui modal." })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Button, { variant: "primary", onClick: () => setOpenCreateModal(true), children: "Buat Pengguna Baru" }), _jsx(Button, { variant: "outline", onClick: () => loadUsers(), children: "Muat Ulang" })] })] }), _jsx(Card, { padding: "md", children: _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsx(Input, { label: "Cari (NIK atau Nama)", placeholder: "Masukkan NIK atau nama...", value: searchText, onChange: (e) => setSearchText(e.target.value) }), _jsx(Select, { label: "Role", placeholder: "Pilih role", options: ROLE_OPTIONS, value: filterRole || '', onChange: (e) => setFilterRole(e.target.value || '') }), _jsx(Select, { label: "Status", placeholder: "Pilih status", options: STATUS_OPTIONS, value: filterStatus || '', onChange: (e) => setFilterStatus(e.target.value || '') }), _jsxs("div", { className: "flex items-end gap-2", children: [_jsx(Button, { variant: "secondary", onClick: () => {
                                        // Apply: do nothing, filters already reactive
                                        showInfo('Filter diterapkan');
                                    }, children: "Terapkan" }), _jsx(Button, { variant: "ghost", onClick: () => {
                                        setSearchText('');
                                        setFilterRole('');
                                        setFilterStatus('');
                                    }, children: "Reset" })] })] }) }), isLoading ? (_jsx("div", { className: "min-h-[30vh] grid place-items-center", children: _jsx(Spinner, { variant: "primary", size: "lg", label: "Memuat pengguna..." }) })) : loadError ? (_jsx(EmptyState, { title: "Gagal memuat data pengguna", description: loadError, action: {
                    label: 'Coba lagi',
                    variant: 'outline',
                    onClick: () => loadUsers(),
                } })) : filteredUsers.length === 0 ? (_jsx(EmptyState, { title: "Tidak ada pengguna", description: "Coba ubah filter atau buat pengguna baru.", action: {
                    label: 'Buat Pengguna Baru',
                    variant: 'primary',
                    onClick: () => setOpenCreateModal(true),
                } })) : (_jsxs(_Fragment, { children: [_jsx(Table, { columns: columns, data: paginatedUsers, ariaLabel: "Tabel Pengguna", emptyLabel: "Tidak ada data" }), filteredUsers.length > pageSize && (_jsx("div", { className: "flex justify-end", children: _jsx(Pagination, { currentPage: currentPage, totalPages: totalPages, onPageChange: (p) => setCurrentPage(p), ariaLabel: "Navigasi halaman pengguna" }) }))] })), _jsxs(Modal, { open: openCreateModal, onClose: () => {
                    if (!isCreating)
                        setOpenCreateModal(false);
                }, title: "Buat Pengguna Baru", description: "Lengkapi form berikut untuk menambahkan pengguna baru.", size: "lg", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsx(Input, { label: "NIK", placeholder: "Contoh: EMP001", value: createForm.nik, onChange: (e) => handleCreateFormChange('nik', e.target.value), error: createErrors.nik }), _jsx(Input, { label: "Nama Lengkap", placeholder: "Nama lengkap pengguna", value: createForm.namaLengkap, onChange: (e) => handleCreateFormChange('namaLengkap', e.target.value), error: createErrors.namaLengkap }), _jsx(Input, { label: "Password", type: "password", placeholder: "Password sementara", value: createForm.password, onChange: (e) => handleCreateFormChange('password', e.target.value), error: createErrors.password }), _jsx(Select, { label: "Role", placeholder: "Pilih role", options: ROLE_OPTIONS, value: createForm.roleAccess || '', onChange: (e) => handleCreateFormChange('roleAccess', e.target.value || '') }), _jsx(Select, { label: "Department (opsional)", placeholder: "Pilih department", options: [
                                    { label: '—', value: '' },
                                    ...departments.map((d) => ({ label: d.namaDivisi, value: d.id })),
                                ], value: createForm.departmentId ?? '', onChange: (e) => handleCreateFormChange('departmentId', e.target.value ? Number(e.target.value) : null) }), _jsx(Select, { label: "Jabatan (opsional)", placeholder: "Pilih jabatan", options: [
                                    { label: '—', value: '' },
                                    ...jabatans.map((j) => ({ label: j.namaJabatan, value: j.id })),
                                ], value: createForm.jabatanId ?? '', onChange: (e) => handleCreateFormChange('jabatanId', e.target.value ? Number(e.target.value) : null) }), _jsx(Input, { label: "Keterangan (opsional)", placeholder: "Catatan tambahan", value: createForm.keterangan ?? '', onChange: (e) => handleCreateFormChange('keterangan', e.target.value) })] }), _jsxs("div", { className: "mt-6 flex items-center justify-end gap-2", children: [_jsx(Button, { variant: "ghost", onClick: () => setOpenCreateModal(false), disabled: isCreating, children: "Batal" }), _jsx(Button, { variant: "primary", onClick: submitCreateUser, isLoading: isCreating, disabled: isCreating, children: "Simpan" })] })] }), _jsxs(Modal, { open: openEditModal, onClose: () => {
                    if (!isEditing) {
                        setOpenEditModal(false);
                        setEditTarget(null);
                        setEditErrors({});
                    }
                }, title: "Edit Profil Pengguna", description: editTarget ? (_jsxs("span", { children: ["Ubah profil untuk", ' ', _jsx("span", { className: "font-semibold", children: editTarget.namaLengkap }), ' ', "(", _jsx("span", { className: "font-mono", children: editTarget.nomorIndukKaryawan }), ")"] })) : undefined, size: "lg", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-4", children: [_jsx(Input, { label: "Nama Lengkap", placeholder: "Nama lengkap pengguna", value: editForm.namaLengkap, onChange: (e) => handleEditFormChange('namaLengkap', e.target.value), error: editErrors.namaLengkap }), _jsx(Select, { label: "Department (opsional)", placeholder: "Pilih department", options: [
                                    { label: '—', value: '' },
                                    ...departments.map((d) => ({ label: d.namaDivisi, value: d.id })),
                                ], value: editForm.departmentId ?? '', onChange: (e) => handleEditFormChange('departmentId', e.target.value ? Number(e.target.value) : null) }), _jsx(Select, { label: "Jabatan (opsional)", placeholder: "Pilih jabatan", options: [
                                    { label: '—', value: '' },
                                    ...jabatans.map((j) => ({ label: j.namaJabatan, value: j.id })),
                                ], value: editForm.jabatanId ?? '', onChange: (e) => handleEditFormChange('jabatanId', e.target.value ? Number(e.target.value) : null) })] }), _jsxs("div", { className: "mt-6 flex items-center justify-end gap-2", children: [_jsx(Button, { variant: "ghost", onClick: () => setOpenEditModal(false), disabled: isEditing, children: "Batal" }), _jsx(Button, { variant: "primary", onClick: submitEditUser, isLoading: isEditing, disabled: isEditing, children: "Simpan" })] })] }), _jsx(Modal, { open: openResetModal, onClose: () => {
                    if (!isResetting) {
                        setOpenResetModal(false);
                        setResetTarget(null);
                        setResetResult(null);
                    }
                }, title: "Reset Password Pengguna", description: resetTarget ? (_jsxs("span", { children: ["Reset password untuk", ' ', _jsx("span", { className: "font-semibold", children: resetTarget.namaLengkap }), ' ', "(", _jsx("span", { className: "font-mono", children: resetTarget.nomorIndukKaryawan }), ")"] })) : undefined, size: "md", children: resetResult ? (_jsxs("div", { className: "space-y-4", children: [_jsx("p", { className: "text-sm text-slate-700 dark:text-slate-300", children: "Password sementara berhasil dibuat. Berikan informasi ini kepada pengguna dan sarankan untuk segera mengganti password." }), _jsx(Card, { padding: "sm", className: "bg-slate-50 dark:bg-slate-800/60", children: _jsxs("p", { className: "text-sm", children: ["Password sementara:", ' ', _jsx("span", { className: "font-mono text-base", children: resetResult.tempPassword })] }) }), _jsx("div", { className: "flex items-center justify-end", children: _jsx(Button, { variant: "primary", onClick: () => {
                                    setOpenResetModal(false);
                                    setResetTarget(null);
                                    setResetResult(null);
                                }, children: "Tutup" }) })] })) : (_jsxs("div", { className: "flex items-center justify-end gap-2", children: [_jsx(Button, { variant: "ghost", onClick: () => setOpenResetModal(false), disabled: isResetting, children: "Batal" }), _jsx(Button, { variant: "danger", onClick: confirmResetPassword, isLoading: isResetting, disabled: isResetting, children: "Konfirmasi Reset" })] })) })] }));
}
