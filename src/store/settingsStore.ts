import { create } from 'zustand';

interface SettingsState {
  isDarkMode: boolean;
  notificationsEnabled: boolean;
  reminderSound: string;
  setDarkMode: (enabled: boolean) => void;
  setNotifications: (enabled: boolean) => void;
  setReminderSound: (sound: string) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  isDarkMode: false, // Default to light mode (we can hook this to system later if needed)
  notificationsEnabled: true,
  reminderSound: 'Chime',
  setDarkMode: (enabled) => set({ isDarkMode: enabled }),
  setNotifications: (enabled) => set({ notificationsEnabled: enabled }),
  setReminderSound: (sound) => set({ reminderSound: sound }),
}));
