import { describe, it, expect } from 'vitest';
import {
  totalByType,
  totalByCategory,
  balance,
  groupTransactionsByDay,
  filterTransactions,
  getCategoryExpenseBreakdown,
  getMonthlyEvolution,
  getCategoryComparison,
  getTopExpenses,
  filterAndSortTransactionsForTable,
} from './aggregations';
import type { Category, Transaction } from './models';

const mockTransactions: Transaction[] = [
  { id: '1', type: 'income', amountMinor: 500000, categoryId: 'c1', date: '2023-10-01', createdAt: '2023-10-01T08:00:00Z', updatedAt: '' },
  { id: '2', type: 'income', amountMinor: 100000, categoryId: 'c2', date: '2023-10-02', createdAt: '2023-10-02T09:00:00Z', updatedAt: '' },
  { id: '3', type: 'expense', amountMinor: 15000, categoryId: 'c3', date: '2023-10-03', createdAt: '2023-10-03T10:00:00Z', updatedAt: '' },
  { id: '4', type: 'expense', amountMinor: 5000, categoryId: 'c3', date: '2023-10-03', createdAt: '2023-10-03T14:00:00Z', updatedAt: '' },
  { id: '5', type: 'expense', amountMinor: 20000, categoryId: 'c4', date: '2023-10-05', createdAt: '2023-10-05T12:00:00Z', updatedAt: '' },
];

