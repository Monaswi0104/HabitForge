// src/types/profile.types.ts

export interface Profile {
  id: string;
  name: string;
  avatar?: string | null;
  color?: string | null;
  pin?: string | null;
  created_at: string;
}
