import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// frontend/src/pages/UnauthorizedPage.tsx
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '@/components/ui';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';
export default function UnauthorizedPage() {
    const navigate = useNavigate();
    return (_jsx("div", { className: "min-h-screen flex items-center justify-center px-4 bg-slate-50 dark:bg-slate-900", children: _jsx(Card, { padding: "lg", className: "max-w-lg w-full", children: _jsxs("div", { className: "flex flex-col items-center text-center", children: [_jsx(ShieldExclamationIcon, { className: "h-16 w-16 text-amber-500", "aria-hidden": "true" }), _jsx("h1", { className: "mt-4 text-2xl font-display font-bold text-slate-900 dark:text-white", children: "Akses Ditolak" }), _jsx("p", { className: "mt-2 text-slate-600 dark:text-slate-300", children: "Anda tidak memiliki izin untuk mengakses halaman ini." }), _jsxs("div", { className: "mt-6 flex items-center gap-3", children: [_jsx(Button, { variant: "outline", onClick: () => navigate(-1), children: "Kembali" }), _jsx(Button, { variant: "primary", onClick: () => navigate('/dashboard'), children: "Dashboard" })] })] }) }) }));
}
