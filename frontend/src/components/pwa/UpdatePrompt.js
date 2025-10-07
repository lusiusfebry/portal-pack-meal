import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/* frontend/src/components/pwa/UpdatePrompt.tsx */
import { useEffect, useState, useRef } from 'react';
import usePWA from '@/hooks/usePWA';
import { Button, Card } from '@/components/ui';
import { ArrowPathIcon, XMarkIcon } from '@heroicons/react/24/outline';
/**
 * UpdatePrompt — Menampilkan pemberitahuan saat versi baru tersedia (emerald theme)
 *
 * Fitur:
 * - Tampil saat Service Worker menandai needRefresh
 * - Auto-dismiss setelah 30 detik jika tidak ada interaksi
 * - Dua aksi: Update sekarang (memanggil updateApp) dan Nanti (dismiss)
 * - Animasi slide-up saat muncul
 */
export default function UpdatePrompt() {
    const { needRefresh, updateApp } = usePWA();
    const [showPrompt, setShowPrompt] = useState(false);
    const [entered, setEntered] = useState(false);
    const dismissTimerRef = useRef(null);
    // Sinkronkan state prompt dengan needRefresh dari hook PWA
    useEffect(() => {
        if (needRefresh) {
            setShowPrompt(true);
        }
        else {
            setShowPrompt(false);
        }
    }, [needRefresh]);
    // Animasi masuk (slide-up)
    useEffect(() => {
        if (showPrompt) {
            const t = window.setTimeout(() => setEntered(true), 20);
            return () => window.clearTimeout(t);
        }
        else {
            setEntered(false);
        }
    }, [showPrompt]);
    // Auto-dismiss setelah 30 detik
    useEffect(() => {
        if (!showPrompt) {
            if (dismissTimerRef.current) {
                window.clearTimeout(dismissTimerRef.current);
                dismissTimerRef.current = null;
            }
            return;
        }
        dismissTimerRef.current = window.setTimeout(() => {
            setShowPrompt(false);
        }, 30000);
        return () => {
            if (dismissTimerRef.current) {
                window.clearTimeout(dismissTimerRef.current);
                dismissTimerRef.current = null;
            }
        };
    }, [showPrompt]);
    const handleUpdateNow = () => {
        try {
            updateApp();
        }
        finally {
            // Prompt akan menghilang setelah updateApp memicu reload
            setShowPrompt(false);
        }
    };
    const handleDismiss = () => {
        setShowPrompt(false);
    };
    // Render hanya bila refresh diperlukan dan prompt sedang ditampilkan
    if (!needRefresh || !showPrompt) {
        return null;
    }
    const containerClasses = 'fixed bottom-4 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-1rem)] sm:w-[400px]';
    const cardClasses = [
        'relative',
        'border-emerald-500 shadow-xl',
        'transition-transform transition-opacity duration-300 ease-out',
        entered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
    ].join(' ');
    return (_jsx("div", { className: containerClasses, role: "dialog", "aria-label": "Pemberitahuan update tersedia", children: _jsxs(Card, { className: cardClasses, padding: "md", hover: false, children: [_jsx("button", { type: "button", onClick: handleDismiss, className: "absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800", "aria-label": "Tutup", children: _jsx(XMarkIcon, { className: "h-5 w-5", "aria-hidden": "true" }) }), _jsxs("div", { className: "flex items-start gap-4", children: [_jsx("div", { className: "mt-1", children: _jsx(ArrowPathIcon, { className: "h-8 w-8 text-emerald-500", "aria-hidden": "true" }) }), _jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "text-lg font-semibold text-slate-900 dark:text-slate-100", children: "Update Tersedia" }), _jsx("p", { className: "mt-1 text-sm text-slate-600 dark:text-slate-300", children: "Versi baru aplikasi tersedia. Refresh untuk mendapatkan fitur terbaru." }), _jsxs("div", { className: "mt-4 flex flex-col sm:flex-row gap-2", children: [_jsx(Button, { variant: "primary", size: "md", onClick: handleUpdateNow, leftIcon: _jsx(ArrowPathIcon, { className: "h-5 w-5", "aria-hidden": "true" }), children: "Update Sekarang" }), _jsx(Button, { variant: "ghost", size: "md", onClick: handleDismiss, children: "Nanti" })] })] })] })] }) }));
}
