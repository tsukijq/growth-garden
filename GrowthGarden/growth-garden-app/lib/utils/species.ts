import { HabitCategory, FlowerSpecies, MoodTier } from '@/types';

export const HABIT_CATEGORIES: { value: HabitCategory; label: string; emoji: string }[] = [
  { value: 'fitness', label: 'Fitness', emoji: '💪' },
  { value: 'mindfulness', label: 'Mindfulness', emoji: '🧘' },
  { value: 'learning', label: 'Learning', emoji: '📚' },
  { value: 'creativity', label: 'Creativity', emoji: '🎨' },
  { value: 'discipline', label: 'Discipline', emoji: '⚡' },
  { value: 'relationships', label: 'Relationships', emoji: '💛' },
  { value: 'rest', label: 'Rest', emoji: '😴' },
  { value: 'other', label: 'Other', emoji: '🌿' },
];

export const CATEGORY_TO_SPECIES: Record<HabitCategory, FlowerSpecies> = {
  fitness: 'sunflower',
  mindfulness: 'lotus',
  learning: 'iris',
  creativity: 'tulip',
  discipline: 'carnation',
  relationships: 'rose',
  rest: 'peony',
  other: 'daisy',
};

// Species-specific color palettes for each growth stage
export const SPECIES_COLORS: Record<FlowerSpecies, {
  petal: string;
  center: string;
  accent: string;
}> = {
  sunflower: { petal: '#FFD700', center: '#8B4513', accent: '#FFA500' },
  lotus: { petal: '#FFB6C1', center: '#FFE4B5', accent: '#FF69B4' },
  iris: { petal: '#7B68EE', center: '#FFD700', accent: '#9370DB' },
  tulip: { petal: '#FF6347', center: '#228B22', accent: '#FF4500' },
  carnation: { petal: '#FF69B4', center: '#FFB6C1', accent: '#DC143C' },
  rose: { petal: '#DC143C', center: '#FFD700', accent: '#B22222' },
  peony: { petal: '#DDA0DD', center: '#FFE4E1', accent: '#BA55D3' },
  daisy: { petal: '#FFFFFF', center: '#FFD700', accent: '#F0F0F0' },
};

export function getSpeciesForHabit(category: HabitCategory | null): FlowerSpecies {
  return category ? CATEGORY_TO_SPECIES[category] : 'daisy';
}

/**
 * Calculate mood tier from a 7-day rolling average of reflection sentiment.
 * Higher average (positive reflections) = vivid colors.
 * Middle = muted. Lower = dusty.
 */
export function getMoodTier(recentReflectionCount: number): MoodTier {
  // Simple heuristic: more reflections in the past 7 days = more engaged = vivid
  // 5+ reflections in 7 days = vivid (very engaged)
  // 2-4 = muted (moderate)
  // 0-1 = dusty (low engagement)
  if (recentReflectionCount >= 5) return 'vivid';
  if (recentReflectionCount >= 2) return 'muted';
  return 'dusty';
}

/**
 * Get CSS filter string for mood tier applied to blooming plants only
 */
export function getMoodFilter(tier: MoodTier): string {
  switch (tier) {
    case 'vivid': return 'saturate(1.3) brightness(1.05)';
    case 'muted': return 'saturate(0.85) brightness(1.0)';
    case 'dusty': return 'saturate(0.6) brightness(0.95)';
  }
}
