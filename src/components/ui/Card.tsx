import type { HTMLAttributes } from 'react';

function cx(...parts: (string | undefined | false)[]) {
  return parts.filter(Boolean).join(' ');
}

export type CardTone =
  | 'default'
  | 'cyan'
  | 'pink'
  | 'blue'
  | 'green'
  | 'purple'
  | 'orange';

const TONE_CLASS: Record<CardTone, string> = {
  default: 'neon-card',
  cyan: 'neon-card neon-card-cyan',
  pink: 'neon-card neon-card-pink',
  blue: 'neon-card neon-card-blue',
  green: 'neon-card neon-card-green',
  purple: 'neon-card neon-card-purple',
  orange: 'neon-card neon-card-orange',
};

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  tone?: CardTone;
};

export function Card({ className, tone = 'default', ...rest }: CardProps) {
  return <div className={cx(TONE_CLASS[tone], className)} {...rest} />;
}

export function CardHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        'flex items-center justify-between gap-3 border-b border-[var(--color-surface-border)] pad-card-x py-3',
        className
      )}
      {...rest}
    />
  );
}

export function CardTitle({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cx('text-sm font-semibold text-neutral-900', className)}
      {...rest}
    />
  );
}

export function CardDescription({
  className,
  ...rest
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cx('mt-0.5 text-xs text-neutral-500', className)}
      {...rest}
    />
  );
}

export function CardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('pad-card', className)} {...rest} />;
}

export function CardFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        'flex items-center justify-end gap-2 border-t border-[var(--color-surface-border)] pad-card-x py-3',
        className
      )}
      {...rest}
    />
  );
}
