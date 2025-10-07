import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// frontend/src/components/layout/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { useAuthStore } from '../../stores/auth.store';
// Heroicons (outline)
import { HomeIcon, ClipboardDocumentListIcon, UsersIcon, ClipboardDocumentCheckIcon, DocumentMagnifyingGlassIcon, ChartBarIcon, PlusCircleIcon, QueueListIcon, ClockIcon, TruckIcon, ArrowRightOnRectangleIcon, Cog6ToothIcon, } from '@heroicons/react/24/outline';
function getMenuItems(role) {
    switch (role) {
        case 'administrator':
            return [
                { label: 'Dashboard', path: '/dashboard', icon: HomeIcon },
                { label: 'Orders', path: '/orders', icon: ClipboardDocumentListIcon },
                { label: 'Master Data', path: '/master-data', icon: Cog6ToothIcon },
                { label: 'Users', path: '/users', icon: UsersIcon },
                { label: 'Approval Center', path: '/approvals', icon: ClipboardDocumentCheckIcon },
                { label: 'Reports', path: '/reports', icon: ChartBarIcon },
                { label: 'Audit Trail', path: '/audit', icon: DocumentMagnifyingGlassIcon },
            ];
        case 'employee':
            return [
                { label: 'Dashboard', path: '/dashboard', icon: HomeIcon },
                { label: 'My Orders', path: '/orders', icon: ClipboardDocumentListIcon },
                { label: 'New Order', path: '/orders/new', icon: PlusCircleIcon },
            ];
        case 'dapur':
            return [
                { label: 'Dashboard', path: '/dashboard', icon: HomeIcon },
                { label: 'Order Queue', path: '/orders', icon: QueueListIcon },
                { label: 'Pending Approvals', path: '/approvals', icon: ClockIcon },
            ];
        case 'delivery':
            return [
                { label: 'Dashboard', path: '/dashboard', icon: HomeIcon },
                { label: 'Ready Orders', path: '/orders', icon: ClipboardDocumentCheckIcon },
                { label: 'My Deliveries', path: '/orders', icon: TruckIcon },
            ];
        default:
            // Fallback minimal menu (e.g., unauthenticated state)
            return [{ label: 'Dashboard', path: '/dashboard', icon: HomeIcon }];
    }
}
function roleBadgeClasses(role) {
    // Subtle, role-tinted badge on dark sidebar
    const base = 'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset';
    const map = {
        administrator: 'bg-amber-500/10 text-amber-400 ring-amber-500/20',
        employee: 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
        dapur: 'bg-sky-500/10 text-sky-400 ring-sky-500/20',
        delivery: 'bg-violet-500/10 text-violet-400 ring-violet-500/20',
    };
    if (!role)
        return clsx(base, 'bg-slate-700/50 text-slate-300 ring-slate-600/60');
    return clsx(base, map[role]);
}
const baseItemClasses = 'flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors duration-200';
const activeItemClasses = 'bg-slate-800 text-white border-l-4 border-primary-500';
export default function Sidebar() {
    const user = useAuthStore((s) => s.user);
    const logout = useAuthStore((s) => s.logout);
    const items = React.useMemo(() => getMenuItems(user?.role), [user?.role]);
    return (_jsxs("aside", { className: clsx(
        // Hidden on mobile, visible as fixed sidebar on md+
        'hidden md:fixed md:left-0 md:top-0 md:flex md:h-screen md:w-64 md:flex-col', 
        // Dark sidebar surface
        'bg-slate-900 border-r border-slate-800 z-40'), "aria-label": "Sidebar", children: [_jsxs("div", { className: "px-4 py-4 border-b border-slate-800", children: [_jsxs("div", { className: "flex items-baseline gap-1", children: [_jsx("span", { className: "font-display text-white text-lg font-semibold", children: "Bebang" }), _jsx("span", { className: "font-display text-primary-400 text-lg font-semibold", children: "Pack Meal" })] }), _jsx("div", { className: "mt-1 text-xs text-slate-400", children: "Operational Portal" })] }), _jsx("nav", { className: "flex-1 overflow-y-auto py-4", children: _jsx("ul", { className: "space-y-1", children: items.map((item) => {
                        const Icon = item.icon;
                        return (_jsx("li", { children: _jsxs(NavLink, { to: item.path, className: ({ isActive }) => clsx(baseItemClasses, isActive && activeItemClasses), children: [_jsx(Icon, { className: "h-5 w-5", "aria-hidden": "true" }), _jsx("span", { className: "text-sm font-medium", children: item.label })] }) }, item.path));
                    }) }) }), _jsxs("div", { className: "mt-auto border-t border-slate-800 p-4", children: [_jsxs("div", { className: "flex items-center gap-3", children: [_jsx("div", { className: "flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-300", children: user?.nama ? user.nama.charAt(0).toUpperCase() : 'U' }), _jsxs("div", { className: "min-w-0", children: [_jsx("div", { className: "truncate text-sm font-medium text-white", children: user?.nama ?? 'User' }), _jsx("div", { className: "mt-1", children: _jsx("span", { className: roleBadgeClasses(user?.role), children: user?.role ?? 'guest' }) })] })] }), _jsxs("button", { type: "button", onClick: () => logout()?.catch(() => { }), className: "mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 ring-1 ring-inset ring-slate-700 hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-400", children: [_jsx(ArrowRightOnRectangleIcon, { className: "h-4 w-4", "aria-hidden": "true" }), _jsx("span", { children: "Logout" })] })] })] }));
}
