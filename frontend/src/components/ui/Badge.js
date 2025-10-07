import { jsx as _jsx } from "react/jsx-runtime";
import clsx from 'clsx';
const baseClasses = 'inline-flex items-center font-medium rounded-full';
const variantClasses = {
    success: 'bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300',
    warning: 'bg-accent-100 text-accent-800 dark:bg-accent-900/30 dark:text-accent-300',
    error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    neutral: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
};
const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
};
export function Badge({ children, variant = 'neutral', size = 'md', className, }) {
    const classes = clsx(baseClasses, sizeClasses[size], variantClasses[variant], className);
    return _jsx("span", { className: classes, children: children });
}
export default Badge;
