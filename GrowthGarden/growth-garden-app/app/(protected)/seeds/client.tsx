'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createHabit } from '@/lib/actions/habits';
import { getSeasonalSeeds } from '@/lib/utils/seasonal';
import { useRouter } from 'next/navigation';

interface SeedsPageClientProps {
  longestStreak: number;
}

const standardSeeds = [
  { name: 'Morning Ritual', description: 'A gentle seed that thrives with early consistency.' },
  { name: 'Movement', description: 'Grows stronger with daily physical activity.' },
  { name: 'Mindfulness', description: 'A quiet seed that blooms with stillness and presence.' },
  { name: 'Learning', description: 'Feeds on curiosity and daily study.' },
  { name: 'Hydration', description: 'A simple seed — just add water, every day.' },
  { name: 'Creative Work', description: 'Blossoms when you make something, anything, daily.' },
];

const streakSeeds = [
  { name: 'Crystal Sprout', streakRequired: 7, description: 'Unlocked at 7-day streaks. A translucent beauty.' },
  { name: 'Moonbell Orchid', streakRequired: 30, description: 'Unlocked at 30-day streaks. Rings softly under moonlight.' },
  { name: 'Black Moonflower', streakRequired: 100, description: 'Unlocked at 100-day streaks. The rarest bloom in any garden.' },
];

