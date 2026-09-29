import type { Transaction, TransactionType } from './models';

export function totalByType(transactions: Transaction[], type: TransactionType): number {
  return transactions
    .filter(t => t.type === type)
    .reduce((sum, t) => sum + t.amountMinor, 0);
}

export function totalByCategory(transactions: Transaction[]): Record<string, number> {
  const totals: Record<string, number> = {};
  for (const t of transactions) {
    if (!totals[t.categoryId]) {
      totals[t.categoryId] = 0;
    }
    totals[t.categoryId] += t.amountMinor;
  }
  return totals;
}

export function balance(transactions: Transaction[]): number {
  const income = totalByType(transactions, 'income');
  const expense = totalByType(transactions, 'expense');
  return income - expense;
}

export interface DayGroup {
  date: string; // YYYY-MM-DD
  transactions: Transaction[];
  totalMinor: number; // Net for the day: totalIncomeMinor - totalExpenseMinor
  totalIncomeMinor: number;
  totalExpenseMinor: number;
}

/**
 * Groups transactions by date (YYYY-MM-DD), sorted by date descending (newest first).
 * Transactions inside each day group are sorted by createdAt descending.
 */
export function groupTransactionsByDay(transactions: Transaction[]): DayGroup[] {
  const map = new Map<string, Transaction[]>();

  for (const t of transactions) {
    const list = map.get(t.date) || [];
    list.push(t);
    map.set(t.date, list);
  }

  const sortedDates = Array.from(map.keys()).sort((a, b) => b.localeCompare(a));

  return sortedDates.map(date => {
    const dayTxs = [...(map.get(date) || [])];
    dayTxs.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    let totalIncomeMinor = 0;
    let totalExpenseMinor = 0;

    for (const t of dayTxs) {
      if (t.type === 'income') {
        totalIncomeMinor += t.amountMinor;
      } else {
        totalExpenseMinor += t.amountMinor;
      }
    }

    return {
      date,
      transactions: dayTxs,
      totalMinor: totalIncomeMinor - totalExpenseMinor,
      totalIncomeMinor,
      totalExpenseMinor,
    };
  });
}

export interface TransactionFilterOptions {
  month?: string; // YYYY-MM
  type?: TransactionType | 'all';
  categoryId?: string | 'all';
}

/**
 * Pure function to filter transactions by month, type, and category.
 */
export function filterTransactions(
  transactions: Transaction[],
  filters: TransactionFilterOptions
): Transaction[] {
  return transactions.filter(t => {
    if (filters.month && !t.date.startsWith(filters.month)) {
      return false;
    }
    if (filters.type && filters.type !== 'all' && t.type !== filters.type) {
      return false;
    }
    if (filters.categoryId && filters.categoryId !== 'all' && t.categoryId !== filters.categoryId) {
      return false;
    }
    return true;
  });
}

