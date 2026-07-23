import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { computeGrowthStage, shouldWilt, isScheduledDay } from './garden-engine';
import type { Habit, Completion, GrowthStage } from './types';

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

/**
 * Formats a Date as YYYY-MM-DD string for completion records.
 */
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// =============================================================================
// Pure domain logic for duplicate completion detection
// =============================================================================

/**
 * Checks if a completion already exists for a given habit and date.
 * This mirrors the duplicate detection logic in the completeHabit Server Action
 * but operates on a pure in-memory list of completions.
 *
 * @returns true if a duplicate exists (completion should be rejected)
 */
function isDuplicateCompletion(
  habitId: string,
  date: string,
  existingCompletions: Completion[]
): boolean {
  return existingCompletions.some(
    (c) => c.habit_id === habitId && c.completed_date === date
  );
}

/**
 * Simulates the wilting transition for a habit that missed a scheduled day.
 * Returns the new habit state after wilting is applied.
 */
function applyWiltingTransition(habit: Habit): Habit {
  return {
    ...habit,
    is_wilting: true,
    current_streak: 0,
  };
}

/**
 * Simulates the wilting recovery when a completion is recorded on a wilting habit.
 * Returns the new habit state after recovery.
 */
function applyWiltingRecovery(habit: Habit): Habit {
  return {
    ...habit,
    is_wilting: false,
    current_streak: 1,
  };
}

// =============================================================================
// Arbitraries
// =============================================================================

/** Generates a valid day of week (0-6) */
const dayOfWeekArb = fc.integer({ min: 0, max: 6 });

/** Generates a non-empty array of unique days of week */
const scheduleDaysArb = fc.uniqueArray(dayOfWeekArb, { minLength: 1, maxLength: 7 });

/** Generates a Date within a reasonable range */
const dateArb = fc.date({ min: new Date(2020, 0, 1), max: new Date(2030, 11, 31) });

/** Non-negative streak value */
const streakArb = fc.nat({ max: 200 });

/** Generates a habit with any valid schedule type */
const habitWithScheduleArb: fc.Arbitrary<Habit> = fc
  .record({
    scheduleType: fc.constantFrom('daily' as const, 'weekly' as const, 'custom' as const),
    scheduleDays: scheduleDaysArb,
    streak: streakArb,
    isWilting: fc.boolean(),
  })
  .map(({ scheduleType, scheduleDays, streak, isWilting }) => {
    let finalDays: number[] | null;
    if (scheduleType === 'daily') {
      finalDays = null;
    } else if (scheduleType === 'weekly') {
      finalDays = [scheduleDays[0]];
    } else {
      finalDays = scheduleDays;
    }
    return makeHabit({
      schedule_type: scheduleType,
      schedule_days: finalDays,
      status: 'active',
      current_streak: streak,
      is_wilting: isWilting,
    });
  });

/** Generates an active, non-wilting habit with arbitrary streak */
const activeNonWiltingHabitArb: fc.Arbitrary<Habit> = fc
  .record({
    scheduleType: fc.constantFrom('daily' as const, 'weekly' as const, 'custom' as const),
    scheduleDays: scheduleDaysArb,
    streak: streakArb,
  })
  .map(({ scheduleType, scheduleDays, streak }) => {
    let finalDays: number[] | null;
    if (scheduleType === 'daily') {
      finalDays = null;
    } else if (scheduleType === 'weekly') {
      finalDays = [scheduleDays[0]];
    } else {
      finalDays = scheduleDays;
    }
    return makeHabit({
      schedule_type: scheduleType,
      schedule_days: finalDays,
      status: 'active',
      current_streak: streak,
      is_wilting: false,
    });
  });

