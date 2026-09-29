import Dexie, { type Table } from 'dexie';
import type { Category, Transaction, Budget, Settings } from './models';

export class FinanceDatabase extends Dexie {
  categories!: Table<Category, string>;
  transactions!: Table<Transaction, string>;
  budgets!: Table<Budget, string>;
  settings!: Table<Settings, string>;

  constructor() {
    super('FinanceDB');
    
    this.version(1).stores({
      categories: 'id, type',
      transactions: 'id, date, categoryId, type',
      budgets: 'id, categoryId',
      settings: 'id'
    });

    this.on('populate', () => {
      // populateInitialData must not be async in the event handler directly if we don't handle promises correctly,
      // but dexie's populate event supports returning a promise.
      return this.populateInitialData();
    });
  }

  private async populateInitialData() {
    const now = new Date().toISOString();
    
    const defaultCategories: Category[] = [
      { id: crypto.randomUUID(), name: 'Mâncare', type: 'expense', icon: '🍔', color: '#f87171', isArchived: false, createdAt: now },
      { id: crypto.randomUUID(), name: 'Chirie/Utilități', type: 'expense', icon: '🏠', color: '#60a5fa', isArchived: false, createdAt: now },
      { id: crypto.randomUUID(), name: 'Transport', type: 'expense', icon: '🚗', color: '#fbbf24', isArchived: false, createdAt: now },
      { id: crypto.randomUUID(), name: 'Sănătate', type: 'expense', icon: '💊', color: '#34d399', isArchived: false, createdAt: now },
      { id: crypto.randomUUID(), name: 'Distracție', type: 'expense', icon: '🎉', color: '#a78bfa', isArchived: false, createdAt: now },
      { id: crypto.randomUUID(), name: 'Cumpărături', type: 'expense', icon: '🛍️', color: '#f472b6', isArchived: false, createdAt: now },
      { id: crypto.randomUUID(), name: 'Abonamente', type: 'expense', icon: '📺', color: '#38bdf8', isArchived: false, createdAt: now },
      { id: crypto.randomUUID(), name: 'Altele', type: 'expense', icon: '📦', color: '#9ca3af', isArchived: false, createdAt: now },
      
      { id: crypto.randomUUID(), name: 'Salariu', type: 'income', icon: '💰', color: '#4ade80', isArchived: false, createdAt: now },
      { id: crypto.randomUUID(), name: 'Bonusuri', type: 'income', icon: '🎁', color: '#fb923c', isArchived: false, createdAt: now },
      { id: crypto.randomUUID(), name: 'Altele', type: 'income', icon: '💵', color: '#9ca3af', isArchived: false, createdAt: now },
    ];

    await this.categories.bulkAdd(defaultCategories);
    
    await this.settings.add({
      id: 'settings',
      currency: 'RON',
      firstDayOfMonth: 1
    });
  }
}

export const db = new FinanceDatabase();