describe('Aggregations', () => {
  it('should calculate total by type correctly', () => {
    expect(totalByType(mockTransactions, 'income')).toBe(600000);
    expect(totalByType(mockTransactions, 'expense')).toBe(40000);
  });

  it('should calculate total by category correctly', () => {
    const totals = totalByCategory(mockTransactions);
    expect(totals['c1']).toBe(500000);
    expect(totals['c2']).toBe(100000);
    expect(totals['c3']).toBe(20000); // 15000 + 5000
    expect(totals['c4']).toBe(20000);
  });

  it('should calculate balance correctly', () => {
    // 600000 - 40000 = 560000
    expect(balance(mockTransactions)).toBe(560000);
  });

  it('should handle empty array', () => {
    expect(totalByType([], 'income')).toBe(0);
    expect(totalByCategory([])).toEqual({});
    expect(balance([])).toBe(0);
  });

  describe('groupTransactionsByDay', () => {
    it('should return empty array for no transactions', () => {
      expect(groupTransactionsByDay([])).toEqual([]);
    });

    it('should group transactions by date and calculate day totals', () => {
      const groups = groupTransactionsByDay(mockTransactions);
      expect(groups).toHaveLength(4);
      // Newest date first: 2023-10-05
      expect(groups[0].date).toBe('2023-10-05');
      expect(groups[0].transactions).toHaveLength(1);
      expect(groups[0].totalExpenseMinor).toBe(20000);
      expect(groups[0].totalMinor).toBe(-20000);

      // 2023-10-03 has 2 transactions
      const groupOct3 = groups.find(g => g.date === '2023-10-03');
      expect(groupOct3).toBeDefined();
      expect(groupOct3!.transactions).toHaveLength(2);
      expect(groupOct3!.totalExpenseMinor).toBe(20000); // 15000 + 5000
      expect(groupOct3!.totalIncomeMinor).toBe(0);
      expect(groupOct3!.totalMinor).toBe(-20000);
      // Newest createdAt first on 2023-10-03
      expect(groupOct3!.transactions[0].id).toBe('4');
      expect(groupOct3!.transactions[1].id).toBe('3');
    });

    it('should compute net total when day has both income and expense', () => {
      const txs: Transaction[] = [
        { id: 'a', type: 'income', amountMinor: 10000, categoryId: 'c1', date: '2026-03-29', createdAt: '2026-03-29T10:00:00Z', updatedAt: '' },
        { id: 'b', type: 'expense', amountMinor: 4000, categoryId: 'c2', date: '2026-03-29', createdAt: '2026-03-29T11:00:00Z', updatedAt: '' },
      ];
      const groups = groupTransactionsByDay(txs);
      expect(groups).toHaveLength(1);
      expect(groups[0].totalIncomeMinor).toBe(10000);
      expect(groups[0].totalExpenseMinor).toBe(4000);
      expect(groups[0].totalMinor).toBe(6000);
    });
  });

  describe('filterTransactions', () => {
    it('should filter by month', () => {
      const txs: Transaction[] = [
        { id: '1', type: 'expense', amountMinor: 100, categoryId: 'c1', date: '2026-02-28', createdAt: '', updatedAt: '' },
        { id: '2', type: 'expense', amountMinor: 200, categoryId: 'c1', date: '2026-03-01', createdAt: '', updatedAt: '' },
        { id: '3', type: 'expense', amountMinor: 300, categoryId: 'c1', date: '2026-03-15', createdAt: '', updatedAt: '' },
      ];
      const result = filterTransactions(txs, { month: '2026-03' });
      expect(result).toHaveLength(2);
      expect(result.map(t => t.id)).toEqual(['2', '3']);
    });

    it('should filter by type', () => {
      const result = filterTransactions(mockTransactions, { type: 'expense' });
      expect(result).toHaveLength(3);
      expect(result.every(t => t.type === 'expense')).toBe(true);
    });

    it('should filter by categoryId', () => {
      const result = filterTransactions(mockTransactions, { categoryId: 'c3' });
      expect(result).toHaveLength(2);
      expect(result.every(t => t.categoryId === 'c3')).toBe(true);
    });

    it('should combine filters correctly', () => {
      const result = filterTransactions(mockTransactions, {
        month: '2023-10',
        type: 'income',
        categoryId: 'c1',
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });
  });

  describe('getCategoryExpenseBreakdown', () => {
    const categories: Category[] = [
      { id: 'c3', name: 'Mâncare', type: 'expense', icon: '🍔', color: '#f87171', isArchived: false, createdAt: '' },
      { id: 'c4', name: 'Transport', type: 'expense', icon: '🚗', color: '#fbbf24', isArchived: false, createdAt: '' },
    ];

    it('should aggregate expenses by category and calculate percentages', () => {
      // In mockTransactions: c3 has 15000 + 5000 = 20000; c4 has 20000. Total expense = 40000.
      const breakdown = getCategoryExpenseBreakdown(mockTransactions, categories);
      expect(breakdown).toHaveLength(2);
      expect(breakdown[0].totalMinor).toBe(20000);
      expect(breakdown[0].percentage).toBe(50);
      expect(breakdown[1].totalMinor).toBe(20000);
      expect(breakdown[1].percentage).toBe(50);
    });

    it('should return empty array when no expenses exist', () => {
      const incomeOnly: Transaction[] = [
        { id: '1', type: 'income', amountMinor: 1000, categoryId: 'c1', date: '2026-03-01', createdAt: '', updatedAt: '' },
      ];
      expect(getCategoryExpenseBreakdown(incomeOnly, categories)).toEqual([]);
    });

    it('should fallback gracefully for unknown category', () => {
      const txs: Transaction[] = [
        { id: '1', type: 'expense', amountMinor: 5000, categoryId: 'unknown', date: '2026-03-01', createdAt: '', updatedAt: '' },
      ];
      const breakdown = getCategoryExpenseBreakdown(txs, []);
      expect(breakdown).toHaveLength(1);
      expect(breakdown[0].categoryName).toBe('Altele');
      expect(breakdown[0].color).toBe('#9ca3af');
      expect(breakdown[0].percentage).toBe(100);
    });
  });

  describe('getMonthlyEvolution', () => {
    it('should aggregate income and expense for the last 6 months', () => {
      const txs: Transaction[] = [
        { id: '1', type: 'income', amountMinor: 500000, categoryId: 'c1', date: '2026-03-10', createdAt: '', updatedAt: '' },
        { id: '2', type: 'expense', amountMinor: 200000, categoryId: 'c2', date: '2026-03-15', createdAt: '', updatedAt: '' },
        { id: '3', type: 'income', amountMinor: 450000, categoryId: 'c1', date: '2026-02-10', createdAt: '', updatedAt: '' },
        { id: '4', type: 'expense', amountMinor: 150000, categoryId: 'c2', date: '2026-02-20', createdAt: '', updatedAt: '' },
      ];

      const evolution = getMonthlyEvolution(txs, '2026-03', 6);
      expect(evolution).toHaveLength(6);
      // Last month is 2026-03
      const mar = evolution[5];
      expect(mar.monthIso).toBe('2026-03');
      expect(mar.label).toBe('Mar');
      expect(mar.incomeMinor).toBe(500000);
      expect(mar.expenseMinor).toBe(200000);
      expect(mar.netMinor).toBe(300000);

      // Second to last is 2026-02
      const feb = evolution[4];
      expect(feb.monthIso).toBe('2026-02');
      expect(feb.incomeMinor).toBe(450000);
      expect(feb.expenseMinor).toBe(150000);

      // Month with 0 data
      const jan = evolution[3];
      expect(jan.monthIso).toBe('2026-01');
      expect(jan.incomeMinor).toBe(0);
      expect(jan.expenseMinor).toBe(0);
      expect(jan.netMinor).toBe(0);
    });
  });

  describe('getCategoryComparison', () => {
    const categories: Category[] = [
      { id: 'c1', name: 'Mâncare', type: 'expense', icon: '🍔', color: '#f87171', isArchived: false, createdAt: '' },
      { id: 'c2', name: 'Transport', type: 'expense', icon: '🚗', color: '#fbbf24', isArchived: false, createdAt: '' },
      { id: 'c3', name: 'Chirie', type: 'expense', icon: '🏠', color: '#60a5fa', isArchived: false, createdAt: '' },
    ];

    it('should compare current month with previous month', () => {
      const currentMonthTxs: Transaction[] = [
        { id: '1', type: 'expense', amountMinor: 15000, categoryId: 'c1', date: '2026-03-01', createdAt: '', updatedAt: '' },
        { id: '2', type: 'expense', amountMinor: 5000, categoryId: 'c2', date: '2026-03-05', createdAt: '', updatedAt: '' },
      ];

      const prevMonthTxs: Transaction[] = [
        { id: '3', type: 'expense', amountMinor: 10000, categoryId: 'c1', date: '2026-02-01', createdAt: '', updatedAt: '' },
        { id: '4', type: 'expense', amountMinor: 20000, categoryId: 'c3', date: '2026-02-05', createdAt: '', updatedAt: '' },
      ];

      const comparison = getCategoryComparison(currentMonthTxs, prevMonthTxs, categories);
      expect(comparison).toHaveLength(3);

      // c1: 15000 vs 10000 (+5000, +50%)
      const c1Item = comparison.find(c => c.categoryId === 'c1')!;
      expect(c1Item.currentMinor).toBe(15000);
      expect(c1Item.previousMinor).toBe(10000);
      expect(c1Item.diffMinor).toBe(5000);
      expect(c1Item.diffPercentage).toBe(50);
      expect(c1Item.isNew).toBe(false);

      // c2: 5000 vs 0 (new)
      const c2Item = comparison.find(c => c.categoryId === 'c2')!;
      expect(c2Item.currentMinor).toBe(5000);
      expect(c2Item.previousMinor).toBe(0);
      expect(c2Item.diffMinor).toBe(5000);
      expect(c2Item.isNew).toBe(true);
      expect(c2Item.diffPercentage).toBeNull();

      // c3: 0 vs 20000 (-20000, -100%)
      const c3Item = comparison.find(c => c.categoryId === 'c3')!;
      expect(c3Item.currentMinor).toBe(0);
      expect(c3Item.previousMinor).toBe(20000);
      expect(c3Item.diffMinor).toBe(-20000);
      expect(c3Item.diffPercentage).toBe(-100);
      expect(c3Item.isNew).toBe(false);
    });

    it('should return empty array if both months have no expenses', () => {
      expect(getCategoryComparison([], [], categories)).toEqual([]);
    });
  });

  describe('getTopExpenses', () => {
    const categories: Category[] = [
      { id: 'c1', name: 'Mâncare', type: 'expense', icon: '🍔', color: '#f87171', isArchived: false, createdAt: '' },
      { id: 'c2', name: 'Transport', type: 'expense', icon: '🚗', color: '#fbbf24', isArchived: false, createdAt: '' },
    ];

    it('should return top expenses ordered by amount descending', () => {
      const txs: Transaction[] = [
        { id: '1', type: 'expense', amountMinor: 2000, categoryId: 'c1', date: '2026-03-01', createdAt: '', updatedAt: '', note: 'Prânz' },
        { id: '2', type: 'income', amountMinor: 50000, categoryId: 'c1', date: '2026-03-01', createdAt: '', updatedAt: '' },
        { id: '3', type: 'expense', amountMinor: 8000, categoryId: 'c2', date: '2026-03-02', createdAt: '', updatedAt: '', note: 'Benzină' },
        { id: '4', type: 'expense', amountMinor: 4000, categoryId: 'c1', date: '2026-03-03', createdAt: '', updatedAt: '', note: 'Cumpărături' },
        { id: '5', type: 'expense', amountMinor: 1000, categoryId: 'c1', date: '2026-03-04', createdAt: '', updatedAt: '' },
        { id: '6', type: 'expense', amountMinor: 3000, categoryId: 'c2', date: '2026-03-05', createdAt: '', updatedAt: '' },
        { id: '7', type: 'expense', amountMinor: 500, categoryId: 'c1', date: '2026-03-06', createdAt: '', updatedAt: '' },
      ];

      const top = getTopExpenses(txs, categories, 5);
      expect(top).toHaveLength(5);
      expect(top[0].id).toBe('3'); // 8000
      expect(top[0].categoryName).toBe('Transport');
      expect(top[1].id).toBe('4'); // 4000
      expect(top[2].id).toBe('6'); // 3000
      expect(top[3].id).toBe('1'); // 2000
      expect(top[4].id).toBe('5'); // 1000
    });
  });

  describe('filterAndSortTransactionsForTable', () => {
    const categories: Category[] = [
      { id: 'c1', name: 'Mâncare', type: 'expense', icon: '🍔', color: '#f87171', isArchived: false, createdAt: '' },
      { id: 'c2', name: 'Salariu', type: 'income', icon: '💰', color: '#4ade80', isArchived: false, createdAt: '' },
    ];

    const txs: Transaction[] = [
      { id: '1', type: 'expense', amountMinor: 1000, categoryId: 'c1', date: '2026-03-01', createdAt: '2026-03-01T10:00:00Z', updatedAt: '', note: 'Cafea' },
      { id: '2', type: 'income', amountMinor: 500000, categoryId: 'c2', date: '2026-03-05', createdAt: '2026-03-05T10:00:00Z', updatedAt: '', note: 'Salariu luna' },
      { id: '3', type: 'expense', amountMinor: 3000, categoryId: 'c1', date: '2026-03-10', createdAt: '2026-03-10T10:00:00Z', updatedAt: '', note: 'Pizza' },
    ];

    it('should filter by date range', () => {
      const result = filterAndSortTransactionsForTable(
        txs,
        categories,
        { startDate: '2026-03-02', endDate: '2026-03-08' },
        { field: 'date', order: 'asc' }
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('should filter by category and type', () => {
      const result = filterAndSortTransactionsForTable(
        txs,
        categories,
        { categoryId: 'c1', type: 'expense' },
        { field: 'date', order: 'asc' }
      );
      expect(result).toHaveLength(2);
      expect(result.every(r => r.categoryId === 'c1')).toBe(true);
    });

    it('should sort by amount descending', () => {
      const result = filterAndSortTransactionsForTable(
        txs,
        categories,
        {},
        { field: 'amount', order: 'desc' }
      );
      expect(result[0].id).toBe('2'); // 500000
      expect(result[1].id).toBe('3'); // 3000
      expect(result[2].id).toBe('1'); // 1000
    });

    it('should sort by date descending', () => {
      const result = filterAndSortTransactionsForTable(
        txs,
        categories,
        {},
        { field: 'date', order: 'desc' }
      );
      expect(result[0].id).toBe('3'); // 2026-03-10
      expect(result[1].id).toBe('2'); // 2026-03-05
      expect(result[2].id).toBe('1'); // 2026-03-01
    });
  });
});

