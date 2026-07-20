import { PlantStage, RareVariant } from '@/types';

/**
 * The 6 stages of plant growth (based on real botany):
 *
 * 1. Seed         — dormant, waiting for first completion
 * 2. Sprout       — germination, first shoots break soil (streak 1-2)
 * 3. Seedling     — small stem with first true leaves (streak 3-6)
 * 4. Vegetative   — rapid growth, multiple leaves, getting taller (streak 7-13)
 * 5. Budding      — flower buds forming, almost ready to bloom (streak 14-20)
 * 6. Flowering    — full bloom, open petals, peak beauty (streak 21-29)
 * 7. Fruiting     — bearing fruit/seeds, the legendary stage (streak 30+)
 *
 * Health score affects visual appearance (wilting/drooping) but
 * does NOT block stage advancement. Stage is purely streak-based.
 */
export function computePlantStage(healthScore: number, streakCount: number): PlantStage {
  if (streakCount >= 30) return 'fruiting';
  if (streakCount >= 21) return 'flowering';
  if (streakCount >= 14) return 'budding';
  if (streakCount >= 7) return 'vegetative';
  if (streakCount >= 3) return 'seedling';
  if (streakCount >= 1) return 'sprout';
  return 'seed';
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
