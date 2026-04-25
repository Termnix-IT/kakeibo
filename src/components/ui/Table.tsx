import type {
  HTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react';

function cx(...parts: (string | undefined | false)[]) {
  return parts.filter(Boolean).join(' ');
}

export function Table({ className, ...rest }: HTMLAttributes<HTMLTableElement>) {
  return (
    <table
      className={cx('w-full border-collapse text-sm', className)}
      {...rest}
    />
  );
}

export function THead({ className, ...rest }: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cx(
        'bg-[var(--color-surface-2)]/60 text-neutral-500',
        className
      )}
      {...rest}
    />
  );
}

export function TBody(props: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props} />;
}

export function TR({ className, ...rest }: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cx(
        'border-b border-[var(--color-surface-border)] hover:bg-[rgba(34,211,238,0.05)] transition-colors',
        className
      )}
      {...rest}
    />
  );
}

export type TAlign = 'left' | 'right' | 'center';

export function TH({
  align = 'left',
  className,
  ...rest
}: ThHTMLAttributes<HTMLTableCellElement> & { align?: TAlign }) {
  const a =
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <th
      className={cx(
        'px-3 py-2 text-[11px] font-medium uppercase tracking-wider',
        a,
        className
      )}
      {...rest}
    />
  );
}

export function TD({
  align = 'left',
  mono,
  className,
  ...rest
}: TdHTMLAttributes<HTMLTableCellElement> & {
  align?: TAlign;
  mono?: boolean;
}) {
  const a =
    align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';
  return (
    <td
      className={cx(
        'px-3 py-2 align-middle text-neutral-800',
        a,
        mono ? 'font-mono tabular-nums' : '',
        className
      )}
      {...rest}
    />
  );
}
