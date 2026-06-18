import { Completion, Frequency, HabitDay } from '../types/habit.types';
import { format, subDays, isSameDay, parseISO } from 'date-fns';

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  missedDays: number;
}

export const calculateStreak = (
  completions: Completion[],
  frequency: Frequency,
  habitDays?: HabitDay[] // Only needed for weekly/custom if we want advanced calculation
): StreakStats => {
  if (completions.length === 0) {
    return { currentStreak: 0, longestStreak: 0, missedDays: 0 };
  }

  // Sort completions by date descending (newest first)
  const sortedCompletions = [...completions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let currentStreak = 0;
  let longestStreak = 0;
  let missedDays = 0;
  let tempStreak = 0;

  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const yesterdayStr = format(subDays(today, 1), 'yyyy-MM-dd');

  // Simple daily streak calculation
  if (frequency === 'daily') {
    const dates = new Set(sortedCompletions.map(c => c.date));
    const sortedUniqueDates = Array.from(dates).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime() // newest first
    );

    // ── Current Streak ──
    // Walk backwards from today (or yesterday if not completed today).
    // The streak is only "active" if the most recent completion is today or yesterday.
    if (sortedUniqueDates.length > 0) {
      const mostRecent = sortedUniqueDates[0]; // newest date
      if (mostRecent === todayStr || mostRecent === yesterdayStr) {
        // Start counting from the most recent date backwards
        currentStreak = 1;
        let checkDate = new Date(mostRecent);
        for (let i = 1; i < sortedUniqueDates.length; i++) {
          checkDate = subDays(checkDate, 1);
          const expectedStr = format(checkDate, 'yyyy-MM-dd');
          if (dates.has(expectedStr)) {
            currentStreak++;
          } else {
            break;
          }
        }
      } else {
        currentStreak = 0;
      }
    }

    // ── Longest Streak ──
    // Sort ascending, scan for consecutive day sequences
    const ascDates = Array.from(dates).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );
    if (ascDates.length > 0) {
      let maxSeq = 1;
      let seq = 1;
      for (let i = 1; i < ascDates.length; i++) {
        const prev = new Date(ascDates[i - 1]);
        const curr = new Date(ascDates[i]);
        const diffMs = curr.getTime() - prev.getTime();
        const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          seq++;
          maxSeq = Math.max(maxSeq, seq);
        } else {
          seq = 1;
        }
      }
      longestStreak = Math.max(maxSeq, currentStreak);
    }
  } else {
    // Weekly/custom: only count completions, no streak logic yet
    currentStreak = sortedCompletions.length;
    longestStreak = sortedCompletions.length;
  }

  return { currentStreak, longestStreak, missedDays };
};
