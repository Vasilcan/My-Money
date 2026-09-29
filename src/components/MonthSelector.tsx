import { formatMonthDisplay, getPreviousMonth, getNextMonth } from '../lib/date';

interface Props {
  currentMonth: string;
  onChange: (month: string) => void;
}

export function MonthSelector({ currentMonth, onChange }: Props) {
  return (
    <div className="flex items-center justify-between bg-white rounded-2xl shadow-sm border border-gray-100 p-2">
      <button
        onClick={() => onChange(getPreviousMonth(currentMonth))}
        className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
        aria-label="Luna precedentă"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
      </button>
      <span className="font-bold text-gray-900 capitalize text-lg">
        {formatMonthDisplay(currentMonth)}
      </span>
      <button
        onClick={() => onChange(getNextMonth(currentMonth))}
        className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors"
        aria-label="Luna următoare"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
      </button>
    </div>
  );
}
