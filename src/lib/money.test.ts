import { describe, it, expect } from 'vitest';
import { toMinor, fromMinor, formatMoney, formatMoneyWithSign, validateAndParseAmount } from './money';

describe('money utilities', () => {
  describe('toMinor', () => {
    it('should convert a positive integer number to minor units', () => {
      expect(toMinor(123)).toBe(12300);
    });

    it('should convert a positive float number to minor units', () => {
      expect(toMinor(123.45)).toBe(12345);
    });

    it('should handle floating point inaccuracies correctly (0.1 + 0.2)', () => {
      expect(toMinor(0.1 + 0.2)).toBe(30);
    });

    it('should convert a string with a dot separator to minor units', () => {
      expect(toMinor('123.45')).toBe(12345);
    });

    it('should convert a string with a comma separator to minor units', () => {
      expect(toMinor('123,45')).toBe(12345);
    });

    it('should handle negative numbers correctly', () => {
      expect(toMinor(-50.25)).toBe(-5025);
      expect(toMinor('-50,25')).toBe(-5025);
    });

    it('should return 0 for an invalid string', () => {
      expect(toMinor('invalid')).toBe(0);
    });

    it('should handle zero correctly', () => {
      expect(toMinor(0)).toBe(0);
      expect(toMinor('0')).toBe(0);
    });
  });

  describe('fromMinor', () => {
    it('should convert a positive minor unit to a float', () => {
      expect(fromMinor(12345)).toBe(123.45);
    });

    it('should convert a negative minor unit to a float', () => {
      expect(fromMinor(-12345)).toBe(-123.45);
    });

    it('should handle zero correctly', () => {
      expect(fromMinor(0)).toBe(0);
    });
  });

  describe('formatMoney', () => {
    it('should format a positive amount correctly in RON', () => {
      // The exact format depends on the testing environment's locale data.
      // We check for the main parts.
      const formatted = formatMoney(123456);
      expect(formatted).toContain('1.234,56');
      expect(formatted).toContain('RON');
    });

    it('should format a negative amount correctly', () => {
      const formatted = formatMoney(-123456);
      expect(formatted).toContain('-1.234,56');
      expect(formatted).toContain('RON');
    });

    it('should format zero correctly', () => {
      const formatted = formatMoney(0);
      expect(formatted).toContain('0,00');
      expect(formatted).toContain('RON');
    });

    it('should use a different currency when provided', () => {
      const formatted = formatMoney(123456, 'USD');
      expect(formatted).not.toContain('RON');
      expect(formatted).toContain('USD');
    });
  });

  describe('formatMoneyWithSign', () => {
    it('should format expense with minus prefix', () => {
      const formatted = formatMoneyWithSign(5000, 'expense');
      expect(formatted).toContain('-');
      expect(formatted).toContain('50,00');
    });

    it('should format income with plus prefix', () => {
      const formatted = formatMoneyWithSign(10000, 'income');
      expect(formatted).toContain('+');
      expect(formatted).toContain('100,00');
    });
  });

  describe('validateAndParseAmount', () => {
    it('should return error for empty or blank input', () => {
      expect(validateAndParseAmount('')).toEqual({
        isValid: false,
        amountMinor: 0,
        error: 'Introdu suma',
      });
      expect(validateAndParseAmount('   ')).toEqual({
        isValid: false,
        amountMinor: 0,
        error: 'Introdu suma',
      });
    });

    it('should return error for negative numbers', () => {
      const result = validateAndParseAmount('-15');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Suma nu poate fi negativă');
    });

    it('should return error for zero', () => {
      const result = validateAndParseAmount('0');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Suma trebuie să fie mai mare de 0');

      const resultDec = validateAndParseAmount('0,00');
      expect(resultDec.isValid).toBe(false);
      expect(resultDec.error).toBe('Suma trebuie să fie mai mare de 0');
    });

    it('should return error for invalid characters', () => {
      expect(validateAndParseAmount('abc').isValid).toBe(false);
      expect(validateAndParseAmount('12.3.4').isValid).toBe(false);
    });

    it('should return error for more than 2 decimal digits', () => {
      const result = validateAndParseAmount('12.345');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Suma poate avea maximum 2 zecimale');
    });

    it('should successfully parse valid whole and decimal numbers with dot or comma', () => {
      expect(validateAndParseAmount('10')).toEqual({
        isValid: true,
        amountMinor: 1000,
      });
      expect(validateAndParseAmount('10.5')).toEqual({
        isValid: true,
        amountMinor: 1050,
      });
      expect(validateAndParseAmount('10,50')).toEqual({
        isValid: true,
        amountMinor: 1050,
      });
      expect(validateAndParseAmount('99,99')).toEqual({
        isValid: true,
        amountMinor: 9999,
      });
    });
  });
});

