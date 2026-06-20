// src/types/profile.types.ts

export interface Profile {
  id: string;
  name: string;
  avatar?: string | null;
  color?: string | null;
  pin?: string | null;
  xp: number;
  level: number;
  created_at: string;
}
