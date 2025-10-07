import React from 'react';
import clsx from 'clsx';
import { Button } from './Button';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  };
}

/**
 * EmptyState untuk menampilkan keadaan kosong (no data).
 * - Aksesibilitas: role="status"
 * - Responsif dan dark mode support
 * - Design system: emerald/amber accents
 */
export default function EmptyState({
  title = 'Tidak ada data',
  description = 'Coba sesuaikan filter atau tambahkan data baru.',
  icon,
  className,
  action,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={clsx(
        'flex flex-col items-center justify-center text-center',
        'rounded-xl border border-slate-200 dark:border-slate-700',
        'bg-white dark:bg-slate-900',
        'px-6 py-10',
        'shadow-sm',
        className,
      )}
    >
      <div
        className={clsx(
          'flex items-center justify-center',
          'h-16 w-16 rounded-full',
          'bg-slate-100 dark:bg-slate-800',
          'text-slate-600 dark:text-slate-300',
          'mb-4',
        )}
        aria-hidden="true"
      >
        {icon ?? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <circle cx="12" cy="12" r="9" strokeWidth="2" />
            <path d="M9 12h6" strokeWidth="2" />
          </svg>
        )}
      </div>

      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      {description ? (
        <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-300">{description}</p>
      ) : null}

      {action ? (
        <div className="mt-5">
          <Button
            variant={action.variant ?? 'primary'}
            onClick={action.onClick}
            leftIcon={action.icon}
          >
            {action.label}
          </Button>
        </div>
      ) : null}
    </div>
  );
}