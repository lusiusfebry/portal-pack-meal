import React from 'react';
import clsx from 'clsx';

type Align = 'left' | 'center' | 'right';

export interface Column<T extends Record<string, any>> {
  id: string;
  header: React.ReactNode;
  accessor?: (row: T, index: number) => React.ReactNode;
  field?: keyof T;
  headerClassName?: string;
  cellClassName?: string;
  align?: Align;
  width?: string; // tailwind width class (e.g., 'w-24', 'w-1/3')
}

export interface TableProps<T extends Record<string, any>> {
  columns: Array<Column<T>>;
  data: T[];
  getRowId?: (row: T, index: number) => string | number;
  onRowClick?: (row: T, index: number) => void;
  className?: string;
  dense?: boolean;
  ariaLabel?: string;
  emptyLabel?: string;
}

function getTextAlignClass(align: Align | undefined): string {
  switch (align) {
    case 'center':
      return 'text-center';
    case 'right':
      return 'text-right';
    case 'left':
    default:
      return 'text-left';
  }
}

function renderCell<T extends Record<string, any>>(
  col: Column<T>,
  row: T,
  index: number,
): React.ReactNode {
  if (col.accessor) return col.accessor(row, index);
  if (col.field) {
    const v = row[col.field];
    // Render primitive as string; allow ReactNode passthrough
    return typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
      ? String(v)
      : (v as any);
  }
  return null;
}

/**
 * Tabel generik untuk menampilkan data tabular.
 * - Responsif: overflow-x untuk viewport kecil
 * - Aksesibilitas: role/aria, header semantik
 * - Dark mode: warna mengikuti design system
 * - Interaksi: onRowClick (opsional)
 */
export function Table<T extends Record<string, any>>({
  columns,
  data,
  getRowId,
  onRowClick,
  className,
  dense = false,
  ariaLabel,
  emptyLabel = 'Tidak ada data',
}: TableProps<T>) {
  const headerClasses =
    'px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60';
  const cellPadding = dense ? 'px-4 py-2' : 'px-4 py-3';
  const rowBase =
    'border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors';

  const containerClasses = clsx(
    'w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900',
    'shadow-sm',
    className,
  );

  return (
    <div className={containerClasses} role="region" aria-label={ariaLabel}>
      <table className="min-w-full" role="table" aria-label={ariaLabel}>
        <thead role="rowgroup">
          <tr role="row" className="border-b border-slate-200 dark:border-slate-700">
            {columns.map((col) => (
              <th
                key={col.id}
                role="columnheader"
                scope="col"
                className={clsx(
                  headerClasses,
                  getTextAlignClass(col.align),
                  col.width,
                  col.headerClassName,
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody role="rowgroup">
          {data.length === 0 ? (
            <tr role="row">
              <td
                role="cell"
                colSpan={columns.length}
                className={clsx(
                  'text-center text-sm text-slate-600 dark:text-slate-300',
                  'px-6 py-8',
                )}
              >
                {emptyLabel}
              </td>
            </tr>
          ) : (
            data.map((row, idx) => {
              const key = getRowId ? getRowId(row, idx) : idx;
              const clickable = Boolean(onRowClick);
              return (
                <tr
                  role="row"
                  key={key}
                  className={clsx(
                    rowBase,
                    clickable &&
                      'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400',
                  )}
                  onClick={onRowClick ? () => onRowClick(row, idx) : undefined}
                  tabIndex={onRowClick ? 0 : -1}
                  aria-label={onRowClick ? 'Klik untuk aksi baris' : undefined}
                >
                  {columns.map((col) => (
                    <td
                      role="cell"
                      key={col.id}
                      className={clsx(
                        cellPadding,
                        'text-sm text-slate-800 dark:text-slate-200',
                        getTextAlignClass(col.align),
                        col.cellClassName,
                      )}
                    >
                      {renderCell(col, row, idx)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;