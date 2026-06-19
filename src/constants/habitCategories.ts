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
  { id: 'book', name: 'Study', icon: 'book' },
  { id: 'dumbbell', name: 'Fitness', icon: 'dumbbell' },
  { id: 'droplets', name: 'Water', icon: 'droplets' },
  { id: 'brain', name: 'Mind', icon: 'brain' },
  { id: 'pencil', name: 'Journal', icon: 'pencil' },
  { id: 'heart', name: 'Health', icon: 'heart' },
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
