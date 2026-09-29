import { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import type { CategoryExpenseItem } from '../../lib/aggregations';
import { formatMoney } from '../../lib/money';

interface Props {
  data: CategoryExpenseItem[];
  currency?: string;
}

export function CategoryDonutChart({ data, currency = 'RON' }: Props) {
  const [viewMode, setViewMode] = useState<'donut' | 'bars'>('donut');
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const totalExpenseMinor = data.reduce((sum, item) => sum + item.totalMinor, 0);

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center justify-center text-center h-80">
        <div className="w-14 h-14 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center text-2xl mb-3 text-gray-400">
          📊
        </div>
        <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-1">Cheltuieli pe categorii</h3>
        <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs font-medium">
          Nu există cheltuieli înregistrate în această lună.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white text-lg">Cheltuieli pe categorii</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Total: <span className="font-extrabold text-gray-900 dark:text-white">{formatMoney(totalExpenseMinor, currency)}</span>
          </p>
        </div>

        {/* View toggle */}
        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setViewMode('donut')}
            className={`px-2.5 py-1.5 rounded-lg transition-all ${
              viewMode === 'donut'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white'
            }`}
            aria-label="Vizualizare donut"
          >
            Donut
          </button>
          <button
            type="button"
            onClick={() => setViewMode('bars')}
            className={`px-2.5 py-1.5 rounded-lg transition-all ${
              viewMode === 'bars'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white'
            }`}
            aria-label="Vizualizare bare"
          >
            Bare
          </button>
        </div>
      </div>

      {viewMode === 'donut' ? (
        <div className="w-full flex flex-col items-center">
          <div className="w-full h-60 relative flex items-center justify-center min-w-0">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={88}
                  paddingAngle={3}
                  dataKey="totalMinor"
                  nameKey="categoryName"
                  onMouseEnter={(_, index) => setActiveIndex(index)}
                  onMouseLeave={() => setActiveIndex(null)}
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.categoryId}`}
                      fill={entry.color}
                      stroke={activeIndex === index ? '#111827' : '#ffffff'}
                      strokeWidth={activeIndex === index ? 2 : 1}
                      className="cursor-pointer outline-none transition-all duration-150"
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const item = payload[0].payload as CategoryExpenseItem;
                      return (
                        <div className="bg-white dark:bg-gray-800/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-md rounded-xl p-2.5 text-xs z-50">
                          <div className="flex items-center gap-1.5 mb-1 font-bold text-gray-900 dark:text-white">
                            <span>{item.icon}</span>
                            <span>{item.categoryName}</span>
                          </div>
                          <div className="text-gray-600 dark:text-gray-300 flex gap-2 justify-between">
                            <span>{formatMoney(item.totalMinor, currency)}</span>
                            <span className="font-extrabold text-emerald-600">({item.percentage}%)</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs text-gray-400 font-semibold uppercase tracking-wider">
                {activeIndex !== null ? data[activeIndex]?.categoryName : 'Categorii'}
              </span>
              <span className="text-base font-extrabold text-gray-900 dark:text-white">
                {activeIndex !== null
                  ? `${data[activeIndex]?.percentage}%`
                  : `${data.length}`}
              </span>
            </div>
          </div>

          {/* Legend / Category breakdown list */}
          <div className="w-full mt-2 space-y-2 max-h-48 overflow-y-auto pr-1">
            {data.map((cat, idx) => (
              <div
                key={cat.categoryId}
                onMouseEnter={() => setActiveIndex(idx)}
                onMouseLeave={() => setActiveIndex(null)}
                className={`flex items-center justify-between p-2 rounded-xl text-xs sm:text-sm transition-colors cursor-pointer ${
                  activeIndex === idx ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:bg-gray-900'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-3 h-3 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="text-base shrink-0">{cat.icon}</span>
                  <span className="font-medium text-gray-900 dark:text-white truncate">{cat.categoryName}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 pl-2">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-lg">
                    {cat.percentage}%
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {formatMoney(cat.totalMinor, currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Horizontal bars view */
        <div className="w-full space-y-3.5 my-2">
          {data.map(cat => (
            <div key={cat.categoryId} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-base">{cat.icon}</span>
                  <span className="font-medium text-gray-900 dark:text-white truncate">{cat.categoryName}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 pl-2">
                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                    {cat.percentage}%
                  </span>
                  <span className="font-bold text-gray-900 dark:text-white">
                    {formatMoney(cat.totalMinor, currency)}
                  </span>
                </div>
              </div>
              <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${cat.percentage}%`,
                    backgroundColor: cat.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
