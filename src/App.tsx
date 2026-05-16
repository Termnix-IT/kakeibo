import { Suspense, lazy, useEffect, useRef, useState } from 'react';
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const titleInfo = PAGE_TITLES[page];
  const sidebarWidth = sidebarCollapsed ? '4.5rem' : 'clamp(15rem,18vw,18rem)';
  const headerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const header = headerRef.current;
    if (!header) return;
    const setVar = () => {
      document.documentElement.style.setProperty(
        '--app-header-height',
        `${header.offsetHeight}px`
      );
    };
    setVar();
    const observer = new ResizeObserver(setVar);
    observer.observe(header);
    window.addEventListener('resize', setVar);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', setVar);
    };
  }, []);

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
    <div className="flex min-h-screen flex-col text-neutral-800">
      <header ref={headerRef} className="header-neon-line fixed inset-x-0 top-0 z-30 hidden border-b border-[var(--color-header-border)] bg-[var(--color-header-bg)] text-[var(--color-header-fg)] md:block md:px-[var(--space-page-x)] md:py-[var(--space-header-y)]">
        <div className="page-frame flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <button
              type="button"
              onClick={() => setSidebarCollapsed((v) => !v)}
              aria-label={sidebarCollapsed ? 'サイドバーを展開' : 'サイドバーを折りたたむ'}
              aria-expanded={!sidebarCollapsed}
              className="flex items-center gap-2.5 rounded-md p-1 -m-1 hover:bg-[var(--color-header-control-bg)] transition-colors"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/15 text-[var(--color-header-fg)]">
                <Home size={18} strokeWidth={2.25} />
              </div>
              <div className="min-w-0 text-left">
                <p className="text-base font-bold leading-tight text-[var(--color-header-fg)]">家計簿</p>
                <p className="text-[10px] leading-tight text-[var(--color-header-fg-muted)]">スマートに管理、未来をつくる</p>
              </div>
            </button>
            <div className="hidden lg:block h-9 w-px bg-[var(--color-header-control-border)]" />
            <div className="hidden lg:block min-w-0">
              <h1 className="page-title !text-[var(--color-header-fg)]">{titleInfo.title}</h1>
              <p className="mt-0.5 text-sm text-[var(--color-header-fg-muted)] truncate">{titleInfo.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] uppercase tracking-wider text-[var(--color-header-fg-muted)]">対象月</span>
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="h-9 rounded-md border border-[var(--color-header-control-border)] bg-[var(--color-header-control-bg)] px-3 text-sm font-semibold tabular-nums text-[var(--color-header-fg)] focus:outline-none focus:ring-2 focus:ring-white/40 [&::-webkit-calendar-picker-indicator]:invert"
              />
              <button
                type="button"
                onClick={() => setMonth(addMonths(month, -1))}
                aria-label="前の月"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-header-control-border)] bg-[var(--color-header-control-bg)] text-[var(--color-header-fg)] hover:bg-[var(--color-header-control-bg-hover)] transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setMonth(addMonths(month, 1))}
                aria-label="次の月"
                className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-header-control-border)] bg-[var(--color-header-control-bg)] text-[var(--color-header-fg)] hover:bg-[var(--color-header-control-bg-hover)] transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="mx-1 h-9 w-px bg-[var(--color-header-control-border)]" />

            <button
              type="button"
              onClick={() => alert('プレビュー版です')}
              aria-label="クイック入力"
              className="flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-header-control-border)] bg-[var(--color-header-control-bg)] text-[var(--color-header-fg)] hover:bg-[var(--color-header-control-bg-hover)] transition-colors"
            >
              <Sparkles size={16} />
            </button>

            <button
              type="button"
              onClick={() => alert('プレビュー版です')}
              aria-label="通知"
              className="relative flex h-9 w-9 items-center justify-center rounded-md border border-[var(--color-header-control-border)] bg-[var(--color-header-control-bg)] text-[var(--color-header-fg)] hover:bg-[var(--color-header-control-bg-hover)] transition-colors"
            >
              <Bell size={16} />
              <span className="pulse-badge absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--color-danger)] px-1 text-[9px] font-bold text-white">
                3
              </span>
            </button>

            <button
              type="button"
              onClick={() => alert('プレビュー版です')}
              className="flex items-center gap-2 rounded-md border border-[var(--color-header-control-border)] bg-[var(--color-header-control-bg)] px-3 py-1.5 text-left hover:bg-[var(--color-header-control-bg-hover)] transition-colors"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[var(--color-primary-dark)]">
                家
              </div>
              <div className="hidden lg:block">
                <p className="text-xs font-semibold leading-tight text-[var(--color-header-fg)]">家計 太郎</p>
                <p className="text-[10px] leading-tight text-[var(--color-header-fg-muted)]">プレミアムプラン</p>
              </div>
            </button>
          </div>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 md:pt-[var(--app-header-height,4rem)]">
        <aside
          style={{ width: sidebarWidth }}
          className="hidden shrink-0 transition-[width] duration-200 ease-out md:fixed md:left-0 md:top-[var(--app-header-height,4rem)] md:flex md:h-[calc(100vh-var(--app-header-height,4rem))] md:flex-col md:justify-between md:border-r md:border-[var(--color-surface-border)] md:bg-[var(--color-surface)]/80 md:backdrop-blur md:px-[var(--space-sidebar-x)] md:py-[var(--space-sidebar-y)]"
        >
        <div className="space-y-2">
          <nav className="space-y-0.5">
            {NAV_ITEMS.map(({ id, label, caption, icon: Icon }) => {
              const active = page === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPage(id)}
                  title={sidebarCollapsed ? label : undefined}
                  aria-label={sidebarCollapsed ? label : undefined}
                  className={`group flex w-full items-center gap-2.5 rounded-md py-1.5 text-left text-sm transition-all ${
                    sidebarCollapsed ? 'justify-center px-0' : 'px-2.5'
                  } ${
                    active
                      ? 'nav-active-bar bg-[var(--color-primary-subtle)] text-[var(--color-primary-dark)] border border-[var(--color-primary-border)]'
                      : 'text-neutral-600 border border-transparent hover:bg-[var(--color-primary-subtle)] hover:text-[var(--color-primary-dark)] hover:border-[var(--color-primary-border)]'
                  }`}
                >
                  <Icon
                    size={16}
                    strokeWidth={active ? 2.25 : 2}
                    className={active ? '' : 'text-neutral-500 group-hover:text-neutral-700'}
                  />
                  {!sidebarCollapsed && (
                    <div className="flex-1 min-w-0 leading-tight">
                      <p className="font-medium">{label}</p>
                      <p className={`text-[10px] leading-tight ${active ? 'text-[var(--color-primary)]/80' : 'text-neutral-500'}`}>
                        {caption}
                      </p>
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* プレミアムプラン */}
        <div className="text-center">
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(168,85,247,0.18)] border border-[rgba(168,85,247,0.5)]">
            <Gem size={16} className="text-[#c4b5fd]" />
          </div>
          {!sidebarCollapsed && (
            <>
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
            </>
          )}
        </div>
      </aside>

        <div
          style={{ marginLeft: sidebarWidth }}
          className="flex min-w-0 flex-1 flex-col transition-[margin] duration-200 ease-out max-md:!ml-0"
        >
          <main className="flex-1 overflow-hidden md:px-[var(--space-page-x)] md:py-[var(--space-page-y)]">{renderPage()}</main>

          <BottomNav current={page} onChange={setPage} onAddClick={() => setShowModal(true)} />
        </div>
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
