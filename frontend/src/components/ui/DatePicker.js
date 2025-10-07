import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from 'react';
import clsx from 'clsx';
export default function DatePicker({ label, error, helperText, leftIcon, rightIcon, className, disabled, ...props }) {
    const inputId = props.id ?? React.useId();
    const baseClasses = 'block w-full px-4 py-2.5 text-base border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1';
    const normalClasses = 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100';
    const focusClasses = 'focus:border-primary-500 focus:ring-primary-400';
    const errorClasses = 'border-red-500 focus:border-red-500 focus:ring-red-400';
    const disabledClasses = 'disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed';
    const paddingIconClasses = clsx(leftIcon && 'pl-10', rightIcon && 'pr-10');
    const computedInputClassName = clsx(baseClasses, error ? errorClasses : [normalClasses, focusClasses], disabledClasses, paddingIconClasses, className);
    const describedByIds = [];
    const errorId = error ? `${inputId}-error` : undefined;
    const helperId = !error && helperText ? `${inputId}-helper` : undefined;
    if (errorId)
        describedByIds.push(errorId);
    if (helperId)
        describedByIds.push(helperId);
    return (_jsxs("div", { children: [label ? (_jsx("label", { htmlFor: inputId, className: "block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5", children: label })) : null, _jsxs("div", { className: "relative", children: [leftIcon ? (_jsx("span", { className: "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400", children: leftIcon })) : null, _jsx("input", { ...props, id: inputId, type: "date", className: computedInputClassName, "aria-invalid": Boolean(error), "aria-describedby": describedByIds.length ? describedByIds.join(' ') : undefined, disabled: disabled }), rightIcon ? (_jsx("span", { className: "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400", children: rightIcon })) : null] }), error ? (_jsx("p", { id: errorId, className: "mt-1.5 text-sm text-red-600 dark:text-red-400", role: "alert", children: error })) : helperText ? (_jsx("p", { id: helperId, className: "mt-1.5 text-sm text-slate-500 dark:text-slate-400", children: helperText })) : null] }));
}
