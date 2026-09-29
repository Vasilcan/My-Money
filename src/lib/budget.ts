export function getDaysInMonth(year: number, month: number): number {
  // month is 1-indexed
  return new Date(year, month, 0).getDate();
}

export function getRemainingDays(monthIso: string, todayIso: string): number {
  const [yearStr, monthStr] = monthIso.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  const daysInMonth = getDaysInMonth(year, month);
  const monthPrefix = `${yearStr}-${monthStr}`;

  if (todayIso.startsWith(monthPrefix)) {
    // Current month
    const todayDay = parseInt(todayIso.split('-')[2], 10);
    return Math.max(1, daysInMonth - todayDay + 1);
  } else if (todayIso > monthPrefix + '-31') {
    // Past month
    return 0; // No remaining days
  } else {
    // Future month
    return daysInMonth;
  }
}

export function calculateDailyAverageMinor(
  totalBudgetMinor: number,
  totalExpenseMinor: number,
  monthIso: string,
  todayIso: string
): number {
  const remainingBudgetMinor = totalBudgetMinor - totalExpenseMinor;
  
  if (remainingBudgetMinor <= 0) {
    return 0; // Over budget or 0 budget left
  }

  const remainingDays = getRemainingDays(monthIso, todayIso);
  
  if (remainingDays <= 0) {
    return 0; // Month is already past
  }

  return Math.floor(remainingBudgetMinor / remainingDays);
}

export function getCategoryBudgetProgress(
  spentMinor: number,
  budgetMinor: number
): { percentage: number; status: 'green' | 'yellow' | 'red'; excessMinor: number } {
  if (budgetMinor === 0) {
    return {
      percentage: spentMinor > 0 ? 100 : 0,
      status: spentMinor > 0 ? 'red' : 'green',
      excessMinor: spentMinor
    };
  }

  const percentage = Math.round((spentMinor / budgetMinor) * 100);
  
  let status: 'green' | 'yellow' | 'red' = 'green';
  if (percentage >= 100 || spentMinor > budgetMinor) {
    status = 'red';
  } else if (percentage >= 75) {
    status = 'yellow';
  }

  const excessMinor = Math.max(0, spentMinor - budgetMinor);

  return {
    percentage: Math.min(100, percentage), // Cap at 100 for UI purposes (progress bar)
    status,
    excessMinor
  };
}
