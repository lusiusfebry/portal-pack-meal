import { useEffect, useState } from 'react';
function getInitialTheme() {
    try {
        const stored = localStorage.getItem('theme');
        if (stored === 'light' || stored === 'dark') {
            return stored;
        }
    }
    catch {
        // Access to localStorage might throw in some environments; ignore and fall back
    }
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
}
function applyThemeToDocument(theme) {
    if (typeof document === 'undefined')
        return;
    const root = document.documentElement;
    if (theme === 'dark') {
        root.classList.add('dark');
    }
    else {
        root.classList.remove('dark');
    }
}
export function useTheme() {
    const [theme, setThemeState] = useState(() => getInitialTheme());
    useEffect(() => {
        // Determine if user has an explicit preference stored
        let hasExplicitPreference = false;
        try {
            const stored = localStorage.getItem('theme');
            hasExplicitPreference = stored === 'light' || stored === 'dark';
        }
        catch {
            hasExplicitPreference = false;
        }
        // Apply initial theme to the DOM
        applyThemeToDocument(theme);
        // Optional: Listen to system theme changes
        const mediaQuery = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
            ? window.matchMedia('(prefers-color-scheme: dark)')
            : null;
        // Legacy compatibility for older browsers that used addListener/removeListener
        const legacyMediaQuery = mediaQuery;
        const handleChange = (e) => {
            if (!hasExplicitPreference) {
                const newTheme = e.matches ? 'dark' : 'light';
                setThemeState(newTheme);
                applyThemeToDocument(newTheme);
            }
        };
        mediaQuery?.addEventListener?.('change', handleChange);
        // Support older browsers (deprecated methods)
        legacyMediaQuery?.addListener?.(handleChange);
        return () => {
            mediaQuery?.removeEventListener?.('change', handleChange);
            legacyMediaQuery?.removeListener?.(handleChange);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    const setTheme = (newTheme) => {
        setThemeState(newTheme);
        try {
            localStorage.setItem('theme', newTheme);
        }
        catch {
            // Ignore localStorage write errors
        }
        applyThemeToDocument(newTheme);
    };
    const toggleTheme = () => {
        setTheme(theme === 'dark' ? 'light' : 'dark');
    };
    return { theme, toggleTheme, setTheme };
}
