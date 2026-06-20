export interface Category {
  id: string;
  name: string;
}

export const HABIT_CATEGORIES: Category[] = [
  { id: 'health', name: 'Health' },
  { id: 'fitness', name: 'Fitness' },
  { id: 'study', name: 'Study' },
  { id: 'mindfulness', name: 'Mindfulness' },
  { id: 'finance', name: 'Finance' },
  { id: 'social', name: 'Social' },
  { id: 'creativity', name: 'Creativity' },
  { id: 'other', name: 'Other' },
];

export const HABIT_ICONS = [
  { id: 'fitness', name: 'Fitness', icon: 'dumbbell' },
  { id: 'reading', name: 'Reading', icon: 'book' },
  { id: 'coding', name: 'Coding', icon: 'code' },
  { id: 'finance', name: 'Finance', icon: 'wallet' },
  { id: 'meditation', name: 'Meditation', icon: 'sparkles' },
  { id: 'study', name: 'Study', icon: 'graduation-cap' },
  { id: 'health', name: 'Health', icon: 'heart' },
  { id: 'water', name: 'Water', icon: 'droplets' },
  { id: 'running', name: 'Running', icon: 'activity' },
];

export const HABIT_COLORS = [
  '#818CF8', // Indigo
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#F87171', // Red
  '#F472B6', // Pink
  '#FBBF24', // Amber
  '#A78BFA', // Purple
  '#9CA3AF', // Gray
];
