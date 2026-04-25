import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

const BASE =
  'h-9 w-full rounded-md border bg-[var(--color-surface-2)] px-3 text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-2 disabled:bg-[var(--color-surface)] disabled:text-neutral-500';

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, className = '', ...rest },
  ref
) {
  const tone = invalid
    ? 'border-expense focus:border-expense focus:ring-expense/20'
    : 'border-[var(--color-surface-border-strong)] focus:border-primary focus:ring-primary/30';
  return (
    <input ref={ref} className={`${BASE} ${tone} ${className}`} {...rest} />
  );
});
