import { useState, useMemo, useRef, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import type { Category, TransactionType } from '../lib/models';
import {
  getCategories,
  archiveCategory,
  restoreCategory,
  deleteCategoryPermanently,
  getSettings,
  updateSettings,
} from '../lib/repository';
import {
  exportCSV,
  exportJSON,
  parseAndValidateBackup,
  importBackup,
  downloadFile,
  updateLastBackupDate,
  type BackupData
} from '../lib/data-sync';
import CategoryModal from '../components/CategoryModal';
import ConfirmDialog from '../components/ConfirmDialog';
import ImportBackupModal from '../components/ImportBackupModal';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TransactionType>('expense');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  // Backup state
  const [backupData, setBackupData] = useState<BackupData | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live queries
  const rawCategories = useLiveQuery(() => getCategories(true), []);
  const rawTransactions = useLiveQuery(() => db.transactions.toArray(), []);
  const rawSettings = useLiveQuery(() => getSettings(), []);

  const categories = rawCategories ?? [];
  const settings = rawSettings ?? { id: 'settings', currency: 'RON', firstDayOfMonth: 1 };

  // Calculate transaction count per category
  const txCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const tx of rawTransactions ?? []) {
      counts[tx.categoryId] = (counts[tx.categoryId] || 0) + 1;
    }
    return counts;
  }, [rawTransactions]);

  // Filter categories by type
  const activeCategories = categories.filter((c) => c.type === activeTab && !c.isArchived);
  const archivedCategories = categories.filter((c) => c.type === activeTab && c.isArchived);

  const handleOpenAddCategory = () => {
    setEditingCategory(null);
    setIsCategoryModalOpen(true);
  };

  const handleOpenEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setIsCategoryModalOpen(true);
  };

  const handleArchive = async (cat: Category) => {
    try {
      await archiveCategory(cat.id);
    } catch (err) {
      console.error('Failed to archive category:', err);
    }
  };

  const handleRestore = async (cat: Category) => {
    try {
      await restoreCategory(cat.id);
    } catch (err) {
      console.error('Failed to restore category:', err);
    }
  };

  const handleConfirmDelete = async () => {
    if (!categoryToDelete) return;
    try {
      await deleteCategoryPermanently(categoryToDelete.id);
      setCategoryToDelete(null);
    } catch (err) {
      console.error('Failed to delete category permanently:', err);
    }
  };

  const handleCurrencyChange = async (currency: string) => {
    try {
      await updateSettings({ currency });
    } catch (err) {
      console.error('Failed to update currency:', err);
    }
  };

  const handleThemeChange = async (theme: 'system' | 'light' | 'dark') => {
    try {
      await updateSettings({ theme });
    } catch (err) {
      console.error('Failed to update theme:', err);
    }
  };

  const handleExportCSV = async () => {
    try {
      const csvStr = await exportCSV();
      const dateStr = new Date().toISOString().split('T')[0];
      downloadFile(csvStr, `finance-tranzactii-${dateStr}.csv`, 'text/csv;charset=utf-8;');
    } catch (err) {
      console.error('Failed to export CSV:', err);
      alert('A apărut o eroare la exportul CSV.');
    }
  };

  const handleExportJSON = async () => {
    try {
      const jsonStr = await exportJSON();
      const dateStr = new Date().toISOString().split('T')[0];
      downloadFile(jsonStr, `finance-backup-${dateStr}.json`, 'application/json');
      await updateLastBackupDate();
    } catch (err) {
      console.error('Failed to export JSON:', err);
      alert('A apărut o eroare la exportul JSON.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const result = event.target?.result as string;
        const parsed = parseAndValidateBackup(result);
        setBackupData(parsed);
        setIsImportModalOpen(true);
      } catch (err: any) {
        console.error('Failed to parse backup:', err);
        alert(`Eroare la import: ${err.message}`);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleConfirmImport = async (mode: 'replace' | 'merge') => {
    if (!backupData) return;
    try {
      const summary = await importBackup(backupData, mode);
      setIsImportModalOpen(false);
      setBackupData(null);
      alert(`Import realizat cu succes!\n\nS-au importat:\n- ${summary.transactions} tranzacții\n- ${summary.categories} categorii\n- ${summary.budgets} bugete`);
    } catch (err) {
      console.error('Failed to import backup:', err);
      alert('A apărut o eroare la import. Datele nu au fost afectate.');
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const [now] = useState(() => Date.now());
  let daysSinceBackup: number | null = null;
  if (settings?.lastBackupDate) {
    const lastDate = new Date(settings.lastBackupDate).getTime();
    const diffTime = Math.abs(now - lastDate);
    daysSinceBackup = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  }

  const [isPersistenceGranted, setIsPersistenceGranted] = useState(false);

  useEffect(() => {
    if (navigator.storage && navigator.storage.persisted) {
      navigator.storage.persisted().then(isPersisted => {
        setIsPersistenceGranted(isPersisted);
      });
    }
  }, []);

  const requestPersistence = async () => {
    if (navigator.storage && navigator.storage.persist) {
      const isPersisted = await navigator.storage.persist();
      setIsPersistenceGranted(isPersisted);
      if (isPersisted) {
        alert('Stocare persistentă activată cu succes!');
      } else {
        alert('Browserul a refuzat stocarea persistentă. S-ar putea să fie nevoie să instalezi aplicația sau să o adaugi la favorite.');
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-24 lg:pb-8">
      <header className="mt-2 mb-4">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">Setări</h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1">
          Personalizează categoriile și preferințele aplicației.
        </p>
      </header>

      {/* Theme Section */}
      <section className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 dark:border-gray-700 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎨</span>
          <h2 className="text-base font-bold text-gray-900 dark:text-white dark:text-white">Temă vizuală</h2>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 font-medium leading-relaxed">
          Alege aspectul aplicației. Modul automat folosește setarea dispozitivului.
        </p>
        <div className="grid grid-cols-3 gap-2 pt-1">
          {[
            { id: 'system', label: 'Automat', icon: '⚙️' },
            { id: 'light', label: 'Luminos', icon: '☀️' },
            { id: 'dark', label: 'Întunecat', icon: '🌙' }
          ].map((themeOpt) => {
            const isSelected = (settings.theme || 'system') === themeOpt.id;
            return (
              <button
                key={themeOpt.id}
                type="button"
                onClick={() => handleThemeChange(themeOpt.id as any)}
                className={`min-h-[44px] px-2 py-2 text-xs sm:text-sm font-bold rounded-2xl border transition-all flex flex-col items-center justify-center gap-1 ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400 shadow-sm ring-2 ring-emerald-500/20'
                    : 'border-gray-200 dark:border-gray-700 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 dark:bg-gray-700 hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'
                }`}
              >
                <span>{themeOpt.icon}</span>
                <span>{themeOpt.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Currency Section */}
      <section className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🪙</span>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Monedă (doar afișare)</h2>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed">
          Selectează simbolul monedei folosit în aplicație. Toate valorile sunt stocate în mod nativ în RON.
        </p>
        <div className="grid grid-cols-3 gap-2 pt-1">
          {['RON', 'EUR', 'USD'].map((curr) => {
            const isSelected = settings.currency === curr;
            return (
              <button
                key={curr}
                type="button"
                onClick={() => handleCurrencyChange(curr)}
                className={`min-h-[44px] px-3 py-2 text-sm font-bold rounded-2xl border transition-all ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-sm ring-2 ring-emerald-500/20'
                    : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:bg-gray-700 text-gray-700'
                }`}
              >
                {curr}
              </button>
            );
          })}
        </div>
      </section>

      {/* Categories Section */}
      <section className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏷️</span>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Categorii</h2>
          </div>
          <button
            type="button"
            onClick={handleOpenAddCategory}
            className="min-h-[44px] px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm transition-all flex items-center gap-1.5"
          >
            <span className="text-base leading-none">+</span>
            <span>Adaugă</span>
          </button>
        </div>

        {/* Expense / Income Tabs */}
        <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('expense')}
            className={`flex-1 min-h-[44px] py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'expense'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800'
            }`}
          >
            Cheltuieli ({categories.filter((c) => c.type === 'expense' && !c.isArchived).length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('income')}
            className={`flex-1 min-h-[44px] py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'income'
                ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-800'
            }`}
          >
            Venituri ({categories.filter((c) => c.type === 'income' && !c.isArchived).length})
          </button>
        </div>

        {/* Active Categories List */}
        <div className="divide-y divide-gray-100">
          {activeCategories.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">
              Nu există categorii active pentru acest tip.
            </p>
          ) : (
            activeCategories.map((cat) => {
              const count = txCounts[cat.id] || 0;
              return (
                <div
                  key={cat.id}
                  className="py-3 flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-xs border border-gray-100 dark:border-gray-700"
                      style={{ backgroundColor: `${cat.color}25` }}
                    >
                      {cat.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{cat.name}</p>
                      <p className="text-[11px] font-medium text-gray-400">
                        {count === 0 ? 'Fără tranzacții' : `${count} tranzacți${count === 1 ? 'e' : 'i'}`}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditCategory(cat)}
                      aria-label={`Editează categoria ${cat.name}`}
                      title="Editează"
                      className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-800 hover:bg-gray-100 dark:bg-gray-700 transition-colors"
                    >
                      ✏️
                    </button>

                    <button
                      type="button"
                      onClick={() => handleArchive(cat)}
                      aria-label={`Arhivează categoria ${cat.name}`}
                      title="Arhivează"
                      className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                    >
                      📦
                    </button>

                    {count === 0 && (
                      <button
                        type="button"
                        onClick={() => setCategoryToDelete(cat)}
                        aria-label={`Șterge categoria ${cat.name}`}
                        title="Șterge definitiv"
                        className="w-10 h-10 flex items-center justify-center rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Archived Categories Section */}
        {archivedCategories.length > 0 && (
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
            <button
              type="button"
              onClick={() => setShowArchived(!showArchived)}
              className="w-full min-h-[44px] flex items-center justify-between px-3 py-2 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-800 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:bg-gray-700 rounded-xl transition-colors"
            >
              <span>Categorii arhivate ({archivedCategories.length})</span>
              <span>{showArchived ? '▲' : '▼'}</span>
            </button>

            {showArchived && (
              <div className="divide-y divide-gray-100 mt-2">
                {archivedCategories.map((cat) => {
                  const count = txCounts[cat.id] || 0;

  return (
                    <div
                      key={cat.id}
                      className="py-3 flex items-center justify-between gap-3 opacity-75"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 grayscale"
                          style={{ backgroundColor: `${cat.color}20` }}
                        >
                          {cat.icon}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-gray-700 truncate line-through">
                            {cat.name}
                          </p>
                          <p className="text-[11px] font-medium text-gray-400">
                            Arhivată • {count === 0 ? '0 tranzacții' : `${count} tranzacți${count === 1 ? 'e' : 'i'}`}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleRestore(cat)}
                          aria-label={`Restaurează categoria ${cat.name}`}
                          className="min-h-[44px] px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors"
                        >
                          Restaurează
                        </button>

                        {count === 0 && (
                          <button
                            type="button"
                            onClick={() => setCategoryToDelete(cat)}
                            aria-label={`Șterge definitiv categoria ${cat.name}`}
                            title="Șterge definitiv"
                            className="w-10 h-10 flex items-center justify-center rounded-xl text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors"
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Data Section */}
      <section className="bg-white dark:bg-gray-800 dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 dark:border-gray-700 space-y-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">💾</span>
          <h2 className="text-base font-bold text-gray-900 dark:text-white dark:text-white">Date și backup</h2>
        </div>
        
        <div className="space-y-1">
          <p className="text-sm font-bold text-gray-900 dark:text-white dark:text-white">
            Exportă datele pentru a le salva sau a le deschide pe PC.
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-400 font-medium leading-relaxed">
            CSV este ideal pentru Excel. JSON conține absolut toate datele aplicației.
          </p>
        </div>

        <div className={`p-3 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 ${isPersistenceGranted ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50' : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-800/50'}`}>
          <div className="flex items-center gap-2">
            <span>{isPersistenceGranted ? '✅' : '⚠️'}</span>
            <span>
              {isPersistenceGranted 
                ? 'Datele sunt protejate de ștergerea automată a browserului.' 
                : 'Datele pot fi șterse de browser dacă nu este suficient spațiu.'}
            </span>
          </div>
          {!isPersistenceGranted && (
            <button
              type="button"
              onClick={requestPersistence}
              className="min-h-[44px] px-3 py-1.5 bg-amber-200 hover:bg-amber-300 dark:bg-amber-700 dark:hover:bg-amber-600 text-amber-900 dark:text-amber-100 font-bold rounded-xl transition-colors shrink-0"
            >
              Protejează
            </button>
          )}
        </div>

        {daysSinceBackup !== null && (
          <div className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${daysSinceBackup > 30 ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-gray-50 dark:bg-gray-900 text-gray-700'}`}>
            <span>{daysSinceBackup > 30 ? '⚠️' : 'ℹ️'}</span>
            <span>
              Ultimul backup: {daysSinceBackup === 0 ? 'astăzi' : `acum ${daysSinceBackup} zile`}
              {daysSinceBackup > 30 && ' - Este recomandat să faci un nou backup!'}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-emerald-500 hover:text-emerald-700 text-gray-700 text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2"
          >
            📊 Exportă CSV
          </button>
          
          <button
            type="button"
            onClick={handleExportJSON}
            className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-emerald-500 hover:text-emerald-700 text-gray-700 text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2"
          >
            📦 Backup complet JSON
          </button>

          <button
            type="button"
            onClick={triggerFileInput}
            className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2"
          >
            📥 Importă Backup
          </button>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept=".json" 
            className="hidden" 
          />
        </div>
      </section>

      {/* Add / Edit Category Modal */}
      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => {
          setIsCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        editingCategory={editingCategory}
        defaultType={activeTab}
        allCategories={categories}
      />

      {/* Confirm Permanent Delete Modal */}
      <ConfirmDialog
        isOpen={Boolean(categoryToDelete)}
        title="Ștergere definitivă categorie"
        message={`Ești sigur că vrei să ștergi definitiv categoria "${categoryToDelete?.name}"? Această acțiune nu poate fi anulată.`}
        confirmLabel="Da, șterge definitiv"
        cancelLabel="Anulează"
        onConfirm={handleConfirmDelete}
        onCancel={() => setCategoryToDelete(null)}
      />

      <ImportBackupModal
        isOpen={isImportModalOpen}
        onClose={() => {
          setIsImportModalOpen(false);
          setBackupData(null);
        }}
        data={backupData}
        onConfirm={handleConfirmImport}
      />
    </div>
  );
}
