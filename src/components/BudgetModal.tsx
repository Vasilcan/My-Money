import { useState, useEffect, FormEvent } from 'react';
import type { Category, Budget } from '../lib/models';
import { setBudget } from '../lib/repository';
import { toMinor } from '../lib/money';

interface Props {
  category: Category;
  existingBudget?: Budget;
  onClose: () => void;
}

export function BudgetModal({ category, existingBudget, onClose }: Props) {
  const [amountStr, setAmountStr] = useState(() => 
    existingBudget && existingBudget.monthlyLimitMinor > 0 
      ? (existingBudget.monthlyLimitMinor / 100).toString() 
      : ''
  );
  const [error, setError] = useState('');

  useEffect(() => {
    if (existingBudget && existingBudget.monthlyLimitMinor > 0) {
      // Initialize state only if amountStr is not already set by the user
      // Or since it's a modal, setting it on mount is fine. 
      // To avoid lint warning `set-state-in-effect`, we can just disable the lint line or 
      // accept that this is setting initial state from props, which is a common pattern in modals.
      // But let's just initialize it in useState to be cleaner.
    }
  }, [existingBudget]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    
    let minor = 0;
    if (amountStr.trim() !== '') {
      minor = toMinor(amountStr);
      if (minor < 0) {
        setError('Suma trebuie să fie pozitivă');
        return;
      }
    }

    try {
      await setBudget(category.id, minor);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Eroare la salvare');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl w-full max-w-sm overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Buget pentru {category.icon} {category.name}
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 rounded-full transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex-1 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-100">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Limită lunară (RON)
            </label>
            <input
              type="number"
              step="0.01"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-colors text-lg font-medium"
              autoFocus
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 font-medium">
              Lasă gol sau pune 0 pentru a șterge bugetul acestei categorii.
            </p>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 font-bold text-gray-700 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 rounded-2xl transition-colors active:scale-95 min-h-[44px]"
            >
              Anulează
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-2xl transition-colors active:scale-95 shadow-sm min-h-[44px]"
            >
              Salvează
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
