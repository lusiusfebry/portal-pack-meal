// frontend/src/lib/axios.ts
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';

type AuthTokens = { accessToken: string; refreshToken?: string };

type AuthStoreShape = {
  accessToken: string | null;
  setTokens: (tokens: AuthTokens) => void;
  logout: () => void;
};

type RetryRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const baseURL = import.meta.env.VITE_API_BASE_URL;

export const apiClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Create a lightweight client without interceptors for refresh-flow to avoid recursion
const refreshClient: AxiosInstance = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

async function getAuthState(): Promise<AuthStoreShape | null> {
  try {
    const dynamicPath = '../stores/' + 'auth.store';
    // Vite hint to avoid pre-bundling resolution and suppress TS module resolution
    const mod: any = await import(/* @vite-ignore */ dynamicPath).catch(() => null);
    // Prefer named export useAuthStore
    if (mod?.useAuthStore?.getState) {
      return mod.useAuthStore.getState() as AuthStoreShape;
    }
    // Fallback: getAuthState helper export
    if (typeof mod?.getAuthState === 'function') {
      return mod.getAuthState() as AuthStoreShape;
    }
    // Fallback: default export has getState
    if (mod?.default?.getState) {
      return mod.default.getState() as AuthStoreShape;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Read accessToken directly from persisted Zustand storage as a robust fallback.
 * Persist config uses key "bebang-auth-storage" and stores shape { state: { accessToken, user, ... } }
 * Ref: [useAuthStore.persist](frontend/src/stores/auth.store.ts:109-225)
 */
function readTokenFromLocalStorage(): string | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem('bebang-auth-storage');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Zustand persist typically nests state under "state"
    const token = parsed?.state?.accessToken ?? parsed?.accessToken ?? null;
    return typeof token === 'string' && token.length > 0 ? token : null;
  } catch {
    return null;
  }
}

/**
 * Unified accessor that prefers in-memory store but gracefully falls back to localStorage.
 */
async function getAccessTokenSafe(): Promise<string | null> {
  const auth = await getAuthState();
  if (auth?.accessToken) return auth.accessToken;
  return readTokenFromLocalStorage();
}

// Request interceptor: attach Authorization if token exists
apiClient.interceptors.request.use(
 async (config: InternalAxiosRequestConfig) => {
   const token = await getAccessTokenSafe();
   const hasToken = !!token;
   try {
     console.debug('[axios.request]', {
       url: config?.url,
       method: config?.method,
       hasToken,
       hasAuthHeader: !!config?.headers && !!(config.headers as any)['Authorization'],
       baseURL,
     });
   } catch {}
   if (hasToken) {
     config.headers = config.headers ?? {};
     // Normalize header key casing for safety
     const hasAuthHeader =
       !!(config.headers as any)['Authorization'] ||
       !!(config.headers as any)['authorization'];
     if (!hasAuthHeader) {
       (config.headers as any)['Authorization'] = `Bearer ${token}`;
     }
   }
   return config;
 },
 (error) => {
   try {
     console.error('[axios.request.error]', error?.message || error);
   } catch {}
   return Promise.reject(error);
 },
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const originalRequest = error.config as RetryRequestConfig | undefined;
    try {
      console.debug('[axios.response.error]', {
        url: error.config?.url,
        method: error.config?.method,
        status,
      });
    } catch {}

    if (status !== 401 || !originalRequest) {
      try {
        console.debug('[axios.response.error.pass-through]', 'status !== 401 or missing originalRequest');
      } catch {}
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      try {
        console.debug('[axios.response.error.retry-blocked]', 'already retried once');
      } catch {}
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    try {
      // Attempt refresh token
      try {
        console.debug('[axios.refresh.attempt]', { withCredentials: true, baseURL });
      } catch {}
      const refreshRes = await refreshClient.post('/auth/refresh');
      const newAccessToken: string | undefined =
        (refreshRes.data && (refreshRes.data.accessToken as string)) || undefined;
      const newRefreshToken: string | undefined =
        (refreshRes.data && (refreshRes.data.refreshToken as string)) || undefined;

      try {
        console.debug('[axios.refresh.success]', {
          gotAccessToken: !!newAccessToken,
          gotRefreshToken: !!newRefreshToken,
        });
      } catch {}

      const auth = await getAuthState();
      if (auth?.setTokens && newAccessToken) {
        auth.setTokens({
          accessToken: newAccessToken,
          ...(newRefreshToken ? { refreshToken: newRefreshToken } : {}),
        });
      }

      // Set Authorization header for the retried request
      originalRequest.headers = originalRequest.headers ?? {};
      const tokenForRetry = newAccessToken ?? auth?.accessToken ?? null;
      if (!tokenForRetry) {
        throw new Error('Failed to refresh access token');
      }
      originalRequest.headers['Authorization'] = `Bearer ${tokenForRetry}`;

      try {
        console.debug('[axios.retry]', { url: originalRequest?.url, method: originalRequest?.method });
      } catch {}
      // Retry the original request with updated token
      return apiClient(originalRequest);
    } catch (refreshErr) {
      // On refresh fail: logout and redirect to login
      try {
        console.error('[axios.refresh.failed]', (refreshErr as any)?.message || refreshErr);
      } catch {}
      try {
        const auth = await getAuthState();
        auth?.logout?.();
      } catch {
        // ignore
      }
      if (typeof window !== 'undefined' && window.location) {
        window.location.replace('/login');
      }
      return Promise.reject(refreshErr);
    }
  },
);

export default apiClient;