import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import clsx from 'clsx';
/**
 * Pagination komponen aksesibel, responsif, dan dark mode siap.
 * - Keyboard/ARIA ready
 * - Design system warna mengikuti primary (emerald) dan slate untuk neutral
 * - Mendukung ellipsis saat halaman panjang
 */
export default function Pagination({ currentPage, totalPages, onPageChange, className, siblingCount = 1, showEdges = true, compact = false, ariaLabel = 'Navigasi halaman', }) {
    const clampedCurrent = clamp(currentPage, 1, Math.max(1, totalPages));
    const pages = getPages(clampedCurrent, totalPages, siblingCount);
    const btnBase = 'inline-flex items-center justify-center rounded-lg border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400';
    const btnPadding = compact ? 'px-2.5 py-1.5 text-sm' : 'px-3 py-2 text-sm';
    const btnNeutral = 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800';
    const btnActive = 'border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300';
    const btnDisabled = 'opacity-50 cursor-not-allowed';
    const iconClass = compact ? 'h-4 w-4' : 'h-5 w-5';
    const handleChange = (page) => {
        if (page === clampedCurrent)
            return;
        onPageChange(page);
    };
    return (_jsxs("nav", { className: clsx('flex items-center gap-1', className), role: "navigation", "aria-label": ariaLabel, children: [showEdges && (_jsx("button", { type: "button", className: clsx(btnBase, btnPadding, btnNeutral, clampedCurrent <= 1 && btnDisabled), onClick: () => handleChange(1), "aria-label": "Halaman pertama", disabled: clampedCurrent <= 1, children: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: iconClass, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "aria-hidden": "true", children: _jsx("path", { strokeWidth: "2", strokeLinecap: "round", d: "M4 12l6-6M4 12l6 6M14 6v12" }) }) })), _jsx("button", { type: "button", className: clsx(btnBase, btnPadding, btnNeutral, clampedCurrent <= 1 && btnDisabled), onClick: () => handleChange(Math.max(1, clampedCurrent - 1)), "aria-label": "Halaman sebelumnya", disabled: clampedCurrent <= 1, children: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: iconClass, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "aria-hidden": "true", children: _jsx("path", { strokeWidth: "2", strokeLinecap: "round", d: "M15 19l-7-7 7-7" }) }) }), _jsx("ul", { className: "flex items-center gap-1", role: "list", children: pages.map((p, idx) => p === 'ellipsis' ? (_jsx("li", { "aria-hidden": "true", children: _jsx("span", { className: clsx(btnBase, btnPadding, btnNeutral, 'select-none'), children: "\u2026" }) }, `ellipsis-${idx}`)) : (_jsx("li", { children: _jsx("button", { type: "button", className: clsx(btnBase, btnPadding, p === clampedCurrent ? btnActive : btnNeutral), "aria-current": p === clampedCurrent ? 'page' : undefined, "aria-label": `Ke halaman ${p}`, onClick: () => handleChange(p), children: p }) }, `page-${p}`))) }), _jsx("button", { type: "button", className: clsx(btnBase, btnPadding, btnNeutral, clampedCurrent >= totalPages && btnDisabled), onClick: () => handleChange(Math.min(totalPages, clampedCurrent + 1)), "aria-label": "Halaman berikutnya", disabled: clampedCurrent >= totalPages, children: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: iconClass, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "aria-hidden": "true", children: _jsx("path", { strokeWidth: "2", strokeLinecap: "round", d: "M9 5l7 7-7 7" }) }) }), showEdges && (_jsx("button", { type: "button", className: clsx(btnBase, btnPadding, btnNeutral, clampedCurrent >= totalPages && btnDisabled), onClick: () => handleChange(totalPages), "aria-label": "Halaman terakhir", disabled: clampedCurrent >= totalPages, children: _jsx("svg", { xmlns: "http://www.w3.org/2000/svg", className: iconClass, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", "aria-hidden": "true", children: _jsx("path", { strokeWidth: "2", strokeLinecap: "round", d: "M20 12l-6-6M20 12l-6 6M10 6v12" }) }) }))] }));
}
/**
 * Helpers
 */
function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
}
function getPages(current, total, siblingCount) {
    const items = [];
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
        for (let p = 1; p <= total; p++)
            items.push(p);
    }
    return items;
}
