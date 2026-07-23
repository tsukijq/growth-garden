import { GardenPageClient } from './client';
import { getUserHabits, getTodayCompletions, getReleasedHabits, getReflectionCounts, getUserProfile } from '@/lib/actions/habits';
import { sendNotification } from '@/lib/actions/notifications';
import { applyHealthDecay, daysMissed, computePlantStage, isRestDay } from '@/lib/utils/plantStage';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Habit } from '@/types';

export default async function GardenPage() {
  // Parallel fetch — all 5 queries run simultaneously
  const [habits, completedToday, releasedHabits, reflectionCounts, { quietMode }] = await Promise.all([
    getUserHabits(),
    getTodayCompletions(),
    getReleasedHabits(),
    getReflectionCounts(),
    getUserProfile(),
  ]);

  // Apply health decay on page load
  const supabase = await createServerSupabaseClient();
  const processedHabits: Habit[] = [];
  const decayUpdates: { id: string; health_score: number; plant_stage: string; streak_count: number; consistent_days: number }[] = [];

  for (const habit of habits) {
    // Skip decay if already completed today
    if (completedToday.includes(habit.id)) {
      processedHabits.push(habit);
      continue;
    }

    // Skip decay on rest days
    if (isRestDay(habit.rest_days || [])) {
      processedHabits.push(habit);
      continue;
    }

    const missed = daysMissed(habit.last_completed, habit.created_at, habit.rest_days);
    if (missed > 0) {
      const newHealth = applyHealthDecay(habit.health_score, missed);
      const newStreak = 0;
      // Consistent days only resets on 2+ missed days (1-day grace)
      const newConsistentDays = missed >= 2 ? 0 : (habit.consistent_days || 0);
      // Stage never drops below what was previously reached
      const currentStage = habit.plant_stage;

      decayUpdates.push({ id: habit.id, health_score: newHealth, plant_stage: currentStage, streak_count: newStreak, consistent_days: newConsistentDays });

      // Send gentle nudge if 2+ days missed (respects once-per-week cap inside sendNotification)
      if (missed >= 2) {
        const plantName = habit.plant_name || habit.name;
        sendNotification(
          habit.user_id,
          'nudge',
          `${plantName} is resting 🌙`,
          'Whenever you\'re ready. No rush.',
          habit.id
        );
      }

      processedHabits.push({
        ...habit,
        health_score: newHealth,
        plant_stage: currentStage, // preserve stage — wilt only affects visuals
        streak_count: newStreak,
        consistent_days: newConsistentDays,
      });
    } else {
      processedHabits.push(habit);
    }
  }

  // Batch decay updates in parallel
  if (decayUpdates.length > 0) {
    await Promise.all(
      decayUpdates.map((update) =>
        supabase
          .from('habits')
          .update({
            health_score: update.health_score,
            plant_stage: update.plant_stage,
            streak_count: update.streak_count,
            consistent_days: update.consistent_days,
          })
          .eq('id', update.id)
      )
    );
  }

  return (
    <GardenPageClient
      initialHabits={processedHabits}
      completedToday={completedToday}
      releasedHabits={releasedHabits}
      reflectionCounts={reflectionCounts}
      quietMode={quietMode}
    />
  );
}
