import { PlantStage, RareVariant } from '@/types';

/**
 * Day-based growth stage thresholds:
 *
 * 1. Seed         — days 1-7
 * 2. Sprout       — days 8-21
 * 3. Budding      — days 22-66
 * 4. Flowering    — days 67+
 * 5. Fruiting     — reserved for rare flower milestones (streak 30+)
 *
 * The "seedling" and "vegetative" stages are mapped into the sprout range
 * for visual progression within days 8-21.
 *
 * Stage is based on `consistentDays` — a cumulative counter that only resets
 * on 2+ consecutive missed days. Health/wilt affects appearance but NOT stage.
 * Once a stage is reached, it never drops back due to wilting.
 */
export function computePlantStage(_healthScore: number, streakCount: number, consistentDays?: number): PlantStage {
  const days = consistentDays ?? streakCount; // fallback for legacy habits without consistent_days

  // Fruiting is reserved for rare milestone streaks (30+ streak)
  if (streakCount >= 30) return 'fruiting';
  if (days >= 67) return 'flowering';
  if (days >= 22) return 'budding';
  if (days >= 15) return 'vegetative';
  if (days >= 8) return 'seedling';
  if (days >= 3) return 'sprout';
  return 'seed';
}

/**
 * Compute the highest stage a habit has ever reached based on consistent_days.
 * Used to ensure wilting never drops the stage below this.
 */
export function computeHighestStage(consistentDays: number, streakCount: number): PlantStage {
  return computePlantStage(100, streakCount, consistentDays);
}

/**
 * Determine which rare variant a streak qualifies for.
 * These are visual overlays on the flowering/fruiting stages.
 */
export function getRareVariant(streakCount: number): RareVariant {
  if (streakCount >= 100) return 'black_moonflower';
  if (streakCount >= 30) return 'moonbell_orchid';
  if (streakCount >= 7) return 'crystal_sprout';
  return null;
}

/**
 * Check if today is a rest day for a habit.
 */
export function isRestDay(restDays: number[]): boolean {
  if (!restDays || restDays.length === 0) return false;
  const today = new Date().getDay(); // 0 = Sunday, 6 = Saturday
  return restDays.includes(today);
}

/**
 * Calculate how many days have been missed since last completion.
 * For new habits (null last_completed), compute from creation date.
 * Skips rest days in the count. Capped at 30 days max to avoid expensive loops.
 */
export function daysMissed(lastCompleted: string | null, createdAt?: string, restDays?: number[]): number {
  const referenceDate = lastCompleted || createdAt;
  if (!referenceDate) return 0;

  const ref = new Date(referenceDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  ref.setHours(0, 0, 0, 0);

  // Quick bail: if same day or future, no missed days
  if (ref >= today) return 0;

  // Cap at 30 days to prevent expensive loops for very old habits
  const maxDays = 30;
  let missed = 0;
  const current = new Date(ref);
  current.setDate(current.getDate() + 1); // Start from the day after reference

  let iterations = 0;
  while (current < today && iterations < maxDays) {
    const dayOfWeek = current.getDay();
    if (!restDays || !restDays.includes(dayOfWeek)) {
      missed++;
    }
    current.setDate(current.getDate() + 1);
    iterations++;
  }

  return missed;
}

/**
 * Apply health decay based on missed days. Returns the new health score.
 */
export function applyHealthDecay(currentHealth: number, missedDays: number): number {
  if (missedDays === 0) return currentHealth;
  if (missedDays >= 3) return Math.max(15, currentHealth - 60);
  // Each missed day costs 20 health
  const newHealth = currentHealth - (missedDays * 20);
  return Math.max(15, newHealth); // Never below 15 — always a recovery window
}

/**
 * Determine the visual state of a plant for rendering purposes.
 * This affects how droopy/desaturated the plant looks regardless of stage.
 */
export function getPlantVisualState(healthScore: number): 'healthy' | 'wilting' | 'dying' {
  if (healthScore >= 40) return 'healthy';
  if (healthScore >= 20) return 'wilting';
  return 'dying';
}