export function SeedsPageClient({ longestStreak }: SeedsPageClientProps) {
  const [habitName, setHabitName] = useState('');
  const [intention, setIntention] = useState('');
  const [plantName, setPlantName] = useState('');
  const [creating, setCreating] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [selectedSeed, setSelectedSeed] = useState<string | null>(null);
  const router = useRouter();

  const seasonalSeeds = getSeasonalSeeds();

  async function plantSeed(name: string) {
    setCreating(true);
    await createHabit(name, {
      intention: intention.trim() || undefined,
      plantName: plantName.trim() || undefined,
    });
    setCreating(false);
    setSelectedSeed(null);
    setIntention('');
    setPlantName('');
    router.push('/garden');
    router.refresh();
  }

  function selectSeed(name: string) {
    setSelectedSeed(name);
    setHabitName(name);
  }

  async function handleConfirmSeed(e: React.FormEvent) {
    e.preventDefault();
    if (!habitName.trim()) return;
    await plantSeed(habitName.trim());
  }

  async function handleCustomSeed(e: React.FormEvent) {
    e.preventDefault();
    if (!habitName.trim()) return;
    setSelectedSeed(habitName.trim());
  }

  function daysUntil(date: Date): number {
    const now = new Date();
    return Math.max(0, Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-6">Seed Library</h1>

      {/* Confirmation form when a seed is selected */}
      <AnimatePresence>
        {selectedSeed && (
          <motion.form
            onSubmit={handleConfirmSeed}
            className="mb-6 p-4 bg-[#ffffff] border border-[#4A7C59] rounded-lg flex flex-col gap-3"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            aria-label="Confirm seed planting"
          >
            <p className="text-sm text-[#4A7C59] font-medium">🌱 Planting: {habitName}</p>
            <div>
              <label htmlFor="seed-plant-name" className="text-xs text-[#6b7a6b] mb-1 block">Plant name (optional)</label>
              <input
                id="seed-plant-name"
                type="text"
                value={plantName}
                onChange={(e) => setPlantName(e.target.value)}
                placeholder="Give your plant a name"
                maxLength={30}
                className="w-full px-4 py-2.5 bg-[#F7F8F2] border border-[#e2e5da] rounded-lg text-sm text-[#1F2A1F] focus:outline-none focus:border-[#4A7C59] transition-colors"
              />
            </div>
            <div>
              <label htmlFor="seed-intention" className="text-xs text-[#6b7a6b] mb-1 block">Why does this matter to you? (optional)</label>
              <input
                id="seed-intention"
                type="text"
                value={intention}
                onChange={(e) => setIntention(e.target.value)}
                placeholder="I'm planting this because..."
                maxLength={150}
                className="w-full px-4 py-2.5 bg-[#F7F8F2] border border-[#e2e5da] rounded-lg text-sm text-[#6b7a6b] italic focus:outline-none focus:border-[#4A7C59] focus:text-[#1F2A1F] focus:not-italic transition-colors"
              />
            </div>
            <div className="flex gap-2 mt-1">
              <button
                type="submit"
                disabled={creating}
                className="flex-1 py-2.5 bg-[#4A7C59] text-white text-sm rounded-lg hover:bg-[#3d6b4a] transition-colors disabled:opacity-50"
              >
                {creating ? 'Planting...' : '🌱 Plant seed'}
              </button>
              <button
                type="button"
                onClick={() => { setSelectedSeed(null); setIntention(''); setPlantName(''); }}
                className="flex-1 py-2.5 border border-[#e2e5da] text-[#6b7a6b] text-sm rounded-lg hover:text-[#1F2A1F] hover:border-[#4A7C59] transition-colors"
              >
                Cancel
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Limited time section */}
      {seasonalSeeds.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm text-[#6b7a6b] font-medium mb-3">Limited time</h2>
          <div className="flex flex-col gap-2">
            {seasonalSeeds.map((seed) => (
              <motion.button
                key={seed.name}
                onClick={() => selectSeed(seed.name)}
                disabled={creating || !!selectedSeed}
                className="flex items-center justify-between p-4 bg-[#ffffff] border border-[#e2e5da] rounded-lg hover:border-[#7c4dbd] transition-colors text-left"
                whileTap={{ scale: 0.98 }}
              >
                <div>
                  <p className="text-sm text-[#9060e8] font-medium">{seed.name}</p>
                  <p className="text-xs text-[#6b7a6b] mt-0.5">{seed.description}</p>
                </div>
                <span className="text-xs text-[#6b7a6b] whitespace-nowrap ml-4">
                  {daysUntil(seed.endsAt)}d left
                </span>
              </motion.button>
            ))}
          </div>
        </section>
      )}

      {/* Streak unlocks section */}
      <section className="mb-8">
        <h2 className="text-sm text-[#6b7a6b] font-medium mb-3">Streak unlocks</h2>
        <div className="flex flex-col gap-2">
          {streakSeeds.map((seed) => {
            const progress = Math.min(100, (longestStreak / seed.streakRequired) * 100);
            const unlocked = longestStreak >= seed.streakRequired;

            return (
              <div
                key={seed.name}
                className={`p-4 bg-[#ffffff] border rounded-lg ${unlocked ? 'border-[#7c4dbd]' : 'border-[#e2e5da]'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className={`text-sm font-medium ${unlocked ? 'text-[#9060e8]' : 'text-[#6b7a6b]'}`}>
                    {seed.name}
                  </p>
                  <span className="text-xs text-[#6b7a6b]">
                    {unlocked ? '✨ Unlocked' : `${longestStreak}/${seed.streakRequired}d`}
                  </span>
                </div>
                <p className="text-xs text-[#6b7a6b] mb-2">{seed.description}</p>
                <div className="w-full h-1.5 bg-[#e2e5da] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: unlocked ? '#7c4dbd' : '#4A7C59',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Always available section */}
      <section className="mb-8">
        <h2 className="text-sm text-[#6b7a6b] font-medium mb-3">Always available</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {standardSeeds.map((seed) => (
            <motion.button
              key={seed.name}
              onClick={() => selectSeed(seed.name)}
              disabled={creating || !!selectedSeed}
              className="p-4 bg-[#ffffff] border border-[#e2e5da] rounded-lg hover:border-[#4A7C59] transition-colors text-left"
              whileTap={{ scale: 0.98 }}
            >
              <p className="text-sm text-[#1F2A1F] font-medium">{seed.name}</p>
              <p className="text-xs text-[#6b7a6b] mt-0.5">{seed.description}</p>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Custom seed */}
      <section>
        {!showCustom ? (
          <button
            onClick={() => setShowCustom(true)}
            className="w-full p-4 border border-dashed border-[#e2e5da] rounded-lg text-sm text-[#6b7a6b] hover:border-[#4A7C59] hover:text-[#1F2A1F] transition-colors"
          >
            + Plant a custom seed
          </button>
        ) : (
          <form onSubmit={handleCustomSeed} className="flex gap-2">
            <label htmlFor="custom-seed-name" className="sr-only">Custom habit name</label>
            <input
              id="custom-seed-name"
              type="text"
              value={habitName}
              onChange={(e) => setHabitName(e.target.value)}
              placeholder="Name your habit"
              maxLength={50}
              autoFocus
              className="flex-1 px-4 py-3 bg-[#ffffff] border border-[#e2e5da] rounded-lg text-sm text-[#1F2A1F] focus:outline-none focus:border-[#4A7C59] transition-colors"
            />
            <button
              type="submit"
              disabled={creating || !habitName.trim()}
              className="px-5 py-3 bg-[#4A7C59] text-white text-sm rounded-lg hover:bg-[#3d6b4a] transition-colors disabled:opacity-50"
            >
              Next
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
