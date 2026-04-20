import { db } from '../db';
import type { Budget, Category, FixedCost, SavingsGoal, Transaction } from '../types';

type BackupPayload = {
  transactions?: unknown;
  categories?: unknown;
  budgets?: unknown;
  fixedCosts?: unknown;
  goals?: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isTransaction(value: unknown): value is Transaction {
  return isRecord(value)
    && typeof value.id === 'string'
    && (value.type === 'income' || value.type === 'expense')
    && typeof value.amount === 'number'
    && Number.isFinite(value.amount)
    && typeof value.categoryId === 'string'
    && typeof value.date === 'string'
    && (value.memo === undefined || typeof value.memo === 'string')
    && (value.fixedCostId === undefined || typeof value.fixedCostId === 'string')
    && typeof value.createdAt === 'string'
    && typeof value.updatedAt === 'string';
}

function isCategory(value: unknown): value is Category {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.name === 'string'
    && typeof value.icon === 'string'
    && typeof value.color === 'string'
    && (value.type === 'income' || value.type === 'expense' || value.type === 'both');
}

function isBudget(value: unknown): value is Budget {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.categoryId === 'string'
    && (value.month === null || typeof value.month === 'string')
    && typeof value.amount === 'number'
    && Number.isFinite(value.amount);
}

function isFixedCost(value: unknown): value is FixedCost {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.name === 'string'
    && (value.type === 'income' || value.type === 'expense')
    && typeof value.amount === 'number'
    && Number.isFinite(value.amount)
    && typeof value.categoryId === 'string'
    && typeof value.day === 'number'
    && Number.isInteger(value.day)
    && value.day >= 1
    && value.day <= 31
    && typeof value.isActive === 'boolean';
}

function isSavingsGoal(value: unknown): value is SavingsGoal {
  return isRecord(value)
    && typeof value.id === 'string'
    && typeof value.name === 'string'
    && typeof value.targetAmount === 'number'
    && Number.isFinite(value.targetAmount)
    && typeof value.savedAmount === 'number'
    && Number.isFinite(value.savedAmount)
    && typeof value.color === 'string'
    && typeof value.icon === 'string'
    && (value.deadline === undefined || typeof value.deadline === 'string');
}

function parseBackupPayload(data: BackupPayload) {
  if (!Array.isArray(data.transactions) || !Array.isArray(data.categories) || !Array.isArray(data.budgets) || !Array.isArray(data.fixedCosts)) {
    throw new Error('バックアップデータが不完全です');
  }

  if (!data.transactions.every(isTransaction)) {
    throw new Error('取引データの形式が正しくありません');
  }
  if (!data.categories.every(isCategory)) {
    throw new Error('カテゴリデータの形式が正しくありません');
  }
  if (!data.budgets.every(isBudget)) {
    throw new Error('予算データの形式が正しくありません');
  }
  if (!data.fixedCosts.every(isFixedCost)) {
    throw new Error('固定費データの形式が正しくありません');
  }
  if (data.goals !== undefined && (!Array.isArray(data.goals) || !data.goals.every(isSavingsGoal))) {
    throw new Error('貯蓄目標データの形式が正しくありません');
  }

  const categories = data.categories;
  const categoryIds = new Set(categories.map((category) => category.id));
  const fixedCostIds = new Set(data.fixedCosts.map((fixedCost) => fixedCost.id));

  if (data.transactions.some((transaction) => !categoryIds.has(transaction.categoryId))) {
    throw new Error('取引データに存在しないカテゴリ参照があります');
  }
  if (data.transactions.some((transaction) => transaction.fixedCostId && !fixedCostIds.has(transaction.fixedCostId))) {
    throw new Error('取引データに存在しない固定費参照があります');
  }
  if (data.budgets.some((budget) => !categoryIds.has(budget.categoryId))) {
    throw new Error('予算データに存在しないカテゴリ参照があります');
  }
  if (data.fixedCosts.some((fixedCost) => !categoryIds.has(fixedCost.categoryId))) {
    throw new Error('固定費データに存在しないカテゴリ参照があります');
  }

  return {
    transactions: data.transactions,
    categories,
    budgets: data.budgets,
    fixedCosts: data.fixedCosts,
    goals: data.goals ?? [],
  };
}

export async function exportJSON(): Promise<void> {
  const [transactions, categories, budgets, fixedCosts, goals] = await Promise.all([
    db.transactions.toArray(),
    db.categories.toArray(),
    db.budgets.toArray(),
    db.fixedCosts.toArray(),
    db.goals.toArray(),
  ]);

  const data = { transactions, categories, budgets, fixedCosts, goals };
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const date = new Date().toISOString().slice(0, 10);
  const a = document.createElement('a');
  a.href = url;
  a.download = `kakeibo_backup_${date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function importJSON(file: File): Promise<void> {
  const text = await file.text();
  let data: BackupPayload;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('JSONファイルの形式が正しくありません');
  }

  const parsed = parseBackupPayload(data);

  const confirmed = confirm(
    '既存のデータはすべて上書きされます。インポートを続けますか？'
  );
  if (!confirmed) return;

  await db.transaction('rw', [db.transactions, db.categories, db.budgets, db.fixedCosts, db.goals], async () => {
    await db.transactions.clear();
    await db.categories.clear();
    await db.budgets.clear();
    await db.fixedCosts.clear();
    await db.goals.clear();
    await db.transactions.bulkAdd(parsed.transactions);
    await db.categories.bulkAdd(parsed.categories);
    await db.budgets.bulkAdd(parsed.budgets);
    await db.fixedCosts.bulkAdd(parsed.fixedCosts);
    if (parsed.goals.length > 0) {
      await db.goals.bulkAdd(parsed.goals);
    }
  });
}
