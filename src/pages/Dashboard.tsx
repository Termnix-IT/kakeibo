import { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
} from 'recharts';
import { AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';
import { db } from '../db';
import {
  Badge,
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
  Modal,
  ProgressBar,
  Skeleton,
  Stat,
  chartAxisTick,
  chartColors,
  chartTooltipStyle,
} from '../components/ui';

const ALERT_KEY = 'kakeibo_alert_threshold';
const NOTIFIED_KEY = 'kakeibo_notified_budgets';

type WeatherInfo = {
  emoji: string;
  label: string;
  message: string;
};

function getWeather(income: number, expense: number, hasData: boolean): WeatherInfo {
  if (!hasData)
    return {
      emoji: '🌈',
      label: 'データなし',
      message: '記録を始めると天気予報が表示されます',
    };
  if (income === 0 && expense === 0)
    return {
      emoji: '🌤️',
      label: '晴れ時々曇り',
      message: '今月はまだ取引がありません',
    };
  const balance = income - expense;
  const savingRate = income > 0 ? (balance / income) * 100 : balance < 0 ? -100 : 0;
  if (savingRate >= 30)
    return {
      emoji: '☀️',
      label: '快晴',
      message: `貯蓄率${Math.round(savingRate)}%、家計は絶好調です`,
    };
  if (savingRate >= 10)
    return {
      emoji: '🌤️',
      label: '晴れ',
      message: `貯蓄率${Math.round(savingRate)}%、順調なペースです`,
    };
  if (savingRate >= 0)
    return {
      emoji: '⛅',
      label: '曇り',
      message: 'ほぼ収支トントン。もう少し節約できそうです',
    };
  if (savingRate >= -20)
    return {
      emoji: '🌧️',
      label: '雨',
      message: `支出が¥${Math.abs(balance).toLocaleString()}オーバーしています`,
    };
  return {
    emoji: '⛈️',
    label: '嵐',
    message: '大幅赤字、固定費を見直してみましょう',
  };
}

function loadThreshold(): number {
  const v = localStorage.getItem(ALERT_KEY);
  return v !== null ? Number(v) : 80;
}

function getCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
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
  if (n === null || !Number.isFinite(n)) return '比較不可';
  if (n === 0) return '±0%';
  return `${n > 0 ? '+' : ''}${Math.round(n)}%`;
}

function compareRate(current: number, baseline: number) {
  if (baseline === 0) return current === 0 ? 0 : null;
  return ((current - baseline) / baseline) * 100;
}

