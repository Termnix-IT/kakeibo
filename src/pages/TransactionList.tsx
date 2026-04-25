import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  ChevronLeft,
  ChevronRight,
  Filter,
  Pencil,
  RefreshCw,
  Search,
  X,
} from 'lucide-react';
import { db } from '../db';
import { useTransactions } from '../hooks/useTransactions';
import { CalendarView } from '../components/CalendarView';
import { TransactionModal } from '../components/TransactionModal';
import type { Transaction } from '../types';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Field,
  IconButton,
  Input,
  Select,
  Stat,
  Tabs,
} from '../components/ui';

type ViewMode = 'list' | 'calendar';

type Props = {
  month: string;
  onMonthChange: (month: string) => void;
};

function addMonths(yyyymm: string, delta: number): string {
  const [y, m] = yyyymm.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function clampDay(year: number, month: number, day: number): number {
  return Math.min(day, new Date(year, month, 0).getDate());
}

const DAY_NAMES = ['日', '月', '火', '水', '木', '金', '土'];

function fmt(n: number) {
  return `¥${n.toLocaleString()}`;
}

export function TransactionList({ month, onMonthChange }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showFilter, setShowFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const { transactions, updateTransaction, deleteTransaction } = useTransactions(month);
  const categories = useLiveQuery(() => db.categories.toArray(), []);
  const fixedCosts = useLiveQuery(
    async () => (await db.fixedCosts.toArray()).filter((fixedCost) => fixedCost.isActive),
    []
  );
  const prevTransactions = useLiveQuery(
    () => db.transactions.where('date').below(`${month}-01`).toArray(),
    [month]
  );
  const catMap = Object.fromEntries((categories ?? []).map((c) => [c.id, c]));

  const carryOver = (prevTransactions ?? []).reduce((sum, t) => {
    return sum + (t.type === 'income' ? t.amount : -t.amount);
  }, 0);

  const filtered = transactions.filter((t) => {
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    if (categoryFilter && t.categoryId !== categoryFilter) return false;
    if (amountMin && t.amount < Number(amountMin)) return false;
    if (amountMax && t.amount > Number(amountMax)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const cat = catMap[t.categoryId];
      const inMemo = (t.memo ?? '').toLowerCase().includes(q);
      const inCat = (cat?.name ?? '').toLowerCase().includes(q);
      if (!inMemo && !inCat) return false;
    }
    return true;
  });

  const hasFilter = Boolean(
    searchQuery || typeFilter !== 'all' || categoryFilter || amountMin || amountMax
  );

  const grouped: { date: string; items: typeof filtered }[] = [];
  for (const tx of filtered) {
    const last = grouped[grouped.length - 1];
    if (last && last.date === tx.date) last.items.push(tx);
    else grouped.push({ date: tx.date, items: [tx] });
  }

  const totalIncome = transactions
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const totalCarry = carryOver + balance;

  const handleApplyFixedCosts = async () => {
    if (!fixedCosts || fixedCosts.length === 0) return;
    const [y, m] = month.split('-').map(Number);
    const appliedIds = new Set(
      transactions.filter((t) => t.fixedCostId).map((t) => t.fixedCostId as string)
    );
    const toApply = fixedCosts.filter((fc) => !appliedIds.has(fc.id));
    if (toApply.length === 0) return;
    const now = new Date().toISOString();
    const newTxs: Transaction[] = toApply.map((fc) => {
      const day = clampDay(y, m, fc.day);
      const date = `${month}-${String(day).padStart(2, '0')}`;
      return {
        id: crypto.randomUUID(),
        type: fc.type,
        amount: fc.amount,
        categoryId: fc.categoryId,
        date,
        memo: fc.name,
        fixedCostId: fc.id,
        createdAt: now,
        updatedAt: now,
      };
    });
    await db.transactions.bulkAdd(newTxs);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setTypeFilter('all');
    setCategoryFilter('');
    setAmountMin('');
    setAmountMax('');
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto pb-28 md:pb-6">
      <div className="page-frame space-y-section pad-page md:p-0">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <IconButton
                onClick={() => onMonthChange(addMonths(month, -1))}
                aria-label="前月"
              >
                <ChevronLeft size={16} />
              </IconButton>
              <span className="min-w-[92px] text-center text-sm font-semibold tabular-nums text-neutral-900">
                {month.replace('-', '年')}月
              </span>
              <IconButton
                onClick={() => onMonthChange(addMonths(month, 1))}
                aria-label="翌月"
              >
                <ChevronRight size={16} />
              </IconButton>
            </div>
            <div className="flex items-center gap-2">
              <Tabs<ViewMode>
                size="sm"
                value={viewMode}
                onChange={setViewMode}
                items={[
                  { value: 'list', label: '一覧' },
                  { value: 'calendar', label: 'カレンダー' },
                ]}
              />
              <Button
                size="sm"
                variant={showFilter || hasFilter ? 'primary' : 'secondary'}
                leftIcon={<Filter size={14} />}
                onClick={() => setShowFilter((v) => !v)}
              >
                条件
                {hasFilter ? <span className="ml-1">●</span> : null}
              </Button>
            </div>
          </CardHeader>
          {showFilter && (
            <CardBody className="space-y-3 border-b border-neutral-200">
              <Field label="キーワード">
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="メモ・カテゴリ名で検索"
                />
              </Field>
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="種別">
                  <Tabs<'all' | 'income' | 'expense'>
                    size="sm"
                    value={typeFilter}
                    onChange={setTypeFilter}
                    items={[
                      { value: 'all', label: 'すべて' },
                      { value: 'income', label: '収入' },
                      { value: 'expense', label: '支出' },
                    ]}
                    className="w-full"
                  />
                </Field>
                <Field label="カテゴリ">
                  <Select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                  >
                    <option value="">すべて</option>
                    {(categories ?? []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.icon} {c.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field label="金額帯">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={amountMin}
                    onChange={(e) => setAmountMin(e.target.value)}
                    placeholder="最小"
                  />
                  <span className="text-xs text-neutral-500">〜</span>
                  <Input
                    type="number"
                    value={amountMax}
                    onChange={(e) => setAmountMax(e.target.value)}
                    placeholder="最大"
                  />
                  {hasFilter && (
                    <Button size="sm" variant="ghost" onClick={clearFilters}>
                      クリア
                    </Button>
                  )}
                </div>
              </Field>
            </CardBody>
          )}
          <CardBody>
            <div className="grid grid-cols-2 gap-grid md:grid-cols-4">
              <Stat label="収入" tone="income" value={fmt(totalIncome)} />
              <Stat label="支出" tone="expense" value={fmt(totalExpense)} />
              <Stat
                label="収支"
                tone={balance >= 0 ? 'success' : 'expense'}
                value={`${balance >= 0 ? '+' : ''}${fmt(balance)}`}
              />
              <Stat
                label="繰越残高"
                tone={totalCarry >= 0 ? 'success' : 'expense'}
                value={fmt(totalCarry)}
              />
            </div>
          </CardBody>
        </Card>

        {(fixedCosts ?? []).length > 0 && (
          <Button
            variant="secondary"
            fullWidth
            leftIcon={<RefreshCw size={14} />}
            onClick={handleApplyFixedCosts}
          >
            固定費を今月に適用
          </Button>
        )}

        {hasFilter && (
          <Badge tone="primary" leftIcon={<Search size={12} />}>
            フィルター中（{filtered.length}件 / 全{transactions.length}件）
          </Badge>
        )}

        {viewMode === 'calendar' ? (
          <CalendarView
            month={month}
            transactions={transactions}
            catMap={catMap}
            selectedDate={selectedDate}
            onDaySelect={(date) =>
              setSelectedDate((prev) => (prev === date ? null : date))
            }
            onDeleteTransaction={deleteTransaction}
            onEditTransaction={setEditingTx}
          />
        ) : grouped.length === 0 ? (
          <Card>
            <CardBody>
              <div className="flex h-44 flex-col items-center justify-center gap-2 text-neutral-400">
                <span className="text-4xl">{hasFilter ? '🔍' : '📭'}</span>
                <p className="text-sm">
                  {hasFilter ? '条件に一致する取引がありません' : '取引がありません'}
                </p>
              </div>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <div className="divide-y divide-neutral-100">
              {grouped.map(({ date, items }) => {
                const d = new Date(date);
                const dayName = DAY_NAMES[d.getDay()];
                const dayIncome = items
                  .filter((t) => t.type === 'income')
                  .reduce((s, t) => s + t.amount, 0);
                const dayExpense = items
                  .filter((t) => t.type === 'expense')
                  .reduce((s, t) => s + t.amount, 0);
                return (
                  <section key={date}>
                    <div className="flex items-center justify-between bg-[var(--color-surface-2)] px-4 py-2 md:px-5">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-500">
                        {date.slice(8)}日（{dayName}）
                      </span>
                      <div className="flex gap-3 text-xs tabular-nums">
                        {dayIncome > 0 && (
                          <span className="font-medium text-income">
                            +¥{dayIncome.toLocaleString()}
                          </span>
                        )}
                        {dayExpense > 0 && (
                          <span className="font-medium text-expense">
                            -¥{dayExpense.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <ul className="divide-y divide-neutral-100">
                      {items.map((tx) => {
                        const cat = catMap[tx.categoryId];
                        return (
                          <li
                            key={tx.id}
                            className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[var(--color-surface-2)] md:px-5"
                          >
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
                              <p className="mt-0.5 text-[11px] text-neutral-500">
                                {cat?.name}
                              </p>
                            </div>
                            <p
                              className={`text-sm font-semibold tabular-nums ${
                                tx.type === 'income' ? 'text-income' : 'text-expense'
                              }`}
                            >
                              {tx.type === 'expense' ? '-' : '+'}¥
                              {tx.amount.toLocaleString()}
                            </p>
                            <div className="flex items-center gap-0.5">
                              <IconButton
                                onClick={() => setEditingTx(tx)}
                                aria-label="編集"
                              >
                                <Pencil size={14} />
                              </IconButton>
                              <IconButton
                                tone="danger"
                                onClick={() => deleteTransaction(tx.id)}
                                aria-label="削除"
                              >
                                <X size={14} />
                              </IconButton>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </section>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      {editingTx && (
        <TransactionModal
          initial={editingTx}
          onClose={() => setEditingTx(null)}
          onSave={(data) => {
            updateTransaction(editingTx.id, data);
            setEditingTx(null);
          }}
        />
      )}
    </div>
  );
}
