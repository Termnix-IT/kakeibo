export type ProgressBarProps = {
  value: number;
  max: number;
  color?: string;
  size?: 'sm' | 'md';
  className?: string;
};

function buildGradient(color: string) {
  return `linear-gradient(90deg, ${color}33 0%, ${color} 60%, ${color} 100%)`;
}

export function ProgressBar({
  value,
  max,
  color,
  size = 'md',
  className = '',
}: ProgressBarProps) {
  const pct = max <= 0 ? 0 : Math.max(0, Math.min(1, value / max)) * 100;
  const h = size === 'sm' ? 'h-1.5' : 'h-2';
  const fillColor = color ?? '#22d3ee';
  return (
    <div
      className={`w-full overflow-hidden rounded-full bg-[var(--color-surface-2)] ${h} ${className}`}
    >
      <div
        className={`progress-flow ${h} rounded-full transition-[width]`}
        style={{
          width: `${pct}%`,
          background: buildGradient(fillColor),
          boxShadow: `0 0 12px ${fillColor}66`,
        }}
      />
    </div>
  );
}
