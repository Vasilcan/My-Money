import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { Transaction } from '../../lib/models';
import { getMonthlyEvolution } from '../../lib/aggregations';
import { formatMoney, fromMinor } from '../../lib/money';
import { formatMonthDisplay } from '../../lib/date';

interface Props {
  transactions: Transaction[];
  selectedMonthIso: string;
  currency?: string;
}

export function EvolutionBarChart({
  transactions,
  selectedMonthIso,
  currency = 'RON',
}: Props) {
  const [monthRange, setMonthRange] = useState<6 | 12>(6);

  const evolutionData = useMemo(() => {
    const raw = getMonthlyEvolution(transactions, selectedMonthIso, monthRange);
    return raw.map(item => ({
      ...item,
      incomeRon: fromMinor(item.incomeMinor),
      expenseRon: fromMinor(item.expenseMinor),
    }));
  }, [transactions, selectedMonthIso, monthRange]);

  const hasAnyData = evolutionData.some(d => d.incomeMinor > 0 || d.expenseMinor > 0);

  return (
    <div className="bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white text-lg">Evoluție Venituri vs Cheltuieli</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
            Ultimele {monthRange} luni
          </p>
        </div>

        {/* Range Selector */}
        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => setMonthRange(6)}
            className={`px-2.5 py-1.5 rounded-lg transition-all ${
              monthRange === 6
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white'
            }`}
            aria-label="Ultimele 6 luni"
          >
            6 luni
          </button>
          <button
            type="button"
            onClick={() => setMonthRange(12)}
            className={`px-2.5 py-1.5 rounded-lg transition-all ${
              monthRange === 12
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-xs'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:text-white'
            }`}
            aria-label="Ultimele 12 luni"
          >
            12 luni
          </button>
        </div>
      </div>

      <div className="w-full h-72 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={evolutionData}
            margin={{ top: 10, right: 10, left: -15, bottom: 0 }}
            barGap={2}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
              tick={{ fill: '#6b7280', fontSize: 12, fontWeight: 500 }}
              interval={0}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#6b7280', fontSize: 11 }}
              tickFormatter={(val: number) => {
                if (val === 0) return '0';
                if (val >= 1000) return `${Math.round(val / 1000)}k`;
                return `${val}`;
              }}
              width={42}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white dark:bg-gray-800/95 backdrop-blur-sm border border-gray-200 dark:border-gray-700 shadow-md rounded-xl p-3 text-xs space-y-1.5 z-50">
                      <p className="font-bold text-gray-900 dark:text-white capitalize border-b border-gray-100 dark:border-gray-700 pb-1">
                        {formatMonthDisplay(data.monthIso)}
                      </p>
                      <div className="flex justify-between gap-4 text-emerald-600 font-semibold">
                        <span>Venituri:</span>
                        <span>{formatMoney(data.incomeMinor, currency)}</span>
                      </div>
                      <div className="flex justify-between gap-4 text-red-600 font-semibold">
                        <span>Cheltuieli:</span>
                        <span>{formatMoney(data.expenseMinor, currency)}</span>
                      </div>
                      <div className="flex justify-between gap-4 font-bold border-t border-gray-100 dark:border-gray-700 pt-1 text-gray-900 dark:text-white">
                        <span>Sold net:</span>
                        <span className={data.netMinor >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                          {data.netMinor >= 0 ? '+' : ''}{formatMoney(data.netMinor, currency)}
                        </span>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '12px', paddingBottom: '12px' }}
            />
            <Bar
              dataKey="incomeRon"
              name="Venituri"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              dataKey="expenseRon"
              name="Cheltuieli"
              fill="#ef4444"
              radius={[4, 4, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {!hasAnyData && (
        <p className="text-center text-xs text-gray-400 font-medium mt-2">
          Nu există tranzacții înregistrate în această perioadă.
        </p>
      )}
    </div>
  );
}
