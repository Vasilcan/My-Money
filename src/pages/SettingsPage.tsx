import { useState, useMemo } from 'react';
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
import CategoryModal from '../components/CategoryModal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TransactionType>('expense');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [showArchived, setShowArchived] = useState(false);

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

  return (
    <div className="p-4 sm:p-6 space-y-6 pb-24 lg:pb-8">
      <header className="mt-2 mb-4">
        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Setări</h1>
        <p className="text-gray-500 text-sm font-medium mt-1">
          Personalizează categoriile și preferințele aplicației.
        </p>
      </header>

      {/* Currency Section */}
      <section className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🪙</span>
          <h2 className="text-base font-bold text-gray-900">Monedă (doar afișare)</h2>
        </div>
        <p className="text-xs text-gray-500 font-medium leading-relaxed">
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
                    : 'border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700'
                }`}
              >
                {curr}
              </button>
            );
          })}
        </div>
      </section>

      {/* Categories Section */}
      <section className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏷️</span>
            <h2 className="text-base font-bold text-gray-900">Categorii</h2>
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
        <div className="flex p-1 bg-gray-100 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('expense')}
            className={`flex-1 min-h-[44px] py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'expense'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Cheltuieli ({categories.filter((c) => c.type === 'expense' && !c.isArchived).length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('income')}
            className={`flex-1 min-h-[44px] py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === 'income'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            Venituri ({categories.filter((c) => c.type === 'income' && !c.isArchived).length})
          </button>
        </div>

        {/* Active Categories List */}
        <div className="divide-y divide-gray-100">
          {activeCategories.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">
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
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-xs border border-gray-100"
                      style={{ backgroundColor: `${cat.color}25` }}
                    >
                      {cat.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-gray-900 truncate">{cat.name}</p>
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
                      className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
                    >
                      ✏️
                    </button>

                    <button
                      type="button"
                      onClick={() => handleArchive(cat)}
                      aria-label={`Arhivează categoria ${cat.name}`}
                      title="Arhivează"
                      className="w-10 h-10 flex items-center justify-center rounded-xl text-gray-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
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
          <div className="pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setShowArchived(!showArchived)}
              className="w-full min-h-[44px] flex items-center justify-between px-3 py-2 text-xs font-bold text-gray-500 hover:text-gray-800 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors"
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

      {/* Data Section Placeholder */}
      <section className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">💾</span>
          <h2 className="text-base font-bold text-gray-900">Date și backup</h2>
        </div>
        <p className="text-xs text-gray-500 font-medium leading-relaxed">
          Exportul și importul tranzacțiilor (JSON/CSV) pentru salvare locală sau migrare vor fi disponibile în etapele următoare.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            disabled
            className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-gray-100 text-gray-400 text-xs font-bold flex items-center justify-center gap-2 cursor-not-allowed border border-gray-200"
          >
            <span>📥 Export date</span>
            <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-semibold">
              În curând
            </span>
          </button>
          <button
            type="button"
            disabled
            className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-gray-100 text-gray-400 text-xs font-bold flex items-center justify-center gap-2 cursor-not-allowed border border-gray-200"
          >
            <span>📤 Import date</span>
            <span className="text-[10px] bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-semibold">
              În curând
            </span>
          </button>
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
    </div>
  );
}
