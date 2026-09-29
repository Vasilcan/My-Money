import type { TopExpenseItem } from '../../lib/aggregations';
import { formatMoney } from '../../lib/money';
import { formatDateDisplay } from '../../lib/date';

interface Props {
  topExpenses: TopExpenseItem[];
  currency?: string;
  onSelectExpense?: (id: string) => void;
}

export function TopExpensesCard({
  topExpenses,
  currency = 'RON',
  onSelectExpense,
}: Props) {
  if (topExpenses.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center h-80">
        <div className="w-14 h-14 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center text-2xl mb-3 text-gray-400">
          💸
        </div>
        <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">Top 5 cheltuieli</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs font-medium">
          Nicio cheltuială înregistrată în această lună.
        </p>
      </div>
    );
  }

  const rankBadges = [
    'bg-amber-100 text-amber-800 border-amber-300',
    'bg-slate-200 text-slate-800 border-slate-300',
    'bg-amber-50 text-amber-900 border-amber-200',
    'bg-gray-100 dark:bg-gray-700 text-gray-700 border-gray-200 dark:border-gray-700',
    'bg-gray-100 dark:bg-gray-700 text-gray-700 border-gray-200 dark:border-gray-700',
  ];

  return (
    <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between">
      <div className="mb-4">
        <h3 className="font-bold text-gray-900 dark:text-white text-lg">Top 5 cheltuieli ale lunii</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          Cele mai mari plăți din perioada selectată
        </p>
      </div>

      <div className="space-y-2.5 divide-y divide-gray-50">
        {topExpenses.map((expense, idx) => (
          <div
            key={expense.id}
            onClick={() => onSelectExpense?.(expense.id)}
            className={`pt-2.5 first:pt-0 flex items-center justify-between gap-3 p-2 rounded-2xl transition-colors ${
              onSelectExpense ? 'cursor-pointer hover:bg-gray-50 dark:bg-gray-900' : ''
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`w-6 h-6 rounded-lg text-xs font-extrabold flex items-center justify-center border shrink-0 ${
                  rankBadges[idx] || 'bg-gray-100 dark:bg-gray-700 text-gray-700'
                }`}
              >
                #{idx + 1}
              </span>

              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
                style={{ backgroundColor: `${expense.categoryColor}20` }}
              >
                {expense.categoryIcon}
              </div>

              <div className="min-w-0">
                <p className="font-bold text-gray-900 dark:text-white text-sm truncate">
                  {expense.categoryName}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium truncate">
                  {formatDateDisplay(expense.date)}
                  {expense.note && ` • ${expense.note}`}
                </p>
              </div>
            </div>

            <div className="shrink-0 text-right pl-2">
              <span className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white">
                {formatMoney(expense.amountMinor, currency)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
