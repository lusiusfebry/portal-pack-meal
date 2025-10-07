/**
 * usePWA - Custom hook to manage Progressive Web App (PWA) state.
 * Exposes needRefresh, offlineReady, isInstallable, isInstalled, updateApp.
 * Relies on vite-plugin-pwa react adapter.
 */
import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
export default function usePWA() {
    const [needRefresh, setNeedRefresh] = useState(false);
    const [offlineReady, setOfflineReady] = useState(false);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const { updateServiceWorker } = useRegisterSW({
        onNeedRefresh() {
            setNeedRefresh(true);
        },
        onOfflineReady() {
            setOfflineReady(true);
        },
    });
    useEffect(() => {
        if (typeof window === 'undefined')
            return;
        const installed = (typeof window.matchMedia === 'function' &&
            window.matchMedia('(display-mode: standalone)').matches) ||
            // iOS Safari PWA indicator
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            navigator.standalone === true;
        setIsInstalled(Boolean(installed));
        const handleBeforeInstallPrompt = (e) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            setIsInstallable(true);
        };
        const handleAppInstalled = () => {
            setIsInstalled(true);
            setIsInstallable(false);
        };
        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);
    const updateApp = () => {
        // Trigger SW update and reload the page when the new SW is ready
        updateServiceWorker(true);
    };
    return {
        needRefresh,
        offlineReady,
        isInstallable,
        isInstalled,
        updateApp,
    };
}
