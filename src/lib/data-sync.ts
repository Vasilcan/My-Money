import { db } from './db';
import { fromMinor } from './money';
import type { Transaction, Category, Budget, Settings } from './models';

export interface BackupData {
  version: 1;
  timestamp: string;
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  settings: Settings[];
}

export interface ImportSummary {
  transactions: number;
  categories: number;
  budgets: number;
}

export type ImportMode = 'replace' | 'merge';

export async function exportCSV(): Promise<string> {
  const transactions = await db.transactions.toArray();
  const categories = await db.categories.toArray();
  
  const categoryMap = new Map(categories.map(c => [c.id, c.name]));
  
  // UTF-8 BOM
  let csv = '\uFEFF';
  csv += 'Data;Tip;Categorie;Suma;Nota\n';
  
  for (const tx of transactions) {
    const date = tx.date;
    const type = tx.type === 'income' ? 'Venit' : 'Cheltuială';
    const catName = categoryMap.get(tx.categoryId) || 'Necunoscut';
    // Format amount for Romanian Excel: comma for decimals, no grouping
    const amountStr = fromMinor(tx.amountMinor).toLocaleString('ro-RO', { useGrouping: false, minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const note = tx.note || '';
    
    const row = [date, type, catName, amountStr, note].map(escapeCSVCell).join(';');
    csv += row + '\n';
  }
  
  return csv;
}

function escapeCSVCell(cell: string): string {
  if (cell.includes(';') || cell.includes('\n') || cell.includes('"')) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
}

export async function exportJSON(): Promise<string> {
  const transactions = await db.transactions.toArray();
  const categories = await db.categories.toArray();
  const budgets = await db.budgets.toArray();
  const settings = await db.settings.toArray();
  
  const data: BackupData = {
    version: 1,
    timestamp: new Date().toISOString(),
    transactions,
    categories,
    budgets,
    settings
  };
  
  return JSON.stringify(data, null, 2);
}

export function parseAndValidateBackup(jsonString: string): BackupData {
  let data: any;
  try {
    data = JSON.parse(jsonString);
  } catch {
    throw new Error('Fișierul JSON nu este valid.');
  }
  
  if (!data || typeof data !== 'object') {
    throw new Error('Structură incorectă a fișierului.');
  }
  
  if (data.version !== 1) {
    throw new Error('Versiune de backup nesuportată.');
  }
  
  if (!Array.isArray(data.transactions) || !Array.isArray(data.categories)) {
    throw new Error('Fișierul nu conține listele necesare (tranzacții, categorii).');
  }

  // Basic schema validation for a transaction if they exist
  if (data.transactions.length > 0) {
    const tx = data.transactions[0];
    if (typeof tx.id !== 'string' || typeof tx.amountMinor !== 'number' || typeof tx.categoryId !== 'string' || !tx.date) {
      throw new Error('Structura tranzacțiilor este invalidă.');
    }
  }

  // Basic schema validation for a category if they exist
  if (data.categories.length > 0) {
    const cat = data.categories[0];
    if (typeof cat.id !== 'string' || typeof cat.name !== 'string' || typeof cat.type !== 'string') {
      throw new Error('Structura categoriilor este invalidă.');
    }
  }
  
  return data as BackupData;
}

export async function importBackup(data: BackupData, mode: ImportMode): Promise<ImportSummary> {
  let txCount = 0;
  let catCount = 0;
  let budgetCount = 0;
  
  await db.transaction('rw', db.transactions, db.categories, db.budgets, db.settings, async () => {
    if (mode === 'replace') {
      await db.transactions.clear();
      await db.categories.clear();
      await db.budgets.clear();
      // settings is just 1 row usually, but clear to be safe
      await db.settings.clear();
      
      if (data.transactions.length) await db.transactions.bulkAdd(data.transactions);
      if (data.categories.length) await db.categories.bulkAdd(data.categories);
      if (data.budgets && data.budgets.length) await db.budgets.bulkAdd(data.budgets);
      if (data.settings && data.settings.length) await db.settings.bulkAdd(data.settings);
      
      txCount = data.transactions.length;
      catCount = data.categories.length;
      budgetCount = (data.budgets || []).length;
    } else { // merge
      // only add new items
      const existingTx = await db.transactions.toArray();
      const existingCat = await db.categories.toArray();
      const existingBudgets = await db.budgets.toArray();
      
      const txIds = new Set(existingTx.map(t => t.id));
      const catIds = new Set(existingCat.map(c => c.id));
      const budgetIds = new Set(existingBudgets.map(b => b.id));
      
      const newTx = data.transactions.filter(t => !txIds.has(t.id));
      const newCat = data.categories.filter(c => !catIds.has(c.id));
      const newBudgets = (data.budgets || []).filter(b => !budgetIds.has(b.id));
      
      if (newTx.length) await db.transactions.bulkAdd(newTx);
      if (newCat.length) await db.categories.bulkAdd(newCat);
      if (newBudgets.length) await db.budgets.bulkAdd(newBudgets);
      
      txCount = newTx.length;
      catCount = newCat.length;
      budgetCount = newBudgets.length;
    }
    
    // Update last backup date in settings to now (wait, this is import, not export, but we can set it so it resets the warning?)
    // Actually, don't change lastBackupDate on import. It's only for export.
  });
  
  return {
    transactions: txCount,
    categories: catCount,
    budgets: budgetCount
  };
}

export function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


export async function updateLastBackupDate() {
  const now = new Date().toISOString();
  await db.settings.update('settings', { lastBackupDate: now });
}
