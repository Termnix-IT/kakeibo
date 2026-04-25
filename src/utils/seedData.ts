import { db } from '../db';
import type { Category, Transaction } from '../types';

// 画像のダッシュボードに合わせたターゲット値
// 収入 ¥420,000 / 支出 ¥278,450 / 内訳:
//   住居 ¥89,000 / 食費 ¥56,340 / 交通・通信 ¥32,450 /
//   光熱費 ¥24,680 / 趣味・娯楽 ¥21,300 / 日用品 ¥18,650 / その他 ¥36,030

const APRIL_MONTH = '2026-04';

const EXTRA_CATEGORIES: Category[] = [
  { id: 'cat-utility', name: '光熱費', icon: '💡', color: '#fbbf24', type: 'expense' },
];

type Seed = Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>;

const APRIL_SEEDS: Seed[] = [
  // 収入
  { type: 'income', amount: 420_000, categoryId: 'cat-income', date: '2026-04-20', memo: '給与振込' },

  // 住居
  { type: 'expense', amount: 89_000, categoryId: 'cat-housing', date: '2026-04-01', memo: '家賃' },

  // 食費 (合計 ¥56,340)
  { type: 'expense', amount: 12_400, categoryId: 'cat-food', date: '2026-04-02', memo: 'スーパー・マルシェ' },
  { type: 'expense', amount: 8_900,  categoryId: 'cat-food', date: '2026-04-08', memo: '食材まとめ買い' },
  { type: 'expense', amount: 5_480,  categoryId: 'cat-food', date: '2026-04-14', memo: 'ランチ' },
  { type: 'expense', amount: 5_480,  categoryId: 'cat-food', date: '2026-04-20', memo: 'スーパー・マルシェ' },
  { type: 'expense', amount: 11_320, categoryId: 'cat-food', date: '2026-04-23', memo: '外食' },
  { type: 'expense', amount: 12_760, categoryId: 'cat-food', date: '2026-04-27', memo: '週末まとめ買い' },

  // 交通・通信 (合計 ¥32,450)
  { type: 'expense', amount: 7_800,  categoryId: 'cat-transport', date: '2026-04-01', memo: '通信費' },
  { type: 'expense', amount: 4_500,  categoryId: 'cat-transport', date: '2026-04-05', memo: 'ガソリン' },
  { type: 'expense', amount: 10_280, categoryId: 'cat-transport', date: '2026-04-18', memo: 'JR定期券' },
  { type: 'expense', amount: 4_500,  categoryId: 'cat-transport', date: '2026-04-22', memo: 'ガソリン' },
  { type: 'expense', amount: 5_370,  categoryId: 'cat-transport', date: '2026-04-29', memo: '出張交通費' },

  // 光熱費 (合計 ¥24,680)
  { type: 'expense', amount: 3_800, categoryId: 'cat-utility', date: '2026-04-12', memo: '水道料金' },
  { type: 'expense', amount: 4_200, categoryId: 'cat-utility', date: '2026-04-15', memo: 'ガス料金' },
  { type: 'expense', amount: 8_760, categoryId: 'cat-utility', date: '2026-04-19', memo: '電気料金' },
  { type: 'expense', amount: 7_920, categoryId: 'cat-utility', date: '2026-04-25', memo: 'NHK受信料' },

  // 趣味・娯楽 (合計 ¥21,300)
  { type: 'expense', amount: 6_400,  categoryId: 'cat-leisure', date: '2026-04-03', memo: 'ゲームソフト' },
  { type: 'expense', amount: 4_900,  categoryId: 'cat-leisure', date: '2026-04-13', memo: '映画' },
  { type: 'expense', amount: 10_000, categoryId: 'cat-leisure', date: '2026-04-24', memo: '週末アクティビティ' },

  // 日用品 (合計 ¥18,650)
  { type: 'expense', amount: 3_980, categoryId: 'cat-daily', date: '2026-04-08', memo: 'Amazon.co.jp' },
  { type: 'expense', amount: 6_200, categoryId: 'cat-daily', date: '2026-04-17', memo: '日用品まとめ買い' },
  { type: 'expense', amount: 8_470, categoryId: 'cat-daily', date: '2026-04-26', memo: 'ドラッグストア' },

  // その他 (合計 ¥36,030)
  { type: 'expense', amount: 17_000, categoryId: 'cat-other', date: '2026-04-06', memo: '冠婚葬祭' },
  { type: 'expense', amount: 19_030, categoryId: 'cat-other', date: '2026-04-21', memo: 'プレゼント' },
];

export type SeedResult = {
  insertedTransactions: number;
  insertedCategories: number;
};

/** 2026年4月分のサンプルデータが既に投入されているか */
export async function hasAprilSeed(): Promise<boolean> {
  const count = await db.transactions
    .where('date')
    .between(`${APRIL_MONTH}-01`, `${APRIL_MONTH}-31`, true, true)
    .count();
  return count > 0;
}

/**
 * 2026年4月のサンプルトランザクションを投入する。
 * 既に4月の取引がある場合は重複投入しない（呼び出し側で確認すること）。
 * 不足カテゴリ（光熱費など）は自動で追加。
 */
export async function seedAprilData(): Promise<SeedResult> {
  const now = new Date().toISOString();

  // 不足カテゴリを ensure（既存IDがあればスキップ）
  let insertedCategories = 0;
  for (const cat of EXTRA_CATEGORIES) {
    const existing = await db.categories.get(cat.id);
    if (!existing) {
      await db.categories.add(cat);
      insertedCategories += 1;
    }
  }

  const records: Transaction[] = APRIL_SEEDS.map((seed) => ({
    ...seed,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }));

  await db.transactions.bulkAdd(records);

  return {
    insertedTransactions: records.length,
    insertedCategories,
  };
}

/** 2026年4月のサンプルトランザクションのみを削除 */
export async function clearAprilSeed(): Promise<number> {
  const ids = await db.transactions
    .where('date')
    .between(`${APRIL_MONTH}-01`, `${APRIL_MONTH}-31`, true, true)
    .primaryKeys();
  await db.transactions.bulkDelete(ids);
  return ids.length;
}
