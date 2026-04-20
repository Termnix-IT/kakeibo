import type { HTMLAttributes, ReactNode } from 'react';

export type BadgeTone =
  | 'neutral'
  | 'income'
  | 'expense'
  | 'success'
  | 'warning'
  | 'primary';
export type BadgeSize = 'sm' | 'md';

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  size?: BadgeSize;
  leftIcon?: ReactNode;
};

const TONE: Record<BadgeTone, string> = {
  neutral: 'bg-neutral-100 text-neutral-700 border border-neutral-200',
  income: 'bg-income-subtle text-income border border-[#bfdbfe]',
  expense: 'bg-expense-subtle text-expense border border-[#fecaca]',
  success: 'bg-success-subtle text-success border border-[#a7f3d0]',
  warning: 'bg-warning-subtle text-warning border border-[#fde68a]',
  primary: 'bg-primary-subtle text-primary border border-primary-border',
};

const SIZE: Record<BadgeSize, string> = {
  sm: 'h-5 px-2 text-[11px]',
  md: 'h-6 px-2.5 text-xs',
};

export function Badge({
  tone = 'neutral',
  size = 'sm',
  leftIcon,
  className = '',
  children,
  ...rest
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-medium ${TONE[tone]} ${SIZE[size]} ${className}`}
      {...rest}
    >
      {leftIcon ? <span className="inline-flex">{leftIcon}</span> : null}
      {children}
    </span>
  );
}
