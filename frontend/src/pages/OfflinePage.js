import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// frontend/src/pages/OfflinePage.tsx
import { useNavigate } from 'react-router-dom';
import { Card, Button } from '@/components/ui';
import { SignalSlashIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
export default function OfflinePage() {
    const navigate = useNavigate();
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center px-4 bg-slate-50 dark:bg-slate-900", children: _jsx(Card, { padding: "lg", className: "max-w-[500px] w-full", children: _jsxs("div", { className: "flex flex-col items-center text-center", children: [_jsx(SignalSlashIcon, { className: "h-24 w-24 text-amber-500", "aria-hidden": "true" }), _jsx("h1", { className: "mt-4 text-2xl font-display font-bold text-slate-900 dark:text-white", children: "Anda Sedang Offline" }), _jsx("p", { className: "mt-2 text-slate-600 dark:text-slate-300", children: "Koneksi internet tidak tersedia. Beberapa fitur mungkin tidak dapat diakses." }), _jsx("p", { className: "mt-2 text-sm text-slate-500 dark:text-slate-400", children: "Anda masih dapat melihat riwayat pesanan yang telah di-cache." }), _jsxs("div", { className: "mt-6 flex items-center gap-3", children: [_jsx(Button, { variant: "primary", onClick: () => window.location.reload(), leftIcon: _jsx(ArrowPathIcon, { className: "h-5 w-5", "aria-hidden": "true" }), "aria-label": "Coba lagi memuat halaman", children: "Coba Lagi" }), _jsx(Button, { variant: "outline", onClick: () => navigate('/dashboard'), children: "Kembali ke Dashboard" })] })] }) }) }));
}
