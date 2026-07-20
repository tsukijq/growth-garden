'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { computePlantStage, applyHealthDecay, daysMissed, isRestDay } from '@/lib/utils/plantStage';
import { Habit, HabitReflection } from '@/types';

export async function markHabitDone(habitId: string): Promise<Habit | { error: string; milestone?: number }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const today = new Date().toISOString().split('T')[0];

  // Check if already completed today
  const { data: existing } = await supabase
    .from('habit_logs')
    .select('id')
    .eq('habit_id', habitId)
    .eq('completed_at', today)
    .single();

  if (existing) return { error: 'Already completed today' };

  // Get current habit
  const { data: habit, error: habitError } = await supabase
    .from('habits')
    .select('*')
    .eq('id', habitId)
    .eq('user_id', user.id)
    .single();

  if (habitError || !habit) return { error: 'Habit not found' };

  // Apply any pending decay first
  let currentHealth = habit.health_score;
  let currentStreak = habit.streak_count;
  const missed = daysMissed(habit.last_completed, habit.created_at, habit.rest_days);
  if (missed > 0) {
    currentHealth = applyHealthDecay(currentHealth, missed);
    currentStreak = 0;
  }

  // Insert log
  const { error: logError } = await supabase.from('habit_logs').insert({
    habit_id: habitId,
    user_id: user.id,
    completed_at: today,
  });

  if (logError) return { error: 'Failed to log completion' };

  // Apply completion bonus
  const newHealth = Math.min(100, currentHealth + 10);
  const newStreak = currentStreak + 1;
  const newStage = computePlantStage(newHealth, newStreak);

  // Check for milestone
  let newMilestone: number | undefined;
  const milestones = [...(habit.milestones_reached || [])];
  if ([7, 30, 100].includes(newStreak) && !milestones.includes(newStreak)) {
    newMilestone = newStreak;
    milestones.push(newStreak);
  }

  const { data: updated, error: updateError } = await supabase
    .from('habits')
    .update({
      health_score: newHealth,
      streak_count: newStreak,
      last_completed: today,
      plant_stage: newStage,
      milestones_reached: milestones,
    })
    .eq('id', habitId)
    .select()
    .single();

  if (updateError) return { error: 'Failed to update habit' };

  // Update rare blooms count if reached fruiting
  if (newStage === 'fruiting' && habit.plant_stage !== 'fruiting') {
    await supabase.rpc('increment_rare_blooms', { user_id_input: user.id });
  }

  revalidatePath('/garden');

  // Return with milestone info if applicable
  const result = updated as Habit;
  if (newMilestone) {
    return { ...result, milestone: newMilestone } as any;
  }
  return result;
}

export async function createHabit(
  name: string,
  options?: { intention?: string; plantName?: string; restDays?: number[] }
): Promise<Habit | { error: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  if (!name.trim()) return { error: 'Habit name is required' };
  if (name.length > 50) return { error: 'Habit name must be 50 characters or fewer' };

  const { data, error } = await supabase
    .from('habits')
    .insert({
      user_id: user.id,
      name: name.trim(),
      plant_name: options?.plantName?.trim() || null,
      intention: options?.intention?.trim() || null,
      rest_days: options?.restDays || [],
      streak_count: 0,
      plant_stage: 'seed',
      health_score: 60,
      milestones_reached: [],
    })
    .select()
    .single();

  if (error) return { error: `Failed to create habit: ${error.message}` };
  revalidatePath('/garden');
  revalidatePath('/seeds');
  return data as Habit;
}

export async function updateHabit(
  habitId: string,
  updates: { name?: string; plantName?: string; intention?: string; restDays?: number[] }
): Promise<Habit | { error: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const updateData: any = {};
  if (updates.name !== undefined) updateData.name = updates.name.trim();
  if (updates.plantName !== undefined) updateData.plant_name = updates.plantName.trim() || null;
  if (updates.intention !== undefined) updateData.intention = updates.intention.trim() || null;
  if (updates.restDays !== undefined) updateData.rest_days = updates.restDays;

  const { data, error } = await supabase
    .from('habits')
    .update(updateData)
    .eq('id', habitId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) return { error: 'Failed to update habit' };
  revalidatePath('/garden');
  return data as Habit;
}

