import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { MonthSelector } from '../components/MonthSelector';
import { BudgetModal } from '../components/BudgetModal';
import { getCurrentMonthIso, getTodayIsoString, formatDateDisplay } from '../lib/date';
import { getTransactionsFiltered, getAllBudgets, getCategories } from '../lib/repository';
import { totalByType, totalByCategory } from '../lib/aggregations';
import { calculateDailyAverageMinor, getCategoryBudgetProgress } from '../lib/budget';
import { formatMoney, formatMoneyWithSign } from '../lib/money';
import type { Category, Budget } from '../lib/models';

export default function HomePage() {
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonthIso());
  const [selectedCategoryForBudget, setSelectedCategoryForBudget] = useState<Category | null>(null);
  
  const transactions = useLiveQuery(
    () => getTransactionsFiltered({ month: currentMonth }),
    [currentMonth],
    []
  );

  const budgets = useLiveQuery(
    () => getAllBudgets(),
    [],
    []
  );

  const categories = useLiveQuery(
    () => getCategories(false),
    [],
    []
  );

  const summary = useMemo(() => {
    const income = totalByType(transactions, 'income');
    const expense = totalByType(transactions, 'expense');
    const totalBalance = income - expense;
    return { income, expense, totalBalance };
  }, [transactions]);

  const dailyAverage = useMemo(() => {
    if (!budgets || budgets.length === 0) return 0;
    
    // total budget = sum of all limits
    const totalBudgetMinor = budgets.reduce((acc, b) => acc + b.monthlyLimitMinor, 0);
    const todayIso = getTodayIsoString();
    
    return calculateDailyAverageMinor(
      totalBudgetMinor,
      summary.expense,
      currentMonth,
      todayIso
    );
  }, [budgets, summary.expense, currentMonth]);

  const budgetStats = useMemo(() => {
    if (!categories || !budgets) return [];
    
    const expensesByCategory = totalByCategory(transactions.filter(t => t.type === 'expense'));
    const expenseCategories = categories.filter(c => c.type === 'expense');
    
    return expenseCategories.map(cat => {
      const budget = budgets.find(b => b.categoryId === cat.id);
      const spentMinor = expensesByCategory[cat.id] || 0;
      
      // If no budget and no spent amount, skip it from the list
      const hasBudget = budget && budget.monthlyLimitMinor > 0;
      if (!hasBudget && spentMinor === 0) return null;
      
      const budgetMinor = budget ? budget.monthlyLimitMinor : 0;
      const progress = getCategoryBudgetProgress(spentMinor, budgetMinor);
      
      return {
        category: cat,
        budget,
        spentMinor,
        budgetMinor,
        progress
      };
    }).filter(Boolean) as Array<{
      category: Category;
      budget?: Budget;
      spentMinor: number;
      budgetMinor: number;
      progress: { percentage: number; status: 'green' | 'yellow' | 'red'; excessMinor: number; };
    }>;
  }, [categories, budgets, transactions]);

  const recentTransactions = useMemo(() => {
    return [...transactions]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 5);
  }, [transactions]);

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-24">
      <header className="flex justify-between items-center mt-2">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Salut! 👋</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Urmărește-ți cheltuielile.</p>
        </div>
      </header>

      <MonthSelector currentMonth={currentMonth} onChange={setCurrentMonth} />

      {/* Summary Card */}
      <section className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 space-y-6">
        <div>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">Sold disponibil</p>
          <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white">{formatMoney(summary.totalBalance)}</h2>
        </div>
        
        <div className="flex gap-4">
          <div className="flex-1 bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl">
            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3 text-emerald-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 4.5l-15 15m0 0h11.25m-11.25 0V8.25" />
              </svg>
              Venituri
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{formatMoney(summary.income)}</p>
          </div>
          <div className="flex-1 bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl">
            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-3 h-3 text-red-500">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 4.5l15 15m0 0V8.25m0 11.25H8.25" />
              </svg>
              Cheltuieli
            </p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{formatMoney(summary.expense)}</p>
          </div>
        </div>
      </section>

      {/* Daily average indicator */}
      {currentMonth === getCurrentMonthIso() && budgets && budgets.length > 0 && (
        <section className="bg-emerald-50 border border-emerald-100 p-4 rounded-3xl flex items-start gap-4 shadow-sm">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm text-emerald-800 font-medium">
              Poți cheltui în medie <strong className="font-extrabold">{formatMoney(dailyAverage)}/zi</strong> până la finalul lunii.
            </p>
          </div>
        </section>
      )}

      {/* Budgets List */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Bugete</h2>
        </div>
        
        {budgetStats.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-4">Nu ai niciun buget setat încă.</p>
            <button
              onClick={() => {
                const expenseCats = categories?.filter(c => c.type === 'expense') || [];
                if (expenseCats.length > 0) {
                  setSelectedCategoryForBudget(expenseCats[0]);
                }
              }}
              className="text-emerald-600 font-bold text-sm bg-emerald-50 px-4 py-2 rounded-xl"
            >
              Setează un buget
            </button>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden divide-y divide-gray-100">
            {budgetStats.map(stat => (
              <div 
                key={stat.category.id} 
                className="p-4 hover:bg-gray-50 dark:bg-gray-900 cursor-pointer transition-colors"
                onClick={() => setSelectedCategoryForBudget(stat.category)}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{stat.category.icon}</span>
                    <span className="font-bold text-gray-900 dark:text-white">{stat.category.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-900 dark:text-white">{formatMoney(stat.spentMinor)}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 font-medium ml-1">
                      / {stat.budgetMinor > 0 ? formatMoney(stat.budgetMinor) : 'Niciun buget'}
                    </span>
                  </div>
                </div>
                
                {stat.budgetMinor > 0 && (
                  <>
                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mt-3">
                      <div 
                        className={`h-full rounded-full ${
                          stat.progress.status === 'green' ? 'bg-emerald-500' : 
                          stat.progress.status === 'yellow' ? 'bg-yellow-400' : 'bg-red-500'
                        }`}
                        style={{ width: `${stat.progress.percentage}%` }}
                      ></div>
                    </div>
                    {stat.progress.status === 'red' && (
                      <p className="text-xs text-red-600 font-bold mt-2 text-right">
                        Ai depășit cu {formatMoney(stat.progress.excessMinor)}
                      </p>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Recent Transactions */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ultimele 5 tranzacții</h2>
          <Link to="/transactions" className="text-emerald-600 font-bold text-sm">Vezi toate</Link>
        </div>
        
        {recentTransactions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 text-center text-gray-500 dark:text-gray-400 text-sm font-medium">
            Nicio tranzacție luna aceasta.
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden divide-y divide-gray-100">
            {recentTransactions.map(tx => {
              const category = categories?.find(c => c.id === tx.categoryId);
              if (!category) return null;
              
              return (
                <div key={tx.id} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: `${category.color}20`, color: category.color }}>
                      {category.icon}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 dark:text-white">{category.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {formatDateDisplay(tx.date)} {tx.note && `• ${tx.note}`}
                      </p>
                    </div>
                  </div>
                  <span className={`font-extrabold ${tx.type === 'income' ? 'text-emerald-600' : 'text-gray-900 dark:text-white'}`}>
                    {formatMoneyWithSign(tx.amountMinor, tx.type)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {selectedCategoryForBudget && (
        <BudgetModal
          category={selectedCategoryForBudget}
          existingBudget={budgets?.find(b => b.categoryId === selectedCategoryForBudget.id)}
          onClose={() => setSelectedCategoryForBudget(null)}
        />
      )}
    </div>
  );
}
