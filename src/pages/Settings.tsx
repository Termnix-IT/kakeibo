import { useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  Bell,
  Check,
  Download,
  FileSpreadsheet,
  Landmark,
  Pencil,
  Plus,
  Upload,
  X,
} from 'lucide-react';
import { db } from '../db';
import type { Category, FixedCost, SavingsGoal } from '../types';
import { exportJSON, importJSON } from '../utils/backup';
import { FixedCostModal } from '../components/FixedCostModal';
import { BANK_FORMATS, parseCSVText, detectFormat } from '../utils/bankImport';
import type { BankFormat, BankRow } from '../utils/bankImport';
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardDescription,
  CardHeader,
  CardTitle,
  Field,
  IconButton,
  Input,
  Modal,
  ProgressBar,
  Select,
  Skeleton,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Table,
} from '../components/ui';

const ALERT_KEY = 'kakeibo_alert_threshold';

function loadThreshold(): number {
  const v = localStorage.getItem(ALERT_KEY);
  return v !== null ? Number(v) : 80;
}

// ---- CategoryModal ----

type CategoryModalProps = {
  initial?: Category;
  existingNames: string[];
  onClose: () => void;
  onSave: (cat: Omit<Category, 'id'> & { id?: string }) => void;
};

const TYPE_OPTIONS: { value: Category['type']; label: string }[] = [
  { value: 'expense', label: '支出' },
  { value: 'income', label: '収入' },
  { value: 'both', label: '両方' },
];

const PRESET_COLORS = [
  '#2563eb', '#1d4ed8', '#1e40af', '#047857',
  '#d97706', '#b45309', '#b91c1c', '#64748b',
  '#0891b2', '#7c3aed', '#059669', '#334155',
];

const FALLBACK_CATEGORY_ID = 'cat-other';

function CategoryModal({ initial, existingNames, onClose, onSave }: CategoryModalProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? '📦');
  const [color, setColor] = useState(initial?.color ?? '#2563eb');
  const [type, setType] = useState<Category['type']>(initial?.type ?? 'expense');
  const [error, setError] = useState('');

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError('カテゴリ名は必須です');
      return;
    }
    const duplicates = existingNames.filter((n) => n !== initial?.name);
    if (duplicates.includes(trimmed)) {
      setError('同じ名前のカテゴリが既に存在します');
      return;
    }
    onSave({ id: initial?.id, name: trimmed, icon, color, type });
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={initial ? 'カテゴリを編集' : 'カテゴリを追加'}
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
        <Field label="カテゴリ名" required error={error || undefined}>
          <Input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="例：外食"
          />
        </Field>
        <Field label="アイコン（絵文字）">
          <Input
            type="text"
            value={icon}
            onChange={(e) => setIcon(e.target.value)}
            className="h-12 w-24 text-center text-2xl"
          />
        </Field>
        <Field label="カラー">
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`h-7 w-7 rounded-full border-2 transition-transform ${
                  color === c ? 'scale-110 border-neutral-900' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
                aria-label={c}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-7 w-7 cursor-pointer rounded-full border border-neutral-300"
              title="カスタムカラー"
            />
          </div>
        </Field>
        <Field label="種別">
          <div className="grid grid-cols-3 gap-2">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setType(opt.value)}
                className={`h-9 rounded-md border text-sm font-medium transition-colors ${
                  type === opt.value
                    ? 'border-primary bg-primary-subtle text-primary'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </Field>
      </div>
    </Modal>
  );
}

// ---- SavingsGoalModal ----

type GoalModalProps = {
  initial?: SavingsGoal;
  onClose: () => void;
  onSave: (g: Omit<SavingsGoal, 'id'> & { id?: string }) => void;
};

