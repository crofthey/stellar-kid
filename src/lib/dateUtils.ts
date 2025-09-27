import {
  startOfWeek,
  endOfWeek,
  addDays,
  getWeek,
  getYear,
  format,
  addWeeks,
  subWeeks,
} from 'date-fns';
const FNS_OPTIONS = { weekStartsOn: 1 } as const; // Monday
export const getWeekInfo = (date: Date) => {
  return {
    year: getYear(date),
    week: getWeek(date, FNS_OPTIONS),
  };
};
export const getWeekDays = (date: Date): Date[] => {
  const start = startOfWeek(date, FNS_OPTIONS);
  return Array.from({ length: 7 }).map((_, i) => addDays(start, i));
};
export const getWeekRangeLabel = (date: Date): string => {
  const start = startOfWeek(date, FNS_OPTIONS);
  const end = endOfWeek(date, FNS_OPTIONS);
  const startMonth = format(start, 'MMMM');
  const endMonth = format(end, 'MMMM');
  if (startMonth === endMonth) {
    return `${format(start, 'MMMM d')} - ${format(end, 'd, yyyy')}`;
  }
  return `${format(start, 'MMMM d')} - ${format(end, 'MMMM d, yyyy')}`;
};
export const getNextWeek = (date: Date): Date => {
  return addWeeks(date, 1);
};
export const getPreviousWeek = (date: Date): Date => {
  return subWeeks(date, 1);
};