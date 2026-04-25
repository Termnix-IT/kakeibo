import { Suspense, lazy, useState } from 'react';
import {
  BarChart3,
  Bell,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Gem,
  Home,
  Landmark,
  Settings as SettingsIcon,
  Sparkles,
  Target,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BottomNav } from './components/BottomNav';
import { TransactionModal } from './components/TransactionModal';
import { TransactionList } from './pages/TransactionList';
import { db } from './db';
import type { Transaction } from './types';
import type { SettingsSection } from './pages/Settings';

const Dashboard = lazy(async () => {
  const module = await import('./pages/Dashboard');
  return { default: module.Dashboard };
});

const Report = lazy(async () => {
  const module = await import('./pages/Report');
  return { default: module.Report };
});

const Settings = lazy(async () => {
  const module = await import('./pages/Settings');
  return { default: module.Settings };
});

export type Page =
  | 'dashboard'
  | 'transactions'
  | 'report'
  | 'budget'
  | 'assets'
  | 'goals'
  | 'settings'
  | 'export';

function getCurrentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function addMonths(yyyymm: string, delta: number): string {
  const [y, m] = yyyymm.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function getDefaultTransactionDate(month: string) {
  const today = new Date();
  const [year, monthNumber] = month.split('-').map(Number);
  const day = Math.min(today.getDate(), new Date(year, monthNumber, 0).getDate());
  return `${month}-${String(day).padStart(2, '0')}`;
}

type NavItem = {
  id: Page;
  label: string;
  caption: string;
  icon: LucideIcon;
};

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'ダッシュボード', caption: '全体の状況', icon: Home },
  { id: 'transactions', label: '収支明細', caption: '収入・支出の記録', icon: FileText },
  { id: 'report', label: 'レポート', caption: '分析とグラフ', icon: BarChart3 },
  { id: 'budget', label: '予算管理', caption: '予算の設定と進捗', icon: Wallet },
  { id: 'assets', label: '資産管理', caption: '口座・資産の一覧', icon: Landmark },
  { id: 'goals', label: '目標・貯金', caption: '目標の設定と達成度', icon: Target },
  { id: 'settings', label: '設定', caption: '各種設定', icon: SettingsIcon },
  { id: 'export', label: 'データエクスポート', caption: 'CSV出力・バックアップ', icon: Download },
];

const PAGE_TITLES: Record<Page, { title: string; subtitle: string }> = {
  dashboard: { title: 'ダッシュボード', subtitle: '今月の家計の状況をひと目で把握' },
  transactions: { title: '収支明細', subtitle: '入力と確認' },
  report: { title: 'レポート', subtitle: '推移とカテゴリの分析' },
  budget: { title: '予算管理', subtitle: 'カテゴリ別の月次予算とアラート閾値' },
  assets: { title: '資産管理', subtitle: '口座・資産の一覧（プレビュー）' },
  goals: { title: '目標・貯金', subtitle: '貯蓄目標の設定と達成度' },
  settings: { title: '設定', subtitle: 'カテゴリ・固定費・通知などのアプリ設定' },
  export: { title: 'データエクスポート', subtitle: 'JSON バックアップ・銀行 CSV インポート' },
};

