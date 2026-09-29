import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AnalysisTransactionsTable } from './AnalysisTransactionsTable';
import type { Category, Transaction } from '../../lib/models';

describe('AnalysisTransactionsTable', () => {
  const categories: Category[] = [
    { id: 'c1', name: 'Mâncare', type: 'expense', icon: '🍔', color: '#f87171', isArchived: false, createdAt: '' },
    { id: 'c2', name: 'Salariu', type: 'income', icon: '💰', color: '#4ade80', isArchived: false, createdAt: '' },
  ];

  const transactions: Transaction[] = [
    {
      id: 'tx1',
      type: 'expense',
      amountMinor: 3500, // 35.00 RON
      categoryId: 'c1',
      date: '2026-03-05',
      note: 'Prânz birou',
      createdAt: '2026-03-05T12:00:00Z',
      updatedAt: '',
    },
    {
      id: 'tx2',
      type: 'income',
      amountMinor: 600000, // 6000.00 RON
      categoryId: 'c2',
      date: '2026-03-10',
      note: 'Salariu companie',
      createdAt: '2026-03-10T09:00:00Z',
      updatedAt: '',
    },
    {
      id: 'tx3',
      type: 'expense',
      amountMinor: 12000, // 120.00 RON
      categoryId: 'c1',
      date: '2026-03-15',
      note: 'Cină restaurant',
      createdAt: '2026-03-15T20:00:00Z',
      updatedAt: '',
    },
  ];

  it('renders all transactions and summary counts', () => {
    render(
      <AnalysisTransactionsTable
        transactions={transactions}
        categories={categories}
        selectedMonthIso="2026-03"
      />
    );

    expect(screen.getByText('Tabel complet tranzacții')).toBeInTheDocument();
    expect(screen.getByText('Prânz birou')).toBeInTheDocument();
    expect(screen.getByText('Salariu companie')).toBeInTheDocument();
    expect(screen.getByText('Cină restaurant')).toBeInTheDocument();
    expect(screen.getByText(/Afișate:/)).toHaveTextContent('3 tranzacții');
  });

  it('sorts by amount when clicking the amount header', () => {
    render(
      <AnalysisTransactionsTable
        transactions={transactions}
        categories={categories}
        selectedMonthIso="2026-03"
      />
    );

    const amountHeader = screen.getByText(/Sumă/);
    fireEvent.click(amountHeader); // First click sorts desc

    const rows = screen.getAllByRole('row');
    // First row is header, second row should have tx2 (6000.00 RON)
    expect(rows[1]).toHaveTextContent('Salariu companie');

    fireEvent.click(amountHeader); // Second click sorts asc
    const rowsAsc = screen.getAllByRole('row');
    expect(rowsAsc[1]).toHaveTextContent('Prânz birou'); // 35.00 RON
  });

  it('filters by category', () => {
    render(
      <AnalysisTransactionsTable
        transactions={transactions}
        categories={categories}
        selectedMonthIso="2026-03"
      />
    );

    const categorySelect = screen.getByDisplayValue('Toate categoriile');
    fireEvent.change(categorySelect, { target: { value: 'c2' } });

    expect(screen.getByText('Salariu companie')).toBeInTheDocument();
    expect(screen.queryByText('Prânz birou')).not.toBeInTheDocument();
    expect(screen.queryByText('Cină restaurant')).not.toBeInTheDocument();
  });

  it('filters by type', () => {
    render(
      <AnalysisTransactionsTable
        transactions={transactions}
        categories={categories}
        selectedMonthIso="2026-03"
      />
    );

    const typeSelect = screen.getByDisplayValue('Toate tipurile');
    fireEvent.change(typeSelect, { target: { value: 'expense' } });

    expect(screen.queryByText('Salariu companie')).not.toBeInTheDocument();
    expect(screen.getByText('Prânz birou')).toBeInTheDocument();
    expect(screen.getByText('Cină restaurant')).toBeInTheDocument();
  });

  it('calls onEditTransaction when row is clicked', () => {
    const handleEdit = vi.fn();
    render(
      <AnalysisTransactionsTable
        transactions={transactions}
        categories={categories}
        selectedMonthIso="2026-03"
        onEditTransaction={handleEdit}
      />
    );

    fireEvent.click(screen.getByText('Prânz birou'));
    expect(handleEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'tx1' }));
  });
});
