import { useContext } from 'react';
import { TransactionModalContext, type TransactionModalContextType } from './TransactionModalContext';

export function useTransactionModal(): TransactionModalContextType {
  const context = useContext(TransactionModalContext);
  if (!context) {
    throw new Error('useTransactionModal must be used within a TransactionModalProvider');
  }
  return context;
}
