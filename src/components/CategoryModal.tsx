import { useState, useRef } from 'react';
import type { Category, TransactionType } from '../lib/models';
import { addCategory, updateCategory } from '../lib/repository';
import {
  validateCategoryName,
  PREDEFINED_PALETTE,
  COMMON_EMOJIS,
} from '../lib/categoryValidation';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingCategory?: Category | null;
  defaultType?: TransactionType;
  allCategories: Category[];
}

export default function CategoryModal({
  isOpen,
  onClose,
  editingCategory = null,
  defaultType = 'expense',
  allCategories,
}: CategoryModalProps) {
  if (!isOpen) return null;

  return (
    <CategoryModalInner
      key={editingCategory ? editingCategory.id : `new-${defaultType}`}
      onClose={onClose}
      editingCategory={editingCategory}
      defaultType={defaultType}
      allCategories={allCategories}
    />
  );
}

function CategoryModalInner({
  onClose,
  editingCategory,
  defaultType,
  allCategories,
}: {
  onClose: () => void;
  editingCategory: Category | null;
  defaultType: TransactionType;
  allCategories: Category[];
}) {
  const [type, setType] = useState<TransactionType>(
    editingCategory ? editingCategory.type : defaultType
  );
  const [name, setName] = useState(editingCategory ? editingCategory.name : '');
  const [icon, setIcon] = useState(editingCategory ? editingCategory.icon : '🏷️');
  const [color, setColor] = useState(
    editingCategory ? editingCategory.color : PREDEFINED_PALETTE[3] // Emerald default
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formTouched, setFormTouched] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);

  const validation = validateCategoryName(
    name,
    type,
    allCategories,
    editingCategory?.id
  );
  const isFormValid = validation.isValid && icon.trim().length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormTouched(true);

    if (!isFormValid || isSubmitting) return;

    try {
      setIsSubmitting(true);
      if (editingCategory) {
        await updateCategory(editingCategory.id, {
          name: name.trim(),
          type,
          icon: icon.trim(),
          color,
        });
      } else {
        await addCategory({
          name: name.trim(),
          type,
          icon: icon.trim(),
          color,
        });
      }
      onClose();
    } catch (err: unknown) {
      console.error('Failed to save category:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="category-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile handle indicator */}
        <div className="w-12 h-1.5 bg-gray-300 rounded-full mx-auto mt-3 mb-1 sm:hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2 border-b border-gray-100 dark:border-gray-700">
          <h2 id="category-modal-title" className="text-lg font-bold text-gray-900 dark:text-white">
            {editingCategory ? 'Editează categoria' : 'Categorie nouă'}
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
          {/* Type Switcher */}
          {!editingCategory ? (
            <div className="flex p-1 bg-gray-100 dark:bg-gray-700 rounded-2xl">
              <button
                type="button"
                onClick={() => setType('expense')}
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
                onClick={() => setType('income')}
                className={`flex-1 min-h-[44px] py-2.5 text-sm font-semibold rounded-xl transition-all ${
                  type === 'income'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:text-white'
                }`}
              >
                Venit
              </button>
            </div>
          ) : (
            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-900 rounded-xl text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-2">
              <span>Tip categorie:</span>
              <span
                className={`font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${
                  type === 'expense'
                    ? 'bg-red-100 text-red-700'
                    : 'bg-emerald-100 text-emerald-700'
                }`}
              >
                {type === 'expense' ? 'Cheltuială' : 'Venit'}
              </span>
            </div>
          )}

          {/* Name Field */}
          <div>
            <label
              htmlFor="category-name-input"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nume categorie *
            </label>
            <input
              id="category-name-input"
              ref={nameInputRef}
              type="text"
              autoFocus
              maxLength={40}
              placeholder="Ex: Sală de sport, Cafea, etc."
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!formTouched) setFormTouched(true);
              }}
              className={`w-full min-h-[48px] px-4 rounded-xl border text-base font-medium outline-none transition-all ${
                formTouched && !validation.isValid
                  ? 'border-red-400 bg-red-50/50 text-red-900 focus:ring-2 focus:ring-red-400'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
              }`}
            />
            {formTouched && !validation.isValid && (
              <p className="mt-1 text-xs text-red-600 font-medium">{validation.error}</p>
            )}
          </div>

          {/* Emoji Picker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Pictogramă (Emoji)
            </label>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-sm border border-gray-100 dark:border-gray-700 shrink-0 transition-transform active:scale-95"
                style={{ backgroundColor: `${color}20` }}
              >
                {icon || '❓'}
              </div>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                maxLength={4}
                placeholder="Introdu emoji"
                className="flex-1 min-h-[44px] px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none"
              />
            </div>

            {/* Suggested Emojis */}
            <div className="p-2 bg-gray-50 dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-700">
              <span className="block text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1.5 px-1">
                Sugestii populare:
              </span>
              <div className="grid grid-cols-8 gap-1">
                {COMMON_EMOJIS.map((emojiOption) => (
                  <button
                    key={emojiOption}
                    type="button"
                    onClick={() => setIcon(emojiOption)}
                    className={`min-h-[44px] flex items-center justify-center rounded-xl text-xl hover:bg-white dark:bg-gray-800 transition-transform active:scale-90 ${
                      icon === emojiOption
                        ? 'bg-white dark:bg-gray-800 shadow-sm ring-2 ring-emerald-500/40'
                        : ''
                    }`}
                  >
                    {emojiOption}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Color Palette */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Culoare
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-6 gap-2">
              {PREDEFINED_PALETTE.map((paletteColor) => {
                const isSelected = color === paletteColor;
                return (
                  <button
                    key={paletteColor}
                    type="button"
                    onClick={() => setColor(paletteColor)}
                    aria-label={`Culoare ${paletteColor}`}
                    aria-pressed={isSelected}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-2xl transition-all active:scale-90"
                    style={{ backgroundColor: paletteColor }}
                  >
                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-white dark:bg-gray-800 shadow-sm flex items-center justify-center text-xs text-gray-900 dark:text-white font-bold">
                        ✓
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Save Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={!isFormValid || isSubmitting}
              className="w-full min-h-[48px] py-3 px-4 rounded-2xl font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:text-gray-500 dark:text-gray-400 disabled:cursor-not-allowed transition-all shadow-md active:scale-[0.99] flex items-center justify-center"
            >
              {isSubmitting
                ? 'Se salvează...'
                : editingCategory
                ? 'Actualizează categoria'
                : 'Adaugă categoria'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
