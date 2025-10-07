// frontend/src/services/api/reports.api.ts
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
    return err?.message ?? 'Unknown error';
}
// GET /api/reports/consumption
export async function getConsumptionReport(query = {}) {
    try {
        const res = await apiClient.get('/reports/consumption', { params: query });
        return res.data;
    }
    catch (error) {
        throw new Error(extractErrorMessage(error));
    }
}
// GET /api/reports/department
export async function getDepartmentReport(query = {}) {
    try {
        const res = await apiClient.get('/reports/department', { params: query });
        return res.data;
    }
    catch (error) {
        throw new Error(extractErrorMessage(error));
    }
}
// GET /api/reports/performance
export async function getPerformanceReport(query = {}) {
    try {
        const res = await apiClient.get('/reports/performance', { params: query });
        return res.data;
    }
    catch (error) {
        throw new Error(extractErrorMessage(error));
    }
}
// GET /api/reports/rejections
export async function getRejectionReport(query = {}) {
    try {
        const res = await apiClient.get('/reports/rejections', { params: query });
        return res.data;
    }
    catch (error) {
        throw new Error(extractErrorMessage(error));
    }
}
// GET /api/reports/audit-trail
export async function getAuditTrail(query = {}) {
    try {
        const res = await apiClient.get('/reports/audit-trail', { params: query });
        return res.data;
    }
    catch (error) {
        throw new Error(extractErrorMessage(error));
    }
}
// GET /api/reports/audit-trail/order/:kodePesanan
export async function getAuditTrailByOrder(kodePesanan) {
    try {
        const res = await apiClient.get(`/reports/audit-trail/order/${encodeURIComponent(kodePesanan)}`);
        return res.data;
    }
    catch (error) {
        throw new Error(extractErrorMessage(error));
    }
}
// GET /api/reports/audit-trail/action-types
export async function getAuditTrailActionTypes() {
    try {
        const res = await apiClient.get('/reports/audit-trail/action-types');
        return res.data;
    }
    catch (error) {
        throw new Error(extractErrorMessage(error));
    }
}