function SavingsGoalModal({ initial, onClose, onSave }: GoalModalProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [icon, setIcon] = useState(initial?.icon ?? '🎯');
  const [color, setColor] = useState(initial?.color ?? '#2563eb');
  const [target, setTarget] = useState(
    initial?.targetAmount ? String(initial.targetAmount) : ''
  );
  const [saved, setSaved] = useState(
    initial?.savedAmount ? String(initial.savedAmount) : '0'
  );
  const [deadline, setDeadline] = useState(initial?.deadline ?? '');
  const [error, setError] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      setError('目標名は必須です');
      return;
    }
    const t = Number(target);
    if (!target || !Number.isInteger(t) || t <= 0) {
      setError('目標金額は1以上の整数を入力してください');
      return;
    }
    const s = Number(saved);
    if (!Number.isInteger(s) || s < 0) {
      setError('達成額は0以上の整数を入力してください');
      return;
    }
    onSave({
      id: initial?.id,
      name: name.trim(),
      icon,
      color,
      targetAmount: t,
      savedAmount: s,
      deadline: deadline || undefined,
    });
    onClose();
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={initial ? '目標を編集' : '貯蓄目標を追加'}
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
        <Field label="目標名" required>
          <Input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="例：旅行資金、緊急予備費"
          />
        </Field>
        <div className="grid grid-cols-[auto_1fr] gap-3">
          <Field label="アイコン">
            <Input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              className="h-12 w-16 text-center text-2xl"
            />
          </Field>
          <Field label="カラー">
            <div className="flex flex-wrap gap-2 pt-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-7 w-7 rounded-full border-2 transition-transform ${
                    color === c
                      ? 'scale-110 border-neutral-900'
                      : 'border-transparent'
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </Field>
        </div>
        <Field label="目標金額" required>
          <Input
            type="number"
            value={target}
            onChange={(e) => {
              setTarget(e.target.value);
              setError('');
            }}
            placeholder="0"
            className="text-right text-lg font-semibold tabular-nums"
          />
        </Field>
        <Field label="現在の達成額">
          <Input
            type="number"
            value={saved}
            onChange={(e) => {
              setSaved(e.target.value);
              setError('');
            }}
            placeholder="0"
            className="text-right text-lg font-semibold tabular-nums"
          />
        </Field>
        <Field label="目標期限">
          <Input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </Field>
        {error ? <p className="text-xs text-expense">{error}</p> : null}
      </div>
    </Modal>
  );
}

// ---- Bank CSV Import Modal ----

type BankImportProps = {
  categories: Category[];
  onClose: () => void;
};

