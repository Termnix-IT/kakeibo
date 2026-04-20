export type Transaction = {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  categoryId: string;
  date: string;
  memo?: string;
  fixedCostId?: string;  // 固定費から生成された場合にセット
  createdAt: string;
  updatedAt: string;
};

export type FixedCost = {
  id: string;
  name: string;
  type: 'income' | 'expense';
  amount: number;
  categoryId: string;
  day: number;       // 毎月何日（1〜31）
  isActive: boolean;
};

export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'income' | 'expense' | 'both';
};

export type Budget = {
  id: string;
  categoryId: string;
  month: string | null;
  amount: number;
};

export type SavingsGoal = {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  deadline?: string;   // YYYY-MM-DD
  color: string;
  icon: string;
};
