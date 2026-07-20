'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Habit } from '@/types';
import { GardenGrid } from '@/components/garden/GardenGrid';
import { SeasonBanner } from '@/components/garden/SeasonBanner';
import { MarkDoneButton } from '@/components/garden/MarkDoneButton';
import { MilestoneScreen } from '@/components/garden/MilestoneScreen';
import { ReflectionPrompt } from '@/components/garden/ReflectionPrompt';
import { JournalDrawer } from '@/components/garden/JournalDrawer';
import { createHabit, releaseHabit, replantHabit } from '@/lib/actions/habits';

interface GardenPageClientProps {
  initialHabits: Habit[];
  completedToday: string[];
  releasedHabits: Habit[];
  reflectionCounts: Record<string, number>;
  quietMode: boolean;
}

export function GardenPageClient({
  initialHabits,
  completedToday: initialCompleted,
  releasedHabits: initialReleased,
  reflectionCounts: initialReflectionCounts,
  quietMode,
}: GardenPageClientProps) {
  const [habits, setHabits] = useState(initialHabits);
  const [completed, setCompleted] = useState<string[]>(initialCompleted);
  const [released, setReleased] = useState<Habit[]>(initialReleased);
  const [reflectionCounts, setReflectionCounts] = useState(initialReflectionCounts);
  const [animatingId, setAnimatingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newIntention, setNewIntention] = useState('');
  const [newPlantName, setNewPlantName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [recentlyReleased, setRecentlyReleased] = useState<Habit | null>(null);

  // Milestone state
  const [milestoneData, setMilestoneData] = useState<{ streak: number; habit: Habit } | null>(null);

  // Reflection state
  const [reflectionHabitId, setReflectionHabitId] = useState<string | null>(null);

  // Journal drawer state
  const [journalHabitId, setJournalHabitId] = useState<string | null>(null);

  const incompleteHabits = habits.filter((h) => !completed.includes(h.id));

  function handleComplete(updatedHabit: Habit, milestone?: number) {
    setHabits((prev) => prev.map((h) => h.id === updatedHabit.id ? updatedHabit : h));
    setCompleted((prev) => [...prev, updatedHabit.id]);
    setAnimatingId(updatedHabit.id);
    setTimeout(() => setAnimatingId(null), 600);

    // Show milestone screen if applicable
    if (milestone && !quietMode) {
      setTimeout(() => setMilestoneData({ streak: milestone, habit: updatedHabit }), 800);
    } else if (!quietMode) {
      // Show reflection prompt after a brief delay
      setTimeout(() => setReflectionHabitId(updatedHabit.id), 1200);
    }
  }

  async function handleRelease(habitId: string) {
    const habitToRelease = habits.find((h) => h.id === habitId);
    if (!habitToRelease) return;

    const result = await releaseHabit(habitId);
    if (result.success) {
      setHabits((prev) => prev.filter((h) => h.id !== habitId));
      setRecentlyReleased(habitToRelease);
      setReleased((prev) => [habitToRelease, ...prev]);
      setTimeout(() => setRecentlyReleased(null), 10000);
    }
  }

  async function handleReplant(habitId: string) {
    const result = await replantHabit(habitId);
    if (!('error' in result)) {
      setHabits((prev) => [...prev, result]);
      setReleased((prev) => prev.filter((h) => h.id !== habitId));
      setRecentlyReleased(null);
    }
  }

  async function handleAddHabit(e: React.FormEvent) {
    e.preventDefault();
    if (!newHabitName.trim() || creating) return;
    setCreating(true);
    setCreateError(null);

    const result = await createHabit(newHabitName.trim(), {
      intention: newIntention.trim() || undefined,
      plantName: newPlantName.trim() || undefined,
    });
    if ('error' in result) {
      setCreateError(result.error);
      setCreating(false);
      return;
    }
    setHabits((prev) => [...prev, result]);
    setNewHabitName('');
    setNewIntention('');
    setNewPlantName('');
    setShowAddForm(false);
    setCreating(false);
  }

  function daysUntilExpiry(releasedAt: string): number {
    const released = new Date(releasedAt);
    const expiry = new Date(released.getTime() + 7 * 24 * 60 * 60 * 1000);
    return Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  }

  const journalHabit = journalHabitId ? habits.find((h) => h.id === journalHabitId) : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Milestone full-screen */}
      <AnimatePresence>
        {milestoneData && (
          <MilestoneScreen
            streakCount={milestoneData.streak}
            plantStage={milestoneData.habit.plant_stage}
            onContinue={() => {
              setMilestoneData(null);
              setReflectionHabitId(milestoneData.habit.id);
            }}
          />
        )}
      </AnimatePresence>

      {/* Reflection bottom sheet */}
      <AnimatePresence>
        {reflectionHabitId && !milestoneData && (
          <ReflectionPrompt
            habitId={reflectionHabitId}
            onDone={() => setReflectionHabitId(null)}
          />
        )}
      </AnimatePresence>

      {/* Journal drawer */}
      <AnimatePresence>
        {journalHabit && (
          <JournalDrawer
            habitId={journalHabit.id}
            habitName={journalHabit.plant_name || journalHabit.name}
            onClose={() => setJournalHabitId(null)}
          />
        )}
      </AnimatePresence>

      <SeasonBanner />

      {/* Quiet mode indicator */}
      {quietMode && (
        <div className="flex items-center gap-2 mb-3 text-xs text-[#8b95a8]">
          <span>🌙</span>
          <span>Quiet mode</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">My Garden</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-3 py-1.5 text-xs rounded-lg bg-[#4a8a50] text-white hover:bg-[#5a9a60] transition-colors"
        >
          + Plant seed
        </button>
      </div>

      {/* Add habit form with intention + plant name */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            onSubmit={handleAddHabit}
            className="flex flex-col gap-2 mb-4 p-4 bg-[#141820] border border-[#252a38] rounded-lg"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            aria-label="Plant a new seed"
          >
            <div>
              <label htmlFor="habit-name" className="text-xs text-[#8b95a8] mb-1 block">Habit</label>
              <input
                id="habit-name"
                type="text"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                placeholder="What habit do you want to grow?"
                maxLength={50}
                autoFocus
                className="w-full px-4 py-2.5 bg-[#0d1117] border border-[#252a38] rounded-lg text-sm text-[#e0e6f0] focus:outline-none focus:border-[#4a8a50] transition-colors"
              />
            </div>
            <div>
              <label htmlFor="plant-name" className="text-xs text-[#8b95a8] mb-1 block">Plant name</label>
              <input
                id="plant-name"
                type="text"
                value={newPlantName}
                onChange={(e) => setNewPlantName(e.target.value)}
                placeholder="Give your plant a name (optional — something personal)"
                maxLength={30}
                className="w-full px-4 py-2.5 bg-[#0d1117] border border-[#252a38] rounded-lg text-sm text-[#e0e6f0] focus:outline-none focus:border-[#4a8a50] transition-colors"
              />
            </div>
            <div>
              <label htmlFor="intention" className="text-xs text-[#8b95a8] mb-1 block">Why does this matter to you?</label>
              <input
                id="intention"
                type="text"
                value={newIntention}
                onChange={(e) => setNewIntention(e.target.value)}
                placeholder="I'm planting this because..."
                maxLength={150}
                className="w-full px-4 py-2.5 bg-[#0d1117] border border-[#252a38] rounded-lg text-sm text-[#8b95a8] italic focus:outline-none focus:border-[#4a8a50] focus:text-[#e0e6f0] focus:not-italic transition-colors"
              />
              <p className="text-[10px] text-[#8b95a8] mt-1">This will gently remind you when things get hard.</p>
            </div>

            {createError && (
              <p className="text-xs text-[#c05030] bg-[#c05030]/10 px-3 py-2 rounded">{createError}</p>
            )}

            <div className="flex gap-2 mt-1">
              <button
                type="submit"
                disabled={creating || !newHabitName.trim()}
                className="flex-1 py-2.5 bg-[#4a8a50] text-white text-sm rounded-lg hover:bg-[#5a9a60] transition-colors disabled:opacity-50"
              >
                {creating ? 'Planting...' : '🌱 Plant seed'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 py-2.5 border border-[#252a38] text-[#8b95a8] text-sm rounded-lg hover:text-[#e0e6f0] hover:border-[#4a8a50] transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <GardenGrid
        habits={habits}
        animatingHabitId={animatingId}
        onRelease={handleRelease}
        onViewJournal={(id) => setJournalHabitId(id)}
        reflectionCounts={reflectionCounts}
      />

      {/* Undo toast */}
      <AnimatePresence>
        {recentlyReleased && (
          <motion.div
            className="fixed bottom-24 left-4 right-4 max-w-md mx-auto bg-[#1a1f28] border border-[#252a38] rounded-lg px-4 py-3 flex items-center justify-between shadow-lg z-40"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <p className="text-sm text-[#e0e6f0]">
              <span className="text-[#e0a060]">🍃</span>{' '}
              <span className="font-medium">{recentlyReleased.plant_name || recentlyReleased.name}</span>{' '}
              <span className="text-[#8b95a8]">released to the wild</span>
            </p>
            <button
              onClick={() => handleReplant(recentlyReleased.id)}
              className="px-3 py-1 text-xs bg-[#4a8a50] text-white rounded-full hover:bg-[#5a9a60] transition-colors whitespace-nowrap ml-3"
            >
              🌱 Replant
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Complete today checklist — hidden in quiet mode */}
      {!quietMode && incompleteHabits.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm text-[#8b95a8] font-medium mb-3">Complete today</h2>
          <div className="flex flex-col gap-2">
            {incompleteHabits.map((habit) => (
              <MarkDoneButton
                key={habit.id}
                habit={habit}
                isCompleted={completed.includes(habit.id)}
                onComplete={handleComplete}
              />
            ))}
          </div>
        </div>
      )}

      {!quietMode && incompleteHabits.length === 0 && habits.length > 0 && (
        <div className="mt-8 text-center py-6">
          <p className="text-[#6ee7a0] text-sm font-medium">All done for today 🌿</p>
          <p className="text-[#8b95a8] text-xs mt-1">Your garden is thriving.</p>
        </div>
      )}

      {/* Released plants */}
      {released.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm text-[#8b95a8] font-medium mb-3">Growing in the wild</h2>
          <p className="text-xs text-[#8b95a8] mb-3">These plants are still out there. You can replant them before they find a new home.</p>
          <div className="flex flex-col gap-2">
            {released.map((habit) => (
              <div key={habit.id} className="flex items-center justify-between p-3 bg-[#141820] border border-[#252a38] rounded-lg opacity-70">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg">🍃</span>
                  <div className="min-w-0">
                    <p className="text-sm text-[#e0e6f0] truncate">{habit.plant_name || habit.name}</p>
                    <p className="text-[10px] text-[#8b95a8]">
                      {habit.released_at ? `${daysUntilExpiry(habit.released_at)} days to replant` : 'Released'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleReplant(habit.id)}
                  className="px-3 py-1.5 text-xs bg-[#4a8a50]/20 text-[#6ee7a0] rounded-lg hover:bg-[#4a8a50]/30 transition-colors whitespace-nowrap"
                >
                  🌱 Replant
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
