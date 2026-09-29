import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './db';
import { exportCSV, exportJSON, parseAndValidateBackup, importBackup } from './data-sync';

describe('Data Sync', () => {
  beforeEach(async () => {
    await db.transactions.clear();
    await db.categories.clear();
    await db.budgets.clear();
    await db.settings.clear();
  });

  it('exports CSV correctly', async () => {
    await db.categories.add({
      id: 'c1',
      name: 'Salariu',
      type: 'income',
      icon: '💰',
      color: '#000',
      isArchived: false,
      createdAt: '2023-01-01T00:00:00Z'
    });
    
    await db.transactions.add({
      id: 't1',
      type: 'income',
      amountMinor: 500050, // 5000,50
      categoryId: 'c1',
      date: '2023-10-15',
      note: 'Salariu oct; extra',
      createdAt: '2023-10-15T00:00:00Z',
      updatedAt: '2023-10-15T00:00:00Z'
    });
    
    const csv = await exportCSV();
    
    // Contains BOM
    expect(csv.startsWith('\uFEFF')).toBe(true);
    
    const lines = csv.split('\n');
    expect(lines).toHaveLength(3); // extra line due to trailing \n
    
    expect(lines[0]).toBe('\uFEFFData;Tip;Categorie;Suma;Nota');
    expect(lines[1]).toBe('2023-10-15;Venit;Salariu;5000,50;"Salariu oct; extra"');
  });

  it('does a round-trip JSON export and import (replace)', async () => {
    await db.categories.add({
      id: 'c1',
      name: 'Test',
      type: 'expense',
      icon: 'x',
      color: 'red',
      isArchived: false,
      createdAt: '2023-01-01'
    });
    await db.transactions.add({
      id: 't1',
      type: 'expense',
      amountMinor: 1000,
      categoryId: 'c1',
      date: '2023-10-15',
      createdAt: '2023-10-15',
      updatedAt: '2023-10-15'
    });
    
    const jsonStr = await exportJSON();
    
    // clear DB to simulate fresh install
    await db.categories.clear();
    await db.transactions.clear();
    
    const parsed = parseAndValidateBackup(jsonStr);
    const summary = await importBackup(parsed, 'replace');
    
    expect(summary.transactions).toBe(1);
    expect(summary.categories).toBe(1);
    
    const cats = await db.categories.toArray();
    expect(cats).toHaveLength(1);
    expect(cats[0].name).toBe('Test');
    
    const txs = await db.transactions.toArray();
    expect(txs).toHaveLength(1);
    expect(txs[0].amountMinor).toBe(1000);
  });

  it('rejects invalid JSON backup', () => {
    expect(() => parseAndValidateBackup('invalid')).toThrow(/nu este valid/);
    expect(() => parseAndValidateBackup('{"version": 1}')).toThrow(/nu conține listele/);
    expect(() => parseAndValidateBackup('{"version": 2}')).toThrow(/nesuportată/);
    
    // Invalid transaction schema
    expect(() => parseAndValidateBackup(JSON.stringify({
      version: 1,
      transactions: [{ id: 't1', amountMinor: 'not a number', categoryId: 'c1' }],
      categories: []
    }))).toThrow(/Structura tranzacțiilor este invalidă/);
  });
});
