// frontend/src/stores/auth.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import apiClient from '../lib/axios';
const STORAGE_KEY = 'bebang-auth-storage';
// Normalize backend auth user payload to frontend User
function normalizeUser(payload) {
    if (!payload) {
        return {
            id: 0,
            karyawanId: 0,
            nik: '',
            nama: '',
            role: 'employee',
        };
    }
    // Resolve role from various backend shapes
    const roleRaw = payload.role ??
        payload.roleAccess ??
        payload.user?.role ??
        payload.user?.roleAccess ??
        null;
    const roleMap = {
        administrator: 'administrator',
        employee: 'employee',
        dapur: 'dapur',
        delivery: 'delivery',
    };
    const role = (roleRaw && roleMap[String(roleRaw)]) ||
        (typeof payload.role === 'string' ? payload.role : 'employee');
    // Resolve identifiers
    const karyawanId = payload.karyawanId ??
        payload.id ??
        payload.karyawan_id ??
        payload.employeeId ??
        payload.userId ??
        null;
    const userId = payload.user?.id ??
        payload.userId ??
        payload.user_id ??
        (typeof payload.user === 'object' ? payload.user?.id : null) ??
        null;
    // Resolve identity fields
    const nik = payload.nik ??
        payload.nomorIndukKaryawan ??
        payload.username ??
        payload.user?.username ??
        '';
    const nama = payload.nama ??
        payload.namaLengkap ??
        payload.fullName ??
        '';
    // Resolve department
    const departmentId = payload.departmentId ??
        payload.department?.id ??
        undefined;
    const departmentName = payload.departmentName ??
        payload.department?.name ??
        undefined;
    return {
        id: (userId ?? karyawanId ?? 0),
        karyawanId: (karyawanId ?? userId ?? 0),
        nik,
        nama,
        role,
        ...(departmentId !== undefined ? { departmentId } : {}),
        ...(departmentName !== undefined ? { departmentName } : {}),
    };
}
export const useAuthStore = create()(persist((set, get) => ({
    user: null,
    accessToken: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    setAccessToken: (token) => set((s) => ({
        accessToken: token,
        isAuthenticated: !!s.user && !!token,
    })),
    setTokens: (tokens) => set((s) => ({
        accessToken: tokens.accessToken ?? s.accessToken,
        isAuthenticated: !!s.user && !!(tokens.accessToken ?? s.accessToken),
    })),
    clearError: () => set({ error: null }),
    login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
            const res = await apiClient.post('/auth/login', credentials);
            const { user, accessToken } = res.data;
            const normalizedUser = normalizeUser(user);
            set({
                user: normalizedUser,
                accessToken,
                isAuthenticated: !!normalizedUser && !!accessToken,
            });
        }
        catch (e) {
            const message = e?.response?.data?.message ||
                e?.message ||
                'Login gagal';
            set({ error: message });
            throw e;
        }
        finally {
            set({ isLoading: false });
        }
    },
    logout: async () => {
        try {
            await apiClient.post('/auth/logout');
        }
        catch {
            // ignore
        }
        finally {
            set({
                user: null,
                accessToken: null,
                isAuthenticated: false,
                isLoading: false,
                error: null,
            });
            if (typeof window !== 'undefined' && window.location) {
                window.location.replace('/login');
            }
        }
    },
    refreshAuth: async () => {
        const res = await apiClient.post('/auth/refresh');
        const accessToken = res.data?.accessToken;
        if (accessToken) {
            get().setTokens({ accessToken });
        }
    },
    fetchUser: async () => {
        try {
            const res = await apiClient.get('/auth/me');
            const rawUser = res.data;
            const normalizedUser = normalizeUser(rawUser);
            set((s) => ({
                user: normalizedUser,
                isAuthenticated: !!normalizedUser && !!s.accessToken,
            }));
        }
        catch {
            // ignore
        }
    },
}), {
    name: STORAGE_KEY,
    storage: createJSONStorage(() => localStorage),
    partialize: (state) => ({ user: state.user, accessToken: state.accessToken }),
    onRehydrateStorage: () => (state, error) => {
        try {
            if (state?.user) {
                setTimeout(async () => {
                    try {
                        const s = useAuthStore.getState();
                        // Refresh access token if missing (uses refresh endpoint via cookie)
                        if (!s.accessToken) {
                            await s.refreshAuth?.();
                        }
                        // Fetch user profile to ensure session consistency and normalization
                        await s.fetchUser?.();
                    }
                    catch {
                        // ignore
                    }
                }, 0);
            }
        }
        catch {
            // ignore
        }
    },
}));
export function getAuthState() {
    return useAuthStore.getState();
}
export default useAuthStore;