export async function saveReflection(habitId: string, note: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  if (!note.trim()) return { success: false, error: 'Note is empty' };

  const { error } = await supabase.from('habit_reflections').insert({
    habit_id: habitId,
    user_id: user.id,
    note: note.trim(),
  });

  if (error) return { success: false, error: 'Failed to save reflection' };
  return { success: true };
}

export async function getReflections(habitId: string): Promise<HabitReflection[]> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('habit_reflections')
    .select('*')
    .eq('habit_id', habitId)
    .eq('user_id', user.id)
    .order('reflected_at', { ascending: false });

  return (data || []) as HabitReflection[];
}

export async function getReflectionCounts(): Promise<Record<string, number>> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return {};

  const { data } = await supabase
    .from('habit_reflections')
    .select('habit_id')
    .eq('user_id', user.id);

  const counts: Record<string, number> = {};
  for (const row of data || []) {
    counts[row.habit_id] = (counts[row.habit_id] || 0) + 1;
  }
  return counts;
}

export async function getUserHabits(): Promise<Habit[]> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', user.id)
    .is('released_at', null)
    .order('created_at', { ascending: true });

  return (data || []) as Habit[];
}

export async function getTodayCompletions(): Promise<string[]> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const today = new Date().toISOString().split('T')[0];
  const { data } = await supabase
    .from('habit_logs')
    .select('habit_id')
    .eq('user_id', user.id)
    .eq('completed_at', today);

  return (data || []).map((log) => log.habit_id);
}

export async function releaseHabit(habitId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase
    .from('habits')
    .update({ released_at: new Date().toISOString() })
    .eq('id', habitId)
    .eq('user_id', user.id);

  if (error) return { success: false, error: 'Failed to release plant' };
  revalidatePath('/garden');
  return { success: true };
}

export async function replantHabit(habitId: string): Promise<Habit | { error: string }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Not authenticated' };

  const { data: habit } = await supabase
    .from('habits')
    .select('*')
    .eq('id', habitId)
    .eq('user_id', user.id)
    .single();

  if (!habit) return { error: 'Plant not found' };
  if (!habit.released_at) return { error: 'This plant is already in your garden' };

  const releasedDate = new Date(habit.released_at);
  const daysSince = Math.floor((Date.now() - releasedDate.getTime()) / (1000 * 60 * 60 * 24));
  if (daysSince > 7) return { error: 'This plant has found a new home. The replant window has passed.' };

  const { data: updated, error } = await supabase
    .from('habits')
    .update({ released_at: null })
    .eq('id', habitId)
    .select()
    .single();

  if (error) return { error: 'Failed to replant' };
  revalidatePath('/garden');
  return updated as Habit;
}

export async function getReleasedHabits(): Promise<Habit[]> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const { data } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', user.id)
    .not('released_at', 'is', null)
    .gte('released_at', sevenDaysAgo.toISOString())
    .order('released_at', { ascending: false });

  return (data || []) as Habit[];
}

export async function getUserProfile(): Promise<{ quietMode: boolean }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { quietMode: false };

  const { data } = await supabase
    .from('profiles')
    .select('quiet_mode')
    .eq('id', user.id)
    .single();

  return { quietMode: data?.quiet_mode || false };
}

export async function toggleQuietMode(enabled: boolean): Promise<{ success: boolean }> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false };

  await supabase
    .from('profiles')
    .update({ quiet_mode: enabled })
    .eq('id', user.id);

  revalidatePath('/garden');
  revalidatePath('/profile');
  return { success: true };
}
