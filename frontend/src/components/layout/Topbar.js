import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Fragment, useMemo, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { BellIcon, UserCircleIcon, MoonIcon, SunIcon, ArrowRightOnRectangleIcon, } from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/auth.store';
import { useTheme } from '@/hooks/useTheme';
/**
 * Topbar
 * Sticky header dengan aksi di sisi kanan:
 * - Theme toggle (mock untuk sekarang)
 * - Notification bell (placeholder)
 * - User menu (Headless UI Menu + Transition)
 *
 * Catatan:
 * - Theme hook dimock menggunakan useState untuk sementara waktu.
 * - Integrasi auth store: mendapatkan user dan logout.
 */
export const Topbar = ({ title }) => {
    // Theme hook
    const { theme, toggleTheme } = useTheme();
    // Auth store: user dan logout
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    // Notification placeholder
    const [hasNotifications] = useState(false);
    const isDark = theme === 'dark';
    const iconClass = 'h-5 w-5';
    const userName = useMemo(() => {
        return user?.nama ?? 'User';
    }, [user]);
    const userRole = useMemo(() => {
        return user?.role ?? 'unknown';
    }, [user]);
    const userDepartment = useMemo(() => {
        return user?.departmentName ?? '—';
    }, [user]);
    return (_jsx("header", { className: "sticky top-0 z-10 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 backdrop-blur-sm bg-opacity-90 dark:bg-opacity-90", role: "banner", children: _jsxs("div", { className: "flex items-center justify-between px-6 h-full", children: [_jsx("div", { className: "flex items-center gap-2 min-w-0", children: title ? (_jsx("h1", { className: "text-slate-900 dark:text-white text-lg font-semibold truncate", children: title })) : (_jsx("span", { className: "text-slate-600 dark:text-slate-300 text-sm", children: "Portal Pack Meal" })) }), _jsxs("div", { className: "flex items-center gap-3", children: [_jsx("button", { type: "button", "aria-label": isDark ? 'Switch to light theme' : 'Switch to dark theme', onClick: toggleTheme, className: "inline-flex items-center justify-center rounded-lg p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors", children: isDark ? _jsx(SunIcon, { className: iconClass }) : _jsx(MoonIcon, { className: iconClass }) }), _jsx("div", { className: "relative", children: _jsxs("button", { type: "button", "aria-label": "Notifications", className: "inline-flex items-center justify-center rounded-lg p-2 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors", children: [_jsx(BellIcon, { className: iconClass }), hasNotifications && (_jsx("span", { className: "absolute top-1.5 right-1.5 inline-flex h-2 w-2 rounded-full bg-emerald-500", "aria-hidden": "true" }))] }) }), _jsxs(Menu, { as: "div", className: "relative", children: [_jsxs(Menu.Button, { className: "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors", children: [_jsx(UserCircleIcon, { className: "h-5 w-5", "aria-hidden": "true" }), _jsx("span", { className: "text-sm font-medium", children: userName }), _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 20 20", fill: "currentColor", className: "h-4 w-4 text-slate-500", "aria-hidden": "true", children: _jsx("path", { fillRule: "evenodd", d: "M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.25 8.29a.75.75 0 0 1-.02-1.08Z", clipRule: "evenodd" }) })] }), _jsx(Transition, { as: Fragment, enter: "transition ease-out duration-150", enterFrom: "opacity-0 translate-y-1 scale-95", enterTo: "opacity-100 translate-y-0 scale-100", leave: "transition ease-in duration-100", leaveFrom: "opacity-100 translate-y-0 scale-100", leaveTo: "opacity-0 translate-y-1 scale-95", children: _jsxs(Menu.Items, { className: "absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-800 shadow-lg border border-slate-200 dark:border-slate-700 py-1 focus:outline-none", children: [_jsxs("div", { className: "px-3 py-2", children: [_jsx("p", { className: "text-sm font-semibold text-slate-900 dark:text-white", children: userName }), _jsxs("p", { className: "text-xs text-slate-600 dark:text-slate-300", children: ["Role: ", userRole] }), _jsxs("p", { className: "text-xs text-slate-600 dark:text-slate-300", children: ["Dept: ", userDepartment] })] }), _jsx("div", { className: "my-1 border-t border-slate-200 dark:border-slate-700" }), _jsx(Menu.Item, { children: ({ active }) => (_jsxs("button", { type: "button", className: `flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${active
                                                        ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white'
                                                        : 'text-slate-800 dark:text-slate-200'}`, children: [_jsx(UserCircleIcon, { className: "h-5 w-5" }), _jsx("span", { children: "Profile" })] })) }), _jsx(Menu.Item, { children: ({ active }) => (_jsxs("button", { type: "button", className: `flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${active
                                                        ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white'
                                                        : 'text-slate-800 dark:text-slate-200'}`, children: [_jsx("svg", { xmlns: "http://www.w3.org/2000/svg", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.5, className: "h-5 w-5", "aria-hidden": "true", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", d: "M10.5 6.75h3m-6.75 10.5h10.5M4.5 12h15" }) }), _jsx("span", { children: "Settings" })] })) }), _jsx("div", { className: "my-1 border-t border-slate-200 dark:border-slate-700" }), _jsx(Menu.Item, { children: ({ active }) => (_jsxs("button", { type: "button", onClick: () => logout?.(), className: `flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${active
                                                        ? 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white'
                                                        : 'text-slate-800 dark:text-slate-200'}`, children: [_jsx(ArrowRightOnRectangleIcon, { className: "h-5 w-5" }), _jsx("span", { children: "Logout" })] })) })] }) })] })] })] }) }));
};
export default Topbar;
