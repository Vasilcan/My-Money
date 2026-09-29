import type { TransactionType } from './models';

/**
 * Converts a string or number amount to its minor unit (integer).
 * Handles both dot and comma as decimal separators.
 * Example: toMinor('1,23') -> 123
 * Example: toMinor(12.34) -> 1234
 */
export function toMinor(amount: string | number): number {
  if (typeof amount === 'number') {
    return Math.round(amount * 100);
  }

  const sanitized = amount.replace(',', '.');
  const value = parseFloat(sanitized);

  if (isNaN(value)) {
    return 0;
  }

  return Math.round(value * 100);
}

/**
 * Converts an amount from its minor unit (integer) to a float.
 * Example: fromMinor(1234) -> 12.34
 */
export function fromMinor(minorAmount: number): number {
  return minorAmount / 100;
}

/**
 * Formats a minor unit amount into a human-readable string.
 * Example: formatMoney(123456) -> "1.234,56 RON"
 */
export function formatMoney(minorAmount: number, currency = 'RON'): string {
  const value = fromMinor(minorAmount);
  return new Intl.NumberFormat('ro-RO', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  }).format(value);
}

/**
 * Formats an amount with explicit + / - sign based on transaction type.
 * Income: +50,00 RON
 * Expense: -12,50 RON
 */
export function formatMoneyWithSign(minorAmount: number, type: TransactionType, currency = 'RON'): string {
  const formatted = formatMoney(minorAmount, currency);
  return type === 'income' ? `+${formatted}` : `-${formatted}`;
}

export interface AmountValidationResult {
  isValid: boolean;
  amountMinor: number;
  error?: string;
}

/**
 * Validates and parses user amount input.
 * Supports comma and dot as decimal separators.
 * Rejects negative numbers, 0, non-numbers, and numbers with > 2 decimal places.
 */
export function validateAndParseAmount(input: string): AmountValidationResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { isValid: false, amountMinor: 0, error: 'Introdu suma' };
  }

  const normalized = trimmed.replace(',', '.');

  if (normalized.startsWith('-')) {
    return { isValid: false, amountMinor: 0, error: 'Suma nu poate fi negativă' };
  }

  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    return { isValid: false, amountMinor: 0, error: 'Introdu o sumă validă (ex: 25,50)' };
  }

  if (/\.\d{3,}$/.test(normalized)) {
    return { isValid: false, amountMinor: 0, error: 'Suma poate avea maximum 2 zecimale' };
  }

  const num = parseFloat(normalized);
  if (isNaN(num) || num <= 0) {
    return { isValid: false, amountMinor: 0, error: 'Suma trebuie să fie mai mare de 0' };
  }

  const minor = Math.round(num * 100);
  if (minor <= 0) {
    return { isValid: false, amountMinor: 0, error: 'Suma trebuie să fie mai mare de 0' };
  }

  return { isValid: true, amountMinor: minor };
}

