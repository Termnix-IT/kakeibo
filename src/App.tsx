import { Suspense, lazy, useState } from 'react';
import {
  BarChart3,
  Home,
  ListChecks,
  Plus,
  Settings as SettingsIcon,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { BottomNav } from './components/BottomNav';
import { TransactionModal } from './components/TransactionModal';
import { TransactionList } from './pages/TransactionList';
import { Button } from './components/ui/Button';
import { db } from './db';
import type { Transaction } from './types';

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

export type Page = 'dashboard' | 'transactions' | 'report' | 'settings';

function getCurrentMonth() {
  const d = new Date();
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
  { id: 'dashboard', label: 'ホーム', caption: '今月の全体像', icon: Home },
  { id: 'transactions', label: '明細', caption: '入力と確認', icon: ListChecks },
  { id: 'report', label: 'レポート', caption: '推移の分析', icon: BarChart3 },
  { id: 'settings', label: '設定', caption: '各種管理', icon: SettingsIcon },
];

export default function App() {
  const [page, setPage] = useState<Page>('transactions');
  const [month, setMonth] = useState(getCurrentMonth);
  const [showModal, setShowModal] = useState(false);
  const activeItem = NAV_ITEMS.find((item) => item.id === page);

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
      <div className="rounded-md border border-neutral-200 bg-white px-6 py-5 text-center">
        <p className="text-sm font-semibold text-neutral-900">画面を読み込み中...</p>
        <p className="mt-1 text-xs text-neutral-500">
          チャートや設定モジュールを準備しています
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <aside className="hidden shrink-0 md:sticky md:top-0 md:flex md:h-screen md:w-64 md:flex-col md:justify-between md:border-r md:border-neutral-200 md:bg-white md:p-5">
        <div className="space-y-6">
          <div className="border-b border-neutral-200 pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary">
                <span className="text-base font-bold text-white">家</span>
              </div>
              <div>
                <p className="eyebrow-label">ワークスペース</p>
                <p className="text-base font-semibold text-neutral-900">家計簿</p>
              </div>
            </div>
            <p className="mt-3 text-xs leading-relaxed text-neutral-500">
              収支・予算・固定費をひとつの画面で管理する家計ワークスペース。
            </p>
          </div>

          <nav className="space-y-0.5">
            {NAV_ITEMS.map(({ id, label, caption, icon: Icon }) => {
              const active = page === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setPage(id)}
                  className={`flex w-full items-center gap-3 rounded-md border-l-2 px-3 py-2 text-left text-sm transition-colors ${
                    active
                      ? 'border-primary bg-primary-subtle text-primary'
                      : 'border-transparent text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900'
                  }`}
                >
                  <Icon
                    size={18}
                    strokeWidth={active ? 2.25 : 2}
                    className={active ? 'text-primary' : 'text-neutral-400'}
                  />
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium ${active ? 'text-primary' : 'text-neutral-800'}`}>
                      {label}
                    </p>
                    <p className={`text-[11px] ${active ? 'text-primary/80' : 'text-neutral-500'}`}>
                      {caption}
                    </p>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="border-t border-neutral-200 pt-4">
          <p className="eyebrow-label">クイック入力</p>
          <p className="mt-1 text-xs leading-relaxed text-neutral-500">
            収入と支出をすぐ記録できます。
          </p>
          <Button
            variant="primary"
            fullWidth
            leftIcon={<Plus size={14} />}
            className="mt-3"
            onClick={() => setShowModal(true)}
          >
            収支を追加
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="hidden border-b border-neutral-200 bg-white md:block md:px-6 md:py-4">
          <div className="page-frame flex items-center justify-between gap-4">
            <div>
              <p className="eyebrow-label">ワークスペース</p>
              <h1 className="page-title mt-0.5">{activeItem?.label}</h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="border-l border-neutral-200 pl-4">
                <p className="stat-label">対象月</p>
                <p className="text-lg font-semibold tabular-nums text-neutral-900">
                  {month.replace('-', '年')}月
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Plus size={14} />}
                onClick={() => setShowModal(true)}
              >
                新規入力
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden md:px-6 md:py-5">
          {page === 'transactions' ? (
            <TransactionList month={month} onMonthChange={setMonth} />
          ) : (
            <Suspense fallback={pageFallback}>
              {page === 'dashboard' && <Dashboard />}
              {page === 'report' && <Report />}
              {page === 'settings' && <Settings />}
            </Suspense>
          )}
        </main>

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
