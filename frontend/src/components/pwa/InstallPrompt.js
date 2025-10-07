import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/* frontend/src/components/pwa/InstallPrompt.tsx */
import { useEffect, useState, useRef } from 'react';
import { Button, Card } from '@/components/ui';
import { showSuccess } from '@/components/ui/Toast';
import { ArrowDownTrayIcon, XMarkIcon } from '@heroicons/react/24/outline';
/**
 * InstallPrompt — Custom PWA install prompt (emerald theme)
 *
 * Fitur:
 * - Menangkap event beforeinstallprompt dan menampilkan prompt kustom (delay 3 detik)
 * - Deteksi status instalasi (display-mode: standalone)
 * - Notifikasi sukses via Toast saat appinstalled atau user menerima prompt
 * - Dismiss dengan gating: jangan tampilkan ulang selama 7 hari
 * - Responsif: bottom sheet style di mobile, fixed card di desktop
 */
const DISMISS_KEY = 'pwa-install-dismissed-at';
const DISMISS_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
function hasRecentDismissal() {
    try {
        const at = localStorage.getItem(DISMISS_KEY);
        if (!at)
            return false;
        const ts = Date.parse(at);
        if (Number.isNaN(ts))
            return false;
        return Date.now() - ts < DISMISS_WINDOW_MS;
    }
    catch {
        return false;
    }
}
function isStandaloneInstalled() {
    const mq = window.matchMedia?.('(display-mode: standalone)').matches;
    // iOS Safari fallback
    const iosStandalone = window.navigator?.standalone === true;
    return Boolean(mq || iosStandalone);
}
export default function InstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [entered, setEntered] = useState(false);
    const delayTimerRef = useRef(null);
    useEffect(() => {
        const installed = isStandaloneInstalled();
        setIsInstalled(installed);
        const onBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            if (!installed && !hasRecentDismissal()) {
                // Tampilkan setelah 3 detik agar tidak mengganggu user langsung
                delayTimerRef.current = window.setTimeout(() => {
                    setShowPrompt(true);
                }, 3000);
            }
        };
        const onAppInstalled = () => {
            setIsInstalled(true);
            setShowPrompt(false);
            setDeferredPrompt(null);
            showSuccess('Aplikasi berhasil diinstall!');
            try {
                localStorage.removeItem(DISMISS_KEY);
            }
            catch { }
        };
        window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt);
        window.addEventListener('appinstalled', onAppInstalled);
        return () => {
            window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt);
            window.removeEventListener('appinstalled', onAppInstalled);
            if (delayTimerRef.current) {
                window.clearTimeout(delayTimerRef.current);
                delayTimerRef.current = null;
            }
        };
    }, []);
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
    const handleInstallClick = async () => {
        if (!deferredPrompt)
            return;
        try {
            await deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                showSuccess('Aplikasi berhasil diinstall!');
            }
        }
        catch (err) {
            // no-op
        }
        finally {
            setDeferredPrompt(null);
            setShowPrompt(false);
        }
    };
    const handleDismiss = () => {
        setShowPrompt(false);
        try {
            localStorage.setItem(DISMISS_KEY, new Date().toISOString());
        }
        catch { }
    };
    // Render hanya bila prompt harus tampil dan belum terpasang
    if (isInstalled || hasRecentDismissal() || !showPrompt) {
        return null;
    }
    const containerClasses = 'fixed bottom-4 sm:right-4 z-50 w-[calc(100%-1rem)] sm:w-[400px] left-1/2 sm:left-auto -translate-x-1/2 sm:translate-x-0';
    const cardClasses = [
        'relative',
        'border-emerald-500 shadow-lg',
        'transition-transform transition-opacity duration-300 ease-out',
        entered ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
    ].join(' ');
    return (_jsx("div", { className: containerClasses, role: "dialog", "aria-label": "Install PWA prompt", children: _jsxs(Card, { className: cardClasses, padding: "md", hover: false, children: [_jsx("button", { type: "button", onClick: handleDismiss, className: "absolute top-3 right-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800", "aria-label": "Tutup", children: _jsx(XMarkIcon, { className: "h-5 w-5", "aria-hidden": "true" }) }), _jsxs("div", { className: "flex items-start gap-4", children: [_jsx("div", { className: "mt-1", children: _jsx(ArrowDownTrayIcon, { className: "h-8 w-8 text-emerald-500", "aria-hidden": "true" }) }), _jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "text-lg font-semibold text-slate-900 dark:text-slate-100", children: "Install Bebang Pack Meal Portal" }), _jsx("p", { className: "mt-1 text-sm text-slate-600 dark:text-slate-300", children: "Akses lebih cepat dengan install aplikasi di perangkat Anda" }), _jsxs("ul", { className: "mt-3 space-y-1 text-sm", children: [_jsxs("li", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-emerald-600", children: "\u2713" }), _jsx("span", { className: "text-slate-700 dark:text-slate-300", children: "Akses offline untuk riwayat pesanan" })] }), _jsxs("li", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-emerald-600", children: "\u2713" }), _jsx("span", { className: "text-slate-700 dark:text-slate-300", children: "Notifikasi realtime" })] }), _jsxs("li", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-emerald-600", children: "\u2713" }), _jsx("span", { className: "text-slate-700 dark:text-slate-300", children: "Lebih cepat dan hemat data" })] })] }), _jsxs("div", { className: "mt-4 flex flex-col sm:flex-row gap-2", children: [_jsx(Button, { variant: "primary", size: "md", onClick: handleInstallClick, leftIcon: _jsx(ArrowDownTrayIcon, { className: "h-5 w-5", "aria-hidden": "true" }), children: "Install Sekarang" }), _jsx(Button, { variant: "ghost", size: "md", onClick: handleDismiss, children: "Nanti Saja" })] })] })] })] }) }));
}
