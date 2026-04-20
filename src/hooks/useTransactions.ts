import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import type { Transaction } from '../types';

export function useTransactions(month: string) {
  const transactions = useLiveQuery(
    () =>
      db.transactions
        .where('date')
        .between(`${month}-01`, `${month}-31`, true, true)
        .reverse()
        .sortBy('date'),
    [month]
  );

  const addTransaction = async (data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    await db.transactions.add({
      ...data,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    });
  };

  const updateTransaction = async (id: string, data: Partial<Omit<Transaction, 'id' | 'createdAt'>>) => {
    await db.transactions.update(id, {
      ...data,
      updatedAt: new Date().toISOString(),
    });
  };

  const deleteTransaction = async (id: string) => {
    await db.transactions.delete(id);
  };

  return { transactions: transactions ?? [], addTransaction, updateTransaction, deleteTransaction };
}
