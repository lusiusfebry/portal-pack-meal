import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import clsx from 'clsx';
/**
 * Spinner komponen aksesibel dan responsif.
 * - Dark mode support
 * - Design system: primary (emerald) dan neutral (slate)
 * - Aksesibilitas: role="status" + sr-only label
 */
export default function Spinner({ size = 'md', variant = 'neutral', className, label = 'Loading...', }) {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-8 w-8',
    };
    const colorClasses = {
        primary: 'text-primary-500',
        neutral: 'text-slate-500 dark:text-slate-400',
    };
    return (_jsxs("span", { role: "status", "aria-live": "polite", "aria-busy": "true", className: clsx('inline-flex items-center', className), children: [_jsxs("svg", { className: clsx('animate-spin', sizeClasses[size], colorClasses[variant]), xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" })] }), _jsx("span", { className: "sr-only", children: label })] }));
}
