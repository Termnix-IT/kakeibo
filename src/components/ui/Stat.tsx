import type { ReactNode } from 'react';

export type StatTone =
  | 'neutral'
  | 'income'
  | 'expense'
  | 'success'
  | 'warning'
  | 'primary';

export type StatDeltaTone =
  | 'up-good'
  | 'up-bad'
  | 'down-good'
  | 'down-bad'
  | 'flat';

export type StatProps = {
  label: string;
  value: ReactNode;
  tone?: StatTone;
  delta?: { label: string; tone?: StatDeltaTone };
  hint?: string;
  className?: string;
};

const TONE_BORDER: Record<StatTone, string> = {
  neutral: 'border-neutral-300',
  income: 'border-income',
  expense: 'border-expense',
  success: 'border-success',
  warning: 'border-warning',
  primary: 'border-primary',
};

const TONE_VALUE: Record<StatTone, string> = {
  neutral: 'text-neutral-900',
  income: 'text-income',
  expense: 'text-expense',
  success: 'text-success',
  warning: 'text-warning',
  primary: 'text-primary',
};

const DELTA_COLOR: Record<StatDeltaTone, string> = {
  'up-good': 'text-success',
  'up-bad': 'text-expense',
  'down-good': 'text-success',
  'down-bad': 'text-expense',
  flat: 'text-neutral-500',
};

export function Stat({
  label,
  value,
  tone = 'neutral',
  delta,
  hint,
  className = '',
}: StatProps) {
  return (
    <div className={`border-l-2 pl-4 ${TONE_BORDER[tone]} ${className}`}>
      <div className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
        {label}
      </div>
      <div
        className={`mt-1 text-2xl font-bold leading-tight tabular-nums ${TONE_VALUE[tone]}`}
      >
        {value}
      </div>
      {delta ? (
        <div
          className={`mt-1 text-xs font-medium ${DELTA_COLOR[delta.tone ?? 'flat']}`}
        >
          {delta.label}
        </div>
      ) : hint ? (
        <div className="mt-1 text-xs text-neutral-500">{hint}</div>
      ) : null}
    </div>
  );
}
