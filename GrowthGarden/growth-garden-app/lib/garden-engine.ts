// =============================================================================
// GrowthGarden Engine — Core Domain Logic
// =============================================================================
// Pure functions for computing plant states, schedule evaluation, and wilting
// mechanics. These functions have no database access for testability.
// =============================================================================

import type { Completion, DashboardStats, GrowthStage, Habit, RareFlower } from './types';

/**
 * Computes the visual growth stage of a plant based on its streak and wilting state.
 *
 * Thresholds:
 * - wilting: isWilting is true (regardless of streak)
 * - blooming: streak >= 21
 * - budding: streak >= 7 (and < 21)
 * - sprout: streak >= 3 (and < 7)
 * - seed: streak < 3
 *
 * @param streak - Current consecutive completion count (non-negative integer)
 * @param isWilting - Whether the plant is in a wilting state
 * @returns The computed GrowthStage
 */
export function computeGrowthStage(streak: number, isWilting: boolean): GrowthStage {
  if (isWilting) return 'wilting';
  if (streak >= 21) return 'blooming';
  if (streak >= 7) return 'budding';
  if (streak >= 3) return 'sprout';
  return 'seed';
}

/**
 * Determines if a given date is a scheduled day for a habit.
 *
 * Schedule types:
 * - 'daily': every day is scheduled
 * - 'weekly': only the day matching schedule_days[0] is scheduled
 * - 'custom': any day in the schedule_days array is scheduled
 *
 * Days of week: 0=Sunday, 1=Monday, ... 6=Saturday (matches JS Date.getDay())
 *
 * @param habit - The habit with schedule_type and schedule_days
 * @param date - The date to check
 * @returns true if the date is a scheduled day for the habit
 */
export function isScheduledDay(habit: Habit, date: Date): boolean {
  switch (habit.schedule_type) {
    case 'daily':
      return true;

    case 'weekly': {
      if (!habit.schedule_days || habit.schedule_days.length === 0) return false;
      return date.getDay() === habit.schedule_days[0];
    }

    case 'custom': {
      if (!habit.schedule_days || habit.schedule_days.length === 0) return false;
      return habit.schedule_days.includes(date.getDay());
    }

    default:
      return false;
  }
}

/**
 * Determines if a habit should transition to the wilting state.
 *
 * A habit should wilt if:
 * 1. It is currently active (not paused or archived)
 * 2. It is not already wilting (idempotent — won't re-wilt)
 * 3. Its most recent past scheduled day (before today) has no completion record
 *
 * @param habit - The habit to evaluate
 * @param completions - All completion records for this habit
 * @param today - The current date (for determining "past" scheduled days)
 * @returns true if the habit should transition to wilting
 */
export function shouldWilt(habit: Habit, completions: Completion[], today: Date): boolean {
  // Only active habits can wilt
  if (habit.status !== 'active') return false;

  // Already wilting — idempotent, don't re-wilt
  if (habit.is_wilting) return false;

  // Find the most recent past scheduled day before today
  const lastScheduledDay = findLastScheduledDay(habit, today);
  if (!lastScheduledDay) return false;

  // Check if there's a completion for that day
  const dateStr = formatDate(lastScheduledDay);
  const hasCompletion = completions.some(
    (c) => c.completed_date === dateStr && c.habit_id === habit.id
  );

  return !hasCompletion;
}

// -----------------------------------------------------------------------------
// Internal Helpers
// -----------------------------------------------------------------------------

/**
 * Finds the most recent scheduled day strictly before the given date.
 * Searches backwards up to 7 days (sufficient for any schedule type).
 */
function findLastScheduledDay(habit: Habit, today: Date): Date | null {
  // Search backward up to 7 days to find the last scheduled day before today
  for (let daysBack = 1; daysBack <= 7; daysBack++) {
    const candidate = new Date(today);
    candidate.setDate(today.getDate() - daysBack);

    if (isScheduledDay(habit, candidate)) {
      return candidate;
    }
  }

  return null;
}

/**
 * Formats a Date as an ISO date string (YYYY-MM-DD) for comparison with
 * completion records.
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// =============================================================================
// Dashboard Statistics
// =============================================================================

/**
 * Calculates the weekly completion rate as a whole-number percentage.
 *
 * Logic:
 * 1. Filter to active habits only (exclude paused and archived)
 * 2. Compute the rolling 7-day window (today - 6 days through today)
 * 3. For each active habit, count how many of those 7 days are scheduled days
 * 4. Count completions that fall within the 7-day window for active habits
 * 5. Rate = Math.round((totalCompleted / totalScheduled) * 100)
 * 6. Return 0 if totalScheduled is 0 (avoid division by zero)
 *
 * @param habits - All user habits (will be filtered to active only)
 * @param completions - All completion records
 * @param today - The current date for determining the 7-day window
 * @returns Whole-number percentage (0-100)
 */
export function calculateWeeklyCompletionRate(
  habits: Habit[],
  completions: Completion[],
  today: Date
): number {
  const activeHabits = habits.filter((h) => h.status === 'active');

  if (activeHabits.length === 0) return 0;

  // Build the 7-day window: today - 6 days through today (inclusive)
  const windowDates: Date[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    d.setHours(0, 0, 0, 0);
    windowDates.push(d);
  }

  // Build set of date strings for the window
  const windowDateStrings = new Set(windowDates.map(formatDate));

  // Count total scheduled occurrences across all active habits in the window
  let totalScheduled = 0;
  const activeHabitIds = new Set(activeHabits.map((h) => h.id));

  for (const habit of activeHabits) {
    for (const date of windowDates) {
      if (isScheduledDay(habit, date)) {
        totalScheduled++;
      }
    }
  }

  if (totalScheduled === 0) return 0;

  // Count completions in the window for active habits
  let totalCompleted = 0;
  for (const completion of completions) {
    if (
      activeHabitIds.has(completion.habit_id) &&
      windowDateStrings.has(completion.completed_date)
    ) {
      totalCompleted++;
    }
  }

  return Math.round((totalCompleted / totalScheduled) * 100);
}

/**
 * Computes aggregate dashboard statistics from user data.
 *
 * - total_active_habits: count of habits with status === 'active'
 * - longest_current_streak: max current_streak among active habits (0 if none)
 * - total_lifetime_completions: count of all completions (all habits, including archived)
 * - total_rare_flowers: count of all rare flowers (all habits, including archived)
 * - weekly_completion_rate: calls calculateWeeklyCompletionRate
 *
 * @param habits - All user habits
 * @param completions - All completion records
 * @param rareFlowers - All rare flower records
 * @param today - The current date (defaults to new Date() for production use)
 * @returns DashboardStats object
 */
export function computeDashboardStats(
  habits: Habit[],
  completions: Completion[],
  rareFlowers: RareFlower[],
  today: Date = new Date()
): DashboardStats {
  const activeHabits = habits.filter((h) => h.status === 'active');

  const total_active_habits = activeHabits.length;

  const longest_current_streak =
    activeHabits.length > 0
      ? Math.max(...activeHabits.map((h) => h.current_streak))
      : 0;

  const total_lifetime_completions = completions.length;

  const total_rare_flowers = rareFlowers.length;

  const weekly_completion_rate = calculateWeeklyCompletionRate(
    habits,
    completions,
    today
  );

  return {
    total_active_habits,
    longest_current_streak,
    total_lifetime_completions,
    total_rare_flowers,
    weekly_completion_rate,
  };
}
