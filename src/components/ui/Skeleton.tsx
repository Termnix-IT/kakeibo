import type { CSSProperties, HTMLAttributes } from 'react';

export type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  width?: string | number;
  height?: string | number;
  rounded?: 'xs' | 'sm' | 'md' | 'full';
};

const ROUND: Record<NonNullable<SkeletonProps['rounded']>, string> = {
  xs: 'rounded-[4px]',
  sm: 'rounded-[6px]',
  md: 'rounded-md',
  full: 'rounded-full',
};

export function Skeleton({
  className = '',
  width,
  height,
  rounded = 'sm',
  style,
  ...rest
}: SkeletonProps) {
  const merged: CSSProperties = { ...style };
  if (width !== undefined) merged.width = typeof width === 'number' ? `${width}px` : width;
  if (height !== undefined)
    merged.height = typeof height === 'number' ? `${height}px` : height;
  return (
    <div
      className={`animate-pulse bg-[var(--color-surface-2)] ${ROUND[rounded]} ${className}`}
      style={merged}
      {...rest}
    />
  );
}
