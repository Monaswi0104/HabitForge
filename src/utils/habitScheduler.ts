import { Habit, DayOfWeek } from '../types/habit.types';
import { getTodayStr, getDatesInRange } from './dateHelpers';
import { isSameDay, parseISO } from 'date-fns';

export const isHabitDueToday = (habit: Habit, days: DayOfWeek[]): boolean => {
  if (habit.frequency === 'daily') return true;
  
  const todayDate = new Date();
  const dayNames: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const todayName = dayNames[todayDate.getDay()];
  
  if (habit.frequency === 'weekly' || habit.frequency === 'custom') {
    return days.includes(todayName);
  }
  
  return false;
};
