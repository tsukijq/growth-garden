import { describe, it, expect } from 'vitest';
import {
  computeGrowthStage,
  isScheduledDay,
  shouldWilt,
  calculateWeeklyCompletionRate,
  computeDashboardStats,
} from './garden-engine';
import type { Habit, Completion, RareFlower } from './types';

// =============================================================================
// Helper Factories
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

function makeCompletion(habitId: string, completedDate: string): Completion {
  return {
    id: `completion-${completedDate}`,
    habit_id: habitId,
    user_id: 'user-1',
    completed_date: completedDate,
    created_at: '2024-01-01T00:00:00Z',
  };
}

// =============================================================================
// computeGrowthStage Tests
// =============================================================================

describe('computeGrowthStage', () => {
  it('returns "wilting" when isWilting is true regardless of streak', () => {
    expect(computeGrowthStage(0, true)).toBe('wilting');
    expect(computeGrowthStage(5, true)).toBe('wilting');
    expect(computeGrowthStage(21, true)).toBe('wilting');
    expect(computeGrowthStage(100, true)).toBe('wilting');
  });

  it('returns "seed" for streak < 3', () => {
    expect(computeGrowthStage(0, false)).toBe('seed');
    expect(computeGrowthStage(1, false)).toBe('seed');
    expect(computeGrowthStage(2, false)).toBe('seed');
  });

  it('returns "sprout" for streak >= 3 and < 7', () => {
    expect(computeGrowthStage(3, false)).toBe('sprout');
    expect(computeGrowthStage(4, false)).toBe('sprout');
    expect(computeGrowthStage(6, false)).toBe('sprout');
  });

  it('returns "budding" for streak >= 7 and < 21', () => {
    expect(computeGrowthStage(7, false)).toBe('budding');
    expect(computeGrowthStage(10, false)).toBe('budding');
    expect(computeGrowthStage(20, false)).toBe('budding');
  });

  it('returns "blooming" for streak >= 21', () => {
    expect(computeGrowthStage(21, false)).toBe('blooming');
    expect(computeGrowthStage(50, false)).toBe('blooming');
    expect(computeGrowthStage(100, false)).toBe('blooming');
  });

  it('handles exact boundary values', () => {
    expect(computeGrowthStage(2, false)).toBe('seed');
    expect(computeGrowthStage(3, false)).toBe('sprout');
    expect(computeGrowthStage(6, false)).toBe('sprout');
    expect(computeGrowthStage(7, false)).toBe('budding');
    expect(computeGrowthStage(20, false)).toBe('budding');
    expect(computeGrowthStage(21, false)).toBe('blooming');
  });
});

// =============================================================================
// isScheduledDay Tests
// =============================================================================

describe('isScheduledDay', () => {
  describe('daily schedule', () => {
    it('returns true for any day of the week', () => {
      const habit = makeHabit({ schedule_type: 'daily' });
      // Test all 7 days of a week (Mon Jan 1, 2024 is a Monday)
      for (let day = 1; day <= 7; day++) {
        const date = new Date(2024, 0, day);
        expect(isScheduledDay(habit, date)).toBe(true);
      }
    });
  });

  describe('weekly schedule', () => {
    it('returns true only for the specified day', () => {
      // schedule_days[0] = 1 (Monday)
      const habit = makeHabit({ schedule_type: 'weekly', schedule_days: [1] });
      // Jan 1, 2024 is a Monday
      expect(isScheduledDay(habit, new Date(2024, 0, 1))).toBe(true);
      // Jan 2, 2024 is a Tuesday
      expect(isScheduledDay(habit, new Date(2024, 0, 2))).toBe(false);
    });

    it('returns false when schedule_days is null or empty', () => {
      const habitNull = makeHabit({ schedule_type: 'weekly', schedule_days: null });
      const habitEmpty = makeHabit({ schedule_type: 'weekly', schedule_days: [] });
      const date = new Date(2024, 0, 1);
      expect(isScheduledDay(habitNull, date)).toBe(false);
      expect(isScheduledDay(habitEmpty, date)).toBe(false);
    });

    it('correctly matches Sunday (0)', () => {
      const habit = makeHabit({ schedule_type: 'weekly', schedule_days: [0] });
      // Jan 7, 2024 is a Sunday
      expect(isScheduledDay(habit, new Date(2024, 0, 7))).toBe(true);
      // Jan 6, 2024 is a Saturday
      expect(isScheduledDay(habit, new Date(2024, 0, 6))).toBe(false);
    });
  });

  describe('custom schedule', () => {
    it('returns true only for days in the schedule_days array', () => {
      // Mon, Wed, Fri (1, 3, 5)
      const habit = makeHabit({ schedule_type: 'custom', schedule_days: [1, 3, 5] });
      // Jan 1, 2024 = Monday (1)
      expect(isScheduledDay(habit, new Date(2024, 0, 1))).toBe(true);
      // Jan 2, 2024 = Tuesday (2)
      expect(isScheduledDay(habit, new Date(2024, 0, 2))).toBe(false);
      // Jan 3, 2024 = Wednesday (3)
      expect(isScheduledDay(habit, new Date(2024, 0, 3))).toBe(true);
      // Jan 4, 2024 = Thursday (4)
      expect(isScheduledDay(habit, new Date(2024, 0, 4))).toBe(false);
      // Jan 5, 2024 = Friday (5)
      expect(isScheduledDay(habit, new Date(2024, 0, 5))).toBe(true);
    });

    it('returns false when schedule_days is null or empty', () => {
      const habitNull = makeHabit({ schedule_type: 'custom', schedule_days: null });
      const habitEmpty = makeHabit({ schedule_type: 'custom', schedule_days: [] });
      const date = new Date(2024, 0, 1);
      expect(isScheduledDay(habitNull, date)).toBe(false);
      expect(isScheduledDay(habitEmpty, date)).toBe(false);
    });
  });
});

// =============================================================================
// shouldWilt Tests
// =============================================================================

describe('shouldWilt', () => {
  it('returns false for paused habits', () => {
    const habit = makeHabit({ status: 'paused' });
    expect(shouldWilt(habit, [], new Date(2024, 0, 3))).toBe(false);
  });

  it('returns false for archived habits', () => {
    const habit = makeHabit({ status: 'archived' });
    expect(shouldWilt(habit, [], new Date(2024, 0, 3))).toBe(false);
  });

  it('returns false if already wilting (idempotent)', () => {
    const habit = makeHabit({ is_wilting: true });
    expect(shouldWilt(habit, [], new Date(2024, 0, 3))).toBe(false);
  });

  it('returns true for a daily habit with no completion yesterday', () => {
    const habit = makeHabit({ schedule_type: 'daily' });
    // Today is Jan 3, yesterday (Jan 2) has no completion
    expect(shouldWilt(habit, [], new Date(2024, 0, 3))).toBe(true);
  });

  it('returns false for a daily habit with a completion yesterday', () => {
    const habit = makeHabit({ schedule_type: 'daily' });
    const completions = [makeCompletion('habit-1', '2024-01-02')];
    // Today is Jan 3, yesterday (Jan 2) has a completion
    expect(shouldWilt(habit, completions, new Date(2024, 0, 3))).toBe(false);
  });

  it('returns true for a weekly habit when last scheduled day has no completion', () => {
    // Scheduled on Monday (1)
    const habit = makeHabit({ schedule_type: 'weekly', schedule_days: [1] });
    // Today is Wednesday Jan 3 (day 3), last Monday was Jan 1 (day 1)
    // No completion for Jan 1
    expect(shouldWilt(habit, [], new Date(2024, 0, 3))).toBe(true);
  });

  it('returns false for a weekly habit when last scheduled day has a completion', () => {
    const habit = makeHabit({ schedule_type: 'weekly', schedule_days: [1] });
    const completions = [makeCompletion('habit-1', '2024-01-01')];
    // Today is Wednesday Jan 3, last Monday was Jan 1, completion exists
    expect(shouldWilt(habit, completions, new Date(2024, 0, 3))).toBe(false);
  });

  it('returns true for a custom schedule habit when last scheduled day was missed', () => {
    // Mon, Wed, Fri (1, 3, 5)
    const habit = makeHabit({ schedule_type: 'custom', schedule_days: [1, 3, 5] });
    // Today is Thursday Jan 4 (day 4), last scheduled day is Wednesday Jan 3 (day 3)
    // No completion for Jan 3
    expect(shouldWilt(habit, [], new Date(2024, 0, 4))).toBe(true);
  });

  it('returns false for a custom schedule habit when last scheduled day has completion', () => {
    const habit = makeHabit({ schedule_type: 'custom', schedule_days: [1, 3, 5] });
    const completions = [makeCompletion('habit-1', '2024-01-03')];
    // Today is Thursday Jan 4, last scheduled day is Wednesday Jan 3, completion exists
    expect(shouldWilt(habit, completions, new Date(2024, 0, 4))).toBe(false);
  });

  it('only checks completions for the matching habit', () => {
    const habit = makeHabit({ id: 'habit-1', schedule_type: 'daily' });
    // Completion exists but for a different habit
    const completions = [makeCompletion('habit-2', '2024-01-02')];
    // Today is Jan 3, yesterday Jan 2 — completion is for wrong habit
    expect(shouldWilt(habit, completions, new Date(2024, 0, 3))).toBe(true);
  });
});


// =============================================================================
// Helper: makeRareFlower
// =============================================================================

function makeRareFlower(habitId: string, milestone: 30 | 60 | 100): RareFlower {
  return {
    id: `flower-${habitId}-${milestone}`,
    habit_id: habitId,
    milestone,
    variant_id: `variant-${milestone}`,
    is_active_display: false,
    unlocked_at: '2024-01-01T00:00:00Z',
  };
}

// =============================================================================
// calculateWeeklyCompletionRate Tests
// =============================================================================

describe('calculateWeeklyCompletionRate', () => {
  it('returns 0 when there are no active habits', () => {
    const habits = [makeHabit({ status: 'paused' }), makeHabit({ status: 'archived' })];
    expect(calculateWeeklyCompletionRate(habits, [], new Date(2024, 0, 7))).toBe(0);
  });

  it('returns 0 when there are no scheduled days in the window', () => {
    // Weekly habit scheduled on Monday (1), but window has no Monday
    // If today is Thursday Jan 4, window is Dec 29 (Fri) - Jan 4 (Thu)
    // Dec 29=Fri, 30=Sat, 31=Sun, Jan 1=Mon... wait that includes Monday
    // Let's use a custom schedule with only Saturday (6)
    // Today = Monday Jan 1, window = Dec 26 (Tue) - Jan 1 (Mon)
    // Actually schedule_days = [6] (Saturday), Dec 30 is Saturday!
    // Let me pick a window with no Saturday: today = Fri Jan 5
    // Window = Dec 30 (Sat) - Jan 5 (Fri) — that includes Saturday.
    // Use an empty schedule_days to guarantee 0 scheduled
    const habit = makeHabit({ schedule_type: 'custom', schedule_days: [] });
    expect(calculateWeeklyCompletionRate([habit], [], new Date(2024, 0, 7))).toBe(0);
  });

  it('returns 100 when all scheduled days are completed for a daily habit', () => {
    const habit = makeHabit({ schedule_type: 'daily' });
    // Today is Jan 7 (Sunday), window = Jan 1 (Mon) - Jan 7 (Sun) = 7 days
    const today = new Date(2024, 0, 7);
    const completions: Completion[] = [];
    for (let d = 1; d <= 7; d++) {
      completions.push(makeCompletion('habit-1', `2024-01-0${d}`));
    }
    expect(calculateWeeklyCompletionRate([habit], completions, today)).toBe(100);
  });

  it('returns correct percentage for partial completions', () => {
    const habit = makeHabit({ schedule_type: 'daily' });
    // Today is Jan 7, window = Jan 1 - Jan 7 (7 scheduled days for daily)
    const today = new Date(2024, 0, 7);
    // 3 out of 7 completions
    const completions = [
      makeCompletion('habit-1', '2024-01-01'),
      makeCompletion('habit-1', '2024-01-03'),
      makeCompletion('habit-1', '2024-01-05'),
    ];
    // 3/7 = 42.857... => Math.round => 43
    expect(calculateWeeklyCompletionRate([habit], completions, today)).toBe(43);
  });

  it('excludes paused and archived habits from the calculation', () => {
    const activeHabit = makeHabit({ id: 'h1', schedule_type: 'daily', status: 'active' });
    const pausedHabit = makeHabit({ id: 'h2', schedule_type: 'daily', status: 'paused' });
    const archivedHabit = makeHabit({ id: 'h3', schedule_type: 'daily', status: 'archived' });
    const today = new Date(2024, 0, 7);
    // Only h1 is active — 7 scheduled days. Completions for all three but only h1 counts.
    const completions = [
      makeCompletion('h1', '2024-01-01'),
      makeCompletion('h1', '2024-01-02'),
      makeCompletion('h2', '2024-01-01'),
      makeCompletion('h3', '2024-01-01'),
    ];
    // 2 completions for active habit / 7 scheduled = 28.57 => 29
    expect(
      calculateWeeklyCompletionRate(
        [activeHabit, pausedHabit, archivedHabit],
        completions,
        today
      )
    ).toBe(29);
  });

  it('handles weekly schedule (only certain days are scheduled)', () => {
    // Scheduled on Monday (1) only
    const habit = makeHabit({ schedule_type: 'weekly', schedule_days: [1] });
    // Today is Sunday Jan 7. Window = Jan 1 (Mon) - Jan 7 (Sun)
    // Only Jan 1 (Monday) is scheduled = 1 scheduled day
    const today = new Date(2024, 0, 7);
    const completions = [makeCompletion('habit-1', '2024-01-01')];
    // 1/1 = 100
    expect(calculateWeeklyCompletionRate([habit], completions, today)).toBe(100);
  });

  it('handles custom schedule with multiple days', () => {
    // Mon, Wed, Fri (1, 3, 5)
    const habit = makeHabit({ schedule_type: 'custom', schedule_days: [1, 3, 5] });
    // Today is Sunday Jan 7. Window = Jan 1 (Mon) - Jan 7 (Sun)
    // Scheduled days: Mon Jan 1, Wed Jan 3, Fri Jan 5 = 3 scheduled days
    const today = new Date(2024, 0, 7);
    const completions = [
      makeCompletion('habit-1', '2024-01-01'),
      makeCompletion('habit-1', '2024-01-05'),
    ];
    // 2/3 = 66.67 => 67
    expect(calculateWeeklyCompletionRate([habit], completions, today)).toBe(67);
  });

  it('handles multiple active habits with different schedules', () => {
    const dailyHabit = makeHabit({ id: 'h1', schedule_type: 'daily' });
    const weeklyHabit = makeHabit({ id: 'h2', schedule_type: 'weekly', schedule_days: [1] });
    // Today is Sunday Jan 7. Window = Jan 1 (Mon) - Jan 7 (Sun)
    // h1: 7 scheduled days, h2: 1 scheduled day (Mon) = 8 total
    const today = new Date(2024, 0, 7);
    const completions = [
      makeCompletion('h1', '2024-01-01'),
      makeCompletion('h1', '2024-01-02'),
      makeCompletion('h1', '2024-01-03'),
      makeCompletion('h2', '2024-01-01'),
    ];
    // 4 completions / 8 scheduled = 50
    expect(calculateWeeklyCompletionRate([dailyHabit, weeklyHabit], completions, today)).toBe(50);
  });

  it('does not count completions outside the 7-day window', () => {
    const habit = makeHabit({ schedule_type: 'daily' });
    // Today is Jan 7. Window = Jan 1 - Jan 7.
    const today = new Date(2024, 0, 7);
    const completions = [
      makeCompletion('habit-1', '2023-12-31'), // outside window
      makeCompletion('habit-1', '2024-01-01'), // inside
    ];
    // 1/7 = 14.28 => 14
    expect(calculateWeeklyCompletionRate([habit], completions, today)).toBe(14);
  });
});

