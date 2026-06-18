export type Frequency = 'daily' | 'weekly' | 'custom';
export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface Habit {
  id: string;
  profile_id: string;
  category_id?: string | null;
  title: string;
  description?: string | null;
  frequency: Frequency;
  color?: string | null;
  icon?: string | null;
  reminder_time?: string | null;
  is_archived: number;
  created_at: string;
}

export interface HabitDay {
  id: string;
  habit_id: string;
  day: DayOfWeek;
}

export interface Completion {
  id: string;
  habit_id: string;
  date: string; // YYYY-MM-DD
  completed_at: string; // ISO 8601
  note?: string | null;
}
