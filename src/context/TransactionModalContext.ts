import { createContext } from 'react';
import type { Transaction, TransactionType } from '../lib/models';

export interface TransactionModalContextType {
  openAddModal: (type?: TransactionType) => void;
  openEditModal: (transaction: Transaction) => void;
  closeModal: () => void;
}

export const TransactionModalContext = createContext<TransactionModalContextType | undefined>(undefined);
