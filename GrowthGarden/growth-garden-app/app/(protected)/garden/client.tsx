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
import { BloomReveal } from '@/components/garden/BloomReveal';

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
  const [newCategory, setNewCategory] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [recentlyReleased, setRecentlyReleased] = useState<Habit | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Milestone state
  const [milestoneData, setMilestoneData] = useState<{ streak: number; habit: Habit } | null>(null);

  // Reflection state
  const [reflectionHabitId, setReflectionHabitId] = useState<string | null>(null);

  // Journal drawer state
  const [journalHabitId, setJournalHabitId] = useState<string | null>(null);

  // Bloom reveal state
  const [bloomRevealHabit, setBloomRevealHabit] = useState<Habit | null>(null);

  const incompleteHabits = habits.filter((h) => !completed.includes(h.id));

  function handleComplete(updatedHabit: Habit, milestone?: number) {
    const previousHabit = habits.find((h) => h.id === updatedHabit.id);
    setHabits((prev) => prev.map((h) => h.id === updatedHabit.id ? updatedHabit : h));
    setCompleted((prev) => [...prev, updatedHabit.id]);
    setAnimatingId(updatedHabit.id);
    setTimeout(() => setAnimatingId(null), 600);

    // Check for first bloom reveal
    const isFirstBloom = updatedHabit.category &&
      (updatedHabit.plant_stage === 'flowering' || updatedHabit.plant_stage === 'fruiting') &&
      previousHabit && previousHabit.plant_stage !== 'flowering' && previousHabit.plant_stage !== 'fruiting' &&
      !updatedHabit.has_revealed_bloom;

    if (isFirstBloom) {
      setTimeout(() => setBloomRevealHabit(updatedHabit), 800);
      return; // Skip milestone/reflection — bloom reveal takes priority
    }

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
      setSuccessMessage(`🌱 ${result.plant_name || result.name} is back in your garden!`);
      setTimeout(() => setSuccessMessage(null), 4000);
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
      category: newCategory || undefined,
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
    setNewCategory('');
    setShowAddForm(false);
    setCreating(false);
    setSuccessMessage(`🌱 ${result.plant_name || result.name} has been planted!`);
    setTimeout(() => setSuccessMessage(null), 4000);
  }

  function daysUntilExpiry(releasedAt: string): number {
    const released = new Date(releasedAt);
    const expiry = new Date(released.getTime() + 7 * 24 * 60 * 60 * 1000);
    return Math.max(0, Math.ceil((expiry.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  }

  const journalHabit = journalHabitId ? habits.find((h) => h.id === journalHabitId) : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Bloom reveal */}
      <AnimatePresence>
        {bloomRevealHabit && (
          <BloomReveal
            habit={bloomRevealHabit}
            reflectionCount={reflectionCounts[bloomRevealHabit.id] || 0}
            onDismiss={() => {
              const h = bloomRevealHabit;
              setBloomRevealHabit(null);
              setHabits((prev) => prev.map((habit) =>
                habit.id === h.id ? { ...habit, has_revealed_bloom: true } : habit
              ));
              // After bloom reveal, show reflection prompt
              if (!quietMode) {
                setTimeout(() => setReflectionHabitId(h.id), 300);
              }
            }}
          />
        )}
      </AnimatePresence>

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
        <div className="flex items-center gap-2 mb-3 text-xs text-[#6b7a6b]">
          <span>🌙</span>
          <span>Quiet mode</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">My Garden</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="px-3 py-1.5 text-xs rounded-lg bg-[#4A7C59] text-white hover:bg-[#3d6b4a] transition-colors"
        >
          + Plant seed
        </button>
      </div>

      {/* Add habit form with intention + plant name */}
      <AnimatePresence>
        {showAddForm && (
          <motion.form
            onSubmit={handleAddHabit}
            className="flex flex-col gap-2 mb-4 p-4 bg-[#ffffff] border border-[#e2e5da] rounded-lg"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            aria-label="Plant a new seed"
          >
            <div>
              <label htmlFor="habit-name" className="text-xs text-[#6b7a6b] mb-1 block">Habit</label>
              <input
                id="habit-name"
                type="text"
                value={newHabitName}
                onChange={(e) => setNewHabitName(e.target.value)}
                placeholder="What habit do you want to grow?"
                maxLength={50}
                autoFocus
                className="w-full px-4 py-2.5 bg-[#F7F8F2] border border-[#e2e5da] rounded-lg text-sm text-[#1F2A1F] focus:outline-none focus:border-[#4A7C59] transition-colors"
              />
            </div>
            <div>
              <label htmlFor="plant-name" className="text-xs text-[#6b7a6b] mb-1 block">Plant name</label>
              <input
                id="plant-name"
                type="text"
                value={newPlantName}
                onChange={(e) => setNewPlantName(e.target.value)}
                placeholder="Give your plant a name (optional — something personal)"
                maxLength={30}
                className="w-full px-4 py-2.5 bg-[#F7F8F2] border border-[#e2e5da] rounded-lg text-sm text-[#1F2A1F] focus:outline-none focus:border-[#4A7C59] transition-colors"
              />
            </div>
            <div>
              <label htmlFor="intention" className="text-xs text-[#6b7a6b] mb-1 block">Why does this matter to you?</label>
              <input
                id="intention"
                type="text"
                value={newIntention}
                onChange={(e) => setNewIntention(e.target.value)}
                placeholder="I'm planting this because..."
                maxLength={150}
                className="w-full px-4 py-2.5 bg-[#F7F8F2] border border-[#e2e5da] rounded-lg text-sm text-[#6b7a6b] italic focus:outline-none focus:border-[#4A7C59] focus:text-[#1F2A1F] focus:not-italic transition-colors"
              />
              <p className="text-[10px] text-[#6b7a6b] mt-1">This will gently remind you when things get hard.</p>
            </div>

            {createError && (
              <p className="text-xs text-[#c44030] bg-[#c44030]/10 px-3 py-2 rounded">{createError}</p>
            )}

            <div className="flex gap-2 mt-1">
              <button
                type="submit"
                disabled={creating || !newHabitName.trim()}
                className="flex-1 py-2.5 bg-[#4A7C59] text-white text-sm rounded-lg hover:bg-[#3d6b4a] transition-colors disabled:opacity-50"
              >
                {creating ? 'Planting...' : '🌱 Plant seed'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="flex-1 py-2.5 border border-[#e2e5da] text-[#6b7a6b] text-sm rounded-lg hover:text-[#1F2A1F] hover:border-[#4A7C59] transition-colors"
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

      {/* Success toast */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            className="fixed top-4 left-4 right-4 max-w-md mx-auto bg-[#f0f5f1] border border-[#c8e0cc] rounded-xl px-4 py-3 shadow-lg z-[70] text-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <p className="text-sm text-[#4A7C59] font-medium">{successMessage}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Undo toast */}
      <AnimatePresence>
        {recentlyReleased && (
          <motion.div
            className="fixed bottom-24 left-4 right-4 max-w-md mx-auto bg-[#ffffff] border border-[#e2e5da] rounded-lg px-4 py-3 flex items-center justify-between shadow-lg z-40"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <p className="text-sm text-[#1F2A1F]">
              <span className="text-[#b08040]">🍃</span>{' '}
              <span className="font-medium">{recentlyReleased.plant_name || recentlyReleased.name}</span>{' '}
              <span className="text-[#6b7a6b]">released to the wild</span>
            </p>
            <button
              onClick={() => handleReplant(recentlyReleased.id)}
              className="px-3 py-1 text-xs bg-[#4A7C59] text-white rounded-full hover:bg-[#3d6b4a] transition-colors whitespace-nowrap ml-3"
            >
              🌱 Replant
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Complete today checklist — hidden in quiet mode */}
      {!quietMode && incompleteHabits.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm text-[#6b7a6b] font-medium mb-3">Complete today</h2>
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
        <motion.div
          className="mt-8 text-center py-8 bg-[#f0f5f1] border border-[#c8e0cc] rounded-xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <span className="text-3xl block mb-2">🌿</span>
          <p className="text-[#4A7C59] text-sm font-semibold">All done for today</p>
          <p className="text-[#6b7a6b] text-xs mt-1">Your garden is thriving. Come back tomorrow.</p>
        </motion.div>
      )}

      {/* Released plants */}
      {released.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm text-[#6b7a6b] font-medium mb-3">Growing in the wild</h2>
          <p className="text-xs text-[#6b7a6b] mb-3">These plants are still out there. You can replant them before they find a new home.</p>
          <div className="flex flex-col gap-2">
            {released.map((habit) => (
              <div key={habit.id} className="flex items-center justify-between p-3 bg-[#ffffff] border border-[#e2e5da] rounded-lg opacity-70">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg">🍃</span>
                  <div className="min-w-0">
                    <p className="text-sm text-[#1F2A1F] truncate">{habit.plant_name || habit.name}</p>
                    <p className="text-[10px] text-[#6b7a6b]">
                      {habit.released_at ? `${daysUntilExpiry(habit.released_at)} days to replant` : 'Released'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleReplant(habit.id)}
                  className="px-3 py-1.5 text-xs bg-[#4A7C59]/20 text-[#4A7C59] rounded-lg hover:bg-[#4A7C59]/30 transition-colors whitespace-nowrap"
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
