import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './db';
import { 
  addTransaction, updateTransaction, deleteTransaction, 
  getTransactionsByMonth, getTransactionsFiltered,
  addCategory, updateCategory, deleteCategory, getCategories,
  archiveCategory, restoreCategory, getCategoryTransactionCount, deleteCategoryPermanently,
  setBudget, getBudget,
  getSettings, updateSettings
} from './repository';

describe('Repository', () => {
  beforeEach(async () => {
    // Clear and re-initialize the DB before each test
    await db.delete();
    await db.open();
  });

  describe('Transactions', () => {
    it('should add a transaction with valid data', async () => {
      const categories = await getCategories(true);
      const expenseCategory = categories.find(c => c.type === 'expense');
      expect(expenseCategory).toBeDefined();

      const tx = await addTransaction({
        type: 'expense',
        amountMinor: 1500,
        categoryId: expenseCategory!.id,
        date: '2023-10-15',
        note: 'Test expense'
      });

      expect(tx.id).toBeDefined();
      expect(tx.amountMinor).toBe(1500);
      expect(tx.createdAt).toBeDefined();
      
      const savedTx = await db.transactions.get(tx.id);
      expect(savedTx).toEqual(tx);
    });

    it('should throw error on zero or negative amount', async () => {
      const categories = await getCategories(true);
      const expenseCategory = categories.find(c => c.type === 'expense');
      
      await expect(addTransaction({
        type: 'expense',
        amountMinor: 0,
        categoryId: expenseCategory!.id,
        date: '2023-10-15'
      })).rejects.toThrow('Amount must be greater than 0');

      await expect(addTransaction({
        type: 'expense',
        amountMinor: -100,
        categoryId: expenseCategory!.id,
        date: '2023-10-15'
      })).rejects.toThrow('Amount must be greater than 0');
    });

    it('should throw error on non-integer amount', async () => {
      const categories = await getCategories(true);
      const expenseCategory = categories.find(c => c.type === 'expense');
      
      await expect(addTransaction({
        type: 'expense',
        amountMinor: 10.5,
        categoryId: expenseCategory!.id,
        date: '2023-10-15'
      })).rejects.toThrow('Amount must be an integer');
    });

    it('should throw error on invalid date format', async () => {
      const categories = await getCategories(true);
      const expenseCategory = categories.find(c => c.type === 'expense');
      
      await expect(addTransaction({
        type: 'expense',
        amountMinor: 100,
        categoryId: expenseCategory!.id,
        date: '2023/10/15'
      })).rejects.toThrow('Invalid date format');
    });

    it('should throw error on mismatched category type', async () => {
      const categories = await getCategories(true);
      const incomeCategory = categories.find(c => c.type === 'income');
      
      await expect(addTransaction({
        type: 'expense',
        amountMinor: 100,
        categoryId: incomeCategory!.id,
        date: '2023-10-15'
      })).rejects.toThrow('Transaction type does not match category type');
    });

    it('should update a transaction', async () => {
      const categories = await getCategories(true);
      const expenseCategory = categories.find(c => c.type === 'expense');
      
      const tx = await addTransaction({
        type: 'expense',
        amountMinor: 1500,
        categoryId: expenseCategory!.id,
        date: '2023-10-15'
      });

      const updated = await updateTransaction(tx.id, { amountMinor: 2000, note: 'Updated note' });
      expect(updated.amountMinor).toBe(2000);
      expect(updated.note).toBe('Updated note');
      
      const saved = await db.transactions.get(tx.id);
      expect(saved?.amountMinor).toBe(2000);
    });

    it('should delete a transaction', async () => {
      const categories = await getCategories(true);
      const expenseCategory = categories.find(c => c.type === 'expense');
      
      const tx = await addTransaction({
        type: 'expense',
        amountMinor: 1500,
        categoryId: expenseCategory!.id,
        date: '2023-10-15'
      });

      await deleteTransaction(tx.id);
      const saved = await db.transactions.get(tx.id);
      expect(saved).toBeUndefined();
    });

    it('should get transactions by month', async () => {
      const categories = await getCategories(true);
      const expenseCategory = categories.find(c => c.type === 'expense')!;
      
      await addTransaction({ type: 'expense', amountMinor: 10, categoryId: expenseCategory.id, date: '2023-09-30' });
      const tx1 = await addTransaction({ type: 'expense', amountMinor: 20, categoryId: expenseCategory.id, date: '2023-10-01' });
      const tx2 = await addTransaction({ type: 'expense', amountMinor: 30, categoryId: expenseCategory.id, date: '2023-10-15' });
      const tx3 = await addTransaction({ type: 'expense', amountMinor: 40, categoryId: expenseCategory.id, date: '2023-10-31' });
      await addTransaction({ type: 'expense', amountMinor: 50, categoryId: expenseCategory.id, date: '2023-11-01' });

      const txs = await getTransactionsByMonth(2023, 10);
      expect(txs).toHaveLength(3);
      expect(txs.map(t => t.id).sort()).toEqual([tx1.id, tx2.id, tx3.id].sort());
    });

    it('should filter transactions', async () => {
      const categories = await getCategories(true);
      const expenseCat1 = categories.find(c => c.name === 'Mâncare')!;
      const expenseCat2 = categories.find(c => c.name === 'Transport')!;
      const incomeCat = categories.find(c => c.type === 'income')!;

      await addTransaction({ type: 'expense', amountMinor: 10, categoryId: expenseCat1.id, date: '2023-10-10' });
      await addTransaction({ type: 'expense', amountMinor: 20, categoryId: expenseCat1.id, date: '2023-11-10' });
      await addTransaction({ type: 'expense', amountMinor: 30, categoryId: expenseCat2.id, date: '2023-10-15' });
      await addTransaction({ type: 'income', amountMinor: 40, categoryId: incomeCat.id, date: '2023-10-20' });

      const filtered1 = await getTransactionsFiltered({ month: '2023-10' });
      expect(filtered1).toHaveLength(3);

      const filtered2 = await getTransactionsFiltered({ month: '2023-10', categoryId: expenseCat1.id });
      expect(filtered2).toHaveLength(1);
      expect(filtered2[0].amountMinor).toBe(10);

      const filtered3 = await getTransactionsFiltered({ type: 'expense' });
      expect(filtered3).toHaveLength(3);
    });
  });

  describe('Categories', () => {
    it('should return prepopulated categories on init', async () => {
      const categories = await getCategories();
      expect(categories.length).toBeGreaterThan(0);
      expect(categories.some(c => c.name === 'Mâncare')).toBe(true);
      expect(categories.some(c => c.name === 'Salariu')).toBe(true);
    });

    it('should add a custom category', async () => {
      const cat = await addCategory({
        name: 'Custom',
        type: 'expense',
        icon: '🚀',
        color: '#000000'
      });
      expect(cat.id).toBeDefined();
      expect(cat.createdAt).toBeDefined();
      expect(cat.isArchived).toBe(false);
      
      const saved = await db.categories.get(cat.id);
      expect(saved).toEqual(cat);
    });

    it('should archive instead of delete if category has transactions', async () => {
      const cat = await addCategory({ name: 'Test', type: 'expense', icon: '?', color: 'red' });
      await addTransaction({
        type: 'expense',
        amountMinor: 100,
        categoryId: cat.id,
        date: '2023-10-10'
      });

      await deleteCategory(cat.id);
      
      const saved = await db.categories.get(cat.id);
      expect(saved).toBeDefined();
      expect(saved?.isArchived).toBe(true);
    });

    it('should actually delete if category has no transactions', async () => {
      const cat = await addCategory({ name: 'Test Empty', type: 'expense', icon: '?', color: 'red' });
      
      await deleteCategory(cat.id);
      
      const saved = await db.categories.get(cat.id);
      expect(saved).toBeUndefined();
    });

    it('should reject empty or whitespace category name', async () => {
      await expect(addCategory({ name: '', type: 'expense', icon: '❓', color: '#000000' }))
        .rejects.toThrow('Category name cannot be empty');
      await expect(addCategory({ name: '   ', type: 'expense', icon: '❓', color: '#000000' }))
        .rejects.toThrow('Category name cannot be empty');
    });

    it('should reject duplicate category name in the same type', async () => {
      await expect(addCategory({ name: 'Mâncare', type: 'expense', icon: '🍔', color: '#000000' }))
        .rejects.toThrow('A category with this name already exists for this type');
      await expect(addCategory({ name: '  mâncare  ', type: 'expense', icon: '🍔', color: '#000000' }))
        .rejects.toThrow('A category with this name already exists for this type');
    });

    it('should allow same category name in different type', async () => {
      const cat = await addCategory({ name: 'Mâncare', type: 'income', icon: '🍔', color: '#000000' });
      expect(cat.id).toBeDefined();
    });

    it('should update a category with duplicate name validation', async () => {
      await addCategory({ name: 'Distractie 1', type: 'expense', icon: '🎉', color: '#000' });
      const cat2 = await addCategory({ name: 'Distractie 2', type: 'expense', icon: '🎈', color: '#111' });

      // Cannot update cat2 name to cat1 name
      await expect(updateCategory(cat2.id, { name: 'Distractie 1' }))
        .rejects.toThrow('A category with this name already exists for this type');

      // Successful update
      const updated = await updateCategory(cat2.id, { name: 'Party', icon: '🎊' });
      expect(updated.name).toBe('Party');
      expect(updated.icon).toBe('🎊');
    });

    it('should archive and restore a category', async () => {
      const cat = await addCategory({ name: 'De Arhivat', type: 'expense', icon: '📁', color: '#000000' });
      const archived = await archiveCategory(cat.id);
      expect(archived.isArchived).toBe(true);

      const activeCategories = await getCategories(false);
      expect(activeCategories.some(c => c.id === cat.id)).toBe(false);

      const restored = await restoreCategory(cat.id);
      expect(restored.isArchived).toBe(false);

      const activeCategoriesAfter = await getCategories(false);
      expect(activeCategoriesAfter.some(c => c.id === cat.id)).toBe(true);
    });

    it('should count category transactions and control permanent deletion', async () => {
      const cat = await addCategory({ name: 'Count Test', type: 'expense', icon: '🔢', color: '#000000' });
      expect(await getCategoryTransactionCount(cat.id)).toBe(0);

      // Permanently delete with 0 transactions
      await deleteCategoryPermanently(cat.id);
      expect(await db.categories.get(cat.id)).toBeUndefined();

      // Category with transactions cannot be deleted permanently
      const catWithTx = await addCategory({ name: 'Has Tx', type: 'expense', icon: '💸', color: '#000000' });
      await addTransaction({
        type: 'expense',
        amountMinor: 500,
        categoryId: catWithTx.id,
        date: '2026-03-29',
      });
      expect(await getCategoryTransactionCount(catWithTx.id)).toBe(1);

      await expect(deleteCategoryPermanently(catWithTx.id))
        .rejects.toThrow('Cannot delete category with associated transactions');
    });
  });

  describe('Budgets and Settings', () => {
    it('should manage budgets', async () => {
      const catId = 'dummy-cat-id';
      const b1 = await setBudget(catId, 50000);
      expect(b1.categoryId).toBe(catId);
      expect(b1.monthlyLimitMinor).toBe(50000);

      const b2 = await getBudget(catId);
      expect(b2).toEqual(b1);

      await setBudget(catId, 60000);
      const b3 = await getBudget(catId);
      expect(b3?.monthlyLimitMinor).toBe(60000);
    });

    it('should get default settings and update them', async () => {
      const defaultSettings = await getSettings();
      expect(defaultSettings.currency).toBe('RON');
      expect(defaultSettings.firstDayOfMonth).toBe(1);

      const updated = await updateSettings({ firstDayOfMonth: 5 });
      expect(updated.firstDayOfMonth).toBe(5);
      expect(updated.currency).toBe('RON');

      const saved = await getSettings();
      expect(saved).toEqual(updated);
    });
  });
});
