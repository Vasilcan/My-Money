import { describe, it, expect } from 'vitest';
import { toMinor, fromMinor, formatMoney } from './money';

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
      // Note: USD formatting might differ, e.g., "$1,234.56"
      // This test is kept simple to avoid locale-specific failures.
      expect(formatted).toContain('USD');
    });
  });
});
