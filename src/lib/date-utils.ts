import {
  format,
  addMonths,
  subDays,
  startOfMonth,
  endOfMonth,
  isWithinInterval,
} from 'date-fns';

export function formatDate(date: string | Date) {
  return format(new Date(date), 'dd MMM, yyyy');
}

export function formatDateTime(date: string | Date) {
  return format(new Date(date), 'dd MMM, yyyy HH:mm');
}

export function quarterRange(year: number, quarter: 1 | 2 | 3 | 4) {
  const startMonth = (quarter - 1) * 3; // 0-indexed month (0-11)
  const start = new Date(Date.UTC(year, startMonth, 1));
  const end = new Date(Date.UTC(year, startMonth + 3, 0, 23, 59, 59, 999)); // Last day of quarter

  return {
    start,
    end,
    startISO: start.toISOString(),
    endISO: end.toISOString(),
    startFormatted: formatDate(start),
    endFormatted: formatDate(end),
  };
}

export function getCurrentQuarter() {
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-11
  const currentQuarter = (Math.floor(currentMonth / 3) + 1) as 1 | 2 | 3 | 4;
  return {
    quarter: currentQuarter,
    year: now.getFullYear(),
    ...quarterRange(now.getFullYear(), currentQuarter),
  };
}

export function isDateInQuarter(
  date: Date,
  year: number,
  quarter: 1 | 2 | 3 | 4
) {
  const { start, end } = quarterRange(year, quarter);
  return isWithinInterval(date, { start, end });
}

export function getQuartersInRange(startDate: Date, endDate: Date) {
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  const quarters: Array<{ year: number; quarter: 1 | 2 | 3 | 4 }> = [];

  for (let year = startYear; year <= endYear; year++) {
    const startQuarter =
      year === startYear ? Math.floor(startDate.getMonth() / 3) + 1 : 1;
    const endQuarter =
      year === endYear ? Math.floor(endDate.getMonth() / 3) + 1 : 4;

    for (let q = startQuarter as 1 | 2 | 3 | 4; q <= endQuarter; q++) {
      quarters.push({ year, quarter: q as 1 | 2 | 3 | 4 });
    }
  }

  return quarters;
}
