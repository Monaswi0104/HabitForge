import { create } from 'zustand';
import { executeQuery, executeMutation } from '../database/db';
import { Profile } from '../types/profile.types';

const generateId = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

interface ProfileState {
  profiles: Profile[];
  activeProfileId: string | null;
  isLoading: boolean;
  error: string | null;

  loadProfiles: () => Promise<void>;
  createProfile: (name: string, avatar: string | null, color: string | null, pin?: string | null) => Promise<Profile>;
  selectProfile: (id: string) => void;
  deleteProfile: (id: string) => Promise<void>;
  addXP: (id: string, amount: number) => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profiles: [],
  activeProfileId: null,
  isLoading: false,
  error: null,

  loadProfiles: async () => {
    set({ isLoading: true, error: null });
    try {
      const rows = await executeQuery<Profile>('SELECT * FROM profiles ORDER BY created_at ASC;');
      set({ profiles: rows, isLoading: false });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
    }
  },

  createProfile: async (name, avatar, color, pin) => {
    set({ isLoading: true, error: null });
    try {
      const now = new Date().toISOString();
      const newProfile: Profile = {
        id: generateId(),
        name,
        avatar,
        color,
        pin,
        xp: 0,
        level: 1,
        created_at: now,
      };

      await executeMutation(
        'INSERT INTO profiles (id, name, avatar, color, pin, xp, level, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?);',
        [newProfile.id, newProfile.name, newProfile.avatar || null, newProfile.color || null, newProfile.pin || null, newProfile.xp, newProfile.level, newProfile.created_at]
      );

      const currentProfiles = get().profiles;
      set({
        profiles: [...currentProfiles, newProfile],
        activeProfileId: newProfile.id,
        isLoading: false,
      });

      return newProfile;
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  selectProfile: (id) => {
    set({ activeProfileId: id });
  },

  deleteProfile: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await executeMutation('DELETE FROM profiles WHERE id = ?;', [id]);
      
      const updatedProfiles = get().profiles.filter((p) => p.id !== id);
      const newActiveId = get().activeProfileId === id 
        ? (updatedProfiles.length > 0 ? updatedProfiles[0].id : null)
        : get().activeProfileId;

      set({
        profiles: updatedProfiles,
        activeProfileId: newActiveId,
        isLoading: false,
      });
    } catch (error: any) {
      set({ error: error.message, isLoading: false });
      throw error;
    }
  },

  addXP: async (id: string, amount: number) => {
    try {
      const { profiles } = get();
      const profileIndex = profiles.findIndex(p => p.id === id);
      if (profileIndex === -1) return;

      const profile = profiles[profileIndex];
      const newXP = Math.max(0, profile.xp + amount);
      const newLevel = Math.floor(newXP / 100) + 1;

      // Optimistic update
      const updatedProfiles = [...profiles];
      updatedProfiles[profileIndex] = { ...profile, xp: newXP, level: newLevel };
      set({ profiles: updatedProfiles });

      // Persist
      await executeMutation('UPDATE profiles SET xp = ?, level = ? WHERE id = ?', [newXP, newLevel, id]);
    } catch (e) {
      console.error('Failed to add XP', e);
    }
  },
}));