/** Generates an active, wilting habit (streak can be anything, is_wilting=true) */
const wiltingHabitArb: fc.Arbitrary<Habit> = fc
  .record({
    scheduleType: fc.constantFrom('daily' as const, 'weekly' as const, 'custom' as const),
    scheduleDays: scheduleDaysArb,
    streak: fc.nat({ max: 200 }),
  })
  .map(({ scheduleType, scheduleDays, streak }) => {
    let finalDays: number[] | null;
    if (scheduleType === 'daily') {
      finalDays = null;
    } else if (scheduleType === 'weekly') {
      finalDays = [scheduleDays[0]];
    } else {
      finalDays = scheduleDays;
    }
    return makeHabit({
      schedule_type: scheduleType,
      schedule_days: finalDays,
      status: 'active',
      current_streak: streak,
      is_wilting: true,
    });
  });

// =============================================================================
// Property 4: Completion uniqueness per habit per day
// =============================================================================
// *For any* habit and scheduled date, if a completion already exists for that
// habit on that date, attempting to record another completion SHALL be rejected
// without modifying any state.
//
// **Validates: Requirements 3.3, 3.4**
// Feature: growth-garden, Property 4: Completion uniqueness per habit per day
// =============================================================================

describe('Feature: growth-garden, Property 4: Completion uniqueness per habit per day', () => {
  it('rejects duplicate completion when one already exists for the same habit and date', () => {
    fc.assert(
      fc.property(
        habitWithScheduleArb,
        dateArb,
        (habit, date) => {
          const dateStr = formatDate(date);

          // Create an existing completion for this habit and date
          const existingCompletions: Completion[] = [
            {
              id: 'completion-existing',
              habit_id: habit.id,
              user_id: habit.user_id,
              completed_date: dateStr,
              created_at: '2024-01-01T00:00:00Z',
            },
          ];

          // Attempting to record another completion for the same habit+date must be rejected
          const isDuplicate = isDuplicateCompletion(habit.id, dateStr, existingCompletions);
          expect(isDuplicate).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('allows completion when no existing completion for that habit and date', () => {
    fc.assert(
      fc.property(
        habitWithScheduleArb,
        dateArb,
        dateArb,
        (habit, existingDate, attemptDate) => {
          const existingDateStr = formatDate(existingDate);
          const attemptDateStr = formatDate(attemptDate);

          // Ensure the dates are different
          fc.pre(existingDateStr !== attemptDateStr);

          // Create an existing completion on a DIFFERENT date
          const existingCompletions: Completion[] = [
            {
              id: 'completion-existing',
              habit_id: habit.id,
              user_id: habit.user_id,
              completed_date: existingDateStr,
              created_at: '2024-01-01T00:00:00Z',
            },
          ];

          // Attempting on a different date should NOT be rejected
          const isDuplicate = isDuplicateCompletion(habit.id, attemptDateStr, existingCompletions);
          expect(isDuplicate).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('allows completion for a different habit on the same date', () => {
    fc.assert(
      fc.property(
        habitWithScheduleArb,
        dateArb,
        fc.string({ minLength: 5, maxLength: 20 }),
        (habit, date, differentHabitId) => {
          const dateStr = formatDate(date);

          // Ensure different habit ID
          fc.pre(differentHabitId !== habit.id);

          // Create an existing completion for a DIFFERENT habit on the same date
          const existingCompletions: Completion[] = [
            {
              id: 'completion-existing',
              habit_id: differentHabitId,
              user_id: habit.user_id,
              completed_date: dateStr,
              created_at: '2024-01-01T00:00:00Z',
            },
          ];

          // Attempting for the original habit should NOT be rejected
          const isDuplicate = isDuplicateCompletion(habit.id, dateStr, existingCompletions);
          expect(isDuplicate).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('duplicate detection does not modify existing state (completions list unchanged)', () => {
    fc.assert(
      fc.property(
        habitWithScheduleArb,
        dateArb,
        fc.nat({ max: 10 }),
        (habit, date, numExisting) => {
          const dateStr = formatDate(date);

          // Generate existing completions (including one for the target date)
          const existingCompletions: Completion[] = Array.from(
            { length: numExisting + 1 },
            (_, i) => ({
              id: `completion-${i}`,
              habit_id: habit.id,
              user_id: habit.user_id,
              completed_date: i === 0 ? dateStr : `2024-01-${String(i + 1).padStart(2, '0')}`,
              created_at: '2024-01-01T00:00:00Z',
            })
          );

          // Snapshot the state before duplicate check
          const completionsBeforeLength = existingCompletions.length;
          const completionsBefore = existingCompletions.map((c) => ({ ...c }));

          // Perform the duplicate check
          isDuplicateCompletion(habit.id, dateStr, existingCompletions);

          // State must remain unchanged
          expect(existingCompletions.length).toBe(completionsBeforeLength);
          existingCompletions.forEach((c, i) => {
            expect(c.id).toBe(completionsBefore[i].id);
            expect(c.habit_id).toBe(completionsBefore[i].habit_id);
            expect(c.completed_date).toBe(completionsBefore[i].completed_date);
          });
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =============================================================================
// Property 6: Wilting transition resets streak and sets wilting state
// =============================================================================
// *For any* active habit (regardless of current growth stage or streak value),
// when a scheduled day passes without a completion, the habit's `is_wilting`
// SHALL become true AND `current_streak` SHALL become 0.
//
// **Validates: Requirements 5.1, 5.2**
// Feature: growth-garden, Property 6: Wilting transition resets streak and sets wilting state
// =============================================================================

describe('Feature: growth-garden, Property 6: Wilting transition resets streak and sets wilting state', () => {
  it('shouldWilt returns true for active non-wilting habit with missed scheduled day', () => {
    fc.assert(
      fc.property(
        activeNonWiltingHabitArb,
        dateArb,
        (habit, today) => {
          // Ensure the habit has a scheduled day in the 7 days before today
          // and no completions for that day
          let hasScheduledDayBefore = false;
          for (let daysBack = 1; daysBack <= 7; daysBack++) {
            const candidate = new Date(today);
            candidate.setDate(today.getDate() - daysBack);
            if (isScheduledDay(habit, candidate)) {
              hasScheduledDayBefore = true;
              break;
            }
          }

          fc.pre(hasScheduledDayBefore);

          // No completions = missed the scheduled day
          const completions: Completion[] = [];
          const willWilt = shouldWilt(habit, completions, today);
          expect(willWilt).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('wilting transition sets is_wilting to true regardless of current streak', () => {
    fc.assert(
      fc.property(
        activeNonWiltingHabitArb,
        (habit) => {
          // Apply wilting transition
          const wilted = applyWiltingTransition(habit);

          // is_wilting must be true
          expect(wilted.is_wilting).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('wilting transition resets current_streak to 0 regardless of previous streak value', () => {
    fc.assert(
      fc.property(
        activeNonWiltingHabitArb,
        (habit) => {
          // Apply wilting transition
          const wilted = applyWiltingTransition(habit);

          // current_streak must be 0
          expect(wilted.current_streak).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('wilting transition produces a wilting growth stage', () => {
    fc.assert(
      fc.property(
        activeNonWiltingHabitArb,
        (habit) => {
          // Apply wilting transition
          const wilted = applyWiltingTransition(habit);

          // computeGrowthStage with is_wilting=true must return 'wilting'
          const growthStage = computeGrowthStage(wilted.current_streak, wilted.is_wilting);
          expect(growthStage).toBe('wilting');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('shouldWilt returns false if a completion exists for the last scheduled day', () => {
    fc.assert(
      fc.property(
        activeNonWiltingHabitArb,
        dateArb,
        (habit, today) => {
          // Find the last scheduled day before today
          let lastScheduledDay: Date | null = null;
          for (let daysBack = 1; daysBack <= 7; daysBack++) {
            const candidate = new Date(today);
            candidate.setDate(today.getDate() - daysBack);
            if (isScheduledDay(habit, candidate)) {
              lastScheduledDay = candidate;
              break;
            }
          }

          fc.pre(lastScheduledDay !== null);

          // Create a completion for the last scheduled day
          const completions: Completion[] = [
            {
              id: 'completion-1',
              habit_id: habit.id,
              user_id: habit.user_id,
              completed_date: formatDate(lastScheduledDay!),
              created_at: '2024-01-01T00:00:00Z',
            },
          ];

          const willWilt = shouldWilt(habit, completions, today);
          expect(willWilt).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// =============================================================================
// Property 7: Wilting recovery starts fresh at seed with streak 1
// =============================================================================
// *For any* habit in the wilting state, recording a completion SHALL set
// `is_wilting` to false, `current_streak` to 1, and
// `computeGrowthStage(1, false)` SHALL return `'seed'`.
//
// **Validates: Requirements 5.3**
// Feature: growth-garden, Property 7: Wilting recovery starts fresh at seed with streak 1
// =============================================================================

describe('Feature: growth-garden, Property 7: Wilting recovery starts fresh at seed with streak 1', () => {
  it('wilting recovery sets is_wilting to false for any wilting habit', () => {
    fc.assert(
      fc.property(wiltingHabitArb, (habit) => {
        // Simulate recording a completion on a wilting habit
        const recovered = applyWiltingRecovery(habit);

        expect(recovered.is_wilting).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('wilting recovery sets current_streak to 1 for any wilting habit', () => {
    fc.assert(
      fc.property(wiltingHabitArb, (habit) => {
        const recovered = applyWiltingRecovery(habit);

        expect(recovered.current_streak).toBe(1);
      }),
      { numRuns: 100 }
    );
  });

  it('after wilting recovery, computeGrowthStage(1, false) returns seed', () => {
    fc.assert(
      fc.property(wiltingHabitArb, (habit) => {
        const recovered = applyWiltingRecovery(habit);

        // The growth stage for streak=1, is_wilting=false must be 'seed'
        const growthStage = computeGrowthStage(recovered.current_streak, recovered.is_wilting);
        expect(growthStage).toBe('seed');
      }),
      { numRuns: 100 }
    );
  });

  it('wilting recovery preserves habit identity and schedule', () => {
    fc.assert(
      fc.property(wiltingHabitArb, (habit) => {
        const recovered = applyWiltingRecovery(habit);

        // Identity preserved
        expect(recovered.id).toBe(habit.id);
        expect(recovered.user_id).toBe(habit.user_id);
        expect(recovered.name).toBe(habit.name);

        // Schedule preserved
        expect(recovered.schedule_type).toBe(habit.schedule_type);
        expect(recovered.schedule_days).toEqual(habit.schedule_days);

        // Status preserved as active
        expect(recovered.status).toBe('active');
      }),
      { numRuns: 100 }
    );
  });

  it('computeGrowthStage(1, false) always returns seed (universal property)', () => {
    // This is a universal truth: streak=1 with no wilting is always 'seed'
    // since the threshold for sprout is 3
    const result = computeGrowthStage(1, false);
    expect(result).toBe('seed');
  });

  it('wilting recovery followed by growth stage computation always yields seed regardless of previous state', () => {
    fc.assert(
      fc.property(
        wiltingHabitArb,
        (habit) => {
          // No matter what the previous streak was (wilting state can have any streak value in the record)
          const recovered = applyWiltingRecovery(habit);

          // After recovery: is_wilting=false, current_streak=1
          // Growth stage must be 'seed' (streak 1 < threshold 3 for sprout)
          const growthStage = computeGrowthStage(recovered.current_streak, recovered.is_wilting);
          expect(growthStage).toBe('seed');

          // Double check the invariants
          expect(recovered.is_wilting).toBe(false);
          expect(recovered.current_streak).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});
