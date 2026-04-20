import type { HTMLAttributes } from 'react';

function cx(...parts: (string | undefined | false)[]) {
  return parts.filter(Boolean).join(' ');
}

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        'rounded-md border border-neutral-200 bg-white',
        className
      )}
      {...rest}
    />
  );
}

export function CardHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        'flex items-center justify-between gap-3 border-b border-neutral-200 px-5 py-3',
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
  return <div className={cx('px-5 py-4', className)} {...rest} />;
}

export function CardFooter({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        'flex items-center justify-end gap-2 border-t border-neutral-200 px-5 py-3',
        className
      )}
      {...rest}
    />
  );
}
