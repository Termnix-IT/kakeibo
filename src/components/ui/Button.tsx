import { forwardRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
};

const BASE =
  'inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover',
  secondary:
    'border border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50',
  ghost: 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
  danger: 'bg-expense text-white hover:bg-[#991b1b]',
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  md: 'h-10 px-4 text-sm',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    leftIcon,
    rightIcon,
    fullWidth,
    className = '',
    children,
    type = 'button',
    ...rest
  },
  ref
) {
  const cls = [
    BASE,
    VARIANTS[variant],
    SIZES[size],
    fullWidth ? 'w-full' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button ref={ref} type={type} className={cls} {...rest}>
      {leftIcon ? <span className="inline-flex items-center">{leftIcon}</span> : null}
      {children}
      {rightIcon ? <span className="inline-flex items-center">{rightIcon}</span> : null}
    </button>
  );
});
