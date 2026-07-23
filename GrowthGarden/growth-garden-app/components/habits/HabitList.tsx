'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { pauseHabit, resumeHabit, archiveHabit, restoreHabit } from '@/lib/actions/habit-management';
import { completeHabit } from '@/lib/actions/completions';
import { computeGrowthStage, isScheduledDay } from '@/lib/garden-engine';
import type { GrowthStage, Habit } from '@/lib/types';

interface HabitItem {
  id: string;
  name: string;
  schedule_type: string;
  schedule_days: number[] | null;
  status: string;
  current_streak: number;
  is_wilting: boolean;
  paused_growth_stage?: string | null;
}

interface HabitListProps {
  habits: HabitItem[];
  completedToday?: string[];
}

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STAGE_ICONS: Record<GrowthStage, string> = {
  seed: '🌰',
  sprout: '🌱',
  budding: '🌿',
  blooming: '🌸',
  wilting: '🥀',
};

const STATUS_BADGES: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-[#4A7C59]/10 text-[#4A7C59]' },
  paused: { label: 'Paused', color: 'bg-[#c9920a]/10 text-[#c9920a]' },
  archived: { label: 'Archived', color: 'bg-[#6b7a6b]/10 text-[#6b7a6b]' },
};

export function HabitList({ habits, completedToday = [] }: HabitListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [completedIds, setCompletedIds] = useState<string[]>(completedToday);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [completionSuccess, setCompletionSuccess] = useState<string | null>(null);
  const [streakOverrides, setStreakOverrides] = useState<Record<string, number>>({});

  async function handleAction(
    habitId: string,
    action: (id: string) => Promise<{ success: boolean; error?: string }>
  ) {
    setActionError(null);
    setLoadingId(habitId);
    const result = await action(habitId);
    setLoadingId(null);
    if (!result.success && result.error) {
      setActionError(result.error);
    } else {
      startTransition(() => {
        router.refresh();
      });
    }
  }

  async function handleComplete(habit: HabitItem) {
    setActionError(null);
    setCompletingId(habit.id);
    setCompletionSuccess(null);

    const today = new Date().toISOString().split('T')[0];
    const result = await completeHabit(habit.id, today);

    setCompletingId(null);

    if (result.success) {
      // Update local state immediately for instant feedback
      setCompletedIds((prev) => [...prev, habit.id]);
      if (result.newStreak !== undefined) {
        setStreakOverrides((prev) => ({ ...prev, [habit.id]: result.newStreak! }));
      }
      setCompletionSuccess(habit.id);
      // Clear success animation after 2 seconds
      setTimeout(() => setCompletionSuccess(null), 2000);
      // Refresh server data in background
      startTransition(() => {
        router.refresh();
      });
    } else if (result.error) {
      // Show specific error messages for known error codes
      if (result.error.code === 'DUPLICATE_COMPLETION') {
        setActionError(`"${habit.name}" has already been completed today.`);
        // Also mark as completed locally to prevent further attempts
        setCompletedIds((prev) => [...prev, habit.id]);
      } else if (result.error.code === 'NOT_SCHEDULED_DAY') {
        setActionError(`Today is not a scheduled day for "${habit.name}".`);
      } else {
        setActionError(result.error.message);
      }
    }
  }

  function getGrowthStage(habit: HabitItem): GrowthStage {
    if (habit.status === 'paused' && habit.paused_growth_stage) {
      return habit.paused_growth_stage as GrowthStage;
    }
    return computeGrowthStage(habit.current_streak, habit.is_wilting);
  }

  function getDisplayStreak(habit: HabitItem): number {
    if (streakOverrides[habit.id] !== undefined) {
      return streakOverrides[habit.id];
    }
    return habit.current_streak;
  }

  function isTodayScheduled(habit: HabitItem): boolean {
    const today = new Date();
    // Cast to match the Habit type expected by isScheduledDay
    const habitForCheck = {
      schedule_type: habit.schedule_type,
      schedule_days: habit.schedule_days,
    } as Habit;
    return isScheduledDay(habitForCheck, today);
  }

  function formatSchedule(habit: HabitItem): string {
    if (habit.schedule_type === 'daily') return 'Every day';
    if (habit.schedule_type === 'weekly' && habit.schedule_days?.length) {
      return `Weekly on ${DAY_LABELS[habit.schedule_days[0]]}`;
    }
    if (habit.schedule_type === 'custom' && habit.schedule_days?.length) {
      return habit.schedule_days.map((d) => DAY_LABELS[d]).join(', ');
    }
    return habit.schedule_type;
  }

  const activeHabits = habits.filter((h) => h.status === 'active');
  const pausedHabits = habits.filter((h) => h.status === 'paused');
  const archivedHabits = habits.filter((h) => h.status === 'archived');

  if (habits.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-[#6b7a6b] mb-4">No habits yet. Start growing your garden!</p>
        <Link
          href="/habits/new"
          className="inline-block px-6 py-3 bg-[#4A7C59] text-white rounded-lg font-medium hover:bg-[#3d6b4a] transition-colors"
        >
          Create your first habit
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {actionError && (
        <p role="alert" className="text-sm text-[#c44030] bg-[#c44030]/5 px-4 py-2.5 rounded-lg">
          {actionError}
        </p>
      )}

      {/* Active Habits */}
      {activeHabits.length > 0 && (
        <section>
          <h2 className="text-xs text-[#6b7a6b] font-medium mb-3 uppercase tracking-wide">
            Active ({activeHabits.length})
          </h2>
          <div className="flex flex-col gap-2">
            {activeHabits.map((habit) => {
              const stage = getGrowthStage(habit);
              const isCompletedToday = completedIds.includes(habit.id);
              const isScheduled = isTodayScheduled(habit);
              const isCompleting = completingId === habit.id;
              const isLoading = loadingId === habit.id;
              const showSuccess = completionSuccess === habit.id;
              const displayStreak = getDisplayStreak(habit);

              return (
                <div
                  key={habit.id}
                  className={`p-4 bg-white border border-[#e2e5da] rounded-lg transition-all ${
                    showSuccess ? 'ring-2 ring-[#4A7C59]/40 bg-[#4A7C59]/5' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Completion button */}
                      <button
                        onClick={() => handleComplete(habit)}
                        disabled={!isScheduled || isCompletedToday || isCompleting || isPending}
                        className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                          isCompletedToday
                            ? 'border-[#4A7C59] bg-[#4A7C59] text-white cursor-default'
                            : !isScheduled
                            ? 'border-[#e2e5da] text-[#ccc] cursor-not-allowed opacity-50'
                            : isCompleting
                            ? 'border-[#4A7C59]/50 text-[#4A7C59]/50 animate-pulse'
                            : 'border-[#4A7C59]/40 text-[#4A7C59] hover:border-[#4A7C59] hover:bg-[#4A7C59]/10'
                        }`}
                        aria-label={
                          isCompletedToday
                            ? `${habit.name} completed today`
                            : !isScheduled
                            ? `${habit.name} is not scheduled today`
                            : `Complete ${habit.name}`
                        }
                        title={
                          isCompletedToday
                            ? 'Already completed today'
                            : !isScheduled
                            ? 'Not scheduled today'
                            : 'Mark as complete'
                        }
                      >
                        {isCompletedToday ? (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        )}
                      </button>

                      {/* Growth stage indicator */}
                      <span
                        className={`text-xl flex-shrink-0 transition-transform ${
                          showSuccess ? 'scale-125' : ''
                        }`}
                        aria-label={`Growth stage: ${stage}`}
                      >
                        {STAGE_ICONS[stage]}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-[#1F2A1F] truncate">
                            {habit.name}
                          </h3>
                          {isCompletedToday && (
                            <span className="text-xs text-[#4A7C59] font-medium">✓ Done</span>
                          )}
                          {showSuccess && (
                            <span className="text-xs text-[#4A7C59] font-medium animate-bounce">
                              🌱 +1
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-[#6b7a6b] mt-0.5">
                          {formatSchedule(habit)} · 🔥 Streak: {displayStreak}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Link
                        href={`/habits/${habit.id}/edit`}
                        className="p-2 text-[#6b7a6b] hover:text-[#4A7C59] transition-colors rounded-md hover:bg-[#4A7C59]/5"
                        aria-label={`Edit ${habit.name}`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                        </svg>
                      </Link>
                      <button
                        onClick={() => handleAction(habit.id, pauseHabit)}
                        disabled={isLoading || isPending}
                        className="p-2 text-[#6b7a6b] hover:text-[#c9920a] transition-colors rounded-md hover:bg-[#c9920a]/5 disabled:opacity-50"
                        aria-label={`Pause ${habit.name}`}
                        title="Pause"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleAction(habit.id, archiveHabit)}
                        disabled={isLoading || isPending}
                        className="p-2 text-[#6b7a6b] hover:text-[#c44030] transition-colors rounded-md hover:bg-[#c44030]/5 disabled:opacity-50"
                        aria-label={`Archive ${habit.name}`}
                        title="Archive"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Paused Habits */}
      {pausedHabits.length > 0 && (
        <section>
          <h2 className="text-xs text-[#6b7a6b] font-medium mb-3 uppercase tracking-wide">
            Paused ({pausedHabits.length})
          </h2>
          <div className="flex flex-col gap-2">
            {pausedHabits.map((habit) => {
              const stage = getGrowthStage(habit);
              const isLoading = loadingId === habit.id;

              return (
                <div
                  key={habit.id}
                  className="p-4 bg-white border border-[#e2e5da] rounded-lg opacity-75"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl flex-shrink-0" aria-label={`Growth stage: ${stage}`}>
                        {STAGE_ICONS[stage]}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-[#1F2A1F] truncate">
                            {habit.name}
                          </h3>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_BADGES.paused.color}`}>
                            {STATUS_BADGES.paused.label}
                          </span>
                        </div>
                        <p className="text-xs text-[#6b7a6b] mt-0.5">
                          {formatSchedule(habit)} · Streak frozen at {habit.current_streak}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleAction(habit.id, resumeHabit)}
                        disabled={isLoading || isPending}
                        className="p-2 text-[#6b7a6b] hover:text-[#4A7C59] transition-colors rounded-md hover:bg-[#4A7C59]/5 disabled:opacity-50"
                        aria-label={`Resume ${habit.name}`}
                        title="Resume"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleAction(habit.id, archiveHabit)}
                        disabled={isLoading || isPending}
                        className="p-2 text-[#6b7a6b] hover:text-[#c44030] transition-colors rounded-md hover:bg-[#c44030]/5 disabled:opacity-50"
                        aria-label={`Archive ${habit.name}`}
                        title="Archive"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Archived Habits */}
      {archivedHabits.length > 0 && (
        <section>
          <h2 className="text-xs text-[#6b7a6b] font-medium mb-3 uppercase tracking-wide">
            Archived ({archivedHabits.length})
          </h2>
          <div className="flex flex-col gap-2">
            {archivedHabits.map((habit) => {
              const stage = getGrowthStage(habit);
              const isLoading = loadingId === habit.id;

              return (
                <div
                  key={habit.id}
                  className="p-4 bg-white border border-[#e2e5da] rounded-lg opacity-60"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl flex-shrink-0" aria-label={`Growth stage: ${stage}`}>
                        {STAGE_ICONS[stage]}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-medium text-[#1F2A1F] truncate">
                            {habit.name}
                          </h3>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${STATUS_BADGES.archived.color}`}>
                            {STATUS_BADGES.archived.label}
                          </span>
                        </div>
                        <p className="text-xs text-[#6b7a6b] mt-0.5">
                          {formatSchedule(habit)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleAction(habit.id, restoreHabit)}
                        disabled={isLoading || isPending}
                        className="p-2 text-[#6b7a6b] hover:text-[#4A7C59] transition-colors rounded-md hover:bg-[#4A7C59]/5 disabled:opacity-50"
                        aria-label={`Restore ${habit.name}`}
                        title="Restore"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
