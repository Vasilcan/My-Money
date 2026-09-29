import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { getAllTransactions, getCategories, getSettings } from '../lib/repository';
import {
  getCategoryExpenseBreakdown,
  getCategoryComparison,
  getTopExpenses,
  totalByType,
} from '../lib/aggregations';
import { getCurrentMonthIso, getPreviousMonth } from '../lib/date';
import { formatMoney } from '../lib/money';
import { useTransactionModal } from '../context/useTransactionModal';
import { MonthSelector } from '../components/MonthSelector';
import { CategoryDonutChart } from '../components/analysis/CategoryDonutChart';
import { EvolutionBarChart } from '../components/analysis/EvolutionBarChart';
import { MonthComparisonCard } from '../components/analysis/MonthComparisonCard';
import { TopExpensesCard } from '../components/analysis/TopExpensesCard';
import { AnalysisTransactionsTable } from '../components/analysis/AnalysisTransactionsTable';

export default function AnalysisPage() {
  const { openEditModal } = useTransactionModal();
  const [selectedMonthIso, setSelectedMonthIso] = useState(getCurrentMonthIso());

  const allTransactions = useLiveQuery(() => getAllTransactions(), [], []);
  const categories = useLiveQuery(() => getCategories(true), [], []);
  const settings = useLiveQuery(() => getSettings(), []);

  const currency = settings?.currency || 'RON';

  const previousMonthIso = useMemo(
    () => getPreviousMonth(selectedMonthIso),
    [selectedMonthIso]
  );

  const currentMonthTransactions = useMemo(
    () => allTransactions.filter(t => t.date.startsWith(selectedMonthIso)),
    [allTransactions, selectedMonthIso]
  );

  const previousMonthTransactions = useMemo(
    () => allTransactions.filter(t => t.date.startsWith(previousMonthIso)),
    [allTransactions, previousMonthIso]
  );

  // Aggregations
  const categoryExpenseData = useMemo(
    () => getCategoryExpenseBreakdown(currentMonthTransactions, categories),
    [currentMonthTransactions, categories]
  );

  const categoryComparisonData = useMemo(
    () => getCategoryComparison(currentMonthTransactions, previousMonthTransactions, categories),
    [currentMonthTransactions, previousMonthTransactions, categories]
  );

  const topExpensesData = useMemo(
    () => getTopExpenses(currentMonthTransactions, categories, 5),
    [currentMonthTransactions, categories]
  );

  const summary = useMemo(() => {
    const income = totalByType(currentMonthTransactions, 'income');
    const expense = totalByType(currentMonthTransactions, 'expense');
    const balance = income - expense;
    const savingsRate = income > 0 ? Math.max(0, Math.round(((income - expense) / income) * 100)) : 0;
    return { income, expense, balance, savingsRate };
  }, [currentMonthTransactions]);

  const handleSelectExpense = (id: string) => {
    const tx = allTransactions.find(t => t.id === id);
    if (tx) {
      openEditModal(tx);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-24 lg:pb-12 max-w-full">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-2">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Analiză</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium text-sm sm:text-base">
            Tipare și tendințe financiare pentru venituri și cheltuieli.
          </p>
        </div>
      </header>

      {/* Month Navigation */}
      <div className="max-w-md">
        <MonthSelector currentMonth={selectedMonthIso} onChange={setSelectedMonthIso} />
      </div>

      {/* Quick Summary Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-1">
            Venituri lunare
          </p>
          <p className="text-lg sm:text-2xl font-extrabold text-emerald-600">
            {formatMoney(summary.income, currency)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-1">
            Cheltuieli lunare
          </p>
          <p className="text-lg sm:text-2xl font-extrabold text-gray-900 dark:text-white">
            {formatMoney(summary.expense, currency)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-1">
            Sold net
          </p>
          <p
            className={`text-lg sm:text-2xl font-extrabold ${
              summary.balance >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}
          >
            {summary.balance >= 0 ? '+' : ''}
            {formatMoney(summary.balance, currency)}
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-1">
            Rată economisire
          </p>
          <p className="text-lg sm:text-2xl font-extrabold text-emerald-600">
            {summary.savingsRate}%
          </p>
        </div>
      </section>

      {/* Main Charts & Analysis Grid:
          - On mobile: 1 column, stacked vertically, smooth scroll, no horizontal scroll.
          - On desktop (>=1024px): 2 columns grid. */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* 1. Category Expense Donut Chart */}
        <div className="min-w-0 w-full">
          <CategoryDonutChart data={categoryExpenseData} currency={currency} />
        </div>

        {/* 2. Evolution Income vs Expense Bar Chart */}
        <div className="min-w-0 w-full">
          <EvolutionBarChart
            transactions={allTransactions}
            selectedMonthIso={selectedMonthIso}
            currency={currency}
          />
        </div>

        {/* 3. Category Comparison with Previous Month */}
        <div className="min-w-0 w-full">
          <MonthComparisonCard
            comparison={categoryComparisonData}
            previousMonthIso={previousMonthIso}
            currency={currency}
          />
        </div>

        {/* 4. Top 5 Expenses of the Month */}
        <div className="min-w-0 w-full">
          <TopExpensesCard
            topExpenses={topExpensesData}
            currency={currency}
            onSelectExpense={handleSelectExpense}
          />
        </div>
      </section>

      {/* Complete Transactions Table:
          - Visible on wide screens (>=1024px) under the charts
          - Sortable columns, date range filter, category filter, type filter */}
      <section className="hidden lg:block pt-2">
        <AnalysisTransactionsTable
          key={selectedMonthIso}
          transactions={allTransactions}
          categories={categories}
          selectedMonthIso={selectedMonthIso}
          currency={currency}
          onEditTransaction={openEditModal}
        />
      </section>
    </div>
  );
}
