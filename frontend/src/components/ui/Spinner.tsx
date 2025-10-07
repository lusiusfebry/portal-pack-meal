import clsx from 'clsx';

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'neutral';
  className?: string;
  label?: string; // accessible label (optional)
}

/**
 * Spinner komponen aksesibel dan responsif.
 * - Dark mode support
 * - Design system: primary (emerald) dan neutral (slate)
 * - Aksesibilitas: role="status" + sr-only label
 */
export default function Spinner({
  size = 'md',
  variant = 'neutral',
  className,
  label = 'Loading...',
}: SpinnerProps) {
  const sizeClasses: Record<NonNullable<SpinnerProps['size']>, string> = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-8 w-8',
  };

  const colorClasses: Record<NonNullable<SpinnerProps['variant']>, string> = {
    primary: 'text-primary-500',
    neutral: 'text-slate-500 dark:text-slate-400',
  };

  return (
    <span
      role="status"
      aria-live="polite"
      aria-busy="true"
      className={clsx('inline-flex items-center', className)}
    >
      <svg
        className={clsx('animate-spin', sizeClasses[size], colorClasses[variant])}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </span>
  );
}