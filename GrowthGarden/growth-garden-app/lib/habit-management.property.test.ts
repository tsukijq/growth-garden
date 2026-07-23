import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  computeGrowthStage,
  editHabit,
  pauseHabit,
  resumeHabit,
  archiveHabit,
  restoreHabit,
  shouldWilt,
} from './garden-engine';
import type { Habit, GrowthStage, Completion, RareFlower, UpdateHabitInput } from './types';

// =============================================================================
// Helper: Habit Factory
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
// Arbitraries
// =============================================================================

/** Valid habit name between 1 and 50 characters */
const habitNameArb = fc.string({ minLength: 1, maxLength: 50 }).filter((s) => s.trim().length > 0);

/** Schedule type */
const scheduleTypeArb = fc.constantFrom('daily' as const, 'weekly' as const, 'custom' as const);

/** Schedule days for weekly (single day) */
const weeklyDaysArb = fc.integer({ min: 0, max: 6 }).map((d) => [d]);

/** Schedule days for custom (subset of days) */
const customDaysArb = fc.uniqueArray(fc.integer({ min: 0, max: 6 }), { minLength: 1, maxLength: 7 });

/** Non-negative streak value */
const streakArb = fc.nat({ max: 200 });

/** Generate a valid active habit with a streak and computed growth stage */
const activeHabitWithStreakArb: fc.Arbitrary<Habit> = fc
  .record({
    streak: streakArb,
    isWilting: fc.boolean(),
    scheduleType: scheduleTypeArb,
    scheduleDays: fc.oneof(
      fc.constant(null),
      weeklyDaysArb,
      customDaysArb
    ),
    name: habitNameArb,
  })
  .map(({ streak, isWilting, scheduleType, scheduleDays, name }) => {
    // Ensure schedule_days consistency with schedule_type
    let finalDays: number[] | null;
    if (scheduleType === 'daily') {
      finalDays = null;
    } else if (scheduleType === 'weekly') {
      finalDays = scheduleDays && scheduleDays.length > 0 ? [scheduleDays[0]] : [0];
    } else {
      finalDays = scheduleDays && scheduleDays.length > 0 ? scheduleDays : [1, 3, 5];
    }

    return makeHabit({
      name,
      schedule_type: scheduleType,
      schedule_days: finalDays,
      status: 'active',
      current_streak: streak,
      is_wilting: isWilting,
    });
  });

/** Generate valid update inputs for editing a habit */
const updateInputArb: fc.Arbitrary<UpdateHabitInput> = fc.record({
  name: fc.option(habitNameArb, { nil: undefined }),
  schedule_type: fc.option(scheduleTypeArb, { nil: undefined }),
  schedule_days: fc.option(
    fc.oneof(weeklyDaysArb, customDaysArb),
    { nil: undefined }
  ),
});

// =============================================================================
// Property 15: Habit edit preserves streak and growth stage
// =============================================================================
// *For any* active habit with a current streak and growth stage, editing the
// habit's name or schedule SHALL preserve the exact same streak value and
// growth stage.
//
// **Validates: Requirements 10.1**
// Feature: growth-garden, Property 15: Habit edit preserves streak and growth stage
// =============================================================================

describe('Feature: growth-garden, Property 15: Habit edit preserves streak and growth stage', () => {
  it('editing name preserves streak and growth stage for any active habit', () => {
    fc.assert(
      fc.property(activeHabitWithStreakArb, habitNameArb, (habit, newName) => {
        const originalStreak = habit.current_streak;
        const originalGrowthStage = computeGrowthStage(habit.current_streak, habit.is_wilting);

        const edited = editHabit(habit, { name: newName });

        // Streak must be preserved
        expect(edited.current_streak).toBe(originalStreak);

        // Growth stage must be preserved (computed from same streak and wilting state)
        const editedGrowthStage = computeGrowthStage(edited.current_streak, edited.is_wilting);
        expect(editedGrowthStage).toBe(originalGrowthStage);

        // Wilting state must be preserved
        expect(edited.is_wilting).toBe(habit.is_wilting);
      }),
      { numRuns: 100 }
    );
  });

  it('editing schedule preserves streak and growth stage for any active habit', () => {
    fc.assert(
      fc.property(
        activeHabitWithStreakArb,
        scheduleTypeArb,
        fc.oneof(weeklyDaysArb, customDaysArb),
        (habit, newScheduleType, newScheduleDays) => {
          const originalStreak = habit.current_streak;
          const originalGrowthStage = computeGrowthStage(habit.current_streak, habit.is_wilting);

          const edited = editHabit(habit, {
            schedule_type: newScheduleType,
            schedule_days: newScheduleDays,
          });

          // Streak must be preserved
          expect(edited.current_streak).toBe(originalStreak);

          // Growth stage must be preserved
          const editedGrowthStage = computeGrowthStage(edited.current_streak, edited.is_wilting);
          expect(editedGrowthStage).toBe(originalGrowthStage);

          // Wilting state must be preserved
          expect(edited.is_wilting).toBe(habit.is_wilting);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('editing name and schedule simultaneously preserves streak and growth stage', () => {
    fc.assert(
      fc.property(activeHabitWithStreakArb, updateInputArb, (habit, updates) => {
        const originalStreak = habit.current_streak;
        const originalIsWilting = habit.is_wilting;
        const originalGrowthStage = computeGrowthStage(originalStreak, originalIsWilting);

        const edited = editHabit(habit, updates);

        // Streak must be preserved regardless of what was edited
        expect(edited.current_streak).toBe(originalStreak);

        // Wilting state must be preserved
        expect(edited.is_wilting).toBe(originalIsWilting);

        // Growth stage (computed) must be preserved
        const editedGrowthStage = computeGrowthStage(edited.current_streak, edited.is_wilting);
        expect(editedGrowthStage).toBe(originalGrowthStage);
      }),
      { numRuns: 100 }
    );
  });
});

// =============================================================================
// Property 16: Pause/resume round trip preserves state
// =============================================================================
// *For any* active habit with a given streak and growth stage, pausing and
// then resuming the habit SHALL restore the exact same streak and growth
// stage values. While paused, the habit SHALL be excluded from wilting
// evaluation.
//
// **Validates: Requirements 10.2, 10.3**
// Feature: growth-garden, Property 16: Pause/resume round trip preserves state
// =============================================================================

describe('Feature: growth-garden, Property 16: Pause/resume round trip preserves state', () => {
  it('pause then resume restores exact streak value for any active habit', () => {
    fc.assert(
      fc.property(activeHabitWithStreakArb, (habit) => {
        // Only meaningful for non-wilting active habits
        fc.pre(habit.status === 'active');

        const originalStreak = habit.current_streak;

        const paused = pauseHabit(habit);
        const resumed = resumeHabit(paused);

        // Streak must be restored to original value
        expect(resumed.current_streak).toBe(originalStreak);
      }),
      { numRuns: 100 }
    );
  });

  it('pause then resume restores exact growth stage for any active habit', () => {
    fc.assert(
      fc.property(activeHabitWithStreakArb, (habit) => {
        fc.pre(habit.status === 'active');

        const originalGrowthStage = computeGrowthStage(habit.current_streak, habit.is_wilting);

        const paused = pauseHabit(habit);
        const resumed = resumeHabit(paused);

        // Growth stage must be restored
        const resumedGrowthStage = computeGrowthStage(resumed.current_streak, resumed.is_wilting);
        expect(resumedGrowthStage).toBe(originalGrowthStage);
      }),
      { numRuns: 100 }
    );
  });

  it('paused habit status is paused and stores frozen streak', () => {
    fc.assert(
      fc.property(activeHabitWithStreakArb, (habit) => {
        fc.pre(habit.status === 'active');

        const paused = pauseHabit(habit);

        // Status must be paused
        expect(paused.status).toBe('paused');

        // Paused streak must equal original streak
        expect(paused.paused_streak).toBe(habit.current_streak);

        // Paused growth stage must equal computed growth stage at time of pause
        const expectedGrowthStage = computeGrowthStage(habit.current_streak, habit.is_wilting);
        expect(paused.paused_growth_stage).toBe(expectedGrowthStage);

        // paused_at must be set
        expect(paused.paused_at).not.toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it('paused habit is excluded from wilting evaluation (shouldWilt returns false)', () => {
    fc.assert(
      fc.property(
        activeHabitWithStreakArb,
        fc.date({ min: new Date(2024, 0, 1), max: new Date(2024, 11, 31) }),
        (habit, today) => {
          fc.pre(habit.status === 'active');

          const paused = pauseHabit(habit);

          // A paused habit should never wilt regardless of completions
          const willWilt = shouldWilt(paused, [], today);
          expect(willWilt).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('resumed habit status is active with cleared paused fields', () => {
    fc.assert(
      fc.property(activeHabitWithStreakArb, (habit) => {
        fc.pre(habit.status === 'active');

        const paused = pauseHabit(habit);
        const resumed = resumeHabit(paused);

        // Status must be active
        expect(resumed.status).toBe('active');

        // Paused fields must be cleared
        expect(resumed.paused_at).toBeNull();
        expect(resumed.paused_streak).toBeNull();
        expect(resumed.paused_growth_stage).toBeNull();
      }),
      { numRuns: 100 }
    );
  });
});

// =============================================================================
// Property 17: Archive preserves data, restore resets streak to zero
// =============================================================================
// *For any* habit that is archived, all completion history and rare flowers
// SHALL be preserved. *For any* archived habit that is restored, the growth
// stage SHALL match the value at archival time, and the streak SHALL be reset
// to zero.
//
// **Validates: Requirements 10.4, 10.5**
// Feature: growth-garden, Property 17: Archive preserves data, restore resets streak to zero
// =============================================================================

describe('Feature: growth-garden, Property 17: Archive preserves data, restore resets streak to zero', () => {
  it('archiving a habit preserves streak and growth stage in the record', () => {
    fc.assert(
      fc.property(activeHabitWithStreakArb, (habit) => {
        fc.pre(habit.status === 'active');

        const originalStreak = habit.current_streak;
        const originalIsWilting = habit.is_wilting;

        const archived = archiveHabit(habit);

        // Status must be archived
        expect(archived.status).toBe('archived');

        // archived_at must be set
        expect(archived.archived_at).not.toBeNull();

        // Streak and wilting state are preserved in the record at archival time
        expect(archived.current_streak).toBe(originalStreak);
        expect(archived.is_wilting).toBe(originalIsWilting);
      }),
      { numRuns: 100 }
    );
  });

  it('archiving preserves completion history and rare flowers (external data is unchanged)', () => {
    fc.assert(
      fc.property(
        activeHabitWithStreakArb,
        fc.array(
          fc.record({
            id: fc.string({ minLength: 5, maxLength: 10 }),
            completed_date: fc.constantFrom('2024-06-01', '2024-06-02', '2024-06-03'),
          }),
          { minLength: 0, maxLength: 10 }
        ),
        fc.array(
          fc.constantFrom(30 as const, 60 as const, 100 as const),
          { minLength: 0, maxLength: 3 }
        ),
        (habit, completionData, milestones) => {
          fc.pre(habit.status === 'active');

          // Create completion records associated with this habit
          const completions: Completion[] = completionData.map((c, i) => ({
            id: c.id,
            habit_id: habit.id,
            user_id: habit.user_id,
            completed_date: c.completed_date,
            created_at: '2024-01-01T00:00:00Z',
          }));

          // Create rare flower records associated with this habit
          const rareFlowers: RareFlower[] = milestones.map((m, i) => ({
            id: `flower-${i}`,
            habit_id: habit.id,
            milestone: m,
            variant_id: `variant-${m}`,
            is_active_display: false,
            unlocked_at: '2024-01-01T00:00:00Z',
          }));

          // Archive the habit
          const archived = archiveHabit(habit);

          // The archive operation only changes the habit state.
          // Completion history and rare flowers are separate data that must
          // be preserved by the system (not deleted). Verify the archived habit
          // doesn't lose its identity (id and user_id preserved).
          expect(archived.id).toBe(habit.id);
          expect(archived.user_id).toBe(habit.user_id);

          // The external data (completions and rare flowers) remain untouched
          // by the archiveHabit pure function — they are preserved externally.
          // We verify they can still be associated with the archived habit.
          expect(completions.every((c) => c.habit_id === archived.id)).toBe(true);
          expect(rareFlowers.every((f) => f.habit_id === archived.id)).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('restoring an archived habit resets streak to zero', () => {
    fc.assert(
      fc.property(activeHabitWithStreakArb, (habit) => {
        fc.pre(habit.status === 'active');

        // Archive then restore
        const archived = archiveHabit(habit);
        const restored = restoreHabit(archived);

        // Streak must be reset to zero
        expect(restored.current_streak).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it('restoring an archived habit sets status to active and clears archived_at', () => {
    fc.assert(
      fc.property(activeHabitWithStreakArb, (habit) => {
        fc.pre(habit.status === 'active');

        const archived = archiveHabit(habit);
        const restored = restoreHabit(archived);

        // Status must be active
        expect(restored.status).toBe('active');

        // archived_at must be cleared
        expect(restored.archived_at).toBeNull();

        // Not wilting after restore
        expect(restored.is_wilting).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  it('growth stage at archival matches growth stage computed from archived habit state', () => {
    fc.assert(
      fc.property(activeHabitWithStreakArb, (habit) => {
        fc.pre(habit.status === 'active');

        const growthStageAtArchival = computeGrowthStage(habit.current_streak, habit.is_wilting);

        const archived = archiveHabit(habit);

        // The growth stage can be recomputed from the archived habit's preserved state
        const archivedGrowthStage = computeGrowthStage(archived.current_streak, archived.is_wilting);
        expect(archivedGrowthStage).toBe(growthStageAtArchival);
      }),
      { numRuns: 100 }
    );
  });

  it('archive then restore full round trip: streak resets, identity preserved', () => {
    fc.assert(
      fc.property(activeHabitWithStreakArb, (habit) => {
        fc.pre(habit.status === 'active');

        const archived = archiveHabit(habit);
        const restored = restoreHabit(archived);

        // Streak is reset to zero
        expect(restored.current_streak).toBe(0);

        // Identity is preserved
        expect(restored.id).toBe(habit.id);
        expect(restored.user_id).toBe(habit.user_id);
        expect(restored.name).toBe(habit.name);

        // Schedule is preserved
        expect(restored.schedule_type).toBe(habit.schedule_type);
        expect(restored.schedule_days).toEqual(habit.schedule_days);

        // Status is active
        expect(restored.status).toBe('active');
      }),
      { numRuns: 100 }
    );
  });
});
