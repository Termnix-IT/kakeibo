export type TabsSize = 'sm' | 'md';

export type TabsProps<T extends string> = {
  value: T;
  onChange: (v: T) => void;
  items: { value: T; label: string }[];
  size?: TabsSize;
  className?: string;
};

const SIZE: Record<TabsSize, string> = {
  sm: 'h-8 text-xs px-3',
  md: 'h-9 text-sm px-4',
};

export function Tabs<T extends string>({
  value,
  onChange,
  items,
  size = 'md',
  className = '',
}: TabsProps<T>) {
  return (
    <div
      role="tablist"
      className={`inline-flex gap-0.5 rounded-md border border-neutral-200 bg-neutral-100 p-0.5 ${className}`}
    >
      {items.map((it) => {
        const active = it.value === value;
        return (
          <button
            key={it.value}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(it.value)}
            className={`inline-flex items-center justify-center rounded-[6px] font-medium transition-colors ${SIZE[size]} ${
              active
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-500 hover:text-neutral-800'
            }`}
          >
            {it.label}
          </button>
        );
      })}
    </div>
  );
}
