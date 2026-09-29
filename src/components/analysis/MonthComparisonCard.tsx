import type { CategoryComparisonItem } from '../../lib/aggregations';
import { formatMoney } from '../../lib/money';
import { formatMonthDisplay } from '../../lib/date';

interface Props {
  comparison: CategoryComparisonItem[];
  previousMonthIso: string;
  currency?: string;
}

export function MonthComparisonCard({
  comparison,
  previousMonthIso,
  currency = 'RON',
}: Props) {
  const previousMonthName = formatMonthDisplay(previousMonthIso);

  if (comparison.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center h-80">
        <div className="w-14 h-14 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center text-2xl mb-3 text-gray-400">
          ⚖️
        </div>
        <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">Comparație cu luna precedentă</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs font-medium">
          Nicio cheltuială de comparat față de {previousMonthName}.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between">
      <div className="mb-4">
        <h3 className="font-bold text-gray-900 dark:text-white text-lg">Comparație cu luna precedentă</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
          Evoluție pe categorii față de {previousMonthName}
        </p>
      </div>

      <div className="space-y-3 divide-y divide-gray-50 max-h-96 overflow-y-auto pr-1">
        {comparison.map((item) => {
          return (
            <div key={item.categoryId} className="pt-3 first:pt-0">
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0"
                    style={{ backgroundColor: `${item.color}20` }}
                  >
                    {item.icon}
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white text-sm truncate">
                    {item.categoryName}
                  </span>
                </div>

                {/* Diff Badge */}
                <div className="shrink-0 text-right">
                  {item.isNew ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                      <span>+{formatMoney(item.diffMinor, currency)}</span>
                      <span className="text-[10px] bg-amber-200/70 text-amber-800 px-1 rounded-sm">Nou</span>
                    </span>
                  ) : item.diffMinor > 0 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-red-50 text-red-700 border border-red-200/60">
                      <span>+{formatMoney(item.diffMinor, currency)}</span>
                      <span className="text-[10px]">
                        (+{item.diffPercentage}%)
                      </span>
                    </span>
                  ) : item.diffMinor < 0 ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                      <span>{formatMoney(item.diffMinor, currency)}</span>
                      <span className="text-[10px]">
                        ({item.diffPercentage}%)
                      </span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold bg-gray-50 dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
                      <span>0 {currency}</span>
                      <span className="text-[10px]">(0%)</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Comparative amounts sub-line */}
              <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-medium pl-10">
                <span>
                  Luna curentă: <strong className="text-gray-800">{formatMoney(item.currentMinor, currency)}</strong>
                </span>
                <span>
                  Anterior: <span className="text-gray-600 dark:text-gray-300">{formatMoney(item.previousMinor, currency)}</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
