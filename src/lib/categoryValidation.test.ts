import { describe, it, expect } from 'vitest';
import { validateCategoryName } from './categoryValidation';
import type { Category } from './models';

const mockCategories: Category[] = [
  { id: '1', name: 'Mâncare', type: 'expense', icon: '🍔', color: '#ef4444', isArchived: false, createdAt: '' },
  { id: '2', name: 'Transport', type: 'expense', icon: '🚗', color: '#3b82f6', isArchived: false, createdAt: '' },
  { id: '3', name: 'Salariu', type: 'income', icon: '💰', color: '#10b981', isArchived: false, createdAt: '' },
];

describe('categoryValidation', () => {
  it('should reject empty or whitespace name', () => {
    expect(validateCategoryName('', 'expense', mockCategories)).toEqual({
      isValid: false,
      error: 'Numele categoriei este obligatoriu',
    });
    expect(validateCategoryName('   ', 'expense', mockCategories)).toEqual({
      isValid: false,
      error: 'Numele categoriei este obligatoriu',
    });
  });

  it('should reject duplicate name in the same type (case-insensitive and trimmed)', () => {
    expect(validateCategoryName('mâncare', 'expense', mockCategories)).toEqual({
      isValid: false,
      error: 'Există deja o categorie cu acest nume pentru acest tip',
    });
    expect(validateCategoryName('  MÂNCARE  ', 'expense', mockCategories)).toEqual({
      isValid: false,
      error: 'Există deja o categorie cu acest nume pentru acest tip',
    });
  });

  it('should allow same name in different type', () => {
    // 'Mâncare' in expense exists, but should be allowed in income
    expect(validateCategoryName('Mâncare', 'income', mockCategories)).toEqual({
      isValid: true,
    });
  });

  it('should allow current category to keep its own name when editing (excludeCategoryId)', () => {
    expect(validateCategoryName('Mâncare', 'expense', mockCategories, '1')).toEqual({
      isValid: true,
    });
  });

  it('should accept valid new category name', () => {
    expect(validateCategoryName('Facturi', 'expense', mockCategories)).toEqual({
      isValid: true,
    });
  });
});
