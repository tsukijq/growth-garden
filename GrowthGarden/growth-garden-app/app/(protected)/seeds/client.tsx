'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
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
  const [creating, setCreating] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const router = useRouter();

  const seasonalSeeds = getSeasonalSeeds();

  async function plantSeed(name: string) {
    setCreating(true);
    await createHabit(name);
    setCreating(false);
    router.push('/garden');
    router.refresh();
  }

  async function handleCustomSeed(e: React.FormEvent) {
    e.preventDefault();
    if (!habitName.trim()) return;
    await plantSeed(habitName.trim());
  }

  function daysUntil(date: Date): number {
    const now = new Date();
    return Math.max(0, Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <h1 className="text-xl font-bold mb-6">Seed Library</h1>

      {/* Limited time section */}
      {seasonalSeeds.length > 0 && (
        <section className="mb-8">
          <h2 className="text-sm text-[#8b95a8] font-medium mb-3">Limited time</h2>
          <div className="flex flex-col gap-2">
            {seasonalSeeds.map((seed) => (
              <motion.button
                key={seed.name}
                onClick={() => plantSeed(seed.name)}
                disabled={creating}
                className="flex items-center justify-between p-4 bg-[#141820] border border-[#252a38] rounded-lg hover:border-[#9060e8] transition-colors text-left"
                whileTap={{ scale: 0.98 }}
              >
                <div>
                  <p className="text-sm text-[#c0a0ff] font-medium">{seed.name}</p>
                  <p className="text-xs text-[#8b95a8] mt-0.5">{seed.description}</p>
                </div>
                <span className="text-xs text-[#8b95a8] whitespace-nowrap ml-4">
                  {daysUntil(seed.endsAt)}d left
                </span>
              </motion.button>
            ))}
          </div>
        </section>
      )}

      {/* Streak unlocks section */}
      <section className="mb-8">
        <h2 className="text-sm text-[#8b95a8] font-medium mb-3">Streak unlocks</h2>
        <div className="flex flex-col gap-2">
          {streakSeeds.map((seed) => {
            const progress = Math.min(100, (longestStreak / seed.streakRequired) * 100);
            const unlocked = longestStreak >= seed.streakRequired;

            return (
              <div
                key={seed.name}
                className={`p-4 bg-[#141820] border rounded-lg ${unlocked ? 'border-[#9060e8]' : 'border-[#252a38]'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className={`text-sm font-medium ${unlocked ? 'text-[#c0a0ff]' : 'text-[#8b95a8]'}`}>
                    {seed.name}
                  </p>
                  <span className="text-xs text-[#8b95a8]">
                    {unlocked ? '✨ Unlocked' : `${longestStreak}/${seed.streakRequired}d`}
                  </span>
                </div>
                <p className="text-xs text-[#8b95a8] mb-2">{seed.description}</p>
                <div className="w-full h-1.5 bg-[#252a38] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${progress}%`,
                      backgroundColor: unlocked ? '#9060e8' : '#4a8a50',
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
        <h2 className="text-sm text-[#8b95a8] font-medium mb-3">Always available</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {standardSeeds.map((seed) => (
            <motion.button
              key={seed.name}
              onClick={() => plantSeed(seed.name)}
              disabled={creating}
              className="p-4 bg-[#141820] border border-[#252a38] rounded-lg hover:border-[#4a8a50] transition-colors text-left"
              whileTap={{ scale: 0.98 }}
            >
              <p className="text-sm text-[#e0e6f0] font-medium">{seed.name}</p>
              <p className="text-xs text-[#8b95a8] mt-0.5">{seed.description}</p>
            </motion.button>
          ))}
        </div>
      </section>

      {/* Custom seed */}
      <section>
        {!showCustom ? (
          <button
            onClick={() => setShowCustom(true)}
            className="w-full p-4 border border-dashed border-[#252a38] rounded-lg text-sm text-[#8b95a8] hover:border-[#4a8a50] hover:text-[#e0e6f0] transition-colors"
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
              className="flex-1 px-4 py-3 bg-[#141820] border border-[#252a38] rounded-lg text-sm text-[#e0e6f0] focus:outline-none focus:border-[#4a8a50] transition-colors"
            />
            <button
              type="submit"
              disabled={creating || !habitName.trim()}
              className="px-5 py-3 bg-[#4a8a50] text-white text-sm rounded-lg hover:bg-[#5a9a60] transition-colors disabled:opacity-50"
            >
              Plant
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
