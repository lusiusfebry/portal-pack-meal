import clsx from 'clsx';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
  siblingCount?: number; // number of pages to show on each side of current
  showEdges?: boolean; // show First/Last buttons
  compact?: boolean; // reduced spacing
  ariaLabel?: string;
}

/**
 * Pagination komponen aksesibel, responsif, dan dark mode siap.
 * - Keyboard/ARIA ready
 * - Design system warna mengikuti primary (emerald) dan slate untuk neutral
 * - Mendukung ellipsis saat halaman panjang
 */
export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
  siblingCount = 1,
  showEdges = true,
  compact = false,
  ariaLabel = 'Navigasi halaman',
}: PaginationProps) {
  const clampedCurrent = clamp(currentPage, 1, Math.max(1, totalPages));
  const pages = getPages(clampedCurrent, totalPages, siblingCount);

  const btnBase =
    'inline-flex items-center justify-center rounded-lg border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400';
  const btnPadding = compact ? 'px-2.5 py-1.5 text-sm' : 'px-3 py-2 text-sm';
  const btnNeutral =
    'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800';
  const btnActive =
    'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300';
  const btnDisabled =
    'opacity-50 cursor-not-allowed';

  const iconClass = compact ? 'h-4 w-4' : 'h-5 w-5';

  const handleChange = (page: number) => {
    if (page === clampedCurrent) return;
    onPageChange(page);
  };

  return (
    <nav
      className={clsx('flex items-center gap-1', className)}
      role="navigation"
      aria-label={ariaLabel}
    >
      {/* First */}
      {showEdges && (
        <button
          type="button"
          className={clsx(btnBase, btnPadding, btnNeutral, clampedCurrent <= 1 && btnDisabled)}
          onClick={() => handleChange(1)}
          aria-label="Halaman pertama"
          disabled={clampedCurrent <= 1}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path strokeWidth="2" strokeLinecap="round" d="M4 12l6-6M4 12l6 6M14 6v12" />
          </svg>
        </button>
      )}

      {/* Prev */}
      <button
        type="button"
        className={clsx(btnBase, btnPadding, btnNeutral, clampedCurrent <= 1 && btnDisabled)}
        onClick={() => handleChange(Math.max(1, clampedCurrent - 1))}
        aria-label="Halaman sebelumnya"
        disabled={clampedCurrent <= 1}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <path strokeWidth="2" strokeLinecap="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Pages */}
      <ul className="flex items-center gap-1" role="list">
        {pages.map((p, idx) =>
          p === 'ellipsis' ? (
            <li key={`ellipsis-${idx}`} aria-hidden="true">
              <span className={clsx(btnBase, btnPadding, btnNeutral, 'select-none')}>…</span>
            </li>
          ) : (
            <li key={`page-${p}`}>
              <button
                type="button"
                className={clsx(
                  btnBase,
                  btnPadding,
                  p === clampedCurrent ? btnActive : btnNeutral,
                )}
                aria-current={p === clampedCurrent ? 'page' : undefined}
                aria-label={`Ke halaman ${p}`}
                onClick={() => handleChange(p)}
              >
                {p}
              </button>
            </li>
          ),
        )}
      </ul>

      {/* Next */}
      <button
        type="button"
        className={clsx(btnBase, btnPadding, btnNeutral, clampedCurrent >= totalPages && btnDisabled)}
        onClick={() => handleChange(Math.min(totalPages, clampedCurrent + 1))}
        aria-label="Halaman berikutnya"
        disabled={clampedCurrent >= totalPages}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
          <path strokeWidth="2" strokeLinecap="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Last */}
      {showEdges && (
        <button
          type="button"
          className={clsx(btnBase, btnPadding, btnNeutral, clampedCurrent >= totalPages && btnDisabled)}
          onClick={() => handleChange(totalPages)}
          aria-label="Halaman terakhir"
          disabled={clampedCurrent >= totalPages}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className={iconClass} viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
            <path strokeWidth="2" strokeLinecap="round" d="M20 12l-6-6M20 12l-6 6M10 6v12" />
          </svg>
        </button>
      )}
    </nav>
  );
}

/**
 * Helpers
 */
function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

type PageItem = number | 'ellipsis';

function getPages(current: number, total: number, siblingCount: number): PageItem[] {
  const items: PageItem[] = [];

  const startPage = Math.max(1, current - siblingCount);
  const endPage = Math.min(total, current + siblingCount);

  // Always show first page
  if (startPage > 1) {
    items.push(1);
    if (startPage > 2) {
      items.push('ellipsis');
    }
  }

  for (let p = startPage; p <= endPage; p++) {
    items.push(p);
  }

  // Always show last page
  if (endPage < total) {
    if (endPage < total - 1) {
      items.push('ellipsis');
    }
    items.push(total);
  }

  // Edge case small totals
  if (total <= 7) {
    items.length = 0;
    for (let p = 1; p <= total; p++) items.push(p);
  }

  return items;
}