import { useState, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../lib/db';
import type { Transaction, TransactionType } from '../lib/models';
import { addTransaction, updateTransaction, deleteTransaction } from '../lib/repository';
import { validateAndParseAmount, fromMinor } from '../lib/money';
import { getTodayIsoString } from '../lib/date';
import ConfirmDialog from './ConfirmDialog';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTransaction?: Transaction | null;
  defaultType?: TransactionType;
}

export default function TransactionModal({
  isOpen,
  onClose,
  editingTransaction = null,
  defaultType = 'expense',
}: TransactionModalProps) {
  if (!isOpen) return null;

  return (
    <TransactionModalInner
      key={editingTransaction ? editingTransaction.id : `new-${defaultType}`}
      onClose={onClose}
      editingTransaction={editingTransaction}
      defaultType={defaultType}
    />
  );
}

function TransactionModalInner({
  onClose,
  editingTransaction,
  defaultType,
}: {
  onClose: () => void;
  editingTransaction: Transaction | null;
  defaultType: TransactionType;
}) {
  const [type, setType] = useState<TransactionType>(
    editingTransaction ? editingTransaction.type : defaultType
  );
  const [amountStr, setAmountStr] = useState(
    editingTransaction
      ? fromMinor(editingTransaction.amountMinor).toFixed(2).replace('.', ',')
      : ''
  );
  const [categoryId, setCategoryId] = useState(
    editingTransaction ? editingTransaction.categoryId : ''
  );
  const [date, setDate] = useState(
    editingTransaction ? editingTransaction.date : getTodayIsoString()
  );
  const [note, setNote] = useState(editingTransaction?.note || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [formTouched, setFormTouched] = useState(false);

  const amountInputRef = useRef<HTMLInputElement>(null);

  // Load all categories and settings
  const allCategories = useLiveQuery(() => db.categories.toArray(), []) || [];
  const settings = useLiveQuery(() => db.settings.get('settings'), []);
  const currency = settings?.currency || 'RON';

  // Categories filtered by the selected type
  const availableCategories = allCategories.filter((c) => {
    if (c.type !== type) return false;
    if (c.isArchived) {
      // Include archived category only if it is the current transaction's category
      return editingTransaction?.categoryId === c.id;
    }
    return true;
  });

  // When type changes, clear category if it belongs to different type
  const handleTypeChange = (newType: TransactionType) => {
    if (newType !== type) {
      setType(newType);
      const currentCat = allCategories.find((c) => c.id === categoryId);
      if (currentCat && currentCat.type !== newType) {
        setCategoryId('');
      }
    }
  };

  // Validation
  const amountValidation = validateAndParseAmount(amountStr);
  const isCategoryValid = Boolean(categoryId && availableCategories.some((c) => c.id === categoryId));
  const isDateValid = /^\d{4}-\d{2}-\d{2}$/.test(date);
  const isFormValid = amountValidation.isValid && isCategoryValid && isDateValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormTouched(true);

    if (!isFormValid || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const data = {
        type,
        amountMinor: amountValidation.amountMinor,
        categoryId,
        date,
        note: note.trim() || undefined,
      };

      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, data);
      } else {
        await addTransaction(data);
      }

      onClose();
    } catch (err) {
      console.error('Failed to save transaction:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!editingTransaction) return;
    try {
      setIsSubmitting(true);
      await deleteTransaction(editingTransaction.id);
      setShowConfirmDelete(false);
      onClose();
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs"
        onClick={onClose}
      >
        <div
          className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile swipe indicator */}
          <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-1 sm:hidden" />

          {/* Modal Header */}
          <div className="flex items-center justify-between px-5 pt-3 pb-2 border-b border-gray-100 dark:border-gray-700">
            <h2 id="modal-title" className="text-lg font-bold text-gray-900 dark:text-white">
              {editingTransaction ? 'Editează tranzacția' : 'Tranzacție nouă'}
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Închide"
              className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Modal Body */}
          <form onSubmit={handleSubmit} className="overflow-y-auto px-5 py-4 space-y-4">
            {/* Type Switcher: Cheltuială / Venit */}
            <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-2xl">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`flex-1 min-h-[44px] py-2.5 text-sm font-semibold rounded-xl transition-all ${
                  type === 'expense'
                    ? 'bg-red-500 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-white'
                }`}
              >
                Cheltuială
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`flex-1 min-h-[44px] py-2.5 text-sm font-semibold rounded-xl transition-all ${
                  type === 'income'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-white'
                }`}
              >
                Venit
              </button>
            </div>

            {/* Amount Field */}
            <div>
              <label
                htmlFor="transaction-amount-input"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Sumă *
              </label>
              <div className="relative rounded-2xl">
                <input
                  id="transaction-amount-input"
                  ref={amountInputRef}
                  type="text"
                  inputMode="decimal"
                  autoFocus
                  placeholder="0,00"
                  value={amountStr}
                  onChange={(e) => {
                    setAmountStr(e.target.value);
                    if (!formTouched) setFormTouched(true);
                  }}
                  className={`w-full min-h-[52px] text-2xl font-bold px-4 pr-16 rounded-2xl border transition-all outline-none ${
                    formTouched && !amountValidation.isValid
                      ? 'border-red-400 bg-red-50/50 text-red-900 focus:ring-2 focus:ring-red-400'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
                  }`}
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-lg pointer-events-none">
                  {currency}
                </span>
              </div>
              {formTouched && !amountValidation.isValid && (
                <p className="mt-1 text-xs text-red-600 font-medium">
                  {amountValidation.error}
                </p>
              )}
            </div>

            {/* Category Grid (Buttons with emoji) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Categorie *
                </label>
                {formTouched && !isCategoryValid && (
                  <span className="text-xs text-red-600 font-medium">
                    Alege o categorie
                  </span>
                )}
              </div>

              {availableCategories.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-3 text-center">
                  Nu există categorii disponibile pentru acest tip.
                </p>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
                  {availableCategories.map((cat) => {
                    const isSelected = categoryId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setCategoryId(cat.id);
                          if (!formTouched) setFormTouched(true);
                        }}
                        aria-pressed={isSelected}
                        className={`flex flex-col items-center justify-center p-2 rounded-2xl min-h-[64px] transition-all border ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-semibold shadow-sm ring-2 ring-emerald-500/30'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:bg-gray-900 text-gray-700'
                        }`}
                      >
                        <span className="text-2xl mb-1">{cat.icon}</span>
                        <span className="text-[11px] leading-tight text-center truncate w-full">
                          {cat.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Date Field with quick buttons */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="transaction-date-input"
                  className="block text-sm font-medium text-gray-700"
                >
                  Dată *
                </label>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setDate(getTodayIsoString())}
                    className="text-xs font-medium px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 text-gray-700"
                  >
                    Azi
                  </button>
                </div>
              </div>
              <input
                id="transaction-date-input"
                type="date"
                min={`${new Date().getFullYear() - 10}-01-01`}
                max={`${new Date().getFullYear() + 10}-12-31`}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
              />
            </div>

            {/* Optional Note Field */}
            <div>
              <label
                htmlFor="transaction-note-input"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Notă (opțional)
              </label>
              <input
                id="transaction-note-input"
                type="text"
                maxLength={100}
                placeholder="Ex: Prânz la birou, benzină, etc."
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full min-h-[44px] px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="submit"
                disabled={!isFormValid || isSubmitting}
                className="w-full min-h-[48px] py-3 px-4 rounded-2xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:text-gray-500 dark:text-gray-400 disabled:cursor-not-allowed transition-all shadow-md active:scale-[0.99] flex items-center justify-center"
              >
                {isSubmitting
                  ? 'Se salvează...'
                  : editingTransaction
                  ? 'Actualizează'
                  : 'Salvează'}
              </button>

              {editingTransaction && (
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(true)}
                  disabled={isSubmitting}
                  className="w-full min-h-[44px] py-2.5 px-4 rounded-2xl font-medium text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center text-sm"
                >
                  Șterge tranzacția
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={showConfirmDelete}
        title="Ștergere tranzacție"
        message="Ești sigur că vrei să ștergi această tranzacție? Datele nu vor mai putea fi recuperate."
        confirmLabel="Da, șterge"
        cancelLabel="Anulează"
        onConfirm={handleDelete}
        onCancel={() => setShowConfirmDelete(false)}
      />
    </>
  );
}