// =============================================================================
// computeDashboardStats Tests
// =============================================================================

describe('computeDashboardStats', () => {
  it('returns zero values when there are no habits', () => {
    const result = computeDashboardStats([], [], [], new Date(2024, 0, 7));
    expect(result).toEqual({
      total_active_habits: 0,
      longest_current_streak: 0,
      total_lifetime_completions: 0,
      total_rare_flowers: 0,
      weekly_completion_rate: 0,
    });
  });

  it('counts only active habits for total_active_habits', () => {
    const habits = [
      makeHabit({ id: 'h1', status: 'active' }),
      makeHabit({ id: 'h2', status: 'active' }),
      makeHabit({ id: 'h3', status: 'paused' }),
      makeHabit({ id: 'h4', status: 'archived' }),
    ];
    const result = computeDashboardStats(habits, [], [], new Date(2024, 0, 7));
    expect(result.total_active_habits).toBe(2);
  });

  it('finds the longest streak among active habits only', () => {
    const habits = [
      makeHabit({ id: 'h1', status: 'active', current_streak: 5 }),
      makeHabit({ id: 'h2', status: 'active', current_streak: 12 }),
      makeHabit({ id: 'h3', status: 'paused', current_streak: 50 }), // paused, ignored
      makeHabit({ id: 'h4', status: 'archived', current_streak: 100 }), // archived, ignored
    ];
    const result = computeDashboardStats(habits, [], [], new Date(2024, 0, 7));
    expect(result.longest_current_streak).toBe(12);
  });

  it('returns 0 for longest streak when no active habits exist', () => {
    const habits = [
      makeHabit({ id: 'h1', status: 'paused', current_streak: 10 }),
    ];
    const result = computeDashboardStats(habits, [], [], new Date(2024, 0, 7));
    expect(result.longest_current_streak).toBe(0);
  });

  it('counts all completions including archived habits for total_lifetime_completions', () => {
    const habits = [
      makeHabit({ id: 'h1', status: 'active' }),
      makeHabit({ id: 'h2', status: 'archived' }),
    ];
    const completions = [
      makeCompletion('h1', '2024-01-01'),
      makeCompletion('h1', '2024-01-02'),
      makeCompletion('h2', '2024-01-01'), // archived habit's completion still counts
    ];
    const result = computeDashboardStats(habits, completions, [], new Date(2024, 0, 7));
    expect(result.total_lifetime_completions).toBe(3);
  });

  it('counts all rare flowers including from archived habits', () => {
    const habits = [
      makeHabit({ id: 'h1', status: 'active' }),
      makeHabit({ id: 'h2', status: 'archived' }),
    ];
    const rareFlowers = [
      makeRareFlower('h1', 30),
      makeRareFlower('h2', 30),
      makeRareFlower('h2', 60),
    ];
    const result = computeDashboardStats(habits, [], rareFlowers, new Date(2024, 0, 7));
    expect(result.total_rare_flowers).toBe(3);
  });

  it('computes weekly_completion_rate correctly', () => {
    const habit = makeHabit({ id: 'h1', schedule_type: 'daily', current_streak: 7 });
    const today = new Date(2024, 0, 7);
    // 7 completions for 7 scheduled days = 100%
    const completions: Completion[] = [];
    for (let d = 1; d <= 7; d++) {
      completions.push(makeCompletion('h1', `2024-01-0${d}`));
    }
    const result = computeDashboardStats([habit], completions, [], today);
    expect(result.weekly_completion_rate).toBe(100);
  });

  it('returns all statistics together in a complete DashboardStats object', () => {
    const habits = [
      makeHabit({ id: 'h1', status: 'active', current_streak: 10, schedule_type: 'daily' }),
      makeHabit({ id: 'h2', status: 'active', current_streak: 3, schedule_type: 'daily' }),
      makeHabit({ id: 'h3', status: 'archived', current_streak: 25, schedule_type: 'daily' }),
    ];
    const today = new Date(2024, 0, 7);
    // h1: 4 completions in window, h2: 2 completions in window
    const completions = [
      makeCompletion('h1', '2024-01-01'),
      makeCompletion('h1', '2024-01-02'),
      makeCompletion('h1', '2024-01-03'),
      makeCompletion('h1', '2024-01-04'),
      makeCompletion('h2', '2024-01-05'),
      makeCompletion('h2', '2024-01-06'),
      makeCompletion('h3', '2024-01-01'), // archived — counts for lifetime but not weekly
    ];
    const rareFlowers = [makeRareFlower('h1', 30), makeRareFlower('h3', 60)];

    const result = computeDashboardStats(habits, completions, rareFlowers, today);

    expect(result.total_active_habits).toBe(2);
    expect(result.longest_current_streak).toBe(10);
    expect(result.total_lifetime_completions).toBe(7);
    expect(result.total_rare_flowers).toBe(2);
    // 2 active habits × 7 days = 14 scheduled. 6 completions in window for active habits
    // 6/14 = 42.86 => 43
    expect(result.weekly_completion_rate).toBe(43);
  });
});
