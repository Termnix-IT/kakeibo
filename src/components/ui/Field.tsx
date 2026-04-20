import type { ReactNode } from 'react';

export type FieldProps = {
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
  children: ReactNode;
  className?: string;
};

export function Field({
  label,
  hint,
  error,
  required,
  htmlFor,
  children,
  className = '',
}: FieldProps) {
  return (
    <div className={`block ${className}`}>
      {label ? (
        <label
          htmlFor={htmlFor}
          className="mb-1 block text-xs font-medium text-neutral-600"
        >
          {label}
          {required ? <span className="ml-0.5 text-expense">*</span> : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="mt-1 text-xs text-expense">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-neutral-500">{hint}</p>
      ) : null}
    </div>
  );
}
