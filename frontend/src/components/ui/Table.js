import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import clsx from 'clsx';
function getTextAlignClass(align) {
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
function renderCell(col, row, index) {
    if (col.accessor)
        return col.accessor(row, index);
    if (col.field) {
        const v = row[col.field];
        // Render primitive as string; allow ReactNode passthrough
        return typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean'
            ? String(v)
            : v;
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
export function Table({ columns, data, getRowId, onRowClick, className, dense = false, ariaLabel, emptyLabel = 'Tidak ada data', }) {
    const headerClasses = 'px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60';
    const cellPadding = dense ? 'px-4 py-2' : 'px-4 py-3';
    const rowBase = 'border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors';
    const containerClasses = clsx('w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900', 'shadow-sm', className);
    return (_jsx("div", { className: containerClasses, role: "region", "aria-label": ariaLabel, children: _jsxs("table", { className: "min-w-full", role: "table", "aria-label": ariaLabel, children: [_jsx("thead", { role: "rowgroup", children: _jsx("tr", { role: "row", className: "border-b border-slate-200 dark:border-slate-700", children: columns.map((col) => (_jsx("th", { role: "columnheader", scope: "col", className: clsx(headerClasses, getTextAlignClass(col.align), col.width, col.headerClassName), children: col.header }, col.id))) }) }), _jsx("tbody", { role: "rowgroup", children: data.length === 0 ? (_jsx("tr", { role: "row", children: _jsx("td", { role: "cell", colSpan: columns.length, className: clsx('text-center text-sm text-slate-600 dark:text-slate-300', 'px-6 py-8'), children: emptyLabel }) })) : (data.map((row, idx) => {
                        const key = getRowId ? getRowId(row, idx) : idx;
                        const clickable = Boolean(onRowClick);
                        return (_jsx("tr", { role: "row", className: clsx(rowBase, clickable &&
                                'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400'), onClick: onRowClick ? () => onRowClick(row, idx) : undefined, tabIndex: onRowClick ? 0 : -1, "aria-label": onRowClick ? 'Klik untuk aksi baris' : undefined, children: columns.map((col) => (_jsx("td", { role: "cell", className: clsx(cellPadding, 'text-sm text-slate-800 dark:text-slate-200', getTextAlignClass(col.align), col.cellClassName), children: renderCell(col, row, idx) }, col.id))) }, key));
                    })) })] }) }));
}
export default Table;
