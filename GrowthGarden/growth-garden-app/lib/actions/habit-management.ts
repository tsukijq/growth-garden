'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { validateHabitName, validateSchedule } from '@/lib/validation';
import { computeGrowthStage } from '@/lib/garden-engine';
import type { Habit, CreateHabitInput, UpdateHabitInput, ScheduleType, GrowthStage } from '@/lib/types';

export interface HabitActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  habit?: Habit;
}

/**
 * Get all habits for the current user (active, paused, and archived).
 */
export async function getAllHabits(): Promise<Habit[]> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  return (data || []) as unknown as Habit[];
}

/**
 * Get a single habit by ID for the current user.
 */
export async function getHabitById(habitId: string): Promise<Habit | null> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('habits')
    .select('*')
    .eq('id', habitId)
    .eq('user_id', user.id)
    .single();

  return (data as unknown as Habit) || null;
}

/**
 * Create a new habit with validation.
 * Enforces the 20 active habit limit.
 */
export async function createHabitAction(
  _prevState: HabitActionResult,
  formData: FormData
): Promise<HabitActionResult> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const name = formData.get('name') as string || '';
  const scheduleType = formData.get('schedule_type') as ScheduleType || 'daily';
  const scheduleDaysRaw = formData.get('schedule_days') as string || '';

  // Parse schedule_days
  let scheduleDays: number[] | null = null;
  if (scheduleDaysRaw) {
    scheduleDays = scheduleDaysRaw.split(',').map(Number).filter(n => !isNaN(n));
  }

  // Validate name
  const nameResult = validateHabitName(name);
  if (!nameResult.valid) {
    return { success: false, fieldErrors: { name: nameResult.error! } };
  }

  // Validate schedule
  const scheduleResult = validateSchedule(scheduleType, scheduleDays);
  if (!scheduleResult.valid) {
    return { success: false, fieldErrors: { schedule: scheduleResult.error! } };
  }

  // Check active habit limit (max 20)
  const { count } = await supabase
    .from('habits')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'active');

  if ((count || 0) >= 20) {
    return { success: false, error: 'You have reached the maximum of 20 active habits.' };
  }

  // Create the habit
  const { data, error } = await supabase
    .from('habits')
    .insert({
      user_id: user.id,
      name: name.trim(),
      schedule_type: scheduleType,
      schedule_days: scheduleDays,
      status: 'active',
      current_streak: 0,
      is_wilting: false,
    })
    .select()
    .single();

  if (error) {
    return { success: false, error: `Failed to create habit: ${error.message}` };
  }

  revalidatePath('/habits');
  revalidatePath('/garden');
  return { success: true, habit: data as unknown as Habit };
}

/**
 * Update an existing habit's name and/or schedule.
 * Preserves streak and growth stage per requirement 10.1.
 */
export async function updateHabitAction(
  habitId: string,
  _prevState: HabitActionResult,
  formData: FormData
): Promise<HabitActionResult> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const name = formData.get('name') as string || '';
  const scheduleType = formData.get('schedule_type') as ScheduleType || 'daily';
  const scheduleDaysRaw = formData.get('schedule_days') as string || '';

  // Parse schedule_days
  let scheduleDays: number[] | null = null;
  if (scheduleDaysRaw) {
    scheduleDays = scheduleDaysRaw.split(',').map(Number).filter(n => !isNaN(n));
  }

  // Validate name
  const nameResult = validateHabitName(name);
  if (!nameResult.valid) {
    return { success: false, fieldErrors: { name: nameResult.error! } };
  }

  // Validate schedule
  const scheduleResult = validateSchedule(scheduleType, scheduleDays);
  if (!scheduleResult.valid) {
    return { success: false, fieldErrors: { schedule: scheduleResult.error! } };
  }

  // Update only name and schedule — preserves streak and growth stage
  const { data, error } = await supabase
    .from('habits')
    .update({
      name: name.trim(),
      schedule_type: scheduleType,
      schedule_days: scheduleDays,
      updated_at: new Date().toISOString(),
    })
    .eq('id', habitId)
    .eq('user_id', user.id)
    .select()
    .single();

  if (error) {
    return { success: false, error: 'Failed to update habit' };
  }

  revalidatePath('/habits');
  revalidatePath(`/habits/${habitId}/edit`);
  revalidatePath('/garden');
  return { success: true, habit: data as unknown as Habit };
}

