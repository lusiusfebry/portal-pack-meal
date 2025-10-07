import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import clsx from 'clsx';
const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed';
const variantClasses = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 focus:ring-primary-400 shadow-sm',
    secondary: 'bg-accent-500 text-white hover:bg-accent-600 focus:ring-accent-400 shadow-sm',
    outline: 'border-2 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800',
    ghost: 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-400 shadow-sm',
};
const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
};
export function Button({ variant = 'primary', size = 'md', isLoading = false, leftIcon, rightIcon, children, className, disabled, type = 'button', ...props }) {
    const computedClassName = clsx(baseClasses, sizeClasses[size], variantClasses[variant], 'gap-x-2', className);
    return (_jsxs("button", { type: type, className: computedClassName, disabled: disabled || isLoading, "aria-disabled": disabled || isLoading, "aria-busy": isLoading, ...props, children: [isLoading ? (_jsxs("svg", { className: "h-4 w-4 animate-spin", xmlns: "http://www.w3.org/2000/svg", fill: "none", viewBox: "0 0 24 24", "aria-hidden": "true", children: [_jsx("circle", { className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }), _jsx("path", { className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" })] })) : leftIcon ? (_jsx("span", { className: "inline-flex", children: leftIcon })) : null, _jsx("span", { children: children }), !isLoading && rightIcon ? (_jsx("span", { className: "inline-flex", children: rightIcon })) : null] }));
}
export default Button;
