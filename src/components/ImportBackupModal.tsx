import { useState } from 'react';
import type { BackupData } from '../lib/data-sync';

interface ImportBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: BackupData | null;
  onConfirm: (mode: 'replace' | 'merge') => void;
}

export default function ImportBackupModal({ isOpen, onClose, data, onConfirm }: ImportBackupModalProps) {
  const [mode, setMode] = useState<'replace' | 'merge'>('merge');

  if (!isOpen || !data) return null;

  const txCount = data.transactions?.length || 0;
  const catCount = data.categories?.length || 0;
  const budgetCount = data.budgets?.length || 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-sm shadow-xl overflow-hidden flex flex-col max-h-full">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Importare Backup</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-600 dark:text-gray-300 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-5 overflow-y-auto">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            Fișierul selectat conține:
          </p>
          <ul className="text-sm font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-900 p-3 rounded-2xl mb-6 space-y-1">
            <li>• {txCount} tranzacții</li>
            <li>• {catCount} categorii</li>
            {budgetCount > 0 && <li>• {budgetCount} bugete</li>}
          </ul>

          <p className="text-sm text-gray-900 dark:text-white font-bold mb-3">Cum dorești să imporți datele?</p>
          <div className="space-y-3">
            <label className={`flex gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-colors ${mode === 'merge' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
              <input 
                type="radio" 
                name="importMode" 
                value="merge" 
                checked={mode === 'merge'} 
                onChange={() => setMode('merge')}
                className="mt-1"
              />
              <div>
                <span className="block text-sm font-bold text-gray-900 dark:text-white">Adaugă la existente</span>
                <span className="block text-xs text-gray-500 dark:text-gray-400">Datele noi vor fi adăugate, evitând duplicatele (după ID). Datele curente sunt păstrate.</span>
              </div>
            </label>

            <label className={`flex gap-3 p-3 rounded-2xl border-2 cursor-pointer transition-colors ${mode === 'replace' ? 'border-red-500 bg-red-50' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'}`}>
              <input 
                type="radio" 
                name="importMode" 
                value="replace" 
                checked={mode === 'replace'} 
                onChange={() => setMode('replace')}
                className="mt-1"
              />
              <div>
                <span className="block text-sm font-bold text-gray-900 dark:text-white">Înlocuiește tot</span>
                <span className="block text-xs text-red-600 font-medium">Atenție! Toate datele curente vor fi șterse definitiv și înlocuite cu cele din backup.</span>
              </div>
            </label>
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 dark:border-gray-700 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[44px] px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl transition-colors"
          >
            Anulează
          </button>
          <button
            type="button"
            onClick={() => onConfirm(mode)}
            className={`flex-1 min-h-[44px] px-4 py-2 text-white text-sm font-bold rounded-xl transition-colors ${mode === 'replace' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}
          >
            Importă
          </button>
        </div>
      </div>
    </div>
  );
}
