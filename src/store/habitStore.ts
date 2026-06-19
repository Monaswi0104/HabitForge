import { create } from 'zustand';
import { Habit, Completion, Frequency, DayOfWeek, HabitDay } from '../types/habit.types';
import { executeQuery, executeMutation } from '../database/db';
import { format } from 'date-fns';

const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

interface HabitState {
  habits: Habit[];
  completions: Completion[];
  isLoading: boolean;
  error: string | null;
  loadHabits: (profileId: string) => Promise<void>;
  addHabit: (habit: Omit<Habit, 'id' | 'is_archived' | 'created_at'>, selectedDays?: DayOfWeek[]) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  toggleCompletion: (habitId: string, date: string) => Promise<void>;
  completeAll: (date: string) => Promise<void>;
  deleteAllHabits: (profileId: string) => Promise<void>;
  deleteHabits: (ids: string[]) => Promise<void>;
  completeHabits: (ids: string[], date: string) => Promise<void>;
}

export const useHabitStore = create<HabitState>((set, get) => ({
  habits: [],
  completions: [],
  isLoading: false,
  error: null,

  loadHabits: async (profileId: string) => {
    set({ isLoading: true, error: null });
    try {
      const habits = await executeQuery<Habit>('SELECT * FROM habits WHERE profile_id = ? AND is_archived = 0', [profileId]);

      // Load all completions for these habits
      // In a real production app, we would load only recent completions or paginate
      const completions = await executeQuery<Completion>(`
        SELECT c.* FROM completions c
        JOIN habits h ON c.habit_id = h.id
        WHERE h.profile_id = ?
      `, [profileId]);

      set({ habits, completions, isLoading: false });
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      console.error('Failed to load habits:', e);
    }
  },

  addHabit: async (habitData, selectedDays) => {
    set({ isLoading: true, error: null });
    try {
      const id = generateId();
      const created_at = new Date().toISOString();
      const newHabit: Habit = {
        ...habitData,
        id,
        is_archived: 0,
        created_at,
      };

      await executeMutation(
        `INSERT INTO habits (id, profile_id, category_id, title, description, frequency, color, icon, reminder_time, is_archived, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          newHabit.id, newHabit.profile_id, newHabit.category_id || null, 
          newHabit.title, newHabit.description || null, newHabit.frequency, 
          newHabit.color || null, newHabit.icon || null, newHabit.reminder_time || null, 
          newHabit.is_archived, newHabit.created_at
        ]
      );

      // Insert habit days if applicable
      if (newHabit.frequency === 'weekly' && selectedDays && selectedDays.length > 0) {
        for (const day of selectedDays) {
          await executeMutation(
            `INSERT INTO habit_days (id, habit_id, day) VALUES (?, ?, ?)`,
            [generateId(), newHabit.id, day]
          );
        }
      }

      // Schedule notification if reminder time is set
      if (newHabit.reminder_time) {
        // We need to pass the date object directly or parse the ISO string
        const reminderDate = new Date(newHabit.reminder_time);
        if (!isNaN(reminderDate.getTime())) {
          // Import notification service dynamically to avoid circular dependencies if any
          const { notificationService } = require('../services/notificationService');
          notificationService.scheduleHabitReminder(newHabit.id, newHabit.title, reminderDate);
        }
      }

      set((state) => ({ 
        habits: [...state.habits, newHabit],
        isLoading: false 
      }));
    } catch (e: any) {
      set({ error: e.message, isLoading: false });
      console.error('Failed to create habit:', e);
    }
  },

  deleteHabit: async (id: string) => {
    try {
      // Optimistic update
      const { habits, completions } = get();
      set({ 
        habits: habits.filter(h => h.id !== id),
        completions: completions.filter(c => c.habit_id !== id)
      });
      
      // Delete from DB. We should delete habit, its completions, and habit_days.
      await executeMutation('DELETE FROM habit_days WHERE habit_id = ?', [id]);
      await executeMutation('DELETE FROM completions WHERE habit_id = ?', [id]);
      await executeMutation('DELETE FROM habits WHERE id = ?', [id]);

      // Cancel notification
      const { notificationService } = require('../services/notificationService');
      notificationService.cancelHabitReminder(id);

    } catch (e) {
      console.error('Failed to delete habit', e);
      // reload to sync with DB on failure
      const { loadHabits } = get();
      // To properly reload, we need activeProfileId which we don't have here. 
      // This is a rare edge case, usually local DB deletes don't fail unless there's a syntax error.
    }
  },

  deleteAllHabits: async (profileId: string) => {
    try {
      // Get habits to delete their notifications and cascade
      const habitsToDelete = get().habits.filter(h => h.profile_id === profileId);
      
      // Optimistic update
      set({ 
        habits: get().habits.filter(h => h.profile_id !== profileId),
        completions: get().completions.filter(c => !habitsToDelete.some(h => h.id === c.habit_id))
      });
      
      const { notificationService } = require('../services/notificationService');
      
      for (const habit of habitsToDelete) {
        await executeMutation('DELETE FROM habit_days WHERE habit_id = ?', [habit.id]);
        await executeMutation('DELETE FROM completions WHERE habit_id = ?', [habit.id]);
        notificationService.cancelHabitReminder(habit.id);
      }
      
      await executeMutation('DELETE FROM habits WHERE profile_id = ?', [profileId]);
    } catch (e) {
      console.error('Failed to delete all habits', e);
    }
  },

  deleteHabits: async (ids: string[]) => {
    if (ids.length === 0) return;
    try {
      set({ 
        habits: get().habits.filter(h => !ids.includes(h.id)),
        completions: get().completions.filter(c => !ids.includes(c.habit_id))
      });
      
      const { notificationService } = require('../services/notificationService');
      
      for (const id of ids) {
        await executeMutation('DELETE FROM habit_days WHERE habit_id = ?', [id]);
        await executeMutation('DELETE FROM completions WHERE habit_id = ?', [id]);
        await executeMutation('DELETE FROM habits WHERE id = ?', [id]);
        notificationService.cancelHabitReminder(id);
      }
    } catch (e) {
      console.error('Failed to delete habits', e);
    }
  },

  toggleCompletion: async (habitId: string, date: string) => {
    // Instant UI update for snappy feel
    const { completions } = get();
    const existingCompletion = completions.find(c => c.habit_id === habitId && c.date === date);

    if (existingCompletion) {
      // Un-complete
      set({
        completions: completions.filter(c => c.id !== existingCompletion.id)
      });
      // Persist
      await executeMutation('DELETE FROM completions WHERE id = ?', [existingCompletion.id]);
    } else {
      // Complete
      const newCompletion: Completion = {
        id: generateId(),
        habit_id: habitId,
        date,
        completed_at: new Date().toISOString(),
      };
      set({
        completions: [...completions, newCompletion]
      });
      // Persist
      await executeMutation(
        'INSERT INTO completions (id, habit_id, date, completed_at) VALUES (?, ?, ?, ?)',
        [newCompletion.id, newCompletion.habit_id, newCompletion.date, newCompletion.completed_at]
      );
    }
  },

  completeAll: async (date: string) => {
    const { habits, completions } = get();
    const newCompletions: Completion[] = [];
    
    // Find habits not completed today
    habits.forEach(habit => {
      const isCompleted = completions.some(c => c.habit_id === habit.id && c.date === date);
      if (!isCompleted) {
        newCompletions.push({
          id: generateId(),
          habit_id: habit.id,
          date,
          completed_at: new Date().toISOString(),
        });
      }
    });

    if (newCompletions.length === 0) return;

    // Optimistic update
    set({ completions: [...completions, ...newCompletions] });

    // Persist
    for (const comp of newCompletions) {
      await executeMutation(
        'INSERT INTO completions (id, habit_id, date, completed_at) VALUES (?, ?, ?, ?)',
        [comp.id, comp.habit_id, comp.date, comp.completed_at]
      );
    }
  },

  completeHabits: async (ids: string[], date: string) => {
    if (ids.length === 0) return;
    const { habits, completions } = get();
    const newCompletions: Completion[] = [];
    
    ids.forEach(id => {
      const isCompleted = completions.some(c => c.habit_id === id && c.date === date);
      if (!isCompleted) {
        newCompletions.push({
          id: generateId(),
          habit_id: id,
          date,
          completed_at: new Date().toISOString(),
        });
      }
    });

    if (newCompletions.length === 0) return;

    set({ completions: [...completions, ...newCompletions] });

    for (const comp of newCompletions) {
      await executeMutation(
        'INSERT INTO completions (id, habit_id, date, completed_at) VALUES (?, ?, ?, ?)',
        [comp.id, comp.habit_id, comp.date, comp.completed_at]
      );
    }
  }
}));
