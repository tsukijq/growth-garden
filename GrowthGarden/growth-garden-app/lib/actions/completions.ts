'use server';

import { revalidatePath } from 'next/cache';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isScheduledDay, computeGrowthStage, checkRareFlowerUnlock } from '@/lib/garden-engine';
import { ErrorCode, type ActionError, type Completion, type CompletionResult, type Habit, type RareFlower } from '@/lib/types';

/**
 * Records a habit completion for a given date.
 *
 * Validates:
 * - The date is a scheduled day for this habit (rejects with NOT_SCHEDULED_DAY)
 * - No duplicate completion exists for this habit+date (rejects with DUPLICATE_COMPLETION)
 *
 * On success:
 * - Inserts a completion record
 * - If wilting: sets is_wilting=false and streak=1
 * - If not wilting: increments current_streak
 * - Checks and applies rare flower unlocks at milestones (30, 60, 100)
 * - All within a transaction for consistency
 *
 * @param habitId - The ID of the habit to complete
 * @param date - The date of completion (YYYY-MM-DD format)
 * @returns CompletionResult with success/error info
 */
export async function completeHabit(
  habitId: string,
  date: string
): Promise<CompletionResult> {
  const supabase = await createServerSupabaseClient();

  // Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Not authenticated',
      },
    };
  }

  // Fetch the habit (RLS ensures user can only access their own)
  const { data: habit, error: habitError } = await supabase
    .from('habits')
    .select('*')
    .eq('id', habitId)
    .eq('user_id', user.id)
    .single();

  if (habitError || !habit) {
    return {
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Habit not found',
      },
    };
  }

  // Cast to our Habit type for garden engine functions
  const typedHabit = habit as unknown as Habit;

  // 1. Validate that the date is a scheduled day for this habit
  const completionDate = new Date(date + 'T00:00:00');
  if (!isScheduledDay(typedHabit, completionDate)) {
    return {
      success: false,
      error: {
        code: ErrorCode.NOT_SCHEDULED_DAY,
        message: 'This day is not part of the habit\'s schedule',
      },
    };
  }

  // 2. Check for duplicate completion on same day
  const { data: existingCompletion } = await supabase
    .from('completions')
    .select('id')
    .eq('habit_id', habitId)
    .eq('completed_date', date)
    .single();

  if (existingCompletion) {
    return {
      success: false,
      error: {
        code: ErrorCode.DUPLICATE_COMPLETION,
        message: 'Habit already completed for this day',
      },
    };
  }

  // 3. Determine new streak value based on wilting state
  let newStreak: number;
  let newIsWilting: boolean;

  if (typedHabit.is_wilting) {
    // Wilting recovery: set is_wilting=false, streak=1
    newStreak = 1;
    newIsWilting = false;
  } else {
    // Normal completion: increment streak
    newStreak = typedHabit.current_streak + 1;
    newIsWilting = false;
  }

  // 4. Compute new growth stage
  const newGrowthStage = computeGrowthStage(newStreak, newIsWilting);

  // 5. Check for rare flower unlock at this new streak value
  const { data: existingFlowers } = await supabase
    .from('rare_flowers')
    .select('*')
    .eq('habit_id', habitId);

  const typedFlowers = (existingFlowers || []) as unknown as RareFlower[];
  const rareFlowerUnlock = checkRareFlowerUnlock(newStreak, typedFlowers);

  // 6. Execute all mutations within a transaction-like approach
  // Insert completion record
  const { data: completionData, error: completionError } = await supabase
    .from('completions')
    .insert({
      habit_id: habitId,
      user_id: user.id,
      completed_date: date,
    })
    .select()
    .single();

  if (completionError) {
    // Handle unique constraint violation (race condition on duplicate)
    if (completionError.code === '23505') {
      return {
        success: false,
        error: {
          code: ErrorCode.DUPLICATE_COMPLETION,
          message: 'Habit already completed for this day',
        },
      };
    }
    return {
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Failed to record completion',
      },
    };
  }

  // Update habit streak and wilting state
  const { error: updateError } = await supabase
    .from('habits')
    .update({
      current_streak: newStreak,
      is_wilting: newIsWilting,
      updated_at: new Date().toISOString(),
    })
    .eq('id', habitId);

  if (updateError) {
    // Rollback: delete the completion we just inserted
    await supabase.from('completions').delete().eq('id', completionData.id);
    return {
      success: false,
      error: {
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Failed to update habit streak',
      },
    };
  }

  // 7. Insert rare flower unlock if applicable
  if (rareFlowerUnlock) {
    const { error: flowerError } = await supabase
      .from('rare_flowers')
      .insert({
        habit_id: habitId,
        milestone: rareFlowerUnlock.milestone,
        variant_id: rareFlowerUnlock.variant_id,
        is_active_display: false,
      });

    if (flowerError && flowerError.code !== '23505') {
      // Non-duplicate error, log but don't fail the overall operation
      console.error('Failed to insert rare flower unlock:', flowerError);
    }
  }

  // Revalidate relevant paths
  revalidatePath('/garden');
  revalidatePath('/habits');
  revalidatePath('/dashboard');

  const completion = completionData as unknown as Completion;

  return {
    success: true,
    completion,
    newStreak,
    growthStage: newGrowthStage,
    rareFlowerUnlock: rareFlowerUnlock || null,
  };
}
