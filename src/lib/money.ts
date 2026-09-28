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
