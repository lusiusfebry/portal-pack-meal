// frontend/src/services/api/orders.api.ts
import apiClient from '@/lib/axios';
// Error extraction helper
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
    return err && err.message ? err.message : 'Unknown error';
}
// ===================== Orders API =====================
// List orders (paginated)
export async function getOrders(params = {}) {
    try {
        const res = await apiClient.get('/orders', { params });
        return res.data;
    }
    catch (error) {
        throw new Error(extractErrorMessage(error));
    }
}
// Get order by id
export async function getOrderById(id) {
    try {
        const res = await apiClient.get(`/orders/${id}`);
        return res.data;
    }
    catch (error) {
        throw new Error(extractErrorMessage(error));
    }
}
// Create order
export async function createOrder(payload) {
    try {
        const res = await apiClient.post('/orders', payload);
        return res.data;
    }
    catch (error) {
        throw new Error(extractErrorMessage(error));
    }
}
export async function updateOrderStatus(id, arg) {
    try {
        const payload = typeof arg === 'string' ? { status: arg } : arg;
        const res = await apiClient.patch(`/orders/${id}/status`, payload);
        return res.data;
    }
    catch (error) {
        throw new Error(extractErrorMessage(error));
    }
}
export async function requestRejection(id, arg) {
    try {
        const payload = typeof arg === 'string' ? { catatanDapur: arg } : arg;
        const res = await apiClient.post(`/orders/${id}/request-rejection`, payload);
        return res.data;
    }
    catch (error) {
        throw new Error(extractErrorMessage(error));
    }
}
export async function requestEdit(id, arg1, arg2) {
    try {
        const payload = typeof arg1 === 'number'
            ? {
                jumlahPesananBaru: arg1,
                catatanDapur: arg2 ?? '',
            }
            : arg1;
        const res = await apiClient.post(`/orders/${id}/request-edit`, payload);
        return res.data;
    }
    catch (error) {
        throw new Error(extractErrorMessage(error));
    }
}
export async function approveRejectOrder(id, arg1, arg2) {
    try {
        const payload = typeof arg1 === 'string'
            ? {
                decision: arg1,
                ...(arg2 ? { catatanAdmin: arg2 } : {}),
            }
            : arg1;
        const res = await apiClient.post(`/orders/${id}/approve-reject`, payload);
        return res.data;
    }
    catch (error) {
        throw new Error(extractErrorMessage(error));
    }
}
// Pending approvals
export async function getPendingApprovals() {
    try {
        const res = await apiClient.get('/orders/pending-approvals');
        return res.data;
    }
    catch (error) {
        throw new Error(extractErrorMessage(error));
    }
}
