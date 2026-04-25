import { BarChart3, FileText, Home, Plus, Settings as SettingsIcon } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Page } from '../App';

type NavItem = { id: Page; label: string; icon: LucideIcon };

const LEFT: NavItem[] = [
  { id: 'dashboard', label: 'ホーム', icon: Home },
  { id: 'transactions', label: '明細', icon: FileText },
];

const RIGHT: NavItem[] = [
  { id: 'report', label: 'レポート', icon: BarChart3 },
  { id: 'settings', label: '設定', icon: SettingsIcon },
];

type Props = {
  current: Page;
  onChange: (page: Page) => void;
  onAddClick: () => void;
};

function NavButton({
  item,
  active,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  const color = active ? 'text-[#67e8f9]' : 'text-neutral-500';
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 flex-col items-center gap-0 py-1.5 transition-colors ${color}`}
    >
      <Icon
        size={20}
        strokeWidth={active ? 2.25 : 2}
        style={
          active
            ? { filter: 'drop-shadow(0 0 6px rgba(34,211,238,0.6))' }
            : undefined
        }
      />
      <span className={`text-[10px] font-medium ${active ? 'text-[#67e8f9]' : 'text-neutral-500'}`}>
        {item.label}
      </span>
    </button>
  );
}

export function BottomNav({ current, onChange, onAddClick }: Props) {
  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 flex h-14 items-center border-t border-[var(--color-surface-border)] bg-[var(--color-bg)]/90 backdrop-blur md:hidden">
      {LEFT.map((it) => (
        <NavButton
          key={it.id}
          item={it}
          active={current === it.id}
          onClick={() => onChange(it.id)}
        />
      ))}
      <div className="flex flex-1 items-center justify-center">
        <button
          type="button"
          onClick={onAddClick}
          aria-label="収支を追加"
          className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[#22d3ee] to-[#0891b2] text-[#04111c] shadow-[0_0_20px_rgba(34,211,238,0.5)] transition-transform active:scale-95"
        >
          <Plus size={24} strokeWidth={2.5} />
        </button>
      </div>
      {RIGHT.map((it) => (
        <NavButton
          key={it.id}
          item={it}
          active={current === it.id}
          onClick={() => onChange(it.id)}
        />
      ))}
    </nav>
  );
}
