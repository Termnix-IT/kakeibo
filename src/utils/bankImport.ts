export type BankFormat = 'mufg' | 'rakuten' | 'yucho' | 'mizuho' | 'smbc' | 'custom';

export type BankRow = {
  date: string;       // YYYY-MM-DD
  amount: number;     // positive = income, negative = expense
  memo: string;
};

export type BankFormatDef = {
  id: BankFormat;
  name: string;
  description: string;
  parse: (rows: string[][]) => BankRow[];
};

function parseDate(s: string): string {
  // Handle YYYY/MM/DD, YYYY-MM-DD, YYYYMMDD
  const clean = s.trim().replace(/\//g, '-').replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
  return clean;
}

function parseAmount(s: string): number {
  return Number(s.trim().replace(/,/g, '').replace(/[¥￥円]/g, '')) || 0;
}

export const BANK_FORMATS: BankFormatDef[] = [
  {
    id: 'mufg',
    name: '三菱UFJ銀行',
    description: '日付,摘要,支払金額,預かり金額,差引残高',
    parse: (rows) => rows
      .filter(r => r.length >= 4 && /^\d{4}/.test(r[0]?.trim() ?? ''))
      .map(r => {
        const debit = parseAmount(r[2]);
        const credit = parseAmount(r[3]);
        return { date: parseDate(r[0]), amount: credit - debit, memo: r[1]?.trim() ?? '' };
      })
      .filter(r => r.amount !== 0),
  },
  {
    id: 'rakuten',
    name: '楽天銀行',
    description: '取引日,入出金(円),残高(円),入出金先内容',
    parse: (rows) => rows
      .filter(r => r.length >= 3 && /^\d{4}/.test(r[0]?.trim() ?? ''))
      .map(r => ({
        date: parseDate(r[0]),
        amount: parseAmount(r[1]),
        memo: r[3]?.trim() ?? r[2]?.trim() ?? '',
      }))
      .filter(r => r.amount !== 0),
  },
  {
    id: 'yucho',
    name: 'ゆうちょ銀行',
    description: '年月日,お取り扱い内容,お支払い金額,お預かり金額,差引残高',
    parse: (rows) => rows
      .filter(r => r.length >= 4 && /^\d{4}/.test(r[0]?.trim() ?? ''))
      .map(r => {
        const debit = parseAmount(r[2]);
        const credit = parseAmount(r[3]);
        return { date: parseDate(r[0]), amount: credit - debit, memo: r[1]?.trim() ?? '' };
      })
      .filter(r => r.amount !== 0),
  },
  {
    id: 'mizuho',
    name: 'みずほ銀行',
    description: '取引日,摘要,支払金額,預入金額,残高',
    parse: (rows) => rows
      .filter(r => r.length >= 4 && /^\d{4}/.test(r[0]?.trim() ?? ''))
      .map(r => {
        const debit = parseAmount(r[2]);
        const credit = parseAmount(r[3]);
        return { date: parseDate(r[0]), amount: credit - debit, memo: r[1]?.trim() ?? '' };
      })
      .filter(r => r.amount !== 0),
  },
  {
    id: 'smbc',
    name: '三井住友銀行',
    description: '年月日,摘要,お支払い金額,お預け入れ金額,差引残高',
    parse: (rows) => rows
      .filter(r => r.length >= 4 && /^\d{4}/.test(r[0]?.trim() ?? ''))
      .map(r => {
        const debit = parseAmount(r[2]);
        const credit = parseAmount(r[3]);
        return { date: parseDate(r[0]), amount: credit - debit, memo: r[1]?.trim() ?? '' };
      })
      .filter(r => r.amount !== 0),
  },
];

export function parseCSVText(text: string): string[][] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  return lines
    .filter(l => l.trim())
    .map(line => {
      const result: string[] = [];
      let inQuote = false;
      let cell = '';
      for (const ch of line) {
        if (ch === '"') {
          inQuote = !inQuote;
        } else if (ch === ',' && !inQuote) {
          result.push(cell);
          cell = '';
        } else {
          cell += ch;
        }
      }
      result.push(cell);
      return result;
    });
}

export function detectFormat(rows: string[][]): BankFormat | null {
  // Try to detect by header
  const header = (rows[0] ?? []).join(',').toLowerCase();
  if (header.includes('摘要') && header.includes('支払')) {
    if (header.includes('三菱') || rows.slice(0, 5).flat().join('').includes('三菱')) return 'mufg';
    return 'mizuho';
  }
  if (header.includes('入出金')) return 'rakuten';
  if (header.includes('お支払い') || header.includes('お預かり')) return 'yucho';
  return null;
}
