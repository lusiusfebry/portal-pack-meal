import { Toaster, toast, type ToastOptions } from 'react-hot-toast';

/**
 * Toast UI Provider dan helper.
 * - Gunakan <ToastProvider /> sekali di root app (misal, App.tsx).
 * - Gunakan helper: showSuccess, showError, showInfo untuk notifikasi cepat.
 *
 * Design system: emerald (primary), amber (accent), dark mode support.
 */

const baseToastOptions: ToastOptions = {
  // Global default styles
  style: {
    // Neutral surface
    background: '#0f172a', // slate-900 (dark)
    color: '#f1f5f9', // slate-100 (light text)
    border: '1px solid #334155', // slate-700
    boxShadow: '0 8px 24px rgba(2,6,23,0.35)',
  },
  className: 'rounded-lg',
  duration: 3500,
};

const successToastOptions: ToastOptions = {
  ...baseToastOptions,
  style: {
    ...baseToastOptions.style,
    background: '#052e1f', // emerald-950 approx
    border: '1px solid #065f46', // emerald-700
  },
  iconTheme: {
    primary: '#10B981', // emerald-500
    secondary: '#ffffff',
  },
};

const errorToastOptions: ToastOptions = {
  ...baseToastOptions,
  style: {
    ...baseToastOptions.style,
    background: '#450a0a', // red-950 approx
    border: '1px solid #b91c1c', // red-700
  },
  iconTheme: {
    primary: '#ef4444', // red-500
    secondary: '#ffffff',
  },
};

const infoToastOptions: ToastOptions = {
  ...baseToastOptions,
  style: {
    ...baseToastOptions.style,
    background: '#0b1220', // slate-950 approx
    border: '1px solid #1d4ed8', // blue-700
  },
  iconTheme: {
    primary: '#60A5FA', // blue-400
    secondary: '#ffffff',
  },
};

export function showSuccess(message: string, options?: ToastOptions) {
  toast.success(message, { ...successToastOptions, ...options });
}

export function showError(message: string, options?: ToastOptions) {
  toast.error(message, { ...errorToastOptions, ...options });
}

export function showInfo(message: string, options?: ToastOptions) {
  toast(message, { ...infoToastOptions, ...options });
}

/**
 * Provider komponen untuk Toaster. Pasang sekali pada root tree.
 */
export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      toastOptions={{
        // Global default
        ...baseToastOptions,
        // Per-type overrides
        success: successToastOptions,
        error: errorToastOptions,
      }}
    />
  );
}