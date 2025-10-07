// frontend/src/components/layout/Sidebar.tsx
import React from 'react';
import { NavLink } from 'react-router-dom';
import clsx from 'clsx';
import { useAuthStore } from '../../stores/auth.store';
import type { Role } from '../../types/auth.types';

// Heroicons (outline)
import {
  HomeIcon,
  ClipboardDocumentListIcon,
  UsersIcon,
  ClipboardDocumentCheckIcon,
  DocumentMagnifyingGlassIcon,
  ChartBarIcon,
  PlusCircleIcon,
  QueueListIcon,
  ClockIcon,
  TruckIcon,
  ArrowRightOnRectangleIcon,
  Cog6ToothIcon,
} from '@heroicons/react/24/outline';

type MenuItem = {
  label: string;
  path: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

function getMenuItems(role: Role | undefined): MenuItem[] {
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

function roleBadgeClasses(role?: Role) {
  // Subtle, role-tinted badge on dark sidebar
  const base =
    'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset';
  const map: Record<Role, string> = {
    administrator:
      'bg-amber-500/10 text-amber-400 ring-amber-500/20',
    employee:
      'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20',
    dapur:
      'bg-sky-500/10 text-sky-400 ring-sky-500/20',
    delivery:
      'bg-violet-500/10 text-violet-400 ring-violet-500/20',
  };
  if (!role) return clsx(base, 'bg-slate-700/50 text-slate-300 ring-slate-600/60');
  return clsx(base, map[role]);
}

const baseItemClasses =
  'flex items-center gap-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors duration-200';
const activeItemClasses =
  'bg-slate-800 text-white border-l-4 border-primary-500';

export default function Sidebar() {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const items = React.useMemo(() => getMenuItems(user?.role), [user?.role]);

// DEBUG: RBAC & Menu visibility — log current role and computed menu items
React.useEffect(() => {
  try {
    console.debug('[Sidebar] user.role =', user?.role);
    console.debug(
      '[Sidebar] menu items =',
      items.map((i) => i.label),
    );
  } catch (e) {
    console.warn('[Sidebar] debug log failed:', e);
  }
}, [user?.role, items]);
  return (
    <aside
      className={clsx(
        // Hidden on mobile, visible as fixed sidebar on md+
        'hidden md:fixed md:left-0 md:top-0 md:flex md:h-screen md:w-64 md:flex-col',
        // Dark sidebar surface
        'bg-slate-900 border-r border-slate-800 z-40',
      )}
      aria-label="Sidebar"
    >
      {/* Brand / Logo */}
      <div className="px-4 py-4 border-b border-slate-800">
        <div className="flex items-baseline gap-1">
          <span className="font-display text-white text-lg font-semibold">Bebang</span>
          <span className="font-display text-primary-400 text-lg font-semibold">
            Pack Meal
          </span>
        </div>
        <div className="mt-1 text-xs text-slate-400">Operational Portal</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    clsx(baseItemClasses, isActive && activeItemClasses)
                  }
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  <span className="text-sm font-medium">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* User info / actions */}
      <div className="mt-auto border-t border-slate-800 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-800 text-slate-300">
            {user?.nama ? user.nama.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-medium text-white">
              {user?.nama ?? 'User'}
            </div>
            <div className="mt-1">
              <span className={roleBadgeClasses(user?.role)}>{user?.role ?? 'guest'}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => logout()?.catch(() => {})}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 ring-1 ring-inset ring-slate-700 hover:bg-slate-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-primary-400"
        >
          <ArrowRightOnRectangleIcon className="h-4 w-4" aria-hidden="true" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}