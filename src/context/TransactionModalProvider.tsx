import { useState, ReactNode } from 'react';
import type { Transaction, TransactionType } from '../lib/models';
import TransactionModal from '../components/TransactionModal';
import { TransactionModalContext } from './TransactionModalContext';

export function TransactionModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [defaultType, setDefaultType] = useState<TransactionType>('expense');

  const openAddModal = (type: TransactionType = 'expense') => {
    setEditingTransaction(null);
    setDefaultType(type);
    setIsOpen(true);
  };

  const openEditModal = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setDefaultType(transaction.type);
    setIsOpen(true);
  };

  const closeModal = () => {
    setIsOpen(false);
    setEditingTransaction(null);
  };

  return (
    <TransactionModalContext.Provider value={{ openAddModal, openEditModal, closeModal }}>
      {children}
      <TransactionModal
        isOpen={isOpen}
        onClose={closeModal}
        editingTransaction={editingTransaction}
        defaultType={defaultType}
      />
    </TransactionModalContext.Provider>
  );
}
