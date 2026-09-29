import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getTransactionsByMonth, getCategories, getSettings } from '../lib/repository';
import { groupTransactionsByDay, filterTransactions } from '../lib/aggregations';
import { formatMonthDisplay, formatDayHeader, getCurrentMonthIso, getPreviousMonth, getNextMonth } from '../lib/date';
import { formatMoney } from '../lib/money';
import { useTransactionModal } from '../context/useTransactionModal';
import type { TransactionType } from '../lib/models';

export default function TransactionsPage() {
  const { openEditModal, openAddModal } = useTransactionModal();

  const [currentMonthIso, setCurrentMonthIso] = useState(getCurrentMonthIso());
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string | 'all'>('all');

  const year = parseInt(currentMonthIso.split('-')[0], 10);
  const month = parseInt(currentMonthIso.split('-')[1], 10);

  // Fetch data
  const rawTransactions = useLiveQuery(() => getTransactionsByMonth(year, month), [year, month]);
  const rawCategories = useLiveQuery(() => getCategories(true), []); // include archived for old transactions
  const rawSettings = useLiveQuery(() => getSettings(), []);

  const transactions = rawTransactions ?? [];
  const categories = rawCategories ?? [];
  const currency = rawSettings?.currency || 'RON';

  // Filter & Group
  const filteredTransactions = useMemo(() => {
    return filterTransactions(rawTransactions ?? [], {
      type: typeFilter !== 'all' ? typeFilter : undefined,
      categoryId: categoryFilter !== 'all' ? categoryFilter : undefined
    });
  }, [rawTransactions, typeFilter, categoryFilter]);

  const groupedTransactions = useMemo(() => {
    return groupTransactionsByDay(filteredTransactions);
  }, [filteredTransactions]);

  // Unique categories from current transactions for the filter dropdown
  const activeCategoryIds = new Set(transactions.map(t => t.categoryId));
  const availableCategoriesForFilter = categories.filter(c => activeCategoryIds.has(c.id));

  const handlePrevMonth = () => setCurrentMonthIso(prev => getPreviousMonth(prev));
  const handleNextMonth = () => setCurrentMonthIso(prev => getNextMonth(prev));

  return (
    <div className="p-4 sm:p-6 h-full flex flex-col">
      <header className="mb-4 mt-2">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-5">Tranzacții</h1>

        {/* Month Navigation */}
        <div className="flex items-center justify-between bg-white dark:bg-gray-800 px-4 py-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <button
            onClick={handlePrevMonth}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-700 active:bg-gray-200 transition-colors"
            aria-label="Luna anterioară"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-lg font-bold text-gray-800 tracking-tight capitalize">
            {formatMonthDisplay(currentMonthIso)}
          </span>
          <button
            onClick={handleNextMonth}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:bg-gray-700 active:bg-gray-200 transition-colors"
            aria-label="Luna următoare"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </header>

      {/* Filters */}
      <div className="flex gap-2 mb-5">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TransactionType | 'all')}
          className="flex-1 min-w-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 text-sm font-medium rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm appearance-none"
          style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1em' }}
        >
          <option value="all">Toate tipurile</option>
          <option value="expense">Cheltuieli</option>
          <option value="income">Venituri</option>
        </select>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="flex-1 min-w-0 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 text-sm font-medium rounded-xl px-3 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm appearance-none"
          style={{ backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1em' }}
        >
          <option value="all">Toate categoriile</option>
          {availableCategoriesForFilter.map(cat => (
            <option key={cat.id} value={cat.id}>
              {cat.icon} {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* List */}
      <div className="flex-1 pb-6 sm:pb-0">
        {groupedTransactions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-8 text-center shadow-sm mt-2">
            <div className="text-5xl mb-4 opacity-80">📭</div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 tracking-tight">Nicio tranzacție găsită</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 max-w-[200px] mx-auto font-medium leading-relaxed">
              Nu ai nicio tranzacție în această perioadă pentru filtrele selectate.
            </p>
            <button
              onClick={() => openAddModal('expense')}
              className="px-5 py-2.5 bg-emerald-50 text-emerald-700 font-semibold rounded-xl hover:bg-emerald-100 active:scale-95 transition-all"
            >
              Adaugă tranzacție
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {groupedTransactions.map(group => (
              <div key={group.date}>
                {/* Day Header */}
                <div className="flex items-center justify-between mb-2 px-2 text-sm">
                  <span className="font-bold text-gray-500 dark:text-gray-400">{formatDayHeader(group.date)}</span>
                  <span className={`font-bold ${group.totalMinor > 0 ? 'text-emerald-600' : group.totalMinor < 0 ? 'text-red-600' : 'text-gray-500 dark:text-gray-400'}`}>
                    {group.totalMinor > 0 ? '+' : ''}{formatMoney(group.totalMinor, currency)}
                  </span>
                </div>

                {/* Day Transactions */}
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                  <div className="divide-y divide-gray-50">
                    {group.transactions.map(tx => {
                      const cat = categories.find(c => c.id === tx.categoryId);
                      return (
                        <button
                          key={tx.id}
                          onClick={() => openEditModal(tx)}
                          className="w-full text-left p-3 flex items-center gap-3.5 hover:bg-gray-50 dark:bg-gray-900 active:bg-gray-100 dark:bg-gray-700 transition-colors focus:outline-none focus:bg-gray-50 dark:bg-gray-900 group"
                        >
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl shrink-0 transition-colors ${tx.type === 'expense' ? 'bg-red-50 text-red-600 group-hover:bg-red-100' : 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100'}`}>
                            {cat?.icon || '❓'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 dark:text-white truncate">
                              {cat?.name || 'Categorie ștearsă'}
                            </p>
                            {tx.note && (
                              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                {tx.note}
                              </p>
                            )}
                          </div>
                          <div className="shrink-0 text-right pl-2">
                            <p className={`font-extrabold tracking-tight ${tx.type === 'income' ? 'text-emerald-600' : 'text-gray-900 dark:text-white'}`}>
                              {tx.type === 'income' ? '+' : '-'}{formatMoney(tx.amountMinor, currency)}
                            </p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
