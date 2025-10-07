import React, { useEffect, useRef } from 'react';
import clsx from 'clsx';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnOverlayClick?: boolean;
  className?: string;
  ariaLabel?: string; // fallback label jika title tidak ada
}

const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export default function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  className,
  ariaLabel,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const titleId = React.useId();
  const descId = React.useId();

  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (!open) return;
      if (e.key === 'Escape') {
        onClose?.();
      }
    }
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [open, onClose]);

  useEffect(() => {
    if (open && dialogRef.current) {
      // Attempt to focus dialog
      dialogRef.current.focus();
    }
  }, [open]);

  if (!open) return null;

  const overlayClickProps = closeOnOverlayClick
    ? {
        onClick: (e: React.MouseEvent<HTMLDivElement>) => {
          // Close only if clicking the overlay (not the dialog itself)
          if (e.target === e.currentTarget) {
            onClose?.();
          }
        },
      }
    : {};

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      aria-hidden={!open}
      {...overlayClickProps}
    >
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        aria-label={!title ? ariaLabel : undefined}
        tabIndex={-1}
        className={clsx(
          'relative z-50 w-full',
          'rounded-xl border border-slate-200 dark:border-slate-700',
          'bg-white dark:bg-slate-900 shadow-xl',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400',
          sizeClasses[size],
          className,
        )}
      >
        <div className="px-6 pt-5">
          <div className="flex items-start justify-between gap-4">
            {title ? (
              <h2
                id={titleId}
                className="text-lg font-semibold text-slate-900 dark:text-slate-100"
              >
                {title}
              </h2>
            ) : null}

            <button
              type="button"
              aria-label="Tutup dialog"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
              onClick={onClose}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path strokeWidth="2" strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          {description ? (
            <p
              id={descId}
              className="mt-2 text-sm text-slate-600 dark:text-slate-300"
            >
              {description}
            </p>
          ) : null}
        </div>

        <div className="px-6 py-5">
          {children}
        </div>

        {footer ? (
          <div className="px-6 pb-5 pt-2 bg-slate-50 dark:bg-slate-800/60 rounded-b-xl">
            <div className="flex items-center justify-end gap-2">{footer}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}