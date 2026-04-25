import { forwardRef } from 'react';
import type { TextareaHTMLAttributes } from 'react';

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  invalid?: boolean;
};

const BASE =
  'w-full rounded-md border bg-[var(--color-surface-2)] px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-500 focus:outline-none focus:ring-2 disabled:bg-[var(--color-surface)] disabled:text-neutral-500';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ invalid, className = '', rows = 3, ...rest }, ref) {
    const tone = invalid
      ? 'border-expense focus:border-expense focus:ring-expense/20'
      : 'border-[var(--color-surface-border-strong)] focus:border-primary focus:ring-primary/30';
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
