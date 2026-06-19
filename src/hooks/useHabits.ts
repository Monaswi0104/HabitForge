import { useHabitStore } from '../store/habitStore';
import { useProfileStore } from '../store/profileStore';
import { useMemo } from 'react';

export const useActiveHabits = () => {
  const { habits } = useHabitStore();
  const { activeProfileId } = useProfileStore();

  return useMemo(() => {
    return habits.filter(h => h.profile_id === activeProfileId);
  }, [habits, activeProfileId]);
};

export const useHabitById = (id: string) => {
  const { habits } = useHabitStore();
  
  return useMemo(() => {
    return habits.find(h => h.id === id);
  }, [habits, id]);
};
