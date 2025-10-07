import { jsx as _jsx } from "react/jsx-runtime";
import clsx from 'clsx';
const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
};
export default function Card({ children, className, padding = 'md', hover = false, }) {
    const classes = clsx('bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm', hover && 'hover:shadow-md transition-shadow duration-200', paddingClasses[padding], className);
    return _jsx("div", { className: classes, children: children });
}
