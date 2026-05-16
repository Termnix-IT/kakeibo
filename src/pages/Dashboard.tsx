import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  ArrowLeftRight,
  ArrowUpRight,
  Lightbulb,
  Mountain,
  PiggyBank,
  Plus,
  Smile,
  Target,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { db } from '../db';
import {
  Badge,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Modal,
  ProgressBar,
  Skeleton,
  Tabs,
  chartAxisTick,
  chartColors,
  chartTooltipStyle,
} from '../components/ui';
import type { Page } from '../App';

const ALERT_KEY = 'kakeibo_alert_threshold';
const NOTIFIED_KEY = 'kakeibo_notified_budgets';
const SAVINGS_GOAL_RATE = 30;

type DashboardProps = {
  month: string;
  onMonthChange: (m: string) => void;
  onQuickAdd: () => void;
  onNavigate: (page: Page) => void;
};

function loadThreshold(): number {
  const v = localStorage.getItem(ALERT_KEY);
  return v !== null ? Number(v) : 80;
}

function addMonths(yyyymm: string, delta: number): string {
  const [y, m] = yyyymm.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function fmt(n: number) {
  return `¥${n.toLocaleString()}`;
}

function fmtDelta(n: number) {
  if (n === 0) return '±¥0';
  return `${n > 0 ? '+' : '-'}¥${Math.abs(n).toLocaleString()}`;
}

function fmtPercent(n: number | null) {
  if (n === null || !Number.isFinite(n)) return '—';
  if (n === 0) return '±0%';
  return `${n > 0 ? '+' : ''}${(Math.round(n * 10) / 10).toFixed(1)}%`;
}

function compareRate(current: number, baseline: number) {
  if (baseline === 0) return current === 0 ? 0 : null;
  return ((current - baseline) / baseline) * 100;
}

function progressColor(pct: number) {
  if (pct < 60) return '#10e0a0';
  if (pct < 80) return '#fb923c';
  return '#ec4899';
}

type CategoryDetailProps = {
  categoryId: string;
  catName: string;
  catColor: string;
  catIcon: string;
  month: string;
  onClose: () => void;
};

function CategoryDetailModal({
  categoryId,
  catName,
  catColor,
  catIcon,
  month,
  onClose,
}: CategoryDetailProps) {
  const months6 = Array.from({ length: 6 }, (_, i) => addMonths(month, i - 5));
  const oldestMonth = months6[0];
  const scopedTransactions = useLiveQuery(
    () =>
      db.transactions
        .where('date')
        .between(`${oldestMonth}-01`, `${month}-31`, true, true)
        .toArray(),
    [oldestMonth, month]
  );

  if (!scopedTransactions) return null;

  const allTransactions = scopedTransactions.filter((t) => t.categoryId === categoryId);
  const monthTxs = allTransactions.filter((t) => t.date.startsWith(month));
  const total = monthTxs.reduce((s, t) => s + t.amount, 0);

  const trendData = months6.map((m) => ({
    month: m.slice(5) + '月',
    amount: allTransactions
      .filter((t) => t.date.startsWith(m) && t.categoryId === categoryId)
      .reduce((s, t) => s + t.amount, 0),
  }));

  return (
    <Modal
      open
      onClose={onClose}
      size="md"
      title={`${catIcon} ${catName}`}
      description={`${month.replace('-', '年')}月 合計 ${fmt(total)}`}
    >
      <div className="space-y-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
            直近6ヶ月の推移
          </p>
          <div className="mt-2">
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="2 4" stroke={chartColors.grid} vertical={false} />
                <XAxis dataKey="month" tick={chartAxisTick} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(v) => (v === 0 ? '0' : `${Math.round(v / 1000)}K`)}
                  tick={chartAxisTick}
                  axisLine={false}
                  tickLine={false}
                  width={32}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(v) => [fmt(Number(v)), '金額']}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke={catColor}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="border-t border-[var(--color-surface-border)] pt-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
            今月の明細
          </p>
          {monthTxs.length === 0 ? (
            <p className="py-6 text-center text-sm text-neutral-500">今月の取引はありません</p>
          ) : (
            <ul className="mt-2 divide-y divide-[var(--color-surface-border)]">
              {monthTxs.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm text-neutral-700">{tx.memo || catName}</p>
                    <p className="text-[11px] text-neutral-500">{tx.date.slice(8)}日</p>
                  </div>
                  <p
                    className={`text-sm font-semibold tabular-nums ${
                      tx.type === 'income' ? 'text-income' : 'text-expense'
                    }`}
                  >
                    {tx.type === 'expense' ? '-' : '+'}¥{tx.amount.toLocaleString()}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}

function DashboardSkeleton() {
  return (
    <div className="h-full overflow-y-auto pb-24 md:pb-6">
      <div className="page-frame space-y-section pad-page md:p-0">
        <div className="grid grid-cols-1 gap-grid sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="neon-card pad-card">
              <Skeleton width={80} height={12} />
              <Skeleton width={140} height={28} className="mt-3" />
              <Skeleton width={120} height={10} className="mt-3" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-grid lg:grid-cols-[2fr_1fr_1fr]">
          {[0, 1, 2].map((i) => (
            <div key={i} className="neon-card p-5">
              <Skeleton width={140} height={14} />
              <Skeleton height={220} className="mt-4" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

type CashflowRange = '6m' | '12m' | 'all';

type SparklineProps = {
  data: number[];
  color: string;
};

function Sparkline({ data, color }: SparklineProps) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * 100;
      const y = 100 - ((v - min) / range) * 100;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
      <polyline fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={points} style={{ filter: `drop-shadow(0 0 4px ${color})` }} />
    </svg>
  );
}

export function Dashboard({ month, onMonthChange: _onMonthChange, onQuickAdd, onNavigate }: DashboardProps) {
  void _onMonthChange;
  const previousMonth = addMonths(month, -1);
  const oldestRangeMonth = addMonths(month, -11);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [cashflowRange, setCashflowRange] = useState<CashflowRange>('6m');

  const allTransactionsRaw = useLiveQuery(() => db.transactions.toArray(), []);
  const categories = useLiveQuery(() => db.categories.toArray(), []);
  const budgets = useLiveQuery(() => db.budgets.toArray(), []);

  const catMap = useMemo(
    () => Object.fromEntries((categories ?? []).map((c) => [c.id, c])),
    [categories]
  );
  const allTransactions = useMemo(
    () => allTransactionsRaw ?? [],
    [allTransactionsRaw]
  );

  const monthlyStats = useMemo(() => {
    const map = new Map<string, { income: number; expense: number }>();
    for (const tx of allTransactions) {
      const monthKey = tx.date.slice(0, 7);
      const stats = map.get(monthKey) ?? { income: 0, expense: 0 };
      if (tx.type === 'income') stats.income += tx.amount;
      else stats.expense += tx.amount;
      map.set(monthKey, stats);
    }
    return map;
  }, [allTransactions]);

  const currentTxs = useMemo(
    () => allTransactions.filter((t) => t.date.startsWith(month)),
    [allTransactions, month]
  );
  const previousTxs = useMemo(
    () => allTransactions.filter((t) => t.date.startsWith(previousMonth)),
    [allTransactions, previousMonth]
  );

  const expenseByCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const tx of currentTxs) {
      if (tx.type !== 'expense') continue;
      map.set(tx.categoryId, (map.get(tx.categoryId) ?? 0) + tx.amount);
    }
    return map;
  }, [currentTxs]);

  const relevantBudgets = useMemo(
    () => (budgets ?? []).filter((b) => b.month === month || b.month === null),
    [budgets, month]
  );
  const budgetRows = useMemo(() => {
    return relevantBudgets.map((b) => {
      const spent = expenseByCategory.get(b.categoryId) ?? 0;
      const pct = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
      return { ...b, cat: catMap[b.categoryId], spent, pct };
    });
  }, [relevantBudgets, expenseByCategory, catMap]);

  const alertThreshold = loadThreshold();
  const alertRows = budgetRows.filter((r) => r.pct >= alertThreshold);

  const cashflowMonths = useMemo(() => {
    if (cashflowRange === '6m') {
      return Array.from({ length: 6 }, (_, i) => addMonths(month, i - 5));
    }
    if (cashflowRange === '12m') {
      return Array.from({ length: 12 }, (_, i) => addMonths(month, i - 11));
    }
    return Array.from(monthlyStats.keys()).sort();
  }, [cashflowRange, month, monthlyStats]);

  useEffect(() => {
    if (alertRows.length === 0) return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    const notifiedStr = sessionStorage.getItem(NOTIFIED_KEY) ?? '';
    const notified = new Set(notifiedStr.split(',').filter(Boolean));
    for (const r of alertRows) {
      const key = `${month}:${r.id}`;
      if (!notified.has(key)) {
        new Notification('家計簿 - 予算アラート', {
          body: `${r.cat?.icon ?? ''} ${r.cat?.name} が予算の ${r.pct}% に達しました`,
          icon: '/favicon.ico',
        });
        notified.add(key);
      }
    }
    sessionStorage.setItem(NOTIFIED_KEY, Array.from(notified).join(','));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alertRows.map((r) => r.id).join(',')]);

  if (!allTransactionsRaw || !categories || !budgets) {
    return <DashboardSkeleton />;
  }

  const totalIncome = currentTxs
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = currentTxs
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const previousIncome = previousTxs
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const previousExpense = previousTxs
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);
  const previousBalance = previousIncome - previousExpense;

  const savingRate = totalIncome > 0 ? (balance / totalIncome) * 100 : 0;
  const previousSavingRate = previousIncome > 0 ? (previousBalance / previousIncome) * 100 : 0;
  const savingRatePtDiff = savingRate - SAVINGS_GOAL_RATE;

  // ----- Cashflow line chart -----
  const cashflowData = cashflowMonths.map((m) => {
    const stats = monthlyStats.get(m) ?? { income: 0, expense: 0 };
    return {
      month: m.slice(5).replace(/^0/, '') + '月',
      income: stats.income,
      expense: stats.expense,
      balance: stats.income - stats.expense,
      raw: m,
    };
  });

  void oldestRangeMonth;

  // ----- Donut chart -----
  const donutData = Array.from(expenseByCategory.entries())
    .map(([catId, value]) => ({
      catId,
      name: catMap[catId]?.name ?? catId,
      value,
      color: catMap[catId]?.color ?? '#888',
    }))
    .sort((a, b) => b.value - a.value);
  const donutTotal = donutData.reduce((s, d) => s + d.value, 0);

  // ----- Sparklines (last 6 months for KPI cards) -----
  const lastSixMonths = Array.from({ length: 6 }, (_, i) => addMonths(month, i - 5));
  const incomeSpark = lastSixMonths.map((m) => monthlyStats.get(m)?.income ?? 0);
  const expenseSpark = lastSixMonths.map((m) => monthlyStats.get(m)?.expense ?? 0);
  const balanceSpark = lastSixMonths.map((m) => {
    const s = monthlyStats.get(m);
    return (s?.income ?? 0) - (s?.expense ?? 0);
  });
  const savingRateSpark = lastSixMonths.map((m) => {
    const s = monthlyStats.get(m);
    if (!s || s.income === 0) return 0;
    return ((s.income - s.expense) / s.income) * 100;
  });

  // ----- Recent transactions (5件) -----
  const recentTxs = [...currentTxs]
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
    .slice(0, 5);

  // ----- KPI cards -----
  type KpiSpec = {
    label: string;
    value: string;
    tone: 'cyan' | 'pink' | 'blue' | 'green';
    deltaLabel: string;
    deltaPositive: boolean;
    sparkData: number[];
    icon: typeof Wallet;
  };

  const incomeDelta = totalIncome - previousIncome;
  const expenseDelta = totalExpense - previousExpense;
  const balanceDelta = balance - previousBalance;
  void previousSavingRate;

  const kpis: KpiSpec[] = [
    {
      label: '今月の収入',
      value: fmt(totalIncome),
      tone: 'cyan',
      deltaLabel: `前月比 ${fmtDelta(incomeDelta)} (${fmtPercent(compareRate(totalIncome, previousIncome))})`,
      deltaPositive: incomeDelta >= 0,
      sparkData: incomeSpark,
      icon: Wallet,
    },
    {
      label: '今月の支出',
      value: fmt(totalExpense),
      tone: 'pink',
      deltaLabel: `前月比 ${fmtDelta(expenseDelta)} (${fmtPercent(compareRate(totalExpense, previousExpense))})`,
      deltaPositive: expenseDelta <= 0,
      sparkData: expenseSpark,
      icon: TrendingDown,
    },
    {
      label: '今月の収支(残高)',
      value: fmt(balance),
      tone: 'blue',
      deltaLabel: `前月比 ${fmtDelta(balanceDelta)} (${fmtPercent(compareRate(balance, previousBalance))})`,
      deltaPositive: balanceDelta >= 0,
      sparkData: balanceSpark,
      icon: TrendingUp,
    },
    {
      label: '貯蓄率',
      value: `${(Math.round(savingRate * 10) / 10).toFixed(1)}%`,
      tone: 'green',
      deltaLabel: `目標 ${SAVINGS_GOAL_RATE}% に対して ${savingRatePtDiff >= 0 ? '+' : ''}${(Math.round(savingRatePtDiff * 10) / 10).toFixed(1)}pt`,
      deltaPositive: savingRatePtDiff >= 0,
      sparkData: savingRateSpark,
      icon: PiggyBank,
    },
  ];

  // ----- Insights -----
  type Insight = { tone: 'cyan' | 'green' | 'orange'; title: string; body: string; icon: typeof Mountain };
  const insights: Insight[] = [];
  if (expenseDelta < 0) {
    insights.push({
      tone: 'cyan',
      title: `支出が先月より${fmt(Math.abs(expenseDelta))}減少しています`,
      body: 'このペースでいくと、目標達成の可能性が高いです！',
      icon: Mountain,
    });
  } else if (expenseDelta > 0) {
    insights.push({
      tone: 'orange',
      title: `支出が先月より${fmt(expenseDelta)}増えています`,
      body: '増えたカテゴリを見直して、節約できる項目を探してみましょう。',
      icon: Mountain,
    });
  }
  if (savingRate >= SAVINGS_GOAL_RATE) {
    insights.push({
      tone: 'green',
      title: '貯蓄率が目標を上回っています',
      body: '素晴らしいです！この調子をキープしましょう。',
      icon: Smile,
    });
  } else if (totalIncome > 0) {
    insights.push({
      tone: 'orange',
      title: `貯蓄率が目標 ${SAVINGS_GOAL_RATE}% に届いていません`,
      body: '固定費の見直しや、外食回数を減らすとペースを取り戻せます。',
      icon: Smile,
    });
  }
  insights.push({
    tone: 'orange',
    title: '通信費の見直しで節約できる可能性があります',
    body: '格安プランへの変更を検討してみては？',
    icon: Lightbulb,
  });

  const selectedCat = selectedCatId ? catMap[selectedCatId] : null;

  return (
    <div className="h-full overflow-y-auto scrollbar-thin pb-24 md:pb-6">
      <div className="page-frame space-y-section pad-page md:p-0">
        {/* Row 1: KPI まとめカード */}
        <Card>
          <CardBody className="grid grid-cols-1 divide-y divide-[var(--color-surface-border)] sm:grid-cols-2 sm:divide-y-0 xl:grid-cols-4 sm:[&>*:nth-child(even)]:border-l sm:[&>*:nth-child(even)]:border-[var(--color-surface-border)] xl:[&>*]:border-l xl:[&>*]:border-[var(--color-surface-border)] xl:[&>*:first-child]:border-l-0 !p-0">
            {kpis.map((kpi) => {
              const Icon = kpi.icon;
              const sparkColor =
                kpi.tone === 'cyan'
                  ? '#4a7c59'    // sage
                  : kpi.tone === 'pink'
                    ? '#87a878'  // moss
                    : kpi.tone === 'blue'
                      ? '#3d8071' // teal-green
                      : '#5fa371'; // fresh
              const valueClass =
                kpi.tone === 'cyan'
                  ? 'neon-text-cyan'
                  : kpi.tone === 'pink'
                    ? 'neon-text-pink'
                    : kpi.tone === 'blue'
                      ? 'neon-text-blue'
                      : 'neon-text-green';
              return (
                <div key={kpi.label} className="pad-card">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                    {kpi.label}
                  </p>
                  <div className="mt-2 flex items-start justify-between gap-3">
                    <p className={`text-3xl font-bold leading-tight tabular-nums ${valueClass}`}>
                      {kpi.value}
                    </p>
                    <div className="h-12 w-20 shrink-0 opacity-80">
                      {kpi.sparkData.some((v) => v !== 0) ? (
                        <Sparkline data={kpi.sparkData} color={sparkColor} />
                      ) : (
                        <Icon size={36} className="ml-auto" style={{ color: sparkColor, filter: `drop-shadow(0 0 6px ${sparkColor})` }} />
                      )}
                    </div>
                  </div>
                  <p
                    className={`mt-3 text-[11px] tabular-nums ${
                      kpi.deltaPositive ? 'text-success' : 'text-expense'
                    }`}
                  >
                    {kpi.deltaLabel}
                  </p>
                </div>
              );
            })}
          </CardBody>
        </Card>

        {/* Row 2: グラフ3枚 */}
        <div className="grid grid-cols-1 gap-grid lg:grid-cols-[2fr_1fr_1fr]">
          {/* Cashflow */}
          <Card>
            <CardHeader>
              <CardTitle>キャッシュフロー推移</CardTitle>
              <Tabs<CashflowRange>
                value={cashflowRange}
                onChange={setCashflowRange}
                items={[
                  { value: '6m', label: '6ヶ月' },
                  { value: '12m', label: '12ヶ月' },
                  { value: 'all', label: '全期間' },
                ]}
                size="sm"
              />
            </CardHeader>
            <CardBody>
              {cashflowData.length === 0 ? (
                <p className="py-12 text-center text-sm text-neutral-500">データがありません</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <LineChart data={cashflowData}>
                    <CartesianGrid
                      strokeDasharray="2 4"
                      stroke={chartColors.grid}
                      vertical={false}
                    />
                    <XAxis
                      dataKey="month"
                      tick={chartAxisTick}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(v) =>
                        v === 0 ? '0' : Math.abs(v) >= 10000 ? `${Math.round(v / 10000)}万` : `${v}`
                      }
                      tick={chartAxisTick}
                      axisLine={false}
                      tickLine={false}
                      width={50}
                    />
                    <Tooltip
                      contentStyle={chartTooltipStyle}
                      formatter={(v, name) => {
                        const label = name === 'income' ? '収入' : name === 'expense' ? '支出' : '収支(残高)';
                        return [fmt(Number(v)), label];
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="income"
                      stroke={chartColors.income}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: chartColors.income }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="expense"
                      stroke={chartColors.expense}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: chartColors.expense }}
                      activeDot={{ r: 5 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="balance"
                      stroke={chartColors.balance}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: chartColors.balance }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
              <div className="mt-2 flex items-center justify-center gap-4 text-[11px] text-neutral-500">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-3 rounded-sm" style={{ backgroundColor: chartColors.income }} />
                  収入
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-3 rounded-sm" style={{ backgroundColor: chartColors.expense }} />
                  支出
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2 w-3 rounded-sm" style={{ backgroundColor: chartColors.balance }} />
                  収支(残高)
                </span>
              </div>
            </CardBody>
          </Card>

          {/* Donut */}
          <section>
            <h3 className="text-sm font-semibold text-neutral-900">支出カテゴリ内訳</h3>
            <button
              type="button"
              onClick={() => onNavigate('report')}
              className="mt-0.5 mb-3 text-[11px] font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-dark)]"
            >
              カテゴリ別レポートを見る →
            </button>
            <div>
              {donutData.length === 0 ? (
                <p className="py-12 text-center text-sm text-neutral-500">
                  今月の支出データがありません
                </p>
              ) : (
                <>
                  <div className="relative mx-auto h-[180px] w-[180px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={donutData}
                          cx="50%"
                          cy="50%"
                          innerRadius={56}
                          outerRadius={86}
                          dataKey="value"
                          paddingAngle={2}
                          stroke="none"
                          onClick={(entry) =>
                            setSelectedCatId(
                              (entry as unknown as { catId: string }).catId
                            )
                          }
                          style={{ cursor: 'pointer' }}
                        >
                          {donutData.map((d, i) => (
                            <Cell key={i} fill={d.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-[10px] uppercase tracking-wider text-neutral-500">支出合計</span>
                      <span className="text-base font-bold tabular-nums text-neutral-900">{fmt(donutTotal)}</span>
                    </div>
                  </div>
                  <ul className="mt-3 space-y-1.5">
                    {donutData.slice(0, 6).map((d) => (
                      <li
                        key={d.catId}
                        className="flex cursor-pointer items-center gap-2 text-xs transition-opacity hover:opacity-70"
                        onClick={() => setSelectedCatId(d.catId)}
                      >
                        <span
                          className="h-2.5 w-2.5 shrink-0 rounded-sm"
                          style={{ background: d.color, boxShadow: `0 0 6px ${d.color}99` }}
                        />
                        <span className="truncate text-neutral-700">{d.name}</span>
                        <span className="ml-auto shrink-0 tabular-nums text-neutral-800">{fmt(d.value)}</span>
                        <span className="shrink-0 tabular-nums text-neutral-500 w-10 text-right">
                          {donutTotal > 0 ? Math.round((d.value / donutTotal) * 100) : 0}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </section>

          {/* Budget */}
          <section>
            <h3 className="text-sm font-semibold text-neutral-900">予算進捗</h3>
            <button
              type="button"
              onClick={() => onNavigate('budget')}
              className="mt-0.5 mb-3 text-[11px] font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-dark)]"
            >
              予算管理へ →
            </button>
            <div className="space-y-3">
              {budgetRows.length === 0 ? (
                <p className="py-6 text-center text-sm text-neutral-500">
                  予算が設定されていません
                </p>
              ) : (
                budgetRows.slice(0, 6).map((r) => {
                  const color = progressColor(r.pct);
                  return (
                    <div key={r.id}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-neutral-700">
                          <span
                            className="inline-block h-2 w-2 rounded-full"
                            style={{ background: r.cat?.color ?? '#888', boxShadow: `0 0 6px ${r.cat?.color ?? '#888'}99` }}
                          />
                          {r.cat?.name ?? r.categoryId}
                        </span>
                        <span className="tabular-nums text-neutral-500">
                          {fmt(r.spent)} / {fmt(r.amount)}
                          <span className="ml-1 font-semibold" style={{ color }}>
                            {r.pct}%
                          </span>
                        </span>
                      </div>
                      <ProgressBar value={r.spent} max={r.amount} color={color} />
                    </div>
                  );
                })
              )}
              {alertRows.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {alertRows.slice(0, 3).map((r) => (
                    <Badge key={r.id} tone="warning">
                      ⚠ {r.cat?.name} {r.pct}%
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Row 3: ボトム4セクション(カードなし) */}
        <div className="grid grid-cols-1 gap-grid lg:grid-cols-[1.6fr_1fr_1fr_1fr] border-t border-[var(--color-surface-border)] pt-6">
          {/* Recent transactions */}
          <section>
            <h3 className="text-sm font-semibold text-neutral-900">最近の取引</h3>
            <button
              type="button"
              onClick={() => onNavigate('transactions')}
              className="mt-0.5 mb-3 text-[11px] font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-dark)]"
            >
              すべて見る →
            </button>
            {recentTxs.length === 0 ? (
              <p className="py-6 text-center text-sm text-neutral-500">
                今月の取引はまだありません
              </p>
            ) : (
              <ul className="divide-y divide-[var(--color-surface-border)]">
                {recentTxs.map((tx) => {
                  const cat = catMap[tx.categoryId];
                  return (
                    <li key={tx.id} className="flex items-center gap-3 py-2.5">
                      <span
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm"
                        style={{
                          backgroundColor: `${cat?.color ?? '#888'}22`,
                          border: `1px solid ${cat?.color ?? '#888'}66`,
                        }}
                      >
                        {cat?.icon ?? '📦'}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm text-neutral-800">
                          {tx.memo || cat?.name || '取引'}
                        </p>
                        <p className="text-[11px] text-neutral-500 tabular-nums">
                          {tx.date.slice(5).replace('-', '/')}
                        </p>
                      </div>
                      <Badge tone={tx.type === 'income' ? 'income' : 'expense'} size="sm">
                        {tx.type === 'income' ? '収入' : '支出'}
                      </Badge>
                      <span
                        className={`shrink-0 text-sm font-semibold tabular-nums ${
                          tx.type === 'income' ? 'text-income' : 'text-expense'
                        }`}
                      >
                        {tx.type === 'income' ? '+' : '-'}¥{tx.amount.toLocaleString()}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {/* Asset summary (dummy) */}
          <section>
            <h3 className="text-sm font-semibold text-neutral-900">資産サマリー</h3>
            <button
              type="button"
              onClick={() => onNavigate('assets')}
              className="mt-0.5 mb-3 text-[11px] font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-dark)]"
            >
              資産管理へ →
            </button>
            <p className="text-[10px] uppercase tracking-wider text-neutral-500">資産総額</p>
            <p className="mt-1 text-2xl font-bold neon-text-cyan tabular-nums">¥3,245,780</p>
            <p className="mt-1 text-[11px] tabular-nums text-success">前月比 +¥68,230 (+2.1%)</p>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-neutral-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#4a7c59] shadow-[0_0_6px_rgba(74,124,89,0.5)]" />
                  銀行口座
                </span>
                <span className="tabular-nums text-neutral-800">¥1,234,560</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-neutral-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#87a878] shadow-[0_0_6px_rgba(135,168,120,0.5)]" />
                  投資信託
                </span>
                <span className="tabular-nums text-neutral-800">¥1,456,780</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-neutral-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#5fa371] shadow-[0_0_6px_rgba(95,163,113,0.5)]" />
                  現金・その他
                </span>
                <span className="tabular-nums text-neutral-800">¥554,440</span>
              </div>
            </div>
          </section>

          {/* Quick actions */}
          <section>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900">クイックアクション</h3>
            <div className="grid grid-cols-2 gap-3">
              <QuickAction
                label="収入を追加"
                icon={<Plus size={20} />}
                color="#4a7c59"
                onClick={onQuickAdd}
              />
              <QuickAction
                label="支出を追加"
                icon={<Plus size={20} />}
                color="#b45838"
                onClick={onQuickAdd}
              />
              <QuickAction
                label="振替"
                icon={<ArrowLeftRight size={20} />}
                color="#3d8071"
                onClick={() => alert('プレビュー版です')}
              />
              <QuickAction
                label="予算を設定"
                icon={<Target size={20} />}
                color="#c98a3a"
                onClick={() => onNavigate('budget')}
              />
            </div>
          </section>

          {/* Insights */}
          <section>
            <h3 className="text-sm font-semibold text-neutral-900">今月のインサイト</h3>
            <button
              type="button"
              onClick={() => onNavigate('report')}
              className="mt-0.5 mb-3 text-[11px] font-medium text-[var(--color-primary)] hover:text-[var(--color-primary-dark)]"
            >
              もっと見る →
            </button>
            <div className="space-y-3">
              {insights.slice(0, 3).map((ins, i) => {
                const Icon = ins.icon;
                const colorClass =
                  ins.tone === 'cyan'
                    ? 'text-[#3d6649] border-[rgba(74,124,89,0.35)] bg-[rgba(74,124,89,0.06)]'
                    : ins.tone === 'green'
                      ? 'text-[#2d5237] border-[rgba(95,163,113,0.35)] bg-[rgba(95,163,113,0.06)]'
                      : 'text-[#8a5a28] border-[rgba(201,138,58,0.40)] bg-[rgba(201,138,58,0.08)]';
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-2 rounded-md border px-3 py-2.5 ${colorClass}`}
                  >
                    <Icon size={16} className="mt-0.5 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-neutral-900">{ins.title}</p>
                      <p className="mt-0.5 text-[11px] text-neutral-600 leading-relaxed">{ins.body}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      {selectedCatId && selectedCat && (
        <CategoryDetailModal
          categoryId={selectedCatId}
          catName={selectedCat.name}
          catColor={selectedCat.color}
          catIcon={selectedCat.icon}
          month={month}
          onClose={() => setSelectedCatId(null)}
        />
      )}
    </div>
  );
}

type QuickActionProps = {
  label: string;
  icon: ReactNode;
  color: string;
  onClick: () => void;
};

function QuickAction({ label, icon, color, onClick }: QuickActionProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex flex-col items-center gap-2"
    >
      <span
        className="hex-button hex-spin-on-hover flex h-14 w-14 items-center justify-center"
        style={{
          background: `linear-gradient(135deg, ${color}55, ${color}11)`,
          color,
          filter: `drop-shadow(0 0 10px ${color}55)`,
        }}
      >
        <span
          className="flex h-12 w-12 items-center justify-center transition-transform group-hover:-rotate-[60deg]"
          style={{ color }}
        >
          {icon}
        </span>
      </span>
      <span className="text-[11px] font-medium text-neutral-700 group-hover:text-neutral-900">
        {label}
      </span>
      <ArrowUpRight size={10} className="hidden" />
    </button>
  );
}
