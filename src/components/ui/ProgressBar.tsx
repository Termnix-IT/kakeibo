export type ProgressBarProps = {
  value: number;
  max: number;
  color?: string;
  size?: 'sm' | 'md';
  className?: string;
};

export function ProgressBar({
  value,
  max,
  color,
  size = 'md',
  className = '',
}: ProgressBarProps) {
  const pct = max <= 0 ? 0 : Math.max(0, Math.min(1, value / max)) * 100;
  const h = size === 'sm' ? 'h-1.5' : 'h-2';
  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-neutral-100 ${h} ${className}`}
    >
      <div
        className={`${h} rounded-full transition-[width]`}
        style={{
          width: `${pct}%`,
          backgroundColor: color ?? 'var(--color-primary)',
        }}
      />
    </div>
  );
}
