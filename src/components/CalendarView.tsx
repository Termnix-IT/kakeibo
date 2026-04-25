import { Pencil, X } from 'lucide-react';
import type { Transaction, Category } from '../types';
import { IconButton } from './ui';

type Props = {
  month: string;
  transactions: Transaction[];
  catMap: Record<string, Category>;
  selectedDate: string | null;
  onDaySelect: (date: string) => void;
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (tx: Transaction) => void;
};

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];

function fmtShort(n: number): string {
  if (n === 0) return '';
  if (n >= 10000) return `${(n / 10000).toFixed(n % 10000 === 0 ? 0 : 1)}万`;
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}K`;
  return String(n);
}

export function CalendarView({
  month,
  transactions,
  catMap,
  selectedDate,
  onDaySelect,
  onDeleteTransaction,
  onEditTransaction,
}: Props) {
  const [y, m] = month.split('-').map(Number);
  const today = new Date().toISOString().slice(0, 10);

  const dayMap: Record<string, { income: number; expense: number }> = {};
  for (const tx of transactions) {
    if (!dayMap[tx.date]) dayMap[tx.date] = { income: 0, expense: 0 };
    if (tx.type === 'income') dayMap[tx.date].income += tx.amount;
    else dayMap[tx.date].expense += tx.amount;
  }

  const maxExpense = Math.max(1, ...Object.values(dayMap).map((d) => d.expense));

  const firstDay = new Date(y, m - 1, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(y, m, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(startOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const selectedTxs = selectedDate
    ? transactions
        .filter((t) => t.date === selectedDate)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    : [];

  return (
    <div className="flex h-full flex-col md:flex-row md:gap-3">
      <div className="overflow-hidden rounded-md border border-[var(--color-surface-border)] bg-[var(--color-surface)] md:flex-1">
        <div className="grid grid-cols-7 border-b border-neutral-100">
          {DAY_NAMES.map((d, i) => (
            <div
              key={d}
              className={`py-2 text-center text-xs font-semibold ${
                i === 0 ? 'text-expense' : i === 6 ? 'text-income' : 'text-neutral-400'
              }`}
            >
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (day === null) {
              return (
                <div
                  key={`blank-${idx}`}
                  className="min-h-[68px] border-b border-r border-neutral-100 md:min-h-[76px]"
                />
              );
            }
            const dateStr = `${month}-${String(day).padStart(2, '0')}`;
            const data = dayMap[dateStr];
            const isToday = dateStr === today;
            const isSelected = dateStr === selectedDate;
            const dow = (startOffset + day - 1) % 7;
            const isSun = dow === 0;
            const isSat = dow === 6;

            const heatOpacity = data?.expense
              ? Math.round((data.expense / maxExpense) * 0.18 * 100) / 100
              : 0;
            const heatStyle =
              heatOpacity > 0 && !isSelected
                ? { backgroundColor: `rgba(236,72,153,${heatOpacity})` }
                : {};

            return (
              <button
                key={dateStr}
                onClick={() => onDaySelect(dateStr)}
                className={`flex min-h-[68px] flex-col items-center gap-0.5 border-b border-r border-neutral-100 p-1.5 transition-colors md:min-h-[76px] ${
                  isSelected ? 'bg-[rgba(34,211,238,0.12)]' : 'hover:bg-[rgba(34,211,238,0.06)]'
                }`}
                style={heatStyle}
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold leading-none ${
                    isToday
                      ? 'bg-primary text-white'
                      : isSelected
                        ? 'bg-[var(--color-surface)] text-primary'
                        : isSun
                          ? 'text-expense'
                          : isSat
                            ? 'text-income'
                            : 'text-neutral-700'
                  }`}
                >
                  {day}
                </span>

                {data?.income ? (
                  <span className="text-[9px] font-medium leading-tight text-income md:text-[10px]">
                    +{fmtShort(data.income)}
                  </span>
                ) : null}

                {data?.expense ? (
                  <span className="text-[9px] font-medium leading-tight text-expense md:text-[10px]">
                    -{fmtShort(data.expense)}
                  </span>
                ) : null}

                {!data?.income &&
                  !data?.expense &&
                  transactions.some((t) => t.date === dateStr) && (
                    <span className="mt-0.5 h-1 w-1 rounded-full bg-neutral-300" />
                  )}
              </button>
            );
          })}
        </div>
      </div>

      <div className={`md:w-72 md:shrink-0 ${selectedDate ? 'block' : 'hidden md:block'}`}>
        {selectedDate ? (
          <div className="overflow-hidden rounded-md border border-[var(--color-surface-border)] bg-[var(--color-surface)]">
            <div className="flex items-center justify-between border-b border-neutral-100 px-4 py-2.5">
              <div>
                <p className="text-sm font-semibold text-neutral-900">
                  {selectedDate.slice(8)}日（{DAY_NAMES[new Date(selectedDate).getDay()]}）
                </p>
                <div className="mt-0.5 flex gap-3 text-xs tabular-nums">
                  {(dayMap[selectedDate]?.income ?? 0) > 0 && (
                    <span className="text-income">
                      +¥{(dayMap[selectedDate]?.income ?? 0).toLocaleString()}
                    </span>
                  )}
                  {(dayMap[selectedDate]?.expense ?? 0) > 0 && (
                    <span className="text-expense">
                      -¥{(dayMap[selectedDate]?.expense ?? 0).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {selectedTxs.length === 0 ? (
              <div className="py-8 text-center text-sm text-neutral-400">
                <p>取引なし</p>
              </div>
            ) : (
              <ul className="divide-y divide-neutral-100">
                {selectedTxs.map((tx) => {
                  const cat = catMap[tx.categoryId];
                  return (
                    <li key={tx.id} className="flex items-center gap-3 px-4 py-2.5">
                      <div
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-base"
                        style={{ backgroundColor: (cat?.color ?? '#888') + '22' }}
                      >
                        {cat?.icon ?? '📦'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-neutral-800">
                          {tx.memo || cat?.name || 'その他'}
                        </p>
                        <p className="text-[11px] text-neutral-500">{cat?.name}</p>
                      </div>
                      <p
                        className={`text-sm font-semibold tabular-nums ${
                          tx.type === 'income' ? 'text-income' : 'text-expense'
                        }`}
                      >
                        {tx.type === 'expense' ? '-' : '+'}¥{tx.amount.toLocaleString()}
                      </p>
                      <IconButton
                        size="sm"
                        onClick={() => onEditTransaction(tx)}
                        aria-label="編集"
                      >
                        <Pencil size={14} />
                      </IconButton>
                      <IconButton
                        size="sm"
                        tone="danger"
                        onClick={() => onDeleteTransaction(tx.id)}
                        aria-label="削除"
                      >
                        <X size={14} />
                      </IconButton>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : (
          <div className="hidden h-32 items-center justify-center text-sm text-neutral-400 md:flex">
            日付を選択してください
          </div>
        )}
      </div>
    </div>
  );
}