/**
 * Pause a habit — freezes growth stage and streak.
 * Requirement 10.2: Excludes from wilting evaluation and streak advancement.
 */
export async function pauseHabit(habitId: string): Promise<HabitActionResult> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  // Get current habit state
  const { data: habit } = await supabase
    .from('habits')
    .select('*')
    .eq('id', habitId)
    .eq('user_id', user.id)
    .single();

  if (!habit) return { success: false, error: 'Habit not found' };
  if (habit.status !== 'active') return { success: false, error: 'Only active habits can be paused' };

  const growthStage = computeGrowthStage(habit.current_streak, habit.is_wilting);

  const { data, error } = await supabase
    .from('habits')
    .update({
      status: 'paused',
      paused_at: new Date().toISOString(),
      paused_streak: habit.current_streak,
      paused_growth_stage: growthStage,
      updated_at: new Date().toISOString(),
    })
    .eq('id', habitId)
    .select()
    .single();

  if (error) return { success: false, error: 'Failed to pause habit' };

  revalidatePath('/habits');
  revalidatePath('/garden');
  return { success: true, habit: data as unknown as Habit };
}

/**
 * Resume a paused habit — restores frozen growth stage and streak.
 * Requirement 10.3: Resumes wilting evaluation from the next scheduled day.
 */
export async function resumeHabit(habitId: string): Promise<HabitActionResult> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: habit } = await supabase
    .from('habits')
    .select('*')
    .eq('id', habitId)
    .eq('user_id', user.id)
    .single();

  if (!habit) return { success: false, error: 'Habit not found' };
  if (habit.status !== 'paused') return { success: false, error: 'Only paused habits can be resumed' };

  const { data, error } = await supabase
    .from('habits')
    .update({
      status: 'active',
      current_streak: habit.paused_streak ?? habit.current_streak,
      is_wilting: false,
      paused_at: null,
      paused_streak: null,
      paused_growth_stage: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', habitId)
    .select()
    .single();

  if (error) return { success: false, error: 'Failed to resume habit' };

  revalidatePath('/habits');
  revalidatePath('/garden');
  return { success: true, habit: data as unknown as Habit };
}

/**
 * Archive a habit — removes from garden view but preserves data.
 * Requirement 10.4: Retains completion history, preserves growth stage and streak.
 */
export async function archiveHabit(habitId: string): Promise<HabitActionResult> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: habit } = await supabase
    .from('habits')
    .select('*')
    .eq('id', habitId)
    .eq('user_id', user.id)
    .single();

  if (!habit) return { success: false, error: 'Habit not found' };
  if (habit.status === 'archived') return { success: false, error: 'Habit is already archived' };

  const growthStage = computeGrowthStage(habit.current_streak, habit.is_wilting);

  const { data, error } = await supabase
    .from('habits')
    .update({
      status: 'archived',
      archived_at: new Date().toISOString(),
      paused_growth_stage: growthStage, // Store current growth stage for restore
      paused_streak: habit.current_streak,
      updated_at: new Date().toISOString(),
    })
    .eq('id', habitId)
    .select()
    .single();

  if (error) return { success: false, error: 'Failed to archive habit' };

  revalidatePath('/habits');
  revalidatePath('/garden');
  return { success: true, habit: data as unknown as Habit };
}

/**
 * Restore an archived habit — returns to active garden view.
 * Requirement 10.5: Preserves growth stage but resets streak to zero.
 */
export async function restoreHabit(habitId: string): Promise<HabitActionResult> {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { data: habit } = await supabase
    .from('habits')
    .select('*')
    .eq('id', habitId)
    .eq('user_id', user.id)
    .single();

  if (!habit) return { success: false, error: 'Habit not found' };
  if (habit.status !== 'archived') return { success: false, error: 'Only archived habits can be restored' };

  // Check active habit limit
  const { count } = await supabase
    .from('habits')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'active');

  if ((count || 0) >= 20) {
    return { success: false, error: 'Cannot restore: you already have 20 active habits.' };
  }

  const { data, error } = await supabase
    .from('habits')
    .update({
      status: 'active',
      current_streak: 0, // Streak resets to zero on restore
      is_wilting: false,
      archived_at: null,
      paused_at: null,
      paused_streak: null,
      paused_growth_stage: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', habitId)
    .select()
    .single();

  if (error) return { success: false, error: 'Failed to restore habit' };

  revalidatePath('/habits');
  revalidatePath('/garden');
  return { success: true, habit: data as unknown as Habit };
}
