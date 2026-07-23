import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorCode } from '@/lib/types';

// Mock next/cache
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

// Mock Supabase
const mockGetUser = vi.fn();
const mockFrom = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

// Chain builder for Supabase query
function createChain(finalData: any = null, finalError: any = null) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: finalData, error: finalError }),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
  };
  return chain;
}

let fromCalls: Record<string, any> = {};

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabaseClient: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: mockGetUser,
      },
      from: (table: string) => {
        if (fromCalls[table]) {
          const call = fromCalls[table].shift();
          return call || createChain();
        }
        return createChain();
      },
    })
  ),
}));

describe('completeHabit Server Action', () => {
  let completeHabit: typeof import('@/lib/actions/completions').completeHabit;

  const mockUser = { id: 'user-123', email: 'test@example.com' };
  const mockHabit = {
    id: 'habit-123',
    user_id: 'user-123',
    name: 'Exercise',
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

  beforeEach(async () => {
    vi.clearAllMocks();
    fromCalls = {};
    mockGetUser.mockResolvedValue({ data: { user: mockUser } });

    const mod = await import('@/lib/actions/completions');
    completeHabit = mod.completeHabit;
  });

  it('rejects when user is not authenticated', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });

    const result = await completeHabit('habit-123', '2024-06-15');

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(result.error?.message).toContain('Not authenticated');
  });

  it('rejects when habit is not found', async () => {
    // habits query returns null
    const habitsChain = createChain(null, { message: 'Not found', code: 'PGRST116' });
    fromCalls['habits'] = [habitsChain];

    const result = await completeHabit('nonexistent', '2024-06-15');

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe(ErrorCode.VALIDATION_ERROR);
    expect(result.error?.message).toContain('Habit not found');
  });

  it('rejects completion on non-scheduled day (NOT_SCHEDULED_DAY)', async () => {
    // Weekly habit scheduled for Monday (1), but date is a Wednesday
    const weeklyHabit = {
      ...mockHabit,
      schedule_type: 'weekly',
      schedule_days: [1], // Monday only
    };

    const habitsChain = createChain(weeklyHabit, null);
    fromCalls['habits'] = [habitsChain];

    // 2024-06-12 is a Wednesday
    const result = await completeHabit('habit-123', '2024-06-12');

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe(ErrorCode.NOT_SCHEDULED_DAY);
    expect(result.error?.message).toContain('not part of the habit\'s schedule');
  });

  it('rejects duplicate completion (DUPLICATE_COMPLETION)', async () => {
    const habitsChain = createChain(mockHabit, null);
    // completions query returns existing record
    const completionsChain = createChain({ id: 'existing-completion' }, null);
    fromCalls['habits'] = [habitsChain];
    fromCalls['completions'] = [completionsChain];

    const result = await completeHabit('habit-123', '2024-06-15');

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe(ErrorCode.DUPLICATE_COMPLETION);
    expect(result.error?.message).toContain('already completed');
  });

  it('successfully records completion and increments streak', async () => {
    const habitsChain = createChain(mockHabit, null);
    // No existing completion
    const completionsCheckChain = createChain(null, { code: 'PGRST116' });
    // Insert completion succeeds
    const completionInsertChain = createChain(
      { id: 'completion-1', habit_id: 'habit-123', user_id: 'user-123', completed_date: '2024-06-15', created_at: '2024-06-15T10:00:00Z' },
      null
    );
    // rare_flowers query
    const rareFlowersChain = createChain(null, null);
    rareFlowersChain.select = vi.fn().mockReturnThis();
    rareFlowersChain.eq = vi.fn().mockResolvedValue({ data: [], error: null });
    // Update habit succeeds
    const habitUpdateChain = createChain(null, null);
    habitUpdateChain.update = vi.fn().mockReturnThis();
    habitUpdateChain.eq = vi.fn().mockResolvedValue({ data: null, error: null });

    fromCalls['habits'] = [habitsChain, habitUpdateChain];
    fromCalls['completions'] = [completionsCheckChain, completionInsertChain];
    fromCalls['rare_flowers'] = [rareFlowersChain];

    const result = await completeHabit('habit-123', '2024-06-15');

    expect(result.success).toBe(true);
    expect(result.newStreak).toBe(6); // 5 + 1
    expect(result.growthStage).toBe('budding'); // streak 6 = budding (>= 3, < 7... wait, 6 >= 3 and < 7 => sprout)
  });

  it('handles wilting recovery: sets streak to 1 and is_wilting to false', async () => {
    const wiltingHabit = {
      ...mockHabit,
      is_wilting: true,
      current_streak: 0,
    };

    const habitsChain = createChain(wiltingHabit, null);
    const completionsCheckChain = createChain(null, { code: 'PGRST116' });
    const completionInsertChain = createChain(
      { id: 'completion-2', habit_id: 'habit-123', user_id: 'user-123', completed_date: '2024-06-15', created_at: '2024-06-15T10:00:00Z' },
      null
    );
    const rareFlowersChain = createChain(null, null);
    rareFlowersChain.select = vi.fn().mockReturnThis();
    rareFlowersChain.eq = vi.fn().mockResolvedValue({ data: [], error: null });
    const habitUpdateChain = createChain(null, null);
    habitUpdateChain.update = vi.fn().mockReturnThis();
    habitUpdateChain.eq = vi.fn().mockResolvedValue({ data: null, error: null });

    fromCalls['habits'] = [habitsChain, habitUpdateChain];
    fromCalls['completions'] = [completionsCheckChain, completionInsertChain];
    fromCalls['rare_flowers'] = [rareFlowersChain];

    const result = await completeHabit('habit-123', '2024-06-15');

    expect(result.success).toBe(true);
    expect(result.newStreak).toBe(1);
    expect(result.growthStage).toBe('seed'); // streak 1, not wilting = seed
  });

  it('detects rare flower unlock at milestone 30', async () => {
    const habit29Streak = {
      ...mockHabit,
      current_streak: 29, // will become 30 after completion
    };

    const habitsChain = createChain(habit29Streak, null);
    const completionsCheckChain = createChain(null, { code: 'PGRST116' });
    const completionInsertChain = createChain(
      { id: 'completion-3', habit_id: 'habit-123', user_id: 'user-123', completed_date: '2024-06-15', created_at: '2024-06-15T10:00:00Z' },
      null
    );
    const rareFlowersChain = createChain(null, null);
    rareFlowersChain.select = vi.fn().mockReturnThis();
    rareFlowersChain.eq = vi.fn().mockResolvedValue({ data: [], error: null });
    const habitUpdateChain = createChain(null, null);
    habitUpdateChain.update = vi.fn().mockReturnThis();
    habitUpdateChain.eq = vi.fn().mockResolvedValue({ data: null, error: null });
    // rare_flowers insert
    const rareFlowerInsertChain = createChain(null, null);
    rareFlowerInsertChain.insert = vi.fn().mockResolvedValue({ data: null, error: null });

    fromCalls['habits'] = [habitsChain, habitUpdateChain];
    fromCalls['completions'] = [completionsCheckChain, completionInsertChain];
    fromCalls['rare_flowers'] = [rareFlowersChain, rareFlowerInsertChain];

    const result = await completeHabit('habit-123', '2024-06-15');

    expect(result.success).toBe(true);
    expect(result.newStreak).toBe(30);
    expect(result.rareFlowerUnlock).not.toBeNull();
    expect(result.rareFlowerUnlock?.milestone).toBe(30);
    expect(result.rareFlowerUnlock?.variant_id).toBe('crystal_bloom');
  });

  it('does not unlock rare flower if milestone already unlocked', async () => {
    const habit29Streak = {
      ...mockHabit,
      current_streak: 29,
    };

    const habitsChain = createChain(habit29Streak, null);
    const completionsCheckChain = createChain(null, { code: 'PGRST116' });
    const completionInsertChain = createChain(
      { id: 'completion-4', habit_id: 'habit-123', user_id: 'user-123', completed_date: '2024-06-15', created_at: '2024-06-15T10:00:00Z' },
      null
    );
    // Already has milestone 30 unlocked
    const rareFlowersChain = createChain(null, null);
    rareFlowersChain.select = vi.fn().mockReturnThis();
    rareFlowersChain.eq = vi.fn().mockResolvedValue({
      data: [{ id: 'flower-1', habit_id: 'habit-123', milestone: 30, variant_id: 'crystal_bloom', is_active_display: false, unlocked_at: '2024-01-01T00:00:00Z' }],
      error: null,
    });
    const habitUpdateChain = createChain(null, null);
    habitUpdateChain.update = vi.fn().mockReturnThis();
    habitUpdateChain.eq = vi.fn().mockResolvedValue({ data: null, error: null });

    fromCalls['habits'] = [habitsChain, habitUpdateChain];
    fromCalls['completions'] = [completionsCheckChain, completionInsertChain];
    fromCalls['rare_flowers'] = [rareFlowersChain];

    const result = await completeHabit('habit-123', '2024-06-15');

    expect(result.success).toBe(true);
    expect(result.newStreak).toBe(30);
    expect(result.rareFlowerUnlock).toBeNull();
  });

  it('accepts completion on a scheduled day for custom schedule', async () => {
    // Custom schedule: Mon(1), Wed(3), Fri(5)
    const customHabit = {
      ...mockHabit,
      schedule_type: 'custom',
      schedule_days: [1, 3, 5],
    };

    const habitsChain = createChain(customHabit, null);
    const completionsCheckChain = createChain(null, { code: 'PGRST116' });
    const completionInsertChain = createChain(
      { id: 'completion-5', habit_id: 'habit-123', user_id: 'user-123', completed_date: '2024-06-14', created_at: '2024-06-14T10:00:00Z' },
      null
    );
    const rareFlowersChain = createChain(null, null);
    rareFlowersChain.select = vi.fn().mockReturnThis();
    rareFlowersChain.eq = vi.fn().mockResolvedValue({ data: [], error: null });
    const habitUpdateChain = createChain(null, null);
    habitUpdateChain.update = vi.fn().mockReturnThis();
    habitUpdateChain.eq = vi.fn().mockResolvedValue({ data: null, error: null });

    fromCalls['habits'] = [habitsChain, habitUpdateChain];
    fromCalls['completions'] = [completionsCheckChain, completionInsertChain];
    fromCalls['rare_flowers'] = [rareFlowersChain];

    // 2024-06-14 is a Friday (day 5)
    const result = await completeHabit('habit-123', '2024-06-14');

    expect(result.success).toBe(true);
    expect(result.newStreak).toBe(6);
  });

  it('handles database unique constraint violation as DUPLICATE_COMPLETION', async () => {
    const habitsChain = createChain(mockHabit, null);
    const completionsCheckChain = createChain(null, { code: 'PGRST116' });
    // Insert fails with unique constraint violation
    const completionInsertChain = createChain(null, { code: '23505', message: 'duplicate key value violates unique constraint' });
    const rareFlowersChain = createChain(null, null);
    rareFlowersChain.select = vi.fn().mockReturnThis();
    rareFlowersChain.eq = vi.fn().mockResolvedValue({ data: [], error: null });

    fromCalls['habits'] = [habitsChain];
    fromCalls['completions'] = [completionsCheckChain, completionInsertChain];
    fromCalls['rare_flowers'] = [rareFlowersChain];

    const result = await completeHabit('habit-123', '2024-06-15');

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe(ErrorCode.DUPLICATE_COMPLETION);
  });
});
