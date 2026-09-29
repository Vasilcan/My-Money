import { describe, it, expect } from 'vitest';
import { getDaysInMonth, getRemainingDays, calculateDailyAverageMinor, getCategoryBudgetProgress } from './budget';

describe('budget pure functions', () => {
  describe('getDaysInMonth', () => {
    it('returns 31 for January', () => expect(getDaysInMonth(2026, 1)).toBe(31));
    it('returns 28 for non-leap February', () => expect(getDaysInMonth(2026, 2)).toBe(28));
    it('returns 29 for leap February', () => expect(getDaysInMonth(2024, 2)).toBe(29));
    it('returns 30 for April', () => expect(getDaysInMonth(2026, 4)).toBe(30));
  });

  describe('getRemainingDays', () => {
    it('calculates correctly for current month middle', () => {
      expect(getRemainingDays('2026-04', '2026-04-10')).toBe(21); // 30 - 10 + 1
    });

    it('calculates correctly for last day of month', () => {
      expect(getRemainingDays('2026-04', '2026-04-30')).toBe(1);
    });

    it('returns 0 for past month', () => {
      expect(getRemainingDays('2026-03', '2026-04-10')).toBe(0);
    });

    it('returns total days for future month', () => {
      expect(getRemainingDays('2026-05', '2026-04-10')).toBe(31);
    });
  });

  describe('calculateDailyAverageMinor', () => {
    it('calculates average for remaining days', () => {
      // Budget 3000 RON (300000 minor), spent 1000 RON (100000 minor), remaining 200000.
      // 21 days remaining in April. 200000 / 21 = 9523 minor
      expect(calculateDailyAverageMinor(300000, 100000, '2026-04', '2026-04-10')).toBe(9523);
    });

    it('handles zero budget left (returns 0)', () => {
      expect(calculateDailyAverageMinor(100000, 100000, '2026-04', '2026-04-10')).toBe(0);
    });

    it('handles over budget (returns 0)', () => {
      expect(calculateDailyAverageMinor(100000, 200000, '2026-04', '2026-04-10')).toBe(0);
    });

    it('handles last day of month correctly', () => {
      // 1 day left, 2000 RON left -> 2000 RON/day
      expect(calculateDailyAverageMinor(300000, 100000, '2026-04', '2026-04-30')).toBe(200000);
    });

    it('handles future month (divides by total days)', () => {
      // 31 days in May. Remaining 200000. 200000 / 31 = 6451 minor
      expect(calculateDailyAverageMinor(300000, 100000, '2026-05', '2026-04-10')).toBe(6451);
    });

    it('handles past month (returns 0)', () => {
      expect(calculateDailyAverageMinor(300000, 100000, '2026-03', '2026-04-10')).toBe(0);
    });
  });

  describe('getCategoryBudgetProgress', () => {
    it('returns green for <75%', () => {
      const res = getCategoryBudgetProgress(5000, 10000);
      expect(res).toEqual({ percentage: 50, status: 'green', excessMinor: 0 });
    });

    it('returns yellow for >=75% and <100%', () => {
      const res = getCategoryBudgetProgress(7500, 10000);
      expect(res).toEqual({ percentage: 75, status: 'yellow', excessMinor: 0 });
    });

    it('returns red for >=100%', () => {
      const res = getCategoryBudgetProgress(10000, 10000);
      expect(res).toEqual({ percentage: 100, status: 'red', excessMinor: 0 });
    });

    it('returns red and excess for >100%', () => {
      const res = getCategoryBudgetProgress(12000, 10000);
      expect(res).toEqual({ percentage: 100, status: 'red', excessMinor: 2000 });
    });

    it('handles zero budget with no spending (green)', () => {
      const res = getCategoryBudgetProgress(0, 0);
      expect(res).toEqual({ percentage: 0, status: 'green', excessMinor: 0 });
    });

    it('handles zero budget with spending (red)', () => {
      const res = getCategoryBudgetProgress(1000, 0);
      expect(res).toEqual({ percentage: 100, status: 'red', excessMinor: 1000 });
    });
  });
});
