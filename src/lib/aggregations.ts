import type { Category, Transaction, TransactionType } from './models';
import { formatShortMonth, getPastMonths } from './date';

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

export interface CategoryExpenseItem {
  categoryId: string;
  categoryName: string;
  icon: string;
  color: string;
  totalMinor: number;
  percentage: number; // 0 to 100
}

/**
 * Pure function: calculates expense breakdown by category for a set of transactions.
 * Returns sorted descending by total amount.
 */
export function getCategoryExpenseBreakdown(
  transactions: Transaction[],
  categories: Category[]
): CategoryExpenseItem[] {
  const expenseTransactions = transactions.filter(t => t.type === 'expense');
  const totals = totalByCategory(expenseTransactions);
  const totalAllExpenses = Object.values(totals).reduce((sum, val) => sum + val, 0);

  const categoryMap = new Map<string, Category>(categories.map(c => [c.id, c]));

  const result: CategoryExpenseItem[] = [];

  for (const [catId, amount] of Object.entries(totals)) {
    if (amount <= 0) continue;
    const cat = categoryMap.get(catId);
    const percentage = totalAllExpenses > 0
      ? Math.round((amount / totalAllExpenses) * 1000) / 10
      : 0;

    result.push({
      categoryId: catId,
      categoryName: cat?.name || 'Altele',
      icon: cat?.icon || '📦',
      color: cat?.color || '#9ca3af',
      totalMinor: amount,
      percentage,
    });
  }

  return result.sort((a, b) => b.totalMinor - a.totalMinor);
}

export interface MonthlyEvolutionItem {
  monthIso: string;
  label: string; // e.g. 'Mar'
  incomeMinor: number;
  expenseMinor: number;
  netMinor: number;
}

/**
 * Pure function: calculates evolution of income and expenses over the last N months.
 */
export function getMonthlyEvolution(
  transactions: Transaction[],
  endMonthIso: string,
  monthCount = 6
): MonthlyEvolutionItem[] {
  const months = getPastMonths(endMonthIso, monthCount);

  return months.map(monthIso => {
    const monthTxs = transactions.filter(t => t.date.startsWith(monthIso));
    const incomeMinor = totalByType(monthTxs, 'income');
    const expenseMinor = totalByType(monthTxs, 'expense');

    return {
      monthIso,
      label: formatShortMonth(monthIso),
      incomeMinor,
      expenseMinor,
      netMinor: incomeMinor - expenseMinor,
    };
  });
}

export interface CategoryComparisonItem {
  categoryId: string;
  categoryName: string;
  icon: string;
  color: string;
  currentMinor: number;
  previousMinor: number;
  diffMinor: number;
  diffPercentage: number | null; // null if previous was 0 and current > 0
  isNew: boolean;
}

/**
 * Pure function: compares category expenses between current month and previous month.
 * Sorted by current month spend descending, then previous month spend descending.
 */
export function getCategoryComparison(
  currentMonthTransactions: Transaction[],
  previousMonthTransactions: Transaction[],
  categories: Category[]
): CategoryComparisonItem[] {
  const currentExpenses = currentMonthTransactions.filter(t => t.type === 'expense');
  const previousExpenses = previousMonthTransactions.filter(t => t.type === 'expense');

  const currentTotals = totalByCategory(currentExpenses);
  const previousTotals = totalByCategory(previousExpenses);

  const categoryMap = new Map<string, Category>(categories.map(c => [c.id, c]));
  const allCategoryIds = Array.from(new Set([...Object.keys(currentTotals), ...Object.keys(previousTotals)]));

  const result: CategoryComparisonItem[] = [];

  for (const catId of allCategoryIds) {
    const currentMinor = currentTotals[catId] || 0;
    const previousMinor = previousTotals[catId] || 0;

    if (currentMinor === 0 && previousMinor === 0) continue;

    const diffMinor = currentMinor - previousMinor;
    const isNew = previousMinor === 0 && currentMinor > 0;
    let diffPercentage: number | null = null;

    if (previousMinor > 0) {
      diffPercentage = Math.round(((currentMinor - previousMinor) / previousMinor) * 1000) / 10;
    }

    const cat = categoryMap.get(catId);

    result.push({
      categoryId: catId,
      categoryName: cat?.name || 'Altele',
      icon: cat?.icon || '📦',
      color: cat?.color || '#9ca3af',
      currentMinor,
      previousMinor,
      diffMinor,
      diffPercentage,
      isNew,
    });
  }

  return result.sort((a, b) => {
    if (b.currentMinor !== a.currentMinor) {
      return b.currentMinor - a.currentMinor;
    }
    return b.previousMinor - a.previousMinor;
  });
}

