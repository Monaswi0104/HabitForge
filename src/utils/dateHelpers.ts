import { format, parseISO, isSameDay as fnsIsSameDay, eachDayOfInterval, startOfDay, endOfDay, differenceInDays } from 'date-fns';

export const getTodayStr = (): string => {
  return format(new Date(), 'yyyy-MM-dd');
};

export const formatDate = (date: Date | string, formatStr: string = 'yyyy-MM-dd'): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, formatStr);
};

export const isSameDay = (date1: Date | string, date2: Date | string): boolean => {
  const d1 = typeof date1 === 'string' ? parseISO(date1) : date1;
  const d2 = typeof date2 === 'string' ? parseISO(date2) : date2;
  return fnsIsSameDay(d1, d2);
};

export const getDatesInRange = (startDate: Date | string, endDate: Date | string): Date[] => {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
  return eachDayOfInterval({ start, end });
};

export const getStartOfDay = (date: Date | string = new Date()): Date => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return startOfDay(d);
};

export const getEndOfDay = (date: Date | string = new Date()): Date => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return endOfDay(d);
};

export const getDaysDifference = (dateLeft: Date | string, dateRight: Date | string): number => {
  const dl = typeof dateLeft === 'string' ? parseISO(dateLeft) : dateLeft;
  const dr = typeof dateRight === 'string' ? parseISO(dateRight) : dateRight;
  return Math.abs(differenceInDays(dl, dr));
};
