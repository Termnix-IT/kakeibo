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
    'bg-[rgba(34,211,238,0.12)] text-[#67e8f9] border border-[rgba(34,211,238,0.45)]',
  expense:
    'bg-[rgba(236,72,153,0.12)] text-[#f9a8d4] border border-[rgba(236,72,153,0.45)]',
  success:
    'bg-[rgba(16,224,160,0.12)] text-[#5eead4] border border-[rgba(16,224,160,0.45)]',
  warning:
    'bg-[rgba(251,146,60,0.12)] text-[#fdba74] border border-[rgba(251,146,60,0.45)]',
  primary:
    'bg-[rgba(34,211,238,0.12)] text-[#67e8f9] border border-[rgba(34,211,238,0.45)]',
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
