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
  'shine-on-hover inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap';

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-gradient-to-r from-[#22d3ee] to-[#0891b2] text-[#04111c] hover:from-[#67e8f9] hover:to-[#06b6d4] hover:shadow-[0_0_18px_rgba(34,211,238,0.45)]',
  secondary:
    'border border-[rgba(34,211,238,0.35)] bg-[rgba(34,211,238,0.06)] text-neutral-800 hover:bg-[rgba(34,211,238,0.12)] hover:border-[rgba(34,211,238,0.6)]',
  ghost:
    'text-neutral-600 hover:bg-[rgba(34,211,238,0.08)] hover:text-neutral-900',
  danger:
    'bg-gradient-to-r from-[#ec4899] to-[#be185d] text-white hover:shadow-[0_0_18px_rgba(236,72,153,0.45)]',
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
