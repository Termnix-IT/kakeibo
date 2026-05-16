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
  neutral:
    'bg-[var(--color-surface-2)] text-neutral-700 border border-[var(--color-surface-border-strong)]',
  income:
    'bg-[rgba(74,124,89,0.10)] text-[#2d5237] border border-[rgba(74,124,89,0.35)]',
  expense:
    'bg-[rgba(180,88,56,0.10)] text-[#8a4128] border border-[rgba(180,88,56,0.35)]',
  success:
    'bg-[rgba(95,163,113,0.10)] text-[#2d5237] border border-[rgba(95,163,113,0.35)]',
  warning:
    'bg-[rgba(201,138,58,0.12)] text-[#8a5a28] border border-[rgba(201,138,58,0.40)]',
  primary:
    'bg-[var(--color-primary-subtle)] text-[var(--color-primary-dark)] border border-[var(--color-primary-border)]',
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
