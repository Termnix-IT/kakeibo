import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

const BASE =
  'w-full rounded-md border bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 disabled:bg-neutral-50 disabled:text-neutral-500';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ invalid, className = '', rows = 3, ...rest }, ref) {
    const tone = invalid
      ? 'border-expense focus:border-expense focus:ring-expense/20'
      : 'border-neutral-300 focus:border-primary focus:ring-primary/20';
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={`${BASE} ${tone} ${className}`}
        {...rest}
      />
    );
  }
);
