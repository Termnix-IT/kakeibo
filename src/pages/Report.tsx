import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { db } from '../db';
import { exportCSV } from '../utils/export';
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  IconButton,
  Skeleton,
  Stat,
  Tabs,
  chartAxisTick,
  chartColors,
  chartTooltipStyle,
} from '../components/ui';

function getCurrentMonth(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getCurrentYear(): number {
  return new Date().getFullYear();
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

type RankingView = 'bar' | 'pie';

function ReportSkeleton() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <Skeleton width={160} height={16} />
          <Skeleton width={100} height={28} rounded="sm" />
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-2 border-l-2 border-neutral-200 pl-4">
                <Skeleton width={60} height={10} />
                <Skeleton width={140} height={20} />
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {[0, 1].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton width={160} height={14} />
              <Skeleton width={60} height={14} />
            </CardHeader>
            <CardBody>
              <Skeleton height={196} />
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}

function MonthlyReport({
  month,
  onMonthChange,
}: {
  month: string;
  onMonthChange: (m: string) => void;
}) {
  const [rankingView, setRankingView] = useState<RankingView>('bar');
  const oldestMonth = addMonths(month, -11);
  const previousMonth = addMonths(month, -1);
  const scopedTransactions = useLiveQuery(
    () =>
      db.transactions
        .where('date')
        .between(`${oldestMonth}-01`, `${month}-31`, true, true)
        .toArray(),
    [oldestMonth, month]
  );
  const categories = useLiveQuery(() => db.categories.toArray(), []);

  if (!scopedTransactions || !categories) {
    return <ReportSkeleton />;
  }

  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));
  const allTransactions = scopedTransactions;

  const txs = allTransactions.filter((t) => t.date.startsWith(month));
  const totalIncome = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;
  const previousTxs = allTransactions.filter((t) => t.date.startsWith(previousMonth));
  const previousIncome = previousTxs
    .filter((t) => t.type === 'income')
    .reduce((s, t) => s + t.amount, 0);
  const previousExpense = previousTxs
    .filter((t) => t.type === 'expense')
    .reduce((s, t) => s + t.amount, 0);
  const previousBalance = previousIncome - previousExpense;

  const expenseTxs = txs.filter((t) => t.type === 'expense');
  const expenseByCat: Record<string, number> = {};
  for (const t of expenseTxs) {
    expenseByCat[t.categoryId] = (expenseByCat[t.categoryId] ?? 0) + t.amount;
  }
  const rankingData = Object.entries(expenseByCat)
    .map(([catId, value]) => ({
      name: catMap[catId]?.name ?? catId,
      value,
      color: catMap[catId]?.color ?? '#888',
    }))
    .sort((a, b) => b.value - a.value);
  const rankingTotal = rankingData.reduce((s, r) => s + r.value, 0);

  const months12 = Array.from({ length: 12 }, (_, i) => addMonths(month, i - 11));
  const monthlyStats = new Map<string, { income: number; expense: number }>();
  for (const tx of allTransactions) {
    const monthKey = tx.date.slice(0, 7);
    const stats = monthlyStats.get(monthKey) ?? { income: 0, expense: 0 };
    if (tx.type === 'income') stats.income += tx.amount;
    else stats.expense += tx.amount;
    monthlyStats.set(monthKey, stats);
  }
  const lineData = months12.map((m) => {
    const stats = monthlyStats.get(m) ?? { income: 0, expense: 0 };
    return {
      month: m.slice(5) + '月',
      income: stats.income,
      expense: stats.expense,
    };
  });
  const months3 = Array.from({ length: 3 }, (_, i) => addMonths(month, i - 2));
  const avgIncome = Math.round(
    months3.reduce((sum, mk) => sum + (monthlyStats.get(mk)?.income ?? 0), 0) / months3.length
  );
  const avgExpense = Math.round(
    months3.reduce((sum, mk) => sum + (monthlyStats.get(mk)?.expense ?? 0), 0) / months3.length
  );
  const avgBalance = avgIncome - avgExpense;

  type Row = {
    label: string;
    tone: 'income' | 'expense' | 'success';
    current: number;
    vsPrev: number;
    vsAverage: number;
    prevRate: number | null;
    avgRate: number | null;
    goodIsDown: boolean;
  };

  const comparisonRows: Row[] = [
    {
      label: '収入',
      tone: 'income',
      current: totalIncome,
      vsPrev: totalIncome - previousIncome,
      vsAverage: totalIncome - avgIncome,
      prevRate: compareRate(totalIncome, previousIncome),
      avgRate: compareRate(totalIncome, avgIncome),
      goodIsDown: false,
    },
    {
      label: '支出',
      tone: 'expense',
      current: totalExpense,
      vsPrev: totalExpense - previousExpense,
      vsAverage: totalExpense - avgExpense,
      prevRate: compareRate(totalExpense, previousExpense),
      avgRate: compareRate(totalExpense, avgExpense),
      goodIsDown: true,
    },
    {
      label: '残高',
      tone: balance >= 0 ? 'success' : 'expense',
      current: balance,
      vsPrev: balance - previousBalance,
      vsAverage: balance - avgBalance,
      prevRate: compareRate(balance, previousBalance),
      avgRate: compareRate(balance, avgBalance),
      goodIsDown: false,
    },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <IconButton onClick={() => onMonthChange(addMonths(month, -1))} aria-label="前月">
              <ChevronLeft size={16} />
            </IconButton>
            <span className="min-w-[92px] text-center text-sm font-semibold tabular-nums text-neutral-900">
              {month.replace('-', '年')}月
            </span>
            <IconButton onClick={() => onMonthChange(addMonths(month, 1))} aria-label="翌月">
              <ChevronRight size={16} />
            </IconButton>
          </div>
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<Download size={14} />}
            onClick={() => exportCSV(txs, categories, month)}
          >
            CSVエクスポート
          </Button>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Stat label="収入" tone="income" value={fmt(totalIncome)} />
            <Stat label="支出" tone="expense" value={fmt(totalExpense)} />
            <Stat
              label="残高"
              tone={balance >= 0 ? 'success' : 'expense'}
              value={fmt(balance)}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>比較</CardTitle>
        </CardHeader>
        <CardBody className="grid grid-cols-1 divide-y divide-neutral-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
          {comparisonRows.map((row) => {
            const goodPrev = row.goodIsDown ? row.vsPrev <= 0 : row.vsPrev >= 0;
            const goodAvg = row.goodIsDown ? row.vsAverage <= 0 : row.vsAverage >= 0;
            const valueTone =
              row.tone === 'income'
                ? 'text-income'
                : row.tone === 'expense'
                  ? 'text-expense'
                  : 'text-success';
            return (
              <div
                key={row.label}
                className="px-4 py-3 first:pl-0 last:pr-0 sm:first:pl-4 sm:last:pr-4"
              >
                <p className="text-[11px] font-medium uppercase tracking-wider text-neutral-500">
                  {row.label}
                </p>
                <p className={`mt-1 text-lg font-bold tabular-nums ${valueTone}`}>
                  {fmt(row.current)}
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
                        {fmtDelta(row.vsPrev)}
                      </span>
                      <span className="text-[11px] text-neutral-500 tabular-nums">
                        {fmtPercent(row.prevRate)}
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
                        {fmtDelta(row.vsAverage)}
                      </span>
                      <span className="text-[11px] text-neutral-500 tabular-nums">
                        {fmtPercent(row.avgRate)}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>カテゴリ別支出ランキング</CardTitle>
            <Tabs<RankingView>
              size="sm"
              value={rankingView}
              onChange={setRankingView}
              items={[
                { value: 'bar', label: '棒' },
                { value: 'pie', label: '円' },
              ]}
            />
          </CardHeader>
          <CardBody>
            {rankingData.length === 0 ? (
              <p className="py-4 text-center text-sm text-neutral-400">支出データがありません</p>
            ) : rankingView === 'bar' ? (
              <ResponsiveContainer
                width="100%"
                height={Math.max(rankingData.length * 36 + 20, 152)}
              >
                <BarChart data={rankingData} layout="vertical" barCategoryGap="30%">
                  <XAxis
                    type="number"
                    tick={chartAxisTick}
                    tickFormatter={(v) => `¥${Math.round(v / 1000)}K`}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 12, fill: chartColors.axis }}
                    width={64}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    cursor={{ fill: 'rgba(226,232,240,0.4)' }}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(v, _name, item: any) => [fmt(Number(v)), item?.payload?.name ?? '']}
                  />
                  <Bar dataKey="value" radius={[0, 2, 2, 0]}>
                    {rankingData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center gap-4 py-2">
                <PieChart width={200} height={200}>
                  <Pie
                    data={rankingData}
                    cx={95}
                    cy={95}
                    outerRadius={90}
                    dataKey="value"
                    paddingAngle={2}
                    label={({ percent }: { percent?: number }) =>
                      (percent ?? 0) > 0.05 ? `${Math.round((percent ?? 0) * 100)}%` : ''
                    }
                    labelLine={false}
                  >
                    {rankingData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(v, _name, item: any) => [fmt(Number(v)), item?.payload?.name ?? '']}
                  />
                </PieChart>
                <ul className="w-full space-y-1.5">
                  {rankingData.map((d, i) => {
                    const pct = rankingTotal > 0 ? Math.round((d.value / rankingTotal) * 100) : 0;
                    return (
                      <li key={i} className="flex items-center gap-2 text-xs">
                        <span
                          className="h-3 w-3 shrink-0 rounded-sm"
                          style={{ background: d.color }}
                        />
                        <span className="flex-1 truncate text-neutral-700">{d.name}</span>
                        <span className="tabular-nums text-neutral-500">{pct}%</span>
                        <span className="font-medium tabular-nums text-neutral-800">
                          {fmt(d.value)}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>直近12ヶ月の収支推移</CardTitle>
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
            <ResponsiveContainer width="100%" height={196}>
              <LineChart data={lineData}>
                <CartesianGrid
                  strokeDasharray="2 4"
                  stroke={chartColors.grid}
                  vertical={false}
                />
                <XAxis
                  dataKey="month"
                  tick={chartAxisTick}
                  interval={2}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => (v === 0 ? '0' : `${Math.round(v / 10000)}万`)}
                  tick={chartAxisTick}
                  width={36}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={chartTooltipStyle}
                  formatter={(v, name) => [fmt(Number(v)), name === 'income' ? '収入' : '支出']}
                />
                <Legend
                  iconSize={8}
                  wrapperStyle={{ fontSize: 11, color: chartColors.axis, paddingTop: 8 }}
                  formatter={(v) => (v === 'income' ? '収入' : '支出')}
                />
                <Line
                  type="monotone"
                  dataKey="income"
                  stroke={chartColors.income}
                  strokeWidth={1.75}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="expense"
                  stroke={chartColors.expense}
                  strokeWidth={1.75}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function AnnualReport({
  year,
  onYearChange,
}: {
  year: number;
  onYearChange: (y: number) => void;
}) {
  const yearStart = `${year}-01-01`;
  const yearEnd = `${year}-12-31`;
  const transactions = useLiveQuery(
    () => db.transactions.where('date').between(yearStart, yearEnd, true, true).toArray(),
    [yearStart, yearEnd]
  );

  if (!transactions) {
    return <ReportSkeleton />;
  }

  const txs = transactions;

  const monthlyStats = new Map<string, { income: number; expense: number }>();
  for (const tx of txs) {
    const monthKey = tx.date.slice(0, 7);
    const stats = monthlyStats.get(monthKey) ?? { income: 0, expense: 0 };
    if (tx.type === 'income') stats.income += tx.amount;
    else stats.expense += tx.amount;
    monthlyStats.set(monthKey, stats);
  }
  const barData = Array.from({ length: 12 }, (_, i) => {
    const m = `${year}-${String(i + 1).padStart(2, '0')}`;
    const stats = monthlyStats.get(m) ?? { income: 0, expense: 0 };
    return {
      month: `${i + 1}月`,
      income: stats.income,
      expense: stats.expense,
    };
  });

  const totalIncome = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = txs.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const savingRate =
    totalIncome > 0 ? Math.round(((totalIncome - totalExpense) / totalIncome) * 100) : 0;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <IconButton onClick={() => onYearChange(year - 1)} aria-label="前年">
              <ChevronLeft size={16} />
            </IconButton>
            <span className="min-w-[80px] text-center text-sm font-semibold tabular-nums text-neutral-900">
              {year}年
            </span>
            <IconButton onClick={() => onYearChange(year + 1)} aria-label="翌年">
              <ChevronRight size={16} />
            </IconButton>
          </div>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Stat label="年間収入" tone="income" value={fmt(totalIncome)} />
            <Stat label="年間支出" tone="expense" value={fmt(totalExpense)} />
            <Stat
              label="貯蓄率"
              tone={savingRate >= 0 ? 'success' : 'expense'}
              value={`${savingRate}%`}
            />
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>月別収支</CardTitle>
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
          <ResponsiveContainer width="100%" height={220}>
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
                tickFormatter={(v) => (v === 0 ? '0' : `${Math.round(v / 10000)}万`)}
                tick={chartAxisTick}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip
                contentStyle={chartTooltipStyle}
                cursor={{ fill: 'rgba(226,232,240,0.4)' }}
                formatter={(v, name) => [fmt(Number(v)), name === 'income' ? '収入' : '支出']}
              />
              <Bar dataKey="income" fill={chartColors.income} radius={[2, 2, 0, 0]} />
              <Bar dataKey="expense" fill={chartColors.expense} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardBody>
      </Card>
    </div>
  );
}

type Tab = 'monthly' | 'annual';

export function Report() {
  const [tab, setTab] = useState<Tab>('monthly');
  const [month, setMonth] = useState(getCurrentMonth);
  const [year, setYear] = useState(getCurrentYear);

  return (
    <div className="h-full overflow-y-auto pb-24 md:pb-6">
      <div className="page-frame space-y-4 px-4 py-4 md:px-0 md:py-0">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow-label text-neutral-500">レポート</p>
            <h1 className="page-title mt-0.5">月次・年次の推移を分析</h1>
          </div>
          <Tabs<Tab>
            value={tab}
            onChange={setTab}
            items={[
              { value: 'monthly', label: '月次' },
              { value: 'annual', label: '年次' },
            ]}
          />
        </div>

        {tab === 'monthly' && <MonthlyReport month={month} onMonthChange={setMonth} />}
        {tab === 'annual' && <AnnualReport year={year} onYearChange={setYear} />}
      </div>
    </div>
  );
}
