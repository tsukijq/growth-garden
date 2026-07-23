import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { isScheduledDay, checkRareFlowerUnlock, calculateWeeklyCompletionRate, computeDashboardStats } from './garden-engine';
import type { Habit, Completion, RareFlower, RareFlowerMilestone } from './types';

// =============================================================================
// Helper: Habit Factory for Property Tests
// =============================================================================

function makeHabit(overrides: Partial<Habit> = {}): Habit {
  return {
    id: 'habit-1',
    user_id: 'user-1',
    name: 'Test Habit',
    schedule_type: 'daily',
    schedule_days: null,
    status: 'active',
    current_streak: 0,
    is_wilting: false,
    paused_at: null,
    paused_streak: null,
    paused_growth_stage: null,
    archived_at: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

// =============================================================================
// Arbitraries for Property 5
// =============================================================================

/** Generates a valid day of week (0-6, matching JS Date.getDay()) */
const dayOfWeekArb = fc.integer({ min: 0, max: 6 });

/** Generates a non-empty array of unique days of week for custom schedules */
const scheduleDaysArb = fc.uniqueArray(dayOfWeekArb, { minLength: 1, maxLength: 7 });

/** Generates a single-element array for weekly schedules */
const weeklyDayArb = dayOfWeekArb.map((d) => [d]);

/** Generates a Date within a reasonable range */
const dateArb = fc.date({ min: new Date(2020, 0, 1), max: new Date(2030, 11, 31) });

/** Generates a habit with a daily schedule */
const dailyHabitArb = fc.constant(makeHabit({ schedule_type: 'daily', schedule_days: null }));

/** Generates a habit with a weekly schedule */
const weeklyHabitArb = weeklyDayArb.map((days) =>
  makeHabit({ schedule_type: 'weekly', schedule_days: days })
);

/** Generates a habit with a custom schedule */
const customHabitArb = scheduleDaysArb.map((days) =>
  makeHabit({ schedule_type: 'custom', schedule_days: days })
);

/** Generates any valid habit with a well-defined schedule */
const habitWithScheduleArb = fc.oneof(dailyHabitArb, weeklyHabitArb, customHabitArb);

// =============================================================================
// Property 5: Completions only on scheduled days
// =============================================================================
// *For any* habit with a defined schedule and *for any* date that is NOT part
// of that schedule, attempting to record a completion SHALL be rejected.
// Conversely, *for any* date that IS part of the schedule, the completion SHALL
// be accepted (assuming no duplicate exists).
//
// **Validates: Requirements 3.5, 5.6**
// Feature: growth-garden, Property 5: Completions only on scheduled days
// =============================================================================

describe('Property 5: Completions only on scheduled days', () => {
  it('daily habits: isScheduledDay returns true for any date', () => {
    fc.assert(
      fc.property(dailyHabitArb, dateArb, (habit, date) => {
        expect(isScheduledDay(habit, date)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  it('weekly habits: isScheduledDay returns true only when date.getDay() matches schedule_days[0]', () => {
    fc.assert(
      fc.property(weeklyHabitArb, dateArb, (habit, date) => {
        const expected = date.getDay() === habit.schedule_days![0];
        expect(isScheduledDay(habit, date)).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });

  it('custom habits: isScheduledDay returns true only when date.getDay() is in schedule_days', () => {
    fc.assert(
      fc.property(customHabitArb, dateArb, (habit, date) => {
        const expected = habit.schedule_days!.includes(date.getDay());
        expect(isScheduledDay(habit, date)).toBe(expected);
      }),
      { numRuns: 100 }
    );
  });

  it('non-scheduled days are always rejected (returns false)', () => {
    // Generate a habit and a date that is NOT on the schedule
    const habitAndNonScheduledDate = fc
      .tuple(
        fc.oneof(weeklyHabitArb, customHabitArb),
        dateArb
      )
      .filter(([habit, date]) => !habit.schedule_days!.includes(date.getDay()));

    fc.assert(
      fc.property(habitAndNonScheduledDate, ([habit, date]) => {
        expect(isScheduledDay(habit, date)).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('scheduled days are always accepted (returns true)', () => {
    // Generate a habit and a date that IS on the schedule
    const habitAndScheduledDate = fc
      .tuple(habitWithScheduleArb, dateArb)
      .filter(([habit, date]) => {
        if (habit.schedule_type === 'daily') return true;
        return habit.schedule_days!.includes(date.getDay());
      });

    fc.assert(
      fc.property(habitAndScheduledDate, ([habit, date]) => {
        expect(isScheduledDay(habit, date)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

// =============================================================================
// Arbitraries for Property 9
// =============================================================================

const MILESTONES: RareFlowerMilestone[] = [30, 60, 100];

function makeRareFlower(milestone: RareFlowerMilestone): RareFlower {
  return {
    id: `flower-${milestone}`,
    habit_id: 'habit-1',
    milestone,
    variant_id: `variant-${milestone}`,
    is_active_display: false,
    unlocked_at: '2024-01-01T00:00:00Z',
  };
}

/** Generates a random subset of milestones as existing unlocks */
const existingUnlocksArb: fc.Arbitrary<RareFlower[]> = fc
  .subarray(MILESTONES, { minLength: 0, maxLength: 3 })
  .map((milestones) => milestones.map(makeRareFlower));

// =============================================================================
// Property 9: Rare flower unlock at milestones without duplication
// =============================================================================
// **Validates: Requirements 6.1, 6.2, 6.3, 6.6**
//
// For any habit and streak value, checkRareFlowerUnlock(streak, existingUnlocks)
// SHALL return a new unlock if and only if the streak equals a milestone (30, 60, or 100)
// AND no unlock exists for that milestone. If an unlock already exists at that milestone,
// the function SHALL return null.
// =============================================================================

describe('Feature: growth-garden, Property 9: Rare flower unlock at milestones without duplication', () => {
  it('returns an unlock object when streak is a milestone AND milestone is not in existingUnlocks', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...MILESTONES),
        existingUnlocksArb,
        (milestone, existingUnlocks) => {
          const alreadyUnlocked = existingUnlocks.some((u) => u.milestone === milestone);

          // Only test cases where the milestone is NOT already unlocked
          fc.pre(!alreadyUnlocked);

          const result = checkRareFlowerUnlock(milestone, existingUnlocks);

          // Must return an unlock object
          expect(result).not.toBeNull();
          expect(result!.milestone).toBe(milestone);
          expect(typeof result!.variant_id).toBe('string');
          expect(result!.variant_id.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns null when streak is NOT a milestone value', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 200 }).filter((n) => !MILESTONES.includes(n as RareFlowerMilestone)),
        existingUnlocksArb,
        (streak, existingUnlocks) => {
          const result = checkRareFlowerUnlock(streak, existingUnlocks);
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns null when streak IS a milestone BUT already exists in unlocks (no duplication)', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...MILESTONES),
        (milestone) => {
          // Always include the target milestone in existing unlocks
          const existingUnlocks = [makeRareFlower(milestone)];
          const result = checkRareFlowerUnlock(milestone, existingUnlocks);
          expect(result).toBeNull();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('satisfies the full bidirectional property: returns unlock iff streak is milestone AND not already unlocked', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 200 }),
        existingUnlocksArb,
        (streak, existingUnlocks) => {
          const isMilestone = MILESTONES.includes(streak as RareFlowerMilestone);
          const alreadyUnlocked = existingUnlocks.some((u) => u.milestone === streak);

          const result = checkRareFlowerUnlock(streak, existingUnlocks);

          if (isMilestone && !alreadyUnlocked) {
            // Must return a valid unlock
            expect(result).not.toBeNull();
            expect(result!.milestone).toBe(streak);
            expect(typeof result!.variant_id).toBe('string');
            expect(result!.variant_id.length).toBeGreaterThan(0);
          } else {
            // Must return null
            expect(result).toBeNull();
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});


// =============================================================================
// Generators for Properties 19 and 20
// =============================================================================

const habitStatusArb19 = fc.constantFrom('active' as const, 'paused' as const, 'archived' as const);
const scheduleTypeArb19 = fc.constantFrom('daily' as const, 'weekly' as const, 'custom' as const);

function arbitraryHabit19(idSuffix?: fc.Arbitrary<number>): fc.Arbitrary<Habit> {
  return fc.record({
    id: (idSuffix ?? fc.nat({ max: 999 })).map((n) => `habit-${n}`),
    user_id: fc.constant('user-1'),
    name: fc.string({ minLength: 1, maxLength: 20 }),
    schedule_type: scheduleTypeArb19,
    schedule_days: fc.oneof(
      fc.constant(null),
      fc.uniqueArray(fc.integer({ min: 0, max: 6 }), { minLength: 1, maxLength: 7 })
    ),
    status: habitStatusArb19,
    current_streak: fc.nat({ max: 200 }),
    is_wilting: fc.boolean(),
    paused_at: fc.constant(null),
    paused_streak: fc.constant(null),
    paused_growth_stage: fc.constant(null),
    archived_at: fc.constant(null),
    created_at: fc.constant('2024-01-01T00:00:00Z'),
    updated_at: fc.constant('2024-01-01T00:00:00Z'),
  }).map((h) => {
    // Ensure schedule_days consistency with schedule_type
    if (h.schedule_type === 'daily') {
      return { ...h, schedule_days: null };
    }
    if (h.schedule_type === 'weekly') {
      return { ...h, schedule_days: h.schedule_days ? [h.schedule_days[0]] : [0] };
    }
    // custom
    return { ...h, schedule_days: h.schedule_days ?? [1, 3, 5] };
  });
}

/**
 * Helper: generate a rolling 7-day window of date strings ending at `today`.
 */
function buildWindowDates(today: Date): string[] {
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    dates.push(`${year}-${month}-${day}`);
  }
  return dates;
}

/**
 * Helper: check if a date is scheduled for a habit (mirrors implementation logic).
 */
function isScheduledDayHelper(habit: Habit, date: Date): boolean {
  switch (habit.schedule_type) {
    case 'daily':
      return true;
    case 'weekly':
      if (!habit.schedule_days || habit.schedule_days.length === 0) return false;
      return date.getDay() === habit.schedule_days[0];
    case 'custom':
      if (!habit.schedule_days || habit.schedule_days.length === 0) return false;
      return habit.schedule_days.includes(date.getDay());
    default:
      return false;
  }
}

// =============================================================================
// Property 19: Weekly completion rate calculation
// =============================================================================

/**
 * Feature: growth-garden, Property 19: Weekly completion rate calculation
 *
 * **Validates: Requirements 12.1, 12.2, 12.4**
 *
 * *For any* set of active (non-paused, non-archived) habits with defined schedules,
 * the weekly completion rate SHALL equal (total completions in the rolling past 7 days)
 * divided by (total scheduled occurrences in the rolling past 7 days), expressed as a
 * whole-number percentage between 0 and 100.
 */
describe('Property 19: Weekly completion rate calculation', () => {
  const today = new Date('2024-06-15T12:00:00Z');
  const windowDates = buildWindowDates(today);

  it('result is always between 0 and 100 inclusive when completions do not exceed scheduled occurrences', () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryHabit19(), { minLength: 0, maxLength: 10 }),
        fc.array(fc.boolean(), { minLength: 50, maxLength: 50 }),
        (habits, decisions) => {
          // Generate at most one completion per scheduled day per active habit
          const activeHabits = habits.filter((h) => h.status === 'active');
          const completions: Completion[] = [];
          let decIdx = 0;
          for (const habit of activeHabits) {
            for (const dateStr of windowDates) {
              const d = new Date(dateStr + 'T00:00:00Z');
              if (isScheduledDayHelper(habit, d) && decisions[decIdx % decisions.length]) {
                completions.push({
                  id: `completion-${completions.length}`,
                  habit_id: habit.id,
                  user_id: 'user-1',
                  completed_date: dateStr,
                  created_at: '2024-01-01T00:00:00Z',
                });
              }
              decIdx++;
            }
          }

          const rate = calculateWeeklyCompletionRate(habits, completions, today);
          expect(rate).toBeGreaterThanOrEqual(0);
          expect(rate).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns 0 when there are no active habits', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 10 }),
        fc.nat({ max: 20 }),
        (numHabits, numCompletions) => {
          // All non-active habits
          const nonActiveHabits: Habit[] = Array.from({ length: numHabits }, (_, i) => ({
            id: `habit-${i}`,
            user_id: 'user-1',
            name: `Habit ${i}`,
            schedule_type: 'daily' as const,
            schedule_days: null,
            status: i % 2 === 0 ? ('paused' as const) : ('archived' as const),
            current_streak: 5,
            is_wilting: false,
            paused_at: null,
            paused_streak: null,
            paused_growth_stage: null,
            archived_at: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          }));
          const completions: Completion[] = Array.from({ length: numCompletions }, (_, i) => ({
            id: `c-${i}`,
            habit_id: `habit-${i % Math.max(numHabits, 1)}`,
            user_id: 'user-1',
            completed_date: windowDates[i % windowDates.length],
            created_at: '2024-01-01T00:00:00Z',
          }));
          const rate = calculateWeeklyCompletionRate(nonActiveHabits, completions, today);
          expect(rate).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('returns 0 when there are no scheduled occurrences for active habits in the window', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 100 }),
        () => {
          // Active habit with empty schedule_days (weekly with no days = no scheduled occurrences)
          const habit: Habit = {
            id: 'habit-no-schedule',
            user_id: 'user-1',
            name: 'No Schedule',
            schedule_type: 'weekly',
            schedule_days: [],
            status: 'active',
            current_streak: 0,
            is_wilting: false,
            paused_at: null,
            paused_streak: null,
            paused_growth_stage: null,
            archived_at: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          };
          const rate = calculateWeeklyCompletionRate([habit], [], today);
          expect(rate).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('correctly computes the rate as Math.round((completed / scheduled) * 100)', () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryHabit19(), { minLength: 1, maxLength: 5 }),
        fc.array(fc.boolean(), { minLength: 50, maxLength: 50 }),
        (habits, completionDecisions) => {
          // Ensure at least one active habit
          const habitsWithActive: Habit[] = [
            ...habits,
            {
              id: 'habit-forced-active',
              user_id: 'user-1',
              name: 'Active Habit',
              schedule_type: 'daily' as const,
              schedule_days: null,
              status: 'active' as const,
              current_streak: 3,
              is_wilting: false,
              paused_at: null,
              paused_streak: null,
              paused_growth_stage: null,
              archived_at: null,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            },
          ];

          const activeHabits = habitsWithActive.filter((h) => h.status === 'active');
          const activeHabitIds = new Set(activeHabits.map((h) => h.id));

          // Compute expected scheduled count
          let totalScheduled = 0;
          for (const habit of activeHabits) {
            for (const dateStr of windowDates) {
              const d = new Date(dateStr + 'T00:00:00Z');
              if (isScheduledDayHelper(habit, d)) {
                totalScheduled++;
              }
            }
          }

          if (totalScheduled === 0) {
            const rate = calculateWeeklyCompletionRate(habitsWithActive, [], today);
            expect(rate).toBe(0);
            return;
          }

          // Generate completions deterministically based on random booleans
          const completions: Completion[] = [];
          let decisionIdx = 0;
          for (const habit of activeHabits) {
            for (const dateStr of windowDates) {
              const d = new Date(dateStr + 'T00:00:00Z');
              if (isScheduledDayHelper(habit, d) && completionDecisions[decisionIdx % completionDecisions.length]) {
                completions.push({
                  id: `completion-${completions.length}`,
                  habit_id: habit.id,
                  user_id: 'user-1',
                  completed_date: dateStr,
                  created_at: '2024-01-01T00:00:00Z',
                });
              }
              decisionIdx++;
            }
          }

          const rate = calculateWeeklyCompletionRate(habitsWithActive, completions, today);

          // Count actual completions that match active habits in window
          const windowDateSet = new Set(windowDates);
          let actualCompleted = 0;
          for (const c of completions) {
            if (activeHabitIds.has(c.habit_id) && windowDateSet.has(c.completed_date)) {
              actualCompleted++;
            }
          }

          const expectedRate = Math.round((actualCompleted / totalScheduled) * 100);
          expect(rate).toBe(expectedRate);
          expect(rate).toBeGreaterThanOrEqual(0);
          expect(rate).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('only considers active habits, ignoring paused and archived', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 6 }),
        (scheduledDay) => {
          const activeHabit: Habit = {
            id: 'habit-active',
            user_id: 'user-1',
            name: 'Active',
            schedule_type: 'daily',
            schedule_days: null,
            status: 'active',
            current_streak: 5,
            is_wilting: false,
            paused_at: null,
            paused_streak: null,
            paused_growth_stage: null,
            archived_at: null,
            created_at: '2024-01-01T00:00:00Z',
            updated_at: '2024-01-01T00:00:00Z',
          };

          const pausedHabit: Habit = { ...activeHabit, id: 'habit-paused', name: 'Paused', status: 'paused' };
          const archivedHabit: Habit = { ...activeHabit, id: 'habit-archived', name: 'Archived', status: 'archived' };

          // Completions for the active habit covering the window
          const completions: Completion[] = windowDates.map((dateStr, i) => ({
            id: `c-${i}`,
            habit_id: 'habit-active',
            user_id: 'user-1',
            completed_date: dateStr,
            created_at: '2024-01-01T00:00:00Z',
          }));

          // Rate with only active habit
          const rateActiveOnly = calculateWeeklyCompletionRate([activeHabit], completions, today);

          // Rate with paused and archived habits added (should not change result)
          const rateWithAll = calculateWeeklyCompletionRate(
            [activeHabit, pausedHabit, archivedHabit],
            completions,
            today
          );

          expect(rateActiveOnly).toBe(rateWithAll);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =============================================================================
// Property 20: Dashboard statistics computation
// =============================================================================

/**
 * Feature: growth-garden, Property 20: Dashboard statistics computation
 *
 * **Validates: Requirements 12.1, 12.2, 12.4**
 *
 * *For any* set of user habits (active, paused, and archived) with their completions
 * and rare flowers, the dashboard SHALL correctly compute: total active habits count
 * (excluding paused and archived), the longest current streak among active habits,
 * total lifetime completions (including archived), and total rare flowers unlocked
 * (including archived).
 */
describe('Property 20: Dashboard statistics computation', () => {
  const today = new Date('2024-06-15T12:00:00Z');
  const windowDates = buildWindowDates(today);

  it('total_active_habits equals count of habits with status === active', () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryHabit19(), { minLength: 0, maxLength: 15 }),
        (habits) => {
          const stats = computeDashboardStats(habits, [], [], today);
          const expectedActive = habits.filter((h) => h.status === 'active').length;
          expect(stats.total_active_habits).toBe(expectedActive);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('longest_current_streak equals max streak among active habits (0 if none)', () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryHabit19(), { minLength: 0, maxLength: 15 }),
        (habits) => {
          const stats = computeDashboardStats(habits, [], [], today);
          const activeHabits = habits.filter((h) => h.status === 'active');
          const expectedStreak = activeHabits.length > 0
            ? Math.max(...activeHabits.map((h) => h.current_streak))
            : 0;
          expect(stats.longest_current_streak).toBe(expectedStreak);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('total_lifetime_completions equals total count of all completions including archived', () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryHabit19(), { minLength: 1, maxLength: 10 }),
        fc.nat({ max: 50 }),
        (habits, numCompletions) => {
          const habitIds = habits.map((h) => h.id);
          const completions: Completion[] = Array.from({ length: numCompletions }, (_, i) => ({
            id: `completion-${i}`,
            habit_id: habitIds[i % habitIds.length],
            user_id: 'user-1',
            completed_date: '2024-06-10',
            created_at: '2024-01-01T00:00:00Z',
          }));

          const stats = computeDashboardStats(habits, completions, [], today);
          expect(stats.total_lifetime_completions).toBe(completions.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('total_rare_flowers equals total count of all rare flowers including archived', () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryHabit19(), { minLength: 1, maxLength: 10 }),
        fc.nat({ max: 20 }),
        (habits, numFlowers) => {
          const habitIds = habits.map((h) => h.id);
          const rareFlowers: RareFlower[] = Array.from({ length: numFlowers }, (_, i) => ({
            id: `flower-${i}`,
            habit_id: habitIds[i % habitIds.length],
            milestone: ([30, 60, 100] as const)[i % 3],
            variant_id: 'crystal_bloom',
            is_active_display: true,
            unlocked_at: '2024-01-01T00:00:00Z',
          }));

          const stats = computeDashboardStats(habits, [], rareFlowers, today);
          expect(stats.total_rare_flowers).toBe(rareFlowers.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('all dashboard statistics are computed correctly together', () => {
    fc.assert(
      fc.property(
        fc.array(arbitraryHabit19(), { minLength: 1, maxLength: 10 }),
        fc.array(fc.boolean(), { minLength: 50, maxLength: 50 }),
        fc.nat({ max: 10 }),
        (habits, completionDecisions, numFlowers) => {
          const habitIds = habits.map((h) => h.id);

          // Generate at most one completion per scheduled day per active habit
          const activeHabits = habits.filter((h) => h.status === 'active');
          const completions: Completion[] = [];
          let decIdx = 0;
          for (const habit of activeHabits) {
            for (const dateStr of windowDates) {
              const d = new Date(dateStr + 'T00:00:00Z');
              if (isScheduledDayHelper(habit, d) && completionDecisions[decIdx % completionDecisions.length]) {
                completions.push({
                  id: `completion-${completions.length}`,
                  habit_id: habit.id,
                  user_id: 'user-1',
                  completed_date: dateStr,
                  created_at: '2024-01-01T00:00:00Z',
                });
              }
              decIdx++;
            }
          }
          // Also add completions for non-active habits (they count in lifetime but not rate)
          for (const habit of habits.filter((h) => h.status !== 'active')) {
            completions.push({
              id: `completion-archived-${completions.length}`,
              habit_id: habit.id,
              user_id: 'user-1',
              completed_date: '2024-06-01',
              created_at: '2024-01-01T00:00:00Z',
            });
          }

          const rareFlowers: RareFlower[] = Array.from({ length: numFlowers }, (_, i) => ({
            id: `flower-${i}`,
            habit_id: habitIds[i % habitIds.length],
            milestone: ([30, 60, 100] as const)[i % 3],
            variant_id: 'crystal_bloom',
            is_active_display: true,
            unlocked_at: '2024-01-01T00:00:00Z',
          }));

          const stats = computeDashboardStats(habits, completions, rareFlowers, today);

          // Verify total_active_habits
          expect(stats.total_active_habits).toBe(activeHabits.length);

          // Verify longest_current_streak
          const expectedStreak = activeHabits.length > 0
            ? Math.max(...activeHabits.map((h) => h.current_streak))
            : 0;
          expect(stats.longest_current_streak).toBe(expectedStreak);

          // Verify total_lifetime_completions
          expect(stats.total_lifetime_completions).toBe(completions.length);

          // Verify total_rare_flowers
          expect(stats.total_rare_flowers).toBe(rareFlowers.length);

          // Verify weekly_completion_rate is within bounds
          expect(stats.weekly_completion_rate).toBeGreaterThanOrEqual(0);
          expect(stats.weekly_completion_rate).toBeLessThanOrEqual(100);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('paused and archived habits do not affect active habit count or longest streak', () => {
    fc.assert(
      fc.property(
        fc.nat({ max: 200 }),
        fc.nat({ max: 200 }),
        fc.nat({ max: 200 }),
        (activeStreak, pausedStreak, archivedStreak) => {
          const habits: Habit[] = [
            {
              id: 'habit-active',
              user_id: 'user-1',
              name: 'Active',
              schedule_type: 'daily',
              schedule_days: null,
              status: 'active',
              current_streak: activeStreak,
              is_wilting: false,
              paused_at: null,
              paused_streak: null,
              paused_growth_stage: null,
              archived_at: null,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            },
            {
              id: 'habit-paused',
              user_id: 'user-1',
              name: 'Paused',
              schedule_type: 'daily',
              schedule_days: null,
              status: 'paused',
              current_streak: pausedStreak,
              is_wilting: false,
              paused_at: null,
              paused_streak: null,
              paused_growth_stage: null,
              archived_at: null,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            },
            {
              id: 'habit-archived',
              user_id: 'user-1',
              name: 'Archived',
              schedule_type: 'daily',
              schedule_days: null,
              status: 'archived',
              current_streak: archivedStreak,
              is_wilting: false,
              paused_at: null,
              paused_streak: null,
              paused_growth_stage: null,
              archived_at: null,
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            },
          ];

          const stats = computeDashboardStats(habits, [], [], today);

          // Only count active habits
          expect(stats.total_active_habits).toBe(1);

          // Longest streak only considers active habits
          expect(stats.longest_current_streak).toBe(activeStreak);
        }
      ),
      { numRuns: 100 }
    );
  });
});
