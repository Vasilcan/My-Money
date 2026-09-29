import { describe, it, expect } from 'vitest';
import { totalByType, totalByCategory, balance, groupTransactionsByDay, filterTransactions } from './aggregations';
import type { Transaction } from './models';

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
});

