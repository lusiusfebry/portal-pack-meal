import React from 'react';
import clsx from 'clsx';

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export default function Select({
  label,
  error,
  helperText,
  options,
  placeholder,
  leftIcon,
  rightIcon,
  className,
  disabled,
  ...props
}: SelectProps) {
  const selectId = props.id ?? React.useId();

  const baseClasses =
    'block w-full px-4 py-2.5 text-base border rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1';
  const normalClasses =
    'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100';
  const focusClasses = 'focus:border-primary-500 focus:ring-primary-400';
  const errorClasses = 'border-red-500 focus:border-red-500 focus:ring-red-400';
  const disabledClasses =
    'disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed';

  const paddingIconClasses = clsx(leftIcon && 'pl-10', rightIcon && 'pr-10');

  const computedClassName = clsx(
    baseClasses,
    error ? errorClasses : [normalClasses, focusClasses],
    disabledClasses,
    paddingIconClasses,
    className,
  );

  const describedByIds: string[] = [];
  const errorId = error ? `${selectId}-error` : undefined;
  const helperId = !error && helperText ? `${selectId}-helper` : undefined;
  if (errorId) describedByIds.push(errorId);
  if (helperId) describedByIds.push(helperId);

  return (
    <div>
      {label ? (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
        >
          {label}
        </label>
      ) : null}

      <div className="relative">
        {leftIcon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">
            {leftIcon}
          </span>
        ) : null}

        <select
          id={selectId}
          className={computedClassName}
          aria-invalid={Boolean(error)}
          aria-describedby={describedByIds.length ? describedByIds.join(' ') : undefined}
          disabled={disabled}
          {...props}
        >
          {placeholder ? (
            <option value="" disabled hidden>
              {placeholder}
            </option>
          ) : null}

          {options.map((opt) => (
            <option
              key={`${String(opt.value)}-${opt.label}`}
              value={opt.value}
              disabled={opt.disabled}
            >
              {opt.label}
            </option>
          ))}
        </select>

        {rightIcon ? (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">
            {rightIcon}
          </span>
        ) : null}

        {/* Default chevron icon (shown if rightIcon not provided) */}
        {!rightIcon ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.24a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                clipRule="evenodd"
              />
            </svg>
          </span>
        ) : null}
      </div>

      {error ? (
        <p id={errorId} className="mt-1.5 text-sm text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}