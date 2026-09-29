export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  isArchived: boolean;
  createdAt: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amountMinor: number;
  categoryId: string;
  date: string; // YYYY-MM-DD
  note?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  categoryId: string;
  monthlyLimitMinor: number;
}

export interface Settings {
  id: string;
  currency: string;
  firstDayOfMonth: number;
  lastBackupDate?: string;
  theme?: 'system' | 'light' | 'dark';
}
