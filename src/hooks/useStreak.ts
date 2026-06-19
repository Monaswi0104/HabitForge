import { useMemo } from 'react';
import { useHabitStore } from '../store/habitStore';
import { calculateStreak } from '../utils/streakCalculator';

export const useStreak = (habitId: string) => {
  const habits = useHabitStore(state => state.habits);
  const completions = useHabitStore(state => state.completions);
  
  const streakData = useMemo(() => {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return { currentStreak: 0, longestStreak: 0, missedDays: 0 };
    
    const habitCompletions = completions.filter(c => c.habit_id === habitId);
    return calculateStreak(habitCompletions, habit.frequency);
  }, [habits, completions, habitId]);

  return streakData;
};

export const useOverallStreak = (profileId: string | null) => {
  const habits = useHabitStore(state => state.habits);
  const completions = useHabitStore(state => state.completions);

  const overallStreakData = useMemo(() => {
    if (!profileId) return { currentStreak: 0, longestStreak: 0 };
    
    const profileHabits = habits.filter(h => h.profile_id === profileId);
    let overallCurrentStreak = 0;
    let overallLongestStreak = 0;

    profileHabits.forEach(habit => {
      const habitCompletions = completions.filter(c => c.habit_id === habit.id);
      const { currentStreak, longestStreak } = calculateStreak(habitCompletions, habit.frequency);
      if (currentStreak > overallCurrentStreak) overallCurrentStreak = currentStreak;
      if (longestStreak > overallLongestStreak) overallLongestStreak = longestStreak;
    });

    return {
      currentStreak: overallCurrentStreak,
      longestStreak: overallLongestStreak
    };
  }, [profileId, habits, completions]);

  return overallStreakData;
};
