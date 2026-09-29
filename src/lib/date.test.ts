import { describe, it, expect } from 'vitest';
import {
  getTodayIsoString,
  getCurrentMonthIso,
  getPreviousMonth,
  getNextMonth,
  formatMonthDisplay,
  formatDateDisplay,
  formatDayHeader,
  formatShortMonth,
  getPastMonths,
  getMonthDateRange,
} from './date';

describe('date utilities', () => {
  it('should return today formatted as YYYY-MM-DD from given date', () => {
    const fixed = new Date(2026, 2, 29); // March 29, 2026
    expect(getTodayIsoString(fixed)).toBe('2026-03-29');
  });

  it('should return current month formatted as YYYY-MM', () => {
    const fixed = new Date(2026, 0, 5); // January 5, 2026
    expect(getCurrentMonthIso(fixed)).toBe('2026-01');
  });

  it('should calculate previous month correctly, including year boundary', () => {
    expect(getPreviousMonth('2026-03')).toBe('2026-02');
    expect(getPreviousMonth('2026-01')).toBe('2025-12');
  });

  it('should calculate next month correctly, including year boundary', () => {
    expect(getNextMonth('2026-03')).toBe('2026-04');
    expect(getNextMonth('2026-12')).toBe('2027-01');
  });

  it('should format month display in Romanian', () => {
    expect(formatMonthDisplay('2026-03')).toBe('Martie 2026');
    expect(formatMonthDisplay('2025-12')).toBe('Decembrie 2025');
  });

  it('should format date display in Romanian', () => {
    expect(formatDateDisplay('2026-03-29')).toBe('29 martie 2026');
  });

  it('should format day header as Azi for today', () => {
    const header = formatDayHeader('2026-03-29', '2026-03-29');
    expect(header).toBe('Azi, 29 martie');
  });

  it('should format day header as Ieri for yesterday', () => {
    const header = formatDayHeader('2026-03-28', '2026-03-29');
    expect(header).toBe('Ieri, 28 martie');
  });

  it('should format day header with weekday for other dates', () => {
    // 2026-03-25 was Wednesday (Miercuri)
    const header = formatDayHeader('2026-03-25', '2026-03-29');
    expect(header).toBe('Miercuri, 25 martie 2026');
  });

  it('should format short month in Romanian', () => {
    expect(formatShortMonth('2026-01')).toBe('Ian');
    expect(formatShortMonth('2026-03')).toBe('Mar');
    expect(formatShortMonth('2026-12')).toBe('Dec');
  });

  it('should return past N months ending at given month', () => {
    expect(getPastMonths('2026-03', 3)).toEqual(['2026-01', '2026-02', '2026-03']);
    expect(getPastMonths('2026-02', 4)).toEqual(['2025-11', '2025-12', '2026-01', '2026-02']);
    expect(getPastMonths('2026-03', 0)).toEqual([]);
  });

  it('should return start and end dates for a month', () => {
    expect(getMonthDateRange('2026-03')).toEqual({ startDate: '2026-03-01', endDate: '2026-03-31' });
    expect(getMonthDateRange('2026-02')).toEqual({ startDate: '2026-02-01', endDate: '2026-02-28' });
    expect(getMonthDateRange('2024-02')).toEqual({ startDate: '2024-02-01', endDate: '2024-02-29' }); // leap year
  });
});
