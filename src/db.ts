import Dexie, { type EntityTable } from 'dexie';
import type { Transaction, Category, Budget, FixedCost, SavingsGoal } from './types';

const DEFAULT_CATEGORY_COLOR_MIGRATION: Record<string, { from: string; to: string }> = {
  'cat-food': { from: '#D85A30', to: '#fa6414' },
  'cat-housing': { from: '#378ADD', to: '#2864f0' },
  'cat-transport': { from: '#1D9E75', to: '#00963c' },
  'cat-leisure': { from: '#7F77DD', to: '#3264dc' },
  'cat-medical': { from: '#D4537E', to: '#dc1e32' },
  'cat-daily': { from: '#BA7517', to: '#ffb91e' },
  'cat-income': { from: '#1D9E75', to: '#1e46aa' },
  'cat-other': { from: '#888780', to: '#8c8989' },
};

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-food',      name: '食費',   icon: '🛒', color: '#fa6414', type: 'expense' },
  { id: 'cat-housing',   name: '住居',   icon: '🏠', color: '#2864f0', type: 'expense' },
  { id: 'cat-transport', name: '交通',   icon: '🚃', color: '#00963c', type: 'expense' },
  { id: 'cat-leisure',   name: '娯楽',   icon: '🎮', color: '#3264dc', type: 'expense' },
  { id: 'cat-medical',   name: '医療',   icon: '💊', color: '#dc1e32', type: 'expense' },
  { id: 'cat-daily',     name: '日用品', icon: '🧴', color: '#ffb91e', type: 'expense' },
  { id: 'cat-income',    name: '収入',   icon: '💰', color: '#1e46aa', type: 'income'  },
  { id: 'cat-other',     name: 'その他', icon: '📦', color: '#8c8989', type: 'both'    },
];

class KakeiboDatabase extends Dexie {
  transactions!: EntityTable<Transaction, 'id'>;
  categories!: EntityTable<Category, 'id'>;
  budgets!: EntityTable<Budget, 'id'>;
  fixedCosts!: EntityTable<FixedCost, 'id'>;
  goals!: EntityTable<SavingsGoal, 'id'>;

  constructor() {
    super('KakeiboDatabase');
    this.version(1).stores({
      transactions: 'id, type, date, categoryId',
      categories: 'id, type',
      budgets: 'id, categoryId, month',
    });
    this.version(2).stores({
      transactions: 'id, type, date, categoryId, fixedCostId',
      categories: 'id, type',
      budgets: 'id, categoryId, month',
      fixedCosts: 'id, isActive',
    });
    this.version(3).stores({
      transactions: 'id, type, date, categoryId, fixedCostId',
      categories: 'id, type',
      budgets: 'id, categoryId, month',
      fixedCosts: 'id, isActive',
      goals: 'id',
    });
    this.version(4).stores({
      transactions: 'id, type, date, categoryId, fixedCostId',
      categories: 'id, type',
      budgets: 'id, categoryId, month',
      fixedCosts: 'id, isActive',
      goals: 'id',
    }).upgrade(async (tx) => {
      const categories = await tx.table('categories').toArray() as Category[];
      await Promise.all(categories.map(async (category) => {
        const migration = DEFAULT_CATEGORY_COLOR_MIGRATION[category.id];
        if (!migration || category.color !== migration.from) return;
        await tx.table('categories').update(category.id, { color: migration.to });
      }));
    });
  }
}

export const db = new KakeiboDatabase();

db.on('populate', async () => {
  await db.categories.bulkAdd(DEFAULT_CATEGORIES);
});
