// frontend/src/services/api/users.api.ts
import apiClient from '@/lib/axios';
// Error extraction helper (consistent across API layer)
function extractErrorMessage(error) {
    const err = error;
    const data = err?.response?.data;
    if (data) {
        if (typeof data === 'string')
            return data;
        if (typeof data.message === 'string')
            return data.message;
        if (Array.isArray(data.message))
            return data.message.join(', ');
    }
    return err?.message ? err.message : 'Unknown error';
}
// API: Users (Administrator scope)
export async function getUsers() {
    try {
        const res = await apiClient.get('/users');
        return res.data;
    }
    catch (error) {
        throw new Error(extractErrorMessage(error));
    }
}
export async function getUserById(id) {
    try {
        const res = await apiClient.get(`/users/${id}`);
        return res.data;
    }
    catch (error) {
        throw new Error(extractErrorMessage(error));
    }
}
export async function createUser(payload) {
    try {
        const res = await apiClient.post('/users', payload);
        return res.data;
    }
    catch (error) {
        throw new Error(extractErrorMessage(error));
    }
}
export async function updateUserStatus(payload) {
    try {
        const { userId: karyawanId, status } = payload;
        const isActive = status === 'active';
        const res = await apiClient.patch(`/users/${karyawanId}/status`, { isActive });
        return res.data;
    }
    catch (error) {
        throw new Error(extractErrorMessage(error));
    }
}
export async function updateUserRole(payload) {
    try {
        const { userId: karyawanId, role } = payload;
        const res = await apiClient.patch(`/users/${karyawanId}/role`, { roleAccess: role });
        return res.data;
    }
    catch (error) {
        throw new Error(extractErrorMessage(error));
    }
}
export async function resetUserPassword(karyawanId) {
    try {
        const res = await apiClient.post(`/users/${karyawanId}/reset-password`);
        return res.data;
    }
    catch (error) {
        throw new Error(extractErrorMessage(error));
    }
}
// Update profil karyawan (administrator)
export async function updateUserProfile(payload) {
    try {
        const { userId: karyawanId, namaLengkap, departmentId, jabatanId } = payload;
        const body = { namaLengkap };
        if (typeof departmentId !== 'undefined')
            body.departmentId = departmentId;
        if (typeof jabatanId !== 'undefined')
            body.jabatanId = jabatanId;
        const res = await apiClient.patch(`/users/${karyawanId}/profile`, body);
        return res.data;
    }
    catch (error) {
        throw new Error(extractErrorMessage(error));
    }
}
