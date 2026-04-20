import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Transaction } from '../types';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Field } from './ui/Field';
import { Input } from './ui/Input';

type Props = {
  onClose: () => void;
  onSave: (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  defaultDate?: string;
  initial?: Transaction;
};

export function TransactionModal({ onClose, onSave, defaultDate, initial }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [type, setType] = useState<'expense' | 'income'>(initial?.type ?? 'expense');
  const [amount, setAmount] = useState(initial?.amount ? String(initial.amount) : '');
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? '');
  const [date, setDate] = useState(initial?.date ?? defaultDate ?? today);
  const [memo, setMemo] = useState(initial?.memo ?? '');

  const categories = useLiveQuery(() => db.categories.toArray(), []);
  const filtered = (categories ?? []).filter((c) => c.type === type || c.type === 'both');

  const handleSave = () => {
    if (!amount || !categoryId || !date) return;
    onSave({
      type,
      amount: parseInt(amount, 10),
      categoryId,
      date,
      memo: memo || undefined,
    });
    onClose();
  };

  const isExpense = type === 'expense';
  const canSave = Boolean(amount && categoryId && date);

  return (
    <Modal
      open
      onClose={onClose}
      title={initial ? '取引を編集' : '取引を追加'}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            キャンセル
          </Button>
          <Button
            variant={isExpense ? 'danger' : 'primary'}
            onClick={handleSave}
            disabled={!canSave}
          >
            {initial ? '更新する' : '保存する'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Type tabs */}
        <div className="grid grid-cols-2 gap-0 overflow-hidden rounded-md border border-neutral-200">
          {(['expense', 'income'] as const).map((t) => {
            const activeExpense = t === 'expense' && type === 'expense';
            const activeIncome = t === 'income' && type === 'income';
            const active = activeExpense || activeIncome;
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
                    : 'bg-white text-neutral-500 hover:bg-neutral-50'
                }`}
              >
                {t === 'expense' ? '支出' : '収入'}
              </button>
            );
          })}
        </div>

        {/* Amount display */}
        <div
          className={`rounded-md border px-4 py-5 ${
            isExpense
              ? 'bg-expense-subtle border-[#fecaca]'
              : 'bg-income-subtle border-[#bfdbfe]'
          }`}
        >
          <p className="mb-2 text-center text-[11px] font-medium uppercase tracking-wider text-neutral-500">
            金額（円）
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
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              autoFocus
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
                  onClick={() => setCategoryId(cat.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    selected
                      ? 'text-white border-transparent'
                      : 'border-neutral-200 bg-white text-neutral-700 hover:border-neutral-300'
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

        <div className="grid grid-cols-2 gap-3">
          <Field label="日付" required>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
          <Field label="メモ">
            <Input
              type="text"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="任意"
            />
          </Field>
        </div>
      </div>
    </Modal>
  );
}
