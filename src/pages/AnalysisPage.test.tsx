import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AnalysisPage from './AnalysisPage';
import { db } from '../lib/db';
import { addCategory, addTransaction } from '../lib/repository';
import { TransactionModalProvider } from '../context/TransactionModalProvider';

vi.mock('recharts', async () => {
  const original = await vi.importActual<any>('recharts');
  return {
    ...original,
    ResponsiveContainer: ({ children }: any) => (
      <div style={{ width: 500, height: 300 }}>{children}</div>
    ),
  };
});

describe('AnalysisPage', () => {
  beforeEach(async () => {
    await db.delete();
    await db.open();
  });

  it('renders analysis page with empty state', async () => {
    render(
      <TransactionModalProvider>
        <AnalysisPage />
      </TransactionModalProvider>
    );

    expect(screen.getByText('Analiză')).toBeInTheDocument();
    expect(screen.getByText('Cheltuieli pe categorii')).toBeInTheDocument();
    expect(screen.getByText('Evoluție Venituri vs Cheltuieli')).toBeInTheDocument();
    expect(screen.getByText('Comparație cu luna precedentă')).toBeInTheDocument();
    expect(screen.getByText('Top 5 cheltuieli')).toBeInTheDocument();
  });

  it('displays category expenses and top expenses when data is present', async () => {
    const cat = await addCategory({
      name: 'Supermarket',
      type: 'expense',
      icon: '🛒',
      color: '#f87171',
    });

    const now = new Date();
    const currentMonthIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const today = `${currentMonthIso}-15`;

    await addTransaction({
      type: 'expense',
      amountMinor: 25000, // 250.00 RON
      categoryId: cat.id,
      date: today,
      note: 'Cumparaturi saptamanale',
    });

    render(
      <TransactionModalProvider>
        <AnalysisPage />
      </TransactionModalProvider>
    );

    // Wait for live queries to populate
    const elements = await screen.findAllByText('Supermarket');
    expect(elements.length).toBeGreaterThanOrEqual(1);

    const amountElements = screen.getAllByText(/250,00/);
    expect(amountElements.length).toBeGreaterThanOrEqual(1);
  });

  it('handles single month of history gracefully without crash', async () => {
    const cat = await addCategory({
      name: 'Utilități',
      type: 'expense',
      icon: '💡',
      color: '#60a5fa',
    });

    const now = new Date();
    const currentMonthIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    await addTransaction({
      type: 'expense',
      amountMinor: 10000,
      categoryId: cat.id,
      date: `${currentMonthIso}-05`,
      note: 'Factură curent',
    });

    render(
      <TransactionModalProvider>
        <AnalysisPage />
      </TransactionModalProvider>
    );

    const elements = await screen.findAllByText('Utilități');
    expect(elements.length).toBeGreaterThan(0);
    // Comparison card should show "Nou" since previous month had 0
    expect(screen.getByText('Nou')).toBeInTheDocument();
  });

  it('compares with previous month when both have data', async () => {
    const cat = await addCategory({
      name: 'Combustibil Auto',
      type: 'expense',
      icon: '🚗',
      color: '#fbbf24',
    });

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    const currentMonthIso = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    let prevYear = currentYear;
    let prevMonth = currentMonth - 1;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear -= 1;
    }
    const prevMonthIso = `${prevYear}-${String(prevMonth).padStart(2, '0')}`;

    // Previous month: 100 RON
    await addTransaction({
      type: 'expense',
      amountMinor: 10000,
      categoryId: cat.id,
      date: `${prevMonthIso}-10`,
      note: 'Benzina luna trecuta',
    });

    // Current month: 150 RON (+50 RON, +50%)
    await addTransaction({
      type: 'expense',
      amountMinor: 15000,
      categoryId: cat.id,
      date: `${currentMonthIso}-10`,
      note: 'Benzina luna asta',
    });

    render(
      <TransactionModalProvider>
        <AnalysisPage />
      </TransactionModalProvider>
    );

    const elements = await screen.findAllByText('Combustibil Auto');
    expect(elements.length).toBeGreaterThan(0);
    expect(screen.getByText(/\(\+50%\)/)).toBeInTheDocument();
  });
});
