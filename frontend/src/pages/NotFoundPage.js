import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// frontend/src/pages/NotFoundPage.tsx
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/ui';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
export default function NotFoundPage() {
    const navigate = useNavigate();
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center px-4 bg-slate-50 dark:bg-slate-900", children: _jsx(Card, { padding: "lg", className: "max-w-[500px] w-full", children: _jsxs("div", { className: "flex flex-col items-center text-center", children: [_jsx(ExclamationTriangleIcon, { className: "h-16 w-16 text-emerald-500", "aria-hidden": "true" }), _jsx("p", { className: "mt-4 text-6xl font-display font-extrabold text-emerald-500", children: "404" }), _jsx("h1", { className: "mt-2 text-2xl font-display font-bold text-slate-900 dark:text-white", children: "Halaman Tidak Ditemukan" }), _jsx("p", { className: "mt-2 text-slate-600 dark:text-slate-300", children: "Halaman yang Anda cari tidak ada atau telah dipindahkan." }), _jsx("div", { className: "mt-6", children: _jsx(Button, { variant: "primary", onClick: () => navigate('/dashboard'), children: "Kembali ke Dashboard" }) })] }) }) }));
}
