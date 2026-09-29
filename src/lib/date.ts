const RO_MONTHS = [
  'ianuarie',
  'februarie',
  'martie',
  'aprilie',
  'mai',
  'iunie',
  'iulie',
  'august',
  'septembrie',
  'octombrie',
  'noiembrie',
  'decembrie',
];

const RO_DAYS = [
  'Duminică',
  'Luni',
  'Marți',
  'Miercuri',
  'Joi',
  'Vineri',
  'Sâmbătă',
];

/**
 * Returns today's date formatted as YYYY-MM-DD in local time.
 */
export function getTodayIsoString(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns current month formatted as YYYY-MM in local time.
 */
export function getCurrentMonthIso(now = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Calculates previous month string (YYYY-MM).
 * Example: '2026-03' -> '2026-02', '2026-01' -> '2025-12'
 */
export function getPreviousMonth(monthIso: string): string {
  const [yearStr, monthStr] = monthIso.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10);

  if (month === 1) {
    month = 12;
    year -= 1;
  } else {
    month -= 1;
  }

  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Calculates next month string (YYYY-MM).
 * Example: '2026-03' -> '2026-04', '2026-12' -> '2027-01'
 */
export function getNextMonth(monthIso: string): string {
  const [yearStr, monthStr] = monthIso.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10);

  if (month === 12) {
    month = 1;
    year += 1;
  } else {
    month += 1;
  }

  return `${year}-${String(month).padStart(2, '0')}`;
}

/**
 * Formats YYYY-MM into Romanian localized display.
 * Example: '2026-03' -> 'Martie 2026'
 */
export function formatMonthDisplay(monthIso: string): string {
  const [yearStr, monthStr] = monthIso.split('-');
  const year = parseInt(yearStr, 10);
  const monthIndex = parseInt(monthStr, 10) - 1;

  if (monthIndex < 0 || monthIndex > 11) {
    return monthIso;
  }

  const rawMonthName = RO_MONTHS[monthIndex];
  const capitalized = rawMonthName.charAt(0).toUpperCase() + rawMonthName.slice(1);
  return `${capitalized} ${year}`;
}

/**
 * Formats YYYY-MM-DD into Romanian localized date.
 * Example: '2026-03-29' -> '29 martie 2026'
 */
export function formatDateDisplay(dateIso: string): string {
  const parts = dateIso.split('-');
  if (parts.length !== 3) return dateIso;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  const monthName = RO_MONTHS[month - 1];
  if (!monthName) return dateIso;

  return `${day} ${monthName} ${year}`;
}

/**
 * Formats day group header for transactions list.
 * If date matches today: 'Azi, 29 martie'
 * If date matches yesterday: 'Ieri, 28 martie'
 * Otherwise: 'Duminică, 29 martie 2026'
 */
export function formatDayHeader(dateIso: string, referenceTodayIso?: string): string {
  const todayIso = referenceTodayIso || getTodayIsoString();

  const parts = dateIso.split('-');
  if (parts.length !== 3) return dateIso;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  const monthName = RO_MONTHS[month - 1];
  if (!monthName) return dateIso;

  // Calculate yesterday from todayIso
  const [refYear, refMonth, refDay] = todayIso.split('-').map(Number);
  const refDate = new Date(refYear, refMonth - 1, refDay);
  refDate.setDate(refDate.getDate() - 1);
  const yesterdayIso = `${refDate.getFullYear()}-${String(refDate.getMonth() + 1).padStart(2, '0')}-${String(refDate.getDate()).padStart(2, '0')}`;

  if (dateIso === todayIso) {
    return `Azi, ${day} ${monthName}`;
  }

  if (dateIso === yesterdayIso) {
    return `Ieri, ${day} ${monthName}`;
  }

  const targetDate = new Date(year, month - 1, day);
  const dayOfWeek = RO_DAYS[targetDate.getDay()];

  return `${dayOfWeek}, ${day} ${monthName} ${year}`;
}
