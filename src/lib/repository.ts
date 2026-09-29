import { db } from './db';
import type { Category, Transaction, Budget, Settings, TransactionType } from './models';

// Helpers
function isValidDateString(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime()) && date.toISOString().startsWith(dateStr);
}

// Transactions
export async function addTransaction(data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>): Promise<Transaction> {
  if (data.amountMinor <= 0) {
    throw new Error('Amount must be greater than 0');
  }
  if (!Number.isInteger(data.amountMinor)) {
    throw new Error('Amount must be an integer');
  }
  if (!isValidDateString(data.date)) {
    throw new Error('Invalid date format. Expected YYYY-MM-DD');
  }

  const category = await db.categories.get(data.categoryId);
  if (!category) {
    throw new Error('Category does not exist');
  }
  if (category.type !== data.type) {
    throw new Error('Transaction type does not match category type');
  }

  const now = new Date().toISOString();
  const transaction: Transaction = {
    ...data,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  };

  await db.transactions.add(transaction);
  return transaction;
}

export async function updateTransaction(id: string, data: Partial<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Transaction> {
  const existing = await db.transactions.get(id);
  if (!existing) {
    throw new Error('Transaction not found');
  }

  if (data.amountMinor !== undefined) {
    if (data.amountMinor <= 0) throw new Error('Amount must be greater than 0');
    if (!Number.isInteger(data.amountMinor)) throw new Error('Amount must be an integer');
  }
  
  if (data.date !== undefined && !isValidDateString(data.date)) {
    throw new Error('Invalid date format. Expected YYYY-MM-DD');
  }

  let finalCategoryId = existing.categoryId;
  if (data.categoryId !== undefined) {
    finalCategoryId = data.categoryId;
  }
  
  let finalType = existing.type;
  if (data.type !== undefined) {
    finalType = data.type;
  }

  if (data.categoryId !== undefined || data.type !== undefined) {
    const category = await db.categories.get(finalCategoryId);
    if (!category) {
      throw new Error('Category does not exist');
    }
    if (category.type !== finalType) {
      throw new Error('Transaction type does not match category type');
    }
  }

  const updated: Transaction = {
    ...existing,
    ...data,
    updatedAt: new Date().toISOString(),
  };

  await db.transactions.put(updated);
  return updated;
}

export async function deleteTransaction(id: string): Promise<void> {
  await db.transactions.delete(id);
}

export async function getTransactionsByMonth(year: number, month: number): Promise<Transaction[]> {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

  return await db.transactions
    .where('date')
    .between(startDate, endDate, true, false)
    .toArray();
}

export async function getTransactionsFiltered(filters: { month?: string, categoryId?: string, type?: TransactionType }): Promise<Transaction[]> {
  let collection = db.transactions.toCollection();

  if (filters.month) {
    // format YYYY-MM
    const startDate = `${filters.month}-01`;
    const [yearStr, monthStr] = filters.month.split('-');
    let year = parseInt(yearStr, 10);
    let month = parseInt(monthStr, 10);
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const endDate = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
    
    collection = db.transactions.where('date').between(startDate, endDate, true, false);
  }

  if (filters.categoryId) {
    if (filters.month) {
      // already filtered by date, we can filter JS side or use index intersection (Dexie doesn't natively do multi-index well without a custom index).
      // Since it's local, filtering on collection is fine.
      collection = collection.filter(t => t.categoryId === filters.categoryId);
    } else {
      collection = db.transactions.where('categoryId').equals(filters.categoryId);
    }
  }

  if (filters.type) {
    collection = collection.filter(t => t.type === filters.type);
  }

  return await collection.toArray();
}


// Categories
export async function addCategory(data: Omit<Category, 'id' | 'createdAt' | 'isArchived'>): Promise<Category> {
  const trimmedName = data.name ? data.name.trim() : '';
  if (!trimmedName) {
    throw new Error('Category name cannot be empty');
  }

  const existing = await db.categories.where('type').equals(data.type).toArray();
  const isDuplicate = existing.some(
    c => c.name.trim().toLowerCase() === trimmedName.toLowerCase()
  );
  if (isDuplicate) {
    throw new Error('A category with this name already exists for this type');
  }

  const category: Category = {
    ...data,
    name: trimmedName,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    isArchived: false,
  };
  await db.categories.add(category);
  return category;
}

export async function updateCategory(id: string, data: Partial<Omit<Category, 'id' | 'createdAt'>>): Promise<Category> {
  const existing = await db.categories.get(id);
  if (!existing) throw new Error('Category not found');

  let trimmedName = existing.name;
  if (data.name !== undefined) {
    trimmedName = data.name.trim();
    if (!trimmedName) throw new Error('Category name cannot be empty');
  }

  const targetType = data.type ?? existing.type;
  if (data.name !== undefined || data.type !== undefined) {
    const existingInType = await db.categories.where('type').equals(targetType).toArray();
    const isDuplicate = existingInType.some(
      c => c.id !== id && c.name.trim().toLowerCase() === trimmedName.toLowerCase()
    );
    if (isDuplicate) {
      throw new Error('A category with this name already exists for this type');
    }
  }

  const updated: Category = {
    ...existing,
    ...data,
    name: trimmedName,
  };
  await db.categories.put(updated);
  return updated;
}

export async function archiveCategory(id: string): Promise<Category> {
  return await updateCategory(id, { isArchived: true });
}

export async function restoreCategory(id: string): Promise<Category> {
  return await updateCategory(id, { isArchived: false });
}

export async function getCategoryTransactionCount(id: string): Promise<number> {
  return await db.transactions.where('categoryId').equals(id).count();
}

export async function deleteCategoryPermanently(id: string): Promise<void> {
  const count = await getCategoryTransactionCount(id);
  if (count > 0) {
    throw new Error('Cannot delete category with associated transactions');
  }
  await db.budgets.where('categoryId').equals(id).delete();
  await db.categories.delete(id);
}

export async function deleteCategory(id: string): Promise<void> {
  const count = await db.transactions.where('categoryId').equals(id).count();
  if (count > 0) {
    await updateCategory(id, { isArchived: true });
  } else {
    await db.categories.delete(id);
  }
}

export async function getCategories(includeArchived = false): Promise<Category[]> {
  if (includeArchived) {
    return await db.categories.toArray();
  }
  return await db.categories.filter(c => !c.isArchived).toArray();
}


// Budget
export async function setBudget(categoryId: string, monthlyLimitMinor: number): Promise<Budget> {
  if (monthlyLimitMinor < 0) throw new Error('Budget limit cannot be negative');
  if (!Number.isInteger(monthlyLimitMinor)) throw new Error('Budget limit must be an integer');

  const existing = await db.budgets.where('categoryId').equals(categoryId).first();
  const id = existing ? existing.id : crypto.randomUUID();
  
  const budget: Budget = {
    id,
    categoryId,
    monthlyLimitMinor
  };
  
  await db.budgets.put(budget);
  return budget;
}

export async function getBudget(categoryId: string): Promise<Budget | undefined> {
  return await db.budgets.where('categoryId').equals(categoryId).first();
}

export async function getAllBudgets(): Promise<Budget[]> {
  return await db.budgets.toArray();
}


// Settings
export async function getSettings(): Promise<Settings> {
  let settings = await db.settings.get('settings');
  if (!settings) {
    settings = {
      id: 'settings',
      currency: 'RON',
      firstDayOfMonth: 1
    };
    await db.settings.put(settings);
  }
  return settings;
}

export async function updateSettings(data: Partial<Omit<Settings, 'id'>>): Promise<Settings> {
  const current = await getSettings();
  const updated = { ...current, ...data };
  await db.settings.put(updated);
  return updated;
}
