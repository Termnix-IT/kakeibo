import type { Transaction, Category } from '../types';

function escapeCsvField(value: string): string {
  if (!/[",\n\r]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
}

export function exportCSV(transactions: Transaction[], categories: Category[], month: string): void {
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  const header = '日付,種別,カテゴリ,金額,メモ';
  const rows = transactions.map((t) => {
    const cat = catMap[t.categoryId]?.name ?? '';
    const type = t.type === 'income' ? '収入' : '支出';
    const memo = t.memo ?? '';
    return [
      escapeCsvField(t.date),
      escapeCsvField(type),
      escapeCsvField(cat),
      String(t.amount),
      escapeCsvField(memo),
    ].join(',');
  });

  const csv = [header, ...rows].join('\n');
  const bom = '\uFEFF'; // UTF-8 BOM for Excel compatibility
  const blob = new Blob([bom + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `kakeibo_${month}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
