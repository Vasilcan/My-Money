import type { Category, TransactionType } from './models';

export interface CategoryValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validates category name for empty string and duplicate check in the same transaction type.
 */
export function validateCategoryName(
  name: string,
  type: TransactionType,
  existingCategories: Category[],
  excludeCategoryId?: string
): CategoryValidationResult {
  const trimmed = name.trim();
  if (!trimmed) {
    return { isValid: false, error: 'Numele categoriei este obligatoriu' };
  }

  const isDuplicate = existingCategories.some(
    (c) =>
      c.id !== excludeCategoryId &&
      c.type === type &&
      c.name.trim().toLowerCase() === trimmed.toLowerCase()
  );

  if (isDuplicate) {
    return {
      isValid: false,
      error: 'Există deja o categorie cu acest nume pentru acest tip',
    };
  }

  return { isValid: true };
}

export const PREDEFINED_PALETTE = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#14b8a6', // Teal
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#64748b', // Slate
];

export const COMMON_EMOJIS = [
  '🍔', '🏠', '🚗', '💊', '🎉', '🛍️', '📺', '☕',
  '🏋️', '✈️', '🎓', '🐾', '💡', '💰', '🎁', '💵',
  '📈', '💼', '💻', '🏷️', '📦', '⭐', '🍕', '🛒',
];