function progressColor(pct: number) {
  if (pct < 60) return 'var(--color-success)';
  if (pct < 80) return 'var(--color-warning)';
  return 'var(--color-expense)';
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

        <div className="border-t border-neutral-200 pt-3">
          <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
            今月の明細
          </p>
          {monthTxs.length === 0 ? (
            <p className="py-6 text-center text-sm text-neutral-400">今月の取引はありません</p>
          ) : (
            <ul className="mt-2 divide-y divide-neutral-100">
              {monthTxs.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm text-neutral-700">{tx.memo || catName}</p>
                    <p className="text-[11px] text-neutral-400">{tx.date.slice(8)}日</p>
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
      <div className="page-frame space-y-4 px-4 py-4 md:px-0 md:py-0">
        <Card>
          <CardHeader>
            <div className="space-y-2">
              <Skeleton width={120} height={10} />
              <Skeleton width={200} height={18} />
              <Skeleton width={260} height={10} />
            </div>
            <Skeleton width={96} height={24} rounded="full" />
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="space-y-2 border-l-2 border-neutral-200 pl-4">
                  <Skeleton width={60} height={10} />
                  <Skeleton width={140} height={22} />
                  <Skeleton width={180} height={10} />
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="space-y-2">
                  <Skeleton width={48} height={10} />
                  <Skeleton width={120} height={18} />
                </div>
                <Skeleton width={64} height={20} rounded="full" />
              </CardHeader>
              <CardBody className="grid grid-cols-2 gap-3">
                <Skeleton height={56} />
                <Skeleton height={56} />
              </CardBody>
            </Card>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[0, 1].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton width={140} height={14} />
                <Skeleton width={80} height={14} />
              </CardHeader>
              <CardBody>
                <Skeleton height={184} />
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Dashboard() {
  const currentMonth = getCurrentMonth();
  const oldestMonth = addMonths(currentMonth, -5);
  const previousMonth = addMonths(currentMonth, -1);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const scopedTransactions = useLiveQuery(
    () =>
      db.transactions
        .where('date')
        .between(`${oldestMonth}-01`, `${currentMonth}-31`, true, true)
        .toArray(),
    [oldestMonth, currentMonth]
  );
  const categories = useLiveQuery(() => db.categories.toArray(), []);
  const budgets = useLiveQuery(() => db.budgets.toArray(), []);
  const goals = useLiveQuery(() => db.goals.toArray(), []);

  const catMap = Object.fromEntries((categories ?? []).map((c) => [c.id, c]));
  const allTransactions = scopedTransactions ?? [];
  const monthlyStats = new Map<string, { income: number; expense: number }>();
  for (const tx of allTransactions) {
    const monthKey = tx.date.slice(0, 7);
    const stats = monthlyStats.get(monthKey) ?? { income: 0, expense: 0 };
    if (tx.type === 'income') stats.income += tx.amount;
    else stats.expense += tx.amount;
    monthlyStats.set(monthKey, stats);
  }

  const currentTxs = allTransactions.filter((t) => t.date.startsWith(currentMonth));
  const previousTxs = allTransactions.filter((t) => t.date.startsWith(previousMonth));
  const expenseTxs = currentTxs.filter((t) => t.type === 'expense');
  const relevantBudgets = (budgets ?? []).filter(
    (b) => b.month === currentMonth || b.month === null
  );
  const expenseByCategory = new Map<string, number>();
  for (const tx of expenseTxs) {
    expenseByCategory.set(tx.categoryId, (expenseByCategory.get(tx.categoryId) ?? 0) + tx.amount);
  }
  const budgetRows = relevantBudgets.map((b) => {
    const spent = expenseByCategory.get(b.categoryId) ?? 0;
    const pct = b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0;
    return { ...b, cat: catMap[b.categoryId], spent, pct };
  });
  const alertThreshold = loadThreshold();
  const alertRows = budgetRows.filter((r) => r.pct >= alertThreshold);

  useEffect(() => {
    if (alertRows.length === 0) return;
    if (typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    const notifiedStr = sessionStorage.getItem(NOTIFIED_KEY) ?? '';
    const notified = new Set(notifiedStr.split(',').filter(Boolean));
    for (const r of alertRows) {
      const key = `${currentMonth}:${r.id}`;
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

  if (!scopedTransactions || !categories || !budgets) {
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

  const months3 = Array.from({ length: 3 }, (_, i) => addMonths(currentMonth, i - 2));
  const avgIncome = Math.round(
    months3.reduce((sum, monthKey) => sum + (monthlyStats.get(monthKey)?.income ?? 0), 0) /
      months3.length
  );
  const avgExpense = Math.round(
    months3.reduce((sum, monthKey) => sum + (monthlyStats.get(monthKey)?.expense ?? 0), 0) /
      months3.length
  );
  const avgBalance = avgIncome - avgExpense;

  type Comparison = {
    label: string;
    value: number;
    tone: 'income' | 'expense' | 'success' | 'neutral';
    vsPrev: number;
    vsAverage: number;
    prevRate: number | null;
    avgRate: number | null;
    goodIsDown: boolean;
  };

  const overviewComparisons: Comparison[] = [
    {
      label: '支出',
      value: totalExpense,
      tone: 'expense',
      vsPrev: totalExpense - previousExpense,
      vsAverage: totalExpense - avgExpense,
      prevRate: compareRate(totalExpense, previousExpense),
      avgRate: compareRate(totalExpense, avgExpense),
      goodIsDown: true,
    },
    {
      label: '収入',
      value: totalIncome,
      tone: 'income',
      vsPrev: totalIncome - previousIncome,
      vsAverage: totalIncome - avgIncome,
      prevRate: compareRate(totalIncome, previousIncome),
      avgRate: compareRate(totalIncome, avgIncome),
      goodIsDown: false,
    },
    {
      label: '収支',
      value: balance,
      tone: balance >= 0 ? 'success' : 'expense',
      vsPrev: balance - previousBalance,
      vsAverage: balance - avgBalance,
      prevRate: compareRate(balance, previousBalance),
      avgRate: compareRate(balance, avgBalance),
      goodIsDown: false,
    },
  ];

  const months6 = Array.from({ length: 6 }, (_, i) => addMonths(currentMonth, i - 5));
  const barData = months6.map((m) => {
    const stats = monthlyStats.get(m) ?? { income: 0, expense: 0 };
    return {
      month: m.slice(5) + '月',
      income: stats.income,
      expense: stats.expense,
    };
  });

  const donutData = Array.from(expenseByCategory.entries())
    .map(([catId, value]) => ({
      catId,
      name: catMap[catId]?.name ?? catId,
      value,
      color: catMap[catId]?.color ?? '#888',
    }))
    .sort((a, b) => b.value - a.value);
  const donutTotal = donutData.reduce((s, d) => s + d.value, 0);

  const previousExpenseByCategory = new Map<string, number>();
  for (const tx of previousTxs.filter((t) => t.type === 'expense')) {
    previousExpenseByCategory.set(
      tx.categoryId,
      (previousExpenseByCategory.get(tx.categoryId) ?? 0) + tx.amount
    );
  }
  const categoryDiffs = Array.from(
    new Set([...expenseByCategory.keys(), ...previousExpenseByCategory.keys()])
  )
    .map((categoryId) => {
      const current = expenseByCategory.get(categoryId) ?? 0;
      const previous = previousExpenseByCategory.get(categoryId) ?? 0;
      return {
        categoryId,
        name: catMap[categoryId]?.name ?? categoryId,
        icon: catMap[categoryId]?.icon ?? '📦',
        color: catMap[categoryId]?.color ?? '#888',
        current,
        previous,
        delta: current - previous,
      };
    })
    .filter((row) => row.current > 0 || row.previous > 0)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  const increasedCategories = categoryDiffs.filter((row) => row.delta > 0).slice(0, 3);
  const decreasedCategories = categoryDiffs.filter((row) => row.delta < 0).slice(0, 3);

  const selectedCat = selectedCatId ? catMap[selectedCatId] : null;
  const weather = getWeather(totalIncome, totalExpense, allTransactions.length > 0);

  return (
    <div className="h-full overflow-y-auto pb-24 md:pb-6">
      <div className="page-frame space-y-4 px-4 py-4 md:px-0 md:py-0">
        <Card>
          <CardHeader>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                今月のスナップショット
              </p>
              <CardTitle className="mt-0.5 text-base">
                {currentMonth.replace('-', '年')}月の家計状況
              </CardTitle>
              <CardDescription>
                収入・支出・予算進捗を同じ画面で把握できます
              </CardDescription>
            </div>
            <Badge tone="neutral" size="md">
              <span className="text-sm">{weather.emoji}</span>
              <span>{weather.label}</span>
            </Badge>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Stat
                label="収支"
                tone={balance >= 0 ? 'success' : 'expense'}
                value={`${balance >= 0 ? '+' : ''}${fmt(balance)}`}
                hint={weather.message}
              />
              <Stat label="収入" tone="income" value={fmt(totalIncome)} />
              <Stat label="支出" tone="expense" value={fmt(totalExpense)} />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <div>
              <CardTitle>3か月比較</CardTitle>
              <CardDescription>前月・3か月平均との差分</CardDescription>
            </div>
          </CardHeader>
          <CardBody className="grid grid-cols-1 divide-y divide-neutral-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {overviewComparisons.map((item) => {
              const goodPrev = item.goodIsDown ? item.vsPrev <= 0 : item.vsPrev >= 0;
              const goodAvg = item.goodIsDown ? item.vsAverage <= 0 : item.vsAverage >= 0;
              const valueTone =
                item.tone === 'income'
                  ? 'text-income'
                  : item.tone === 'expense'
                    ? 'text-expense'
                    : item.tone === 'success'
                      ? 'text-success'
                      : 'text-neutral-900';
              return (
                <div key={item.label} className="px-4 py-3 first:pl-0 last:pr-0 sm:first:pl-4 sm:last:pr-4">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                    {item.label}
                  </p>
                  <p className={`mt-1 text-xl font-bold tabular-nums ${valueTone}`}>
                    {fmt(item.value)}
                  </p>
                  <div className="mt-3 space-y-1.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[11px] text-neutral-500">前月比</span>
                      <span className="flex items-baseline gap-1.5">
                        <span
                          className={`text-sm font-semibold tabular-nums ${
                            goodPrev ? 'text-success' : 'text-expense'
                          }`}
                        >
                          {fmtDelta(item.vsPrev)}
                        </span>
                        <span className="text-[11px] text-neutral-500 tabular-nums">
                          {fmtPercent(item.prevRate)}
                        </span>
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[11px] text-neutral-500">3か月平均比</span>
                      <span className="flex items-baseline gap-1.5">
                        <span
                          className={`text-sm font-semibold tabular-nums ${
                            goodAvg ? 'text-success' : 'text-expense'
                          }`}
                        >
                          {fmtDelta(item.vsAverage)}
                        </span>
                        <span className="text-[11px] text-neutral-500 tabular-nums">
                          {fmtPercent(item.avgRate)}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.75fr)_minmax(320px,1fr)]">
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>月別収支</CardTitle>
                    <CardDescription>直近6か月の流れ</CardDescription>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-neutral-500">
                    <span className="flex items-center gap-1">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-sm"
                        style={{ backgroundColor: chartColors.income }}
                      />
                      収入
                    </span>
                    <span className="flex items-center gap-1">
                      <span
                        className="inline-block h-2.5 w-2.5 rounded-sm"
                        style={{ backgroundColor: chartColors.expense }}
                      />
                      支出
                    </span>
                  </div>
                </CardHeader>
                <CardBody>
                  <ResponsiveContainer width="100%" height={184}>
                    <BarChart data={barData} barCategoryGap="25%">
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
                          v === 0 ? '0' : `${Math.round(v / 10000)}万`
                        }
                        tick={chartAxisTick}
                        axisLine={false}
                        tickLine={false}
                        width={36}
                      />
                      <Tooltip
                        contentStyle={chartTooltipStyle}
                        cursor={{ fill: 'rgba(226,232,240,0.4)' }}
                        formatter={(v, name) => [
                          fmt(Number(v)),
                          name === 'income' ? '収入' : '支出',
                        ]}
                      />
                      <Bar dataKey="income" fill={chartColors.income} radius={[2, 2, 0, 0]} />
                      <Bar dataKey="expense" fill={chartColors.expense} radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>カテゴリ別支出</CardTitle>
                    <CardDescription>主要カテゴリの割合と内訳</CardDescription>
                  </div>
                </CardHeader>
                <CardBody>
                  {donutData.length === 0 ? (
                    <p className="py-10 text-center text-sm text-neutral-400">
                      今月の支出データがありません
                    </p>
                  ) : (
                    <div className="flex items-center gap-4">
                      <PieChart width={150} height={150}>
                        <Pie
                          data={donutData}
                          cx={70}
                          cy={70}
                          innerRadius={42}
                          outerRadius={70}
                          dataKey="value"
                          paddingAngle={2}
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
                      <ul className="min-w-0 flex-1 space-y-1.5">
                        {donutData.map((d, i) => (
                          <li
                            key={i}
                            className="flex cursor-pointer items-center gap-2 text-xs transition-opacity hover:opacity-70"
                            onClick={() => setSelectedCatId(d.catId)}
                          >
                            <span
                              className="h-2.5 w-2.5 shrink-0 rounded-sm"
                              style={{ background: d.color }}
                            />
                            <span className="truncate text-neutral-700">{d.name}</span>
                            <span className="ml-auto shrink-0 tabular-nums text-neutral-500">
                              {donutTotal > 0 ? Math.round((d.value / donutTotal) * 100) : 0}%
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardBody>
              </Card>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>増えたカテゴリ</CardTitle>
                    <CardDescription>
                      {previousMonth.replace('-', '年')}月より増えた項目
                    </CardDescription>
                  </div>
                  <TrendingUp size={16} className="text-expense" />
                </CardHeader>
                <CardBody>
                  {increasedCategories.length === 0 ? (
                    <p className="text-sm text-neutral-400">大きく増えたカテゴリはありません</p>
                  ) : (
                    <ul className="space-y-2">
                      {increasedCategories.map((row) => (
                        <li
                          key={row.categoryId}
                          className="flex items-center gap-3 rounded-md bg-expense-subtle px-3 py-2.5"
                        >
                          <span
                            className="flex h-9 w-9 items-center justify-center rounded-md text-base"
                            style={{ backgroundColor: `${row.color}22` }}
                          >
                            {row.icon}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-neutral-800">
                              {row.name}
                            </p>
                            <p className="text-[11px] text-neutral-500 tabular-nums">
                              {fmt(row.previous)} → {fmt(row.current)}
                            </p>
                          </div>
                          <p className="text-sm font-semibold tabular-nums text-expense">
                            {fmtDelta(row.delta)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardBody>
              </Card>

              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>減ったカテゴリ</CardTitle>
                    <CardDescription>
                      {previousMonth.replace('-', '年')}月より減った項目
                    </CardDescription>
                  </div>
                  <TrendingDown size={16} className="text-success" />
                </CardHeader>
                <CardBody>
                  {decreasedCategories.length === 0 ? (
                    <p className="text-sm text-neutral-400">大きく減ったカテゴリはありません</p>
                  ) : (
                    <ul className="space-y-2">
                      {decreasedCategories.map((row) => (
                        <li
                          key={row.categoryId}
                          className="flex items-center gap-3 rounded-md bg-success-subtle px-3 py-2.5"
                        >
                          <span
                            className="flex h-9 w-9 items-center justify-center rounded-md text-base"
                            style={{ backgroundColor: `${row.color}22` }}
                          >
                            {row.icon}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-neutral-800">
                              {row.name}
                            </p>
                            <p className="text-[11px] text-neutral-500 tabular-nums">
                              {fmt(row.previous)} → {fmt(row.current)}
                            </p>
                          </div>
                          <p className="text-sm font-semibold tabular-nums text-success">
                            {fmtDelta(row.delta)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardBody>
              </Card>
            </div>
          </div>

          <div className="space-y-4">
            {alertRows.length > 0 && (
              <Card className="border-warning-border bg-warning-subtle">
                <CardBody className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle size={16} className="text-warning" />
                    <p className="text-xs font-semibold uppercase tracking-wider text-warning">
                      予算アラート
                    </p>
                  </div>
                  <ul className="space-y-1">
                    {alertRows.map((r) => (
                      <li key={r.id} className="flex items-center justify-between text-sm">
                        <span className="text-neutral-800">
                          {r.cat?.icon} {r.cat?.name}
                        </span>
                        <Badge tone="warning">{r.pct}%</Badge>
                      </li>
                    ))}
                  </ul>
                </CardBody>
              </Card>
            )}

            {budgetRows.length > 0 && (
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>予算進捗</CardTitle>
                    <CardDescription>カテゴリごとの消化率</CardDescription>
                  </div>
                </CardHeader>
                <CardBody className="space-y-3.5">
                  {budgetRows.map((r) => {
                    const color = progressColor(r.pct);
                    return (
                      <div key={r.id}>
                        <div className="mb-1 flex items-center justify-between text-xs">
                          <span className="text-neutral-700">
                            {r.cat?.icon} {r.cat?.name}
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
                  })}
                </CardBody>
              </Card>
            )}

            {(goals ?? []).length > 0 && (
              <Card>
                <CardHeader>
                  <div>
                    <CardTitle>貯蓄目標</CardTitle>
                    <CardDescription>目的別の積み上がり</CardDescription>
                  </div>
                </CardHeader>
                <CardBody className="space-y-3.5">
                  {(goals ?? []).map((g) => {
                    const pct =
                      g.targetAmount > 0
                        ? Math.min(100, Math.round((g.savedAmount / g.targetAmount) * 100))
                        : 0;
                    const remaining = g.targetAmount - g.savedAmount;
                    const daysLeft = g.deadline
                      ? Math.ceil((new Date(g.deadline).getTime() - Date.now()) / 86400000)
                      : null;
                    return (
                      <div key={g.id}>
                        <div className="mb-1 flex items-center justify-between gap-2 text-xs">
                          <span className="flex min-w-0 items-center gap-1.5">
                            <span>{g.icon}</span>
                            <span className="truncate font-medium text-neutral-800">
                              {g.name}
                            </span>
                            {daysLeft !== null && (
                              <Badge tone={daysLeft < 0 ? 'expense' : 'neutral'}>
                                {daysLeft < 0 ? '期限切れ' : `残${daysLeft}日`}
                              </Badge>
                            )}
                          </span>
                          <span className="shrink-0 tabular-nums text-neutral-500">
                            {fmt(g.savedAmount)} / {fmt(g.targetAmount)}
                            <span className="ml-1 font-semibold" style={{ color: g.color }}>
                              {pct}%
                            </span>
                          </span>
                        </div>
                        <ProgressBar value={g.savedAmount} max={g.targetAmount} color={g.color} />
                        {remaining > 0 && (
                          <p className="mt-1 text-right text-[10px] text-neutral-400 tabular-nums">
                            あと{fmt(remaining)}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      </div>

      {selectedCatId && selectedCat && (
        <CategoryDetailModal
          categoryId={selectedCatId}
          catName={selectedCat.name}
          catColor={selectedCat.color}
          catIcon={selectedCat.icon}
          month={currentMonth}
          onClose={() => setSelectedCatId(null)}
        />
      )}
    </div>
  );
}