export interface TopExpenseItem {
  id: string;
  amountMinor: number;
  date: string;
  note?: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
}

/**
 * Pure function: returns top N largest expenses for a set of transactions.
 */
export function getTopExpenses(
  transactions: Transaction[],
  categories: Category[],
  limit = 5
): TopExpenseItem[] {
  const expenseTxs = transactions.filter(t => t.type === 'expense');

  const sorted = [...expenseTxs].sort((a, b) => {
    if (b.amountMinor !== a.amountMinor) {
      return b.amountMinor - a.amountMinor;
    }
    return b.date.localeCompare(a.date);
  });

  const sliced = sorted.slice(0, limit);
  const categoryMap = new Map<string, Category>(categories.map(c => [c.id, c]));

  return sliced.map(t => {
    const cat = categoryMap.get(t.categoryId);
    return {
      id: t.id,
      amountMinor: t.amountMinor,
      date: t.date,
      note: t.note,
      categoryId: t.categoryId,
      categoryName: cat?.name || 'Altele',
      categoryIcon: cat?.icon || '📦',
      categoryColor: cat?.color || '#9ca3af',
    };
  });
}

export type TableSortField = 'date' | 'category' | 'amount' | 'type' | 'note';
export type TableSortOrder = 'asc' | 'desc';

export interface TableFilterOptions {
  startDate?: string;
  endDate?: string;
  categoryId?: string | 'all';
  type?: TransactionType | 'all';
}

export interface TableTransactionItem extends Transaction {
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
}

/**
 * Pure function: filters and sorts transactions for the analysis table.
 */
export function filterAndSortTransactionsForTable(
  transactions: Transaction[],
  categories: Category[],
  filters: TableFilterOptions,
  sort: { field: TableSortField; order: TableSortOrder }
): TableTransactionItem[] {
  const categoryMap = new Map<string, Category>(categories.map(c => [c.id, c]));

  const filtered = transactions.filter(t => {
    if (filters.startDate && t.date < filters.startDate) {
      return false;
    }
    if (filters.endDate && t.date > filters.endDate) {
      return false;
    }
    if (filters.categoryId && filters.categoryId !== 'all' && t.categoryId !== filters.categoryId) {
      return false;
    }
    if (filters.type && filters.type !== 'all' && t.type !== filters.type) {
      return false;
    }
    return true;
  });

  const items: TableTransactionItem[] = filtered.map(t => {
    const cat = categoryMap.get(t.categoryId);
    return {
      ...t,
      categoryName: cat?.name || 'Altele',
      categoryIcon: cat?.icon || '📦',
      categoryColor: cat?.color || '#9ca3af',
    };
  });

  return items.sort((a, b) => {
    let comparison = 0;
    switch (sort.field) {
      case 'date':
        comparison = a.date.localeCompare(b.date);
        if (comparison === 0) {
          comparison = (a.createdAt || '').localeCompare(b.createdAt || '');
        }
        break;
      case 'category':
        comparison = a.categoryName.localeCompare(b.categoryName, 'ro');
        break;
      case 'amount':
        comparison = a.amountMinor - b.amountMinor;
        break;
      case 'type':
        comparison = a.type.localeCompare(b.type);
        break;
      case 'note':
        comparison = (a.note || '').localeCompare(b.note || '', 'ro');
        break;
    }
    return sort.order === 'asc' ? comparison : -comparison;
  });
}

