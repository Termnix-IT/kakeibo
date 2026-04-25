import { forwardRef } from 'react';
import type { SelectHTMLAttributes } from 'react';

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  invalid?: boolean;
};

const BASE =
  'h-9 w-full rounded-md border bg-[var(--color-surface-2)] px-3 text-sm text-neutral-900 focus:outline-none focus:ring-2 disabled:bg-[var(--color-surface)] disabled:text-neutral-500';

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { invalid, className = '', children, ...rest },
  ref
) {
  const tone = invalid
    ? 'border-expense focus:border-expense focus:ring-expense/20'
    : 'border-[var(--color-surface-border-strong)] focus:border-primary focus:ring-primary/30';
  return (
    <select ref={ref} className={`${BASE} ${tone} ${className}`} {...rest}>
      {children}
    </select>
  );
});
