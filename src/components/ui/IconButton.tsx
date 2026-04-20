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
  neutral: 'text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700',
  danger: 'text-neutral-400 hover:bg-expense-subtle hover:text-expense',
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