function BankImportModal({ categories, onClose }: BankImportProps) {
  const [format, setFormat] = useState<BankFormat>('mufg');
  const [rows, setRows] = useState<BankRow[]>([]);
  const [categoryMap, setCategoryMap] = useState<Record<number, string>>({});
  const [step, setStep] = useState<'upload' | 'map' | 'done'>('upload');
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const expenseCats = categories.filter(
    (c) => c.type === 'expense' || c.type === 'both'
  );
  const incomeCats = categories.filter(
    (c) => c.type === 'income' || c.type === 'both'
  );

  const handleFile = async (file: File) => {
    let text = '';
    try {
      text = await file.text();
      if (text.includes('縺') || text.includes('逕')) {
        const buf = await file.arrayBuffer();
        text = new TextDecoder('shift-jis').decode(buf);
      }
    } catch {
      const buf = await file.arrayBuffer();
      text = new TextDecoder('shift-jis').decode(buf);
    }

    const allRows = parseCSVText(text);
    const detectedFmt = detectFormat(allRows);
    if (detectedFmt) setFormat(detectedFmt);
    const fmt =
      BANK_FORMATS.find((f) => f.id === (detectedFmt ?? format)) ?? BANK_FORMATS[0];
    const parsed = fmt.parse(allRows);
    setRows(parsed);
    setStep('map');
  };

  const handleImport = async () => {
    setImporting(true);
    const now = new Date().toISOString();
    const txs = rows.map((r, i) => ({
      id: crypto.randomUUID(),
      type: r.amount >= 0 ? ('income' as const) : ('expense' as const),
      amount: Math.abs(r.amount),
      categoryId:
        categoryMap[i] ??
        (r.amount >= 0 ? incomeCats[0]?.id ?? '' : expenseCats[0]?.id ?? ''),
      date: r.date,
      memo: r.memo,
      createdAt: now,
      updatedAt: now,
    }));
    await db.transactions.bulkAdd(txs);
    setImporting(false);
    setStep('done');
  };

  const footer =
    step === 'upload' ? (
      <Button variant="secondary" onClick={onClose}>
        キャンセル
      </Button>
    ) : step === 'map' ? (
      <>
        <Button variant="secondary" onClick={() => setStep('upload')}>
          戻る
        </Button>
        <Button variant="primary" onClick={handleImport} disabled={importing}>
          {importing ? 'インポート中...' : `${rows.length}件をインポート`}
        </Button>
      </>
    ) : (
      <Button variant="primary" onClick={onClose}>
        閉じる
      </Button>
    );

  return (
    <Modal
      open
      onClose={onClose}
      title="銀行CSVインポート"
      size="lg"
      footer={footer}
    >
      {step === 'upload' ? (
        <div className="space-y-4">
          <Field
            label="銀行フォーマット"
            hint={BANK_FORMATS.find((f) => f.id === format)?.description}
          >
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              {BANK_FORMATS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormat(f.id)}
                  className={`rounded-md border px-3 py-2 text-sm transition-colors ${
                    format === f.id
                      ? 'border-primary bg-primary-subtle text-primary font-medium'
                      : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  {f.name}
                </button>
              ))}
            </div>
          </Field>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-neutral-200 py-10 transition-colors hover:border-primary hover:bg-primary-subtle/40"
          >
            <FileSpreadsheet size={28} className="text-neutral-400" />
            <span className="text-sm text-neutral-700">CSVファイルを選択</span>
            <span className="text-xs text-neutral-400">UTF-8 / Shift-JIS 対応</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>
      ) : step === 'map' ? (
        <div className="space-y-3">
          <div className="rounded-md border border-primary-border bg-primary-subtle px-3 py-2">
            <p className="text-xs font-medium text-primary">
              {rows.length}件の取引を検出しました。カテゴリを確認・修正してください。
            </p>
          </div>
          <div className="max-h-[50vh] overflow-auto rounded-md border border-neutral-200">
            <Table>
              <THead>
                <TR>
                  <TH>日付</TH>
                  <TH align="right">金額</TH>
                  <TH>摘要</TH>
                  <TH>カテゴリ</TH>
                </TR>
              </THead>
              <TBody>
                {rows.map((r, i) => {
                  const isIncome = r.amount >= 0;
                  const catList = isIncome ? incomeCats : expenseCats;
                  const defaultCat = catList[0]?.id ?? '';
                  return (
                    <TR key={i}>
                      <TD className="whitespace-nowrap text-neutral-600">
                        {r.date.slice(5)}
                      </TD>
                      <TD
                        align="right"
                        mono
                        className={`font-medium ${
                          isIncome ? 'text-income' : 'text-expense'
                        }`}
                      >
                        {isIncome ? '+' : '-'}¥{Math.abs(r.amount).toLocaleString()}
                      </TD>
                      <TD className="max-w-[180px] truncate text-neutral-600">
                        {r.memo}
                      </TD>
                      <TD>
                        <Select
                          value={categoryMap[i] ?? defaultCat}
                          onChange={(e) =>
                            setCategoryMap((prev) => ({
                              ...prev,
                              [i]: e.target.value,
                            }))
                          }
                          className="h-7 text-xs"
                        >
                          {catList.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.icon} {c.name}
                            </option>
                          ))}
                        </Select>
                      </TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </div>
        </div>
      ) : (
        <div className="space-y-3 py-8 text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-success-subtle text-success">
            <Check size={28} />
          </div>
          <p className="font-semibold text-neutral-900">インポート完了</p>
          <p className="text-sm text-neutral-500">
            {rows.length}件の取引を追加しました
          </p>
        </div>
      )}
    </Modal>
  );
}

// ---- Main Settings ----

function SettingsSkeleton() {
  return (
    <div className="h-full overflow-y-auto pb-24 md:pb-6">
      <div className="page-frame space-y-5 px-4 py-5 md:px-0 md:py-0">
        <Card>
          <CardHeader>
            <div className="space-y-2">
              <Skeleton width={120} height={10} />
              <Skeleton width={80} height={20} />
            </div>
          </CardHeader>
        </Card>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Card key={i}>
              <CardHeader>
                <div className="space-y-2">
                  <Skeleton width={140} height={14} />
                  <Skeleton width={200} height={10} />
                </div>
                <Skeleton width={72} height={28} rounded="sm" />
              </CardHeader>
              <CardBody className="space-y-3">
                <Skeleton height={44} />
                <Skeleton height={44} />
                <Skeleton height={44} />
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Settings() {
  const categories = useLiveQuery(() => db.categories.toArray(), []);
  const budgets = useLiveQuery(() => db.budgets.toArray(), []);
  const fixedCosts = useLiveQuery(() => db.fixedCosts.toArray(), []);
  const goals = useLiveQuery(() => db.goals.toArray(), []);

  const [editCat, setEditCat] = useState<Category | null | 'new'>(null);
  const [editFixed, setEditFixed] = useState<FixedCost | null | 'new'>(null);
  const [editGoal, setEditGoal] = useState<SavingsGoal | null | 'new'>(null);
  const [showBankImport, setShowBankImport] = useState(false);
  const [budgetInputs, setBudgetInputs] = useState<Record<string, string>>({});
  const [budgetErrors, setBudgetErrors] = useState<Record<string, string>>({});
  const [importMsg, setImportMsg] = useState('');
  const importRef = useRef<HTMLInputElement>(null);
  const [threshold, setThreshold] = useState(loadThreshold);
  const [savedMsg, setSavedMsg] = useState('');
  const [notifPermission, setNotifPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );

  if (!categories || !budgets || !fixedCosts || !goals) {
    return <SettingsSkeleton />;
  }

  const handleSaveFixedCost = async (
    data: Omit<FixedCost, 'id'> & { id?: string }
  ) => {
    if (data.id) {
      await db.fixedCosts.update(data.id, {
        name: data.name,
        type: data.type,
        amount: data.amount,
        categoryId: data.categoryId,
        day: data.day,
        isActive: data.isActive,
      });
    } else {
      await db.fixedCosts.add({ ...data, id: crypto.randomUUID() });
    }
  };

  const handleDeleteFixedCost = async (fc: FixedCost) => {
    if (!confirm(`「${fc.name}」を削除しますか？`)) return;
    await db.fixedCosts.delete(fc.id);
  };

  const handleToggleFixedCost = async (fc: FixedCost) => {
    await db.fixedCosts.update(fc.id, { isActive: !fc.isActive });
  };

  const handleSaveGoal = async (
    data: Omit<SavingsGoal, 'id'> & { id?: string }
  ) => {
    if (data.id) {
      await db.goals.update(data.id, {
        name: data.name,
        icon: data.icon,
        color: data.color,
        targetAmount: data.targetAmount,
        savedAmount: data.savedAmount,
        deadline: data.deadline,
      });
    } else {
      await db.goals.add({ ...data, id: crypto.randomUUID() });
    }
  };

  const handleDeleteGoal = async (g: SavingsGoal) => {
    if (!confirm(`「${g.name}」を削除しますか？`)) return;
    await db.goals.delete(g.id);
  };

  const existingNames = categories.map((c) => c.name);

  const getBudgetValue = (catId: string): string => {
    if (catId in budgetInputs) return budgetInputs[catId];
    const existing = budgets.find((b) => b.categoryId === catId && b.month === null);
    return existing ? String(existing.amount) : '';
  };

  const handleBudgetChange = (catId: string, val: string) => {
    setBudgetInputs((prev) => ({ ...prev, [catId]: val }));
    setBudgetErrors((prev) => {
      const next = { ...prev };
      delete next[catId];
      return next;
    });
  };

  const validateBudgets = () => {
    const errors: Record<string, string> = {};
    for (const [catId, val] of Object.entries(budgetInputs)) {
      if (val === '') continue;
      const n = Number(val);
      if (!Number.isInteger(n) || n < 0)
        errors[catId] = '0以上の整数を入力してください';
    }
    return errors;
  };

  const handleSaveBudgets = async () => {
    const errors = validateBudgets();
    if (Object.keys(errors).length > 0) {
      setBudgetErrors(errors);
      return;
    }
    for (const [catId, val] of Object.entries(budgetInputs)) {
      const amount = val === '' ? 0 : Number(val);
      const existing = budgets.find(
        (b) => b.categoryId === catId && b.month === null
      );
      if (existing) {
        await db.budgets.update(existing.id, { amount });
      } else {
        await db.budgets.add({
          id: crypto.randomUUID(),
          categoryId: catId,
          month: null,
          amount,
        });
      }
    }
    localStorage.setItem(ALERT_KEY, String(threshold));
    setBudgetInputs({});
    setSavedMsg('予算を保存しました');
    setTimeout(() => setSavedMsg(''), 2000);
  };

  const handleSaveCategory = async (
    data: Omit<Category, 'id'> & { id?: string }
  ) => {
    if (data.id) {
      await db.categories.update(data.id, {
        name: data.name,
        icon: data.icon,
        color: data.color,
        type: data.type,
      });
    } else {
      await db.categories.add({ ...data, id: crypto.randomUUID() });
    }
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (!confirm(`「${cat.name}」を削除しますか？`)) return;
    if (cat.id === FALLBACK_CATEGORY_ID) {
      alert('「その他」カテゴリは削除できません');
      return;
    }

    await db.transaction(
      'rw',
      [db.categories, db.transactions, db.fixedCosts, db.budgets],
      async () => {
        await db.transactions
          .where('categoryId')
          .equals(cat.id)
          .modify({ categoryId: FALLBACK_CATEGORY_ID });
        await db.fixedCosts
          .where('categoryId')
          .equals(cat.id)
          .modify({ categoryId: FALLBACK_CATEGORY_ID });
        await db.budgets.where('categoryId').equals(cat.id).delete();
        await db.categories.delete(cat.id);
      }
    );
  };

  const handleRequestNotification = async () => {
    if (typeof Notification === 'undefined') return;
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
  };

  const expenseCategories = categories.filter(
    (c) => c.type === 'expense' || c.type === 'both'
  );

  return (
    <div className="h-full overflow-y-auto pb-24 md:pb-6">
      <div className="page-frame space-y-5 px-4 py-5 md:px-0 md:py-0">
        <div>
          <p className="eyebrow-label text-neutral-500">管理メニュー</p>
          <h1 className="page-title mt-0.5">設定</h1>
          <p className="mt-1 text-xs text-neutral-500">
            カテゴリ・固定費・予算・通知・バックアップをまとめて管理します。
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {/* カテゴリ管理 */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>カテゴリ管理</CardTitle>
                <CardDescription>
                  支出・収入で分類するカテゴリの一覧
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Plus size={14} />}
                onClick={() => setEditCat('new')}
              >
                追加
              </Button>
            </CardHeader>
            <div>
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center gap-3 border-b border-neutral-100 px-5 py-2.5 last:border-0"
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-base"
                    style={{ backgroundColor: cat.color + '22' }}
                  >
                    {cat.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-neutral-800">
                      {cat.name}
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      {cat.type === 'income'
                        ? '収入'
                        : cat.type === 'expense'
                        ? '支出'
                        : '両方'}
                    </p>
                  </div>
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <IconButton
                    onClick={() => setEditCat(cat)}
                    aria-label="編集"
                  >
                    <Pencil size={14} />
                  </IconButton>
                  <IconButton
                    tone="danger"
                    onClick={() => handleDeleteCategory(cat)}
                    aria-label="削除"
                  >
                    <X size={16} />
                  </IconButton>
                </div>
              ))}
            </div>
          </Card>

          {/* 固定費管理 */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>固定費管理</CardTitle>
                <CardDescription>毎月自動で適用できる固定の収支</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Plus size={14} />}
                onClick={() => setEditFixed('new')}
              >
                追加
              </Button>
            </CardHeader>
            {fixedCosts.length === 0 ? (
              <CardBody className="text-center text-sm text-neutral-400">
                固定費が登録されていません
              </CardBody>
            ) : (
              <div>
                {fixedCosts.map((fc) => {
                  const cat = categories.find((c) => c.id === fc.categoryId);
                  return (
                    <div
                      key={fc.id}
                      className="flex items-center gap-3 border-b border-neutral-100 px-5 py-2.5 last:border-0"
                    >
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-base"
                        style={{ backgroundColor: (cat?.color ?? '#888') + '22' }}
                      >
                        {cat?.icon ?? '📦'}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-medium ${
                            fc.isActive ? 'text-neutral-800' : 'text-neutral-400'
                          }`}
                        >
                          {fc.name}
                        </p>
                        <p className="text-[11px] text-neutral-500">
                          毎月{fc.day}日 ／ {fc.type === 'expense' ? '支出' : '収入'}
                        </p>
                      </div>
                      <span
                        className={`font-mono text-sm font-semibold tabular-nums ${
                          fc.type === 'income' ? 'text-income' : 'text-expense'
                        }`}
                      >
                        {fc.type === 'expense' ? '-' : '+'}¥
                        {fc.amount.toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleFixedCost(fc)}
                        aria-pressed={fc.isActive}
                        className={`relative h-5 w-10 shrink-0 rounded-full transition-colors ${
                          fc.isActive ? 'bg-primary' : 'bg-neutral-300'
                        }`}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                            fc.isActive ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                      <IconButton
                        onClick={() => setEditFixed(fc)}
                        aria-label="編集"
                      >
                        <Pencil size={14} />
                      </IconButton>
                      <IconButton
                        tone="danger"
                        onClick={() => handleDeleteFixedCost(fc)}
                        aria-label="削除"
                      >
                        <X size={16} />
                      </IconButton>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* 貯蓄目標 */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>貯蓄目標</CardTitle>
                <CardDescription>
                  目標を設定してダッシュボードで進捗確認
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Plus size={14} />}
                onClick={() => setEditGoal('new')}
              >
                追加
              </Button>
            </CardHeader>
            {goals.length === 0 ? (
              <CardBody className="text-center text-sm text-neutral-400">
                貯蓄目標が登録されていません
              </CardBody>
            ) : (
              <div>
                {goals.map((g) => {
                  const pct =
                    g.targetAmount > 0
                      ? Math.min(
                          100,
                          Math.round((g.savedAmount / g.targetAmount) * 100)
                        )
                      : 0;
                  return (
                    <div key={g.id} className="border-b border-neutral-100 px-5 py-3 last:border-0">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-lg">{g.icon}</span>
                        <span className="flex-1 text-sm font-medium text-neutral-800">
                          {g.name}
                        </span>
                        <span className="font-mono text-xs tabular-nums text-neutral-500">
                          ¥{g.savedAmount.toLocaleString()} / ¥
                          {g.targetAmount.toLocaleString()}
                        </span>
                        <IconButton
                          onClick={() => setEditGoal(g)}
                          aria-label="編集"
                        >
                          <Pencil size={14} />
                        </IconButton>
                        <IconButton
                          tone="danger"
                          onClick={() => handleDeleteGoal(g)}
                          aria-label="削除"
                        >
                          <X size={16} />
                        </IconButton>
                      </div>
                      <ProgressBar value={g.savedAmount} max={g.targetAmount} color={g.color} />
                      <div className="mt-1 flex justify-between">
                        <span
                          className="text-[11px] font-semibold tabular-nums"
                          style={{ color: g.color }}
                        >
                          {pct}%
                        </span>
                        {g.deadline ? (
                          <span className="text-[11px] text-neutral-500">
                            期限: {g.deadline}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* 月次予算設定 */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>月次予算設定</CardTitle>
                <CardDescription>
                  支出カテゴリの月次予算（毎月デフォルト）
                </CardDescription>
              </div>
            </CardHeader>
            <div>
              {expenseCategories.map((cat) => {
                const val = getBudgetValue(cat.id);
                const err = budgetErrors[cat.id];
                return (
                  <div
                    key={cat.id}
                    className="border-b border-neutral-100 px-5 py-2.5 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-center text-base">{cat.icon}</span>
                      <span className="flex-1 text-sm font-medium text-neutral-700">
                        {cat.name}
                      </span>
                      <div className="relative w-36">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
                          ¥
                        </span>
                        <Input
                          type="number"
                          min={0}
                          step={1}
                          value={val}
                          onChange={(e) =>
                            handleBudgetChange(cat.id, e.target.value)
                          }
                          placeholder="予算なし"
                          className="pl-7 text-right font-mono tabular-nums"
                          invalid={Boolean(err)}
                        />
                      </div>
                    </div>
                    {err ? (
                      <p className="mt-1 text-right text-[11px] text-expense">
                        {err}
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* 予算アラート閾値 */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>予算アラート閾値</CardTitle>
                <CardDescription>
                  この使用率を超えるとダッシュボードにアラート表示
                </CardDescription>
              </div>
            </CardHeader>
            <CardBody>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="flex-1 accent-primary"
                />
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={threshold}
                    onChange={(e) =>
                      setThreshold(
                        Math.max(0, Math.min(100, Number(e.target.value)))
                      )
                    }
                    className="w-16 text-center"
                  />
                  <span className="text-sm text-neutral-500">%</span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* アプリ設定 */}
          <Card>
            <CardHeader>
              <div>
                <CardTitle>アプリ設定</CardTitle>
                <CardDescription>通知・表示設定</CardDescription>
              </div>
            </CardHeader>
            <CardBody>
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-800">
                    ブラウザ通知
                  </p>
                  <p className="text-xs text-neutral-500">予算超過時に通知を受け取る</p>
                </div>
                {notifPermission === 'granted' ? (
                  <Badge tone="success">有効</Badge>
                ) : notifPermission === 'denied' ? (
                  <Badge tone="expense">拒否済み</Badge>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Bell size={14} />}
                    onClick={handleRequestNotification}
                  >
                    許可する
                  </Button>
                )}
              </div>
            </CardBody>
          </Card>

          {/* エクスポート・インポート */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div>
                <CardTitle>エクスポート / インポート</CardTitle>
                <CardDescription>
                  全データの JSON バックアップと銀行 CSV の取込
                </CardDescription>
              </div>
            </CardHeader>
            <CardBody className="space-y-3">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <Button
                  variant="secondary"
                  leftIcon={<Download size={14} />}
                  onClick={() => exportJSON()}
                >
                  JSONエクスポート
                </Button>
                <Button
                  variant="secondary"
                  leftIcon={<Upload size={14} />}
                  onClick={() => importRef.current?.click()}
                >
                  JSONインポート
                </Button>
                <Button
                  variant="secondary"
                  leftIcon={<Landmark size={14} />}
                  onClick={() => setShowBankImport(true)}
                >
                  銀行CSVインポート
                </Button>
              </div>
              <input
                ref={importRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  try {
                    await importJSON(file);
                    setImportMsg('インポートが完了しました');
                  } catch (err) {
                    setImportMsg(
                      err instanceof Error ? err.message : 'インポートに失敗しました'
                    );
                  }
                  e.target.value = '';
                  setTimeout(() => setImportMsg(''), 3000);
                }}
              />
              {importMsg ? (
                <p className="text-center text-xs text-primary">{importMsg}</p>
              ) : null}
            </CardBody>
          </Card>
        </div>

        {/* 保存ボタン */}
        <Card>
          <CardBody className="space-y-2">
            {savedMsg ? (
              <p className="text-center text-xs font-medium text-success">
                {savedMsg}
              </p>
            ) : null}
            <Button variant="primary" fullWidth onClick={handleSaveBudgets}>
              予算を保存
            </Button>
          </CardBody>
        </Card>
      </div>

      {editCat !== null && (
        <CategoryModal
          initial={editCat === 'new' ? undefined : editCat}
          existingNames={existingNames}
          onClose={() => setEditCat(null)}
          onSave={handleSaveCategory}
        />
      )}
      {editFixed !== null && (
        <FixedCostModal
          initial={editFixed === 'new' ? undefined : editFixed}
          onClose={() => setEditFixed(null)}
          onSave={handleSaveFixedCost}
        />
      )}
      {editGoal !== null && (
        <SavingsGoalModal
          initial={editGoal === 'new' ? undefined : editGoal}
          onClose={() => setEditGoal(null)}
          onSave={handleSaveGoal}
        />
      )}
      {showBankImport && (
        <BankImportModal
          categories={categories}
          onClose={() => setShowBankImport(false)}
        />
      )}
    </div>
  );
}
