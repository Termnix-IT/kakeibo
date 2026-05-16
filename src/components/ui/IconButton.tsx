import { forwardRef } from 'react';
import type { ButtonHTMLAttributes } from 'react';

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  size?: 'sm' | 'md';
  tone?: 'neutral' | 'danger';
};

const SIZE = {
  sm: 'h-7 w-7',
  md: 'h-8 w-8',
};

const TONE = {
  neutral:
    'text-neutral-500 hover:bg-[var(--color-primary-subtle)] hover:text-[var(--color-primary-dark)] border border-transparent hover:border-[var(--color-primary-border)]',
  danger:
    'text-neutral-500 hover:bg-[rgba(180,88,56,0.10)] hover:text-expense border border-transparent hover:border-[rgba(180,88,56,0.40)]',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  function IconButton(
    { size = 'md', tone = 'neutral', className = '', type = 'button', ...rest },
    ref
  ) {
    return (
      <button
        ref={ref}
        type={type}
        className={`inline-flex items-center justify-center rounded-md transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed ${SIZE[size]} ${TONE[tone]} ${className}`}
        {...rest}
      />
    );
  }
);
