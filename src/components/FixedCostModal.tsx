import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { FixedCost } from '../types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Field } from './ui/Field';
import { Input } from './ui/Input';

type Props = {
  initial?: FixedCost;
  onClose: () => void;
  onSave: (data: Omit<FixedCost, 'id'> & { id?: string }) => void;
};

export function FixedCostModal({ initial, onClose, onSave }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [type, setType] = useState<'expense' | 'income'>(initial?.type ?? 'expense');
  const [amount, setAmount] = useState(initial?.amount ? String(initial.amount) : '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '');
  const [day, setDay] = useState(initial?.day ?? 1);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [error, setError] = useState('');

  const categories = useLiveQuery(() => db.categories.toArray(), []);
  const filtered = (categories ?? []).filter((c) => c.type === type || c.type === 'both');

  const handleSave = () => {
    if (!name.trim()) {
      setError('名前は必須です');
      return;
    }
    const amt = Number(amount);
    if (!amount || !Number.isInteger(amt) || amt <= 0) {
      setError('金額は1以上の整数を入力してください');
      return;
    }
    if (!categoryId) {
      setError('カテゴリを選択してください');
      return;
    }
    onSave({
      id: initial?.id,
      name: name.trim(),
      type,
      amount: amt,
      categoryId,
      day,
      isActive,
    });
    onClose();
  };

  const isExpense = type === 'expense';

  return (
    <Modal
      open
      onClose={onClose}
      title={initial ? '固定費を編集' : '固定費を追加'}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            キャンセル
          </Button>
          <Button variant="primary" onClick={handleSave}>
            保存
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="名前" required error={error && !name.trim() ? error : undefined}>
          <Input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="例：家賃、Netflix"
          />
        </Field>

        <div className="grid grid-cols-2 gap-0 overflow-hidden rounded-md border border-neutral-200">
          {(['expense', 'income'] as const).map((t) => {
            const active = type === t;
            return (
              <button
                key={t}
                type="button"
                onClick={() => {
                  setType(t);
                  setCategoryId('');
                }}
                className={`py-2.5 text-sm font-semibold transition-colors ${
                  active
                    ? t === 'expense'
                      ? 'bg-expense text-white'
                      : 'bg-income text-white'
                    : 'bg-[var(--color-surface-2)] text-neutral-600 hover:bg-[rgba(34,211,238,0.06)]'
                }`}
              >
                {t === 'expense' ? '支出' : '収入'}
              </button>
            );
          })}
        </div>

        <div
          className={`rounded-md border px-4 py-5 ${
            isExpense
              ? 'bg-expense-subtle border-[rgba(236,72,153,0.45)]'
              : 'bg-income-subtle border-[rgba(34,211,238,0.45)]'
          }`}
        >
          <p className="mb-2 text-center text-[11px] font-medium uppercase tracking-wider text-neutral-500">
            金額（円）*
          </p>
          <div className="flex items-baseline justify-center gap-2">
            <span
              className={`text-2xl font-bold leading-none ${
                isExpense ? 'text-expense' : 'text-income'
              }`}
            >
              ¥
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError('');
              }}
              placeholder="0"
              className={`w-full max-w-[240px] bg-transparent text-center text-4xl font-bold leading-none tabular-nums focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${
                isExpense ? 'text-expense' : 'text-income'
              }`}
            />
          </div>
        </div>

        <Field label="カテゴリ" required>
          <div className="flex flex-wrap gap-2">
            {filtered.map((cat) => {
              const selected = categoryId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setCategoryId(cat.id);
                    setError('');
                  }}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    selected
                      ? 'text-white border-transparent'
                      : 'border-[var(--color-surface-border-strong)] bg-[var(--color-surface-2)] text-neutral-700 hover:border-[rgba(34,211,238,0.4)]'
                  }`}
                  style={
                    selected
                      ? { backgroundColor: cat.color, borderColor: cat.color }
                      : undefined
                  }
                >
                  <span>{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="毎月何日" hint="月末より大きい場合は月末日を使用">
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={31}
              value={day}
              onChange={(e) =>
                setDay(Math.max(1, Math.min(31, Number(e.target.value))))
              }
              className="w-20 text-center"
            />
            <span className="text-sm text-neutral-600">日</span>
          </div>
        </Field>

        <div className="flex items-center justify-between border-t border-neutral-200 pt-3">
          <span className="text-sm text-neutral-700">有効</span>
          <button
            type="button"
            aria-pressed={isActive}
            onClick={() => setIsActive((v) => !v)}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              isActive ? 'bg-primary' : 'bg-neutral-300'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                isActive ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {error && !error.includes('名前') ? (
          <p className="text-xs text-expense">{error}</p>
        ) : null}
      </div>
    </Modal>
  );
}