function AssetsComingSoon() {
  return (
    <div className="page-frame pad-page md:p-0">
      <div className="neon-card neon-card-purple p-[clamp(1.5rem,4vw,2.5rem)] text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(168,85,247,0.15)] border border-[rgba(168,85,247,0.5)]">
          <Landmark size={28} className="text-[#c4b5fd]" />
        </div>
        <h2 className="mt-4 text-xl font-bold neon-text-purple">資産管理（プレビュー）</h2>
        <p className="mt-2 text-sm text-neutral-500 leading-relaxed">
          銀行口座 / 投資信託 / 現金などの資産を一元管理する機能を準備中です。
          <br />
          現在のバージョンではダッシュボード上にダミー値で表示されます。
        </p>
        <div className="mx-auto mt-6 max-w-sm grid grid-cols-3 gap-3 text-left">
          <div className="rounded-md border border-[var(--color-surface-border)] bg-[var(--color-surface-2)] p-3">
            <p className="text-[10px] uppercase tracking-wider text-neutral-500">銀行口座</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-neutral-900">¥1,234,560</p>
          </div>
          <div className="rounded-md border border-[var(--color-surface-border)] bg-[var(--color-surface-2)] p-3">
            <p className="text-[10px] uppercase tracking-wider text-neutral-500">投資信託</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-neutral-900">¥1,456,780</p>
          </div>
          <div className="rounded-md border border-[var(--color-surface-border)] bg-[var(--color-surface-2)] p-3">
            <p className="text-[10px] uppercase tracking-wider text-neutral-500">現金・その他</p>
            <p className="mt-1 text-sm font-semibold tabular-nums text-neutral-900">¥554,440</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [month, setMonth] = useState(getCurrentMonth);
  const [showModal, setShowModal] = useState(false);
  const titleInfo = PAGE_TITLES[page];

  const handleAddTransaction = async (
    data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    const now = new Date().toISOString();
    await db.transactions.add({
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
  };

  const pageFallback = (
    <div className="flex h-full items-center justify-center px-6">
      <div className="neon-card px-6 py-5 text-center">
        <p className="text-sm font-semibold text-neutral-900">画面を読み込み中...</p>
        <p className="mt-1 text-xs text-neutral-500">
          チャートや設定モジュールを準備しています
        </p>
      </div>
    </div>
  );

  // 各ページが Settings のどのセクションを表示するかのマッピング
  const sectionsForPage: Record<string, SettingsSection[] | null> = {
    budget: ['budget', 'budgetAlert'],
    goals: ['goals'],
    settings: ['category', 'fixed', 'app', 'seed'],
    export: ['backup'],
  };

  const renderPage = () => {
    if (page === 'transactions') {
      return <TransactionList month={month} onMonthChange={setMonth} />;
    }
    if (page === 'assets') {
      return <AssetsComingSoon />;
    }
    const settingsSections = sectionsForPage[page];
    return (
      <Suspense fallback={pageFallback}>
        {page === 'dashboard' && <Dashboard month={month} onMonthChange={setMonth} onQuickAdd={() => setShowModal(true)} onNavigate={setPage} />}
        {page === 'report' && <Report />}
        {settingsSections && <Settings sections={settingsSections} />}
      </Suspense>
    );
  };

  return (
    <div className="flex min-h-screen text-neutral-800">
      <aside className="hidden shrink-0 md:sticky md:top-0 md:flex md:h-screen md:w-[clamp(15rem,18vw,18rem)] md:flex-col md:justify-between md:border-r md:border-[var(--color-surface-border)] md:bg-[var(--color-surface)]/80 md:backdrop-blur md:px-[var(--space-sidebar-x)] md:py-[var(--space-sidebar-y)]">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5 pb-1">
            <div className="glow-pulse flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-[#22d3ee] to-[#0891b2] shadow-[0_0_18px_rgba(34,211,238,0.5)] text-[#22d3ee]">
              <Home size={18} className="text-[#04111c]" strokeWidth={2.5} />
            </div>
            <div className="min-w-0">
              <p className="glitch text-base font-bold neon-text-cyan leading-tight">家計簿</p>
              <p className="text-[10px] text-neutral-500 leading-tight">スマートに管理、未来をつくる</p>
            </div>
          </div>

          <nav className="space-y-0.5">
            {NAV_ITEMS.map(({ id, label, caption, icon: Icon }) => {
              const active = page === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPage(id)}
                  className={`group flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-sm transition-all ${
                    active
                      ? 'nav-active-bar bg-[rgba(34,211,238,0.12)] text-[#67e8f9] border border-[rgba(34,211,238,0.4)] shadow-[0_0_18px_rgba(34,211,238,0.15)]'
                      : 'text-neutral-600 border border-transparent hover:bg-[rgba(34,211,238,0.06)] hover:text-neutral-900 hover:border-[rgba(34,211,238,0.2)]'
                  }`}
                >
                  <Icon
                    size={16}
                    strokeWidth={active ? 2.25 : 2}
                    className={active ? '' : 'text-neutral-500 group-hover:text-neutral-700'}
                  />
                  <div className="flex-1 min-w-0 leading-tight">
                    <p className="font-medium">{label}</p>
                    <p className={`text-[10px] leading-tight ${active ? 'text-[#67e8f9]/70' : 'text-neutral-500'}`}>
                      {caption}
                    </p>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* プレミアムプランカード */}
        <div className="neon-card neon-card-purple p-3 text-center">
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(168,85,247,0.18)] border border-[rgba(168,85,247,0.5)]">
            <Gem size={16} className="text-[#c4b5fd]" />
          </div>
          <p className="mt-1.5 text-sm font-bold neon-text-purple leading-tight">プレミアムプラン</p>
          <p className="mt-0.5 text-[10px] text-neutral-500 leading-snug">
            高度な分析と連携機能を利用
          </p>
          <button
            type="button"
            onClick={() => alert('プレビュー版です')}
            className="mt-2 w-full rounded-md bg-gradient-to-r from-[#a855f7] to-[#7c3aed] px-3 py-1.5 text-xs font-semibold text-white shadow-[0_0_14px_rgba(168,85,247,0.4)] hover:shadow-[0_0_20px_rgba(168,85,247,0.6)] transition-shadow"
          >
            プランをアップグレード
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="header-neon-line hidden border-b border-[var(--color-surface-border)] bg-[var(--color-bg)]/60 backdrop-blur md:block md:px-[var(--space-page-x)] md:py-[var(--space-header-y)]">
          <div className="page-frame flex items-center justify-between gap-4">
            <div>
              <h1 className="page-title">{titleInfo.title}</h1>
              <p className="mt-0.5 text-sm text-neutral-500">{titleInfo.subtitle}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] uppercase tracking-wider text-neutral-500">対象月</span>
                <input
                  type="month"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  className="h-9 rounded-md border border-[var(--color-surface-border-strong)] bg-[var(--color-surface-2)] px-3 text-sm font-semibold tabular-nums text-neutral-900 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  type="button"
                  onClick={() => setMonth(addMonths(month, -1))}
                  aria-label="前の月"
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-surface-border-strong)] bg-[var(--color-surface-2)] text-neutral-600 hover:border-[rgba(34,211,238,0.5)] hover:text-[#67e8f9] transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setMonth(addMonths(month, 1))}
                  aria-label="次の月"
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-surface-border-strong)] bg-[var(--color-surface-2)] text-neutral-600 hover:border-[rgba(34,211,238,0.5)] hover:text-[#67e8f9] transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              <div className="mx-1 h-9 w-px bg-[var(--color-surface-border)]" />

              <button
                type="button"
                onClick={() => alert('プレビュー版です')}
                aria-label="クイック入力"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-[rgba(251,146,60,0.45)] bg-[rgba(251,146,60,0.1)] text-[#fdba74] hover:shadow-[0_0_14px_rgba(251,146,60,0.35)] transition-shadow"
              >
                <Sparkles size={16} />
              </button>

              <button
                type="button"
                onClick={() => alert('プレビュー版です')}
                aria-label="通知"
                className="relative flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-surface-border-strong)] bg-[var(--color-surface-2)] text-neutral-600 hover:border-[rgba(34,211,238,0.5)] hover:text-[#67e8f9] transition-colors"
              >
                <Bell size={16} />
                <span className="pulse-badge absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#ec4899] px-1 text-[9px] font-bold text-white shadow-[0_0_10px_rgba(236,72,153,0.6)]">
                  3
                </span>
              </button>

              <button
                type="button"
                onClick={() => alert('プレビュー版です')}
                className="flex items-center gap-2 rounded-md border border-[var(--color-surface-border-strong)] bg-[var(--color-surface-2)] px-3 py-1.5 text-left hover:border-[rgba(34,211,238,0.4)] transition-colors"
              >
                <div className="avatar-flow flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-[#22d3ee] via-[#a855f7] to-[#ec4899] text-[10px] font-bold text-[#04111c]">
                  家
                </div>
                <div className="hidden lg:block">
                  <p className="text-xs font-semibold text-neutral-900 leading-tight">家計 太郎</p>
                  <p className="text-[10px] text-neutral-500 leading-tight">プレミアムプラン</p>
                </div>
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden md:px-[var(--space-page-x)] md:py-[var(--space-page-y)]">{renderPage()}</main>

        <BottomNav current={page} onChange={setPage} onAddClick={() => setShowModal(true)} />
      </div>

      {showModal && (
        <TransactionModal
          onClose={() => setShowModal(false)}
          onSave={handleAddTransaction}
          defaultDate={getDefaultTransactionDate(month)}
        />
      )}
    </div>
  );
}
