import { useState, useMemo } from 'react';
import type { Category, Transaction, TransactionType } from '../../lib/models';
import {
  filterAndSortTransactionsForTable,
  type TableSortField,
  type TableSortOrder,
} from '../../lib/aggregations';
import { formatDateDisplay, getMonthDateRange } from '../../lib/date';
import { formatMoney, formatMoneyWithSign } from '../../lib/money';

interface Props {
  transactions: Transaction[];
  categories: Category[];
  selectedMonthIso: string;
  currency?: string;
  onEditTransaction?: (tx: Transaction) => void;
}

export function AnalysisTransactionsTable({
  transactions,
  categories,
  selectedMonthIso,
  currency = 'RON',
  onEditTransaction,
}: Props) {
  const initialRange = useMemo(() => getMonthDateRange(selectedMonthIso), [selectedMonthIso]);

  const [startDate, setStartDate] = useState(initialRange.startDate);
  const [endDate, setEndDate] = useState(initialRange.endDate);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'all'>('all');

  const [sortField, setSortField] = useState<TableSortField>('date');
  const [sortOrder, setSortOrder] = useState<TableSortOrder>('desc');

  // Handle column header click for sorting
  const handleSort = (field: TableSortField) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleResetToMonth = () => {
    const range = getMonthDateRange(selectedMonthIso);
    setStartDate(range.startDate);
    setEndDate(range.endDate);
    setCategoryFilter('all');
    setTypeFilter('all');
  };

  const handleResetToAll = () => {
    setStartDate('');
    setEndDate('');
    setCategoryFilter('all');
    setTypeFilter('all');
  };

  const filteredItems = useMemo(() => {
    return filterAndSortTransactionsForTable(
      transactions,
      categories,
      {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        categoryId: categoryFilter,
        type: typeFilter,
      },
      { field: sortField, order: sortOrder }
    );
  }, [transactions, categories, startDate, endDate, categoryFilter, typeFilter, sortField, sortOrder]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const item of filteredItems) {
      if (item.type === 'income') {
        income += item.amountMinor;
      } else {
        expense += item.amountMinor;
      }
    }
    return { income, expense, balance: income - expense };
  }, [filteredItems]);

  const renderSortIndicator = (field: TableSortField) => {
    if (sortField !== field) {
      return (
        <span className="text-gray-300 ml-1 inline-block opacity-0 group-hover:opacity-100 transition-opacity">
          ↕
        </span>
      );
    }
    return (
      <span className="text-emerald-600 ml-1 inline-block font-bold">
        {sortOrder === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      {/* Table Header & Controls */}
      <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-700 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Tabel complet tranzacții</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
              Filtrează și sortează toate tranzacțiile pentru analiza detaliată
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetToMonth}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Luna selectată
            </button>
            <button
              type="button"
              onClick={handleResetToAll}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Toate tranzacțiile
            </button>
          </div>
        </div>

        {/* Filters bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          {/* Start Date */}
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              De la
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 text-xs font-medium rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Până la
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 text-xs font-medium rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Categorie
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 text-xs font-medium rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="all">Toate categoriile</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.icon} {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">
              Tip
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TransactionType | 'all')}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-800 text-xs font-medium rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            >
              <option value="all">Toate tipurile</option>
              <option value="expense">Cheltuieli</option>
              <option value="income">Venituri</option>
            </select>
          </div>
        </div>

        {/* Stats summary bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-300 font-medium">
          <div>
            Afișate: <strong className="text-gray-900 dark:text-white">{filteredItems.length}</strong> tranzacții
          </div>
          <div className="flex items-center gap-4">
            <span className="text-emerald-700">
              Venituri: <strong>+{formatMoney(totals.income, currency)}</strong>
            </span>
            <span className="text-red-700">
              Cheltuieli: <strong>-{formatMoney(totals.expense, currency)}</strong>
            </span>
            <span className="text-gray-900 dark:text-white">
              Sold: <strong>{totals.balance >= 0 ? '+' : ''}{formatMoney(totals.balance, currency)}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Table Element */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs sm:text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900/75 border-b border-gray-100 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold uppercase tracking-wider text-[11px]">
              <th
                role="button"
                tabIndex={0}
                onClick={() => handleSort('date')}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSort('date'); }}
                className="py-3 px-4 cursor-pointer select-none hover:bg-gray-100 dark:bg-gray-700/80 transition-colors group focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700/80"
              >
                Dată {renderSortIndicator('date')}
              </th>
              <th
                role="button"
                tabIndex={0}
                onClick={() => handleSort('category')}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSort('category'); }}
                className="py-3 px-4 cursor-pointer select-none hover:bg-gray-100 dark:bg-gray-700/80 transition-colors group focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700/80"
              >
                Categorie {renderSortIndicator('category')}
              </th>
              <th
                role="button"
                tabIndex={0}
                onClick={() => handleSort('note')}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSort('note'); }}
                className="py-3 px-4 cursor-pointer select-none hover:bg-gray-100 dark:bg-gray-700/80 transition-colors group focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700/80"
              >
                Descriere {renderSortIndicator('note')}
              </th>
              <th
                role="button"
                tabIndex={0}
                onClick={() => handleSort('type')}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSort('type'); }}
                className="py-3 px-4 cursor-pointer select-none hover:bg-gray-100 dark:bg-gray-700/80 transition-colors group focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700/80"
              >
                Tip {renderSortIndicator('type')}
              </th>
              <th
                role="button"
                tabIndex={0}
                onClick={() => handleSort('amount')}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleSort('amount'); }}
                className="py-3 px-4 text-right cursor-pointer select-none hover:bg-gray-100 dark:bg-gray-700/80 transition-colors group focus:outline-none focus:bg-gray-100 dark:focus:bg-gray-700/80"
              >
                Sumă {renderSortIndicator('amount')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-gray-800">
            {filteredItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-12 text-center text-gray-500 dark:text-gray-400 font-medium">
                  <div className="text-3xl mb-2">🔍</div>
                  Nicio tranzacție găsită pentru filtrele selectate.
                </td>
              </tr>
            ) : (
              filteredItems.map((tx) => (
                <tr
                  key={tx.id}
                  onClick={() => onEditTransaction?.(tx)}
                  className={`hover:bg-gray-50 dark:bg-gray-900/80 transition-colors ${
                    onEditTransaction ? 'cursor-pointer' : ''
                  }`}
                >
                  <td className="py-3 px-4 font-medium whitespace-nowrap text-gray-600 dark:text-gray-300">
                    {formatDateDisplay(tx.date)}
                  </td>
                  <td className="py-3 px-4 font-semibold whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                        style={{ backgroundColor: `${tx.categoryColor}20` }}
                      >
                        {tx.categoryIcon}
                      </div>
                      <span>{tx.categoryName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-500 dark:text-gray-400 max-w-xs truncate font-normal">
                    {tx.note || <span className="text-gray-300">-</span>}
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold ${
                        tx.type === 'income'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-red-50 text-red-700'
                      }`}
                    >
                      {tx.type === 'income' ? 'Venit' : 'Cheltuială'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-extrabold whitespace-nowrap">
                    <span className={tx.type === 'income' ? 'text-emerald-600' : 'text-gray-900 dark:text-white'}>
                      {formatMoneyWithSign(tx.amountMinor, tx.type, currency)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
