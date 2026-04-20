import { forwardRef } from 'react';
import type { InputHTMLAttributes } from 'react';

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean;
};

const BASE =
  'h-9 w-full rounded-md border bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 disabled:bg-neutral-50 disabled:text-neutral-500';

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid, className = '', ...rest },
  ref
) {
  const tone = invalid
    ? 'border-expense focus:border-expense focus:ring-expense/20'
    : 'border-neutral-300 focus:border-primary focus:ring-primary/20';
  return (
    <input ref={ref} className={`${BASE} ${tone} ${className}`} {...rest} />
  );
});
