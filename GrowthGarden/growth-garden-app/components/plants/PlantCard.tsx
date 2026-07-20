'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Habit } from '@/types';
import { getRareVariant, isRestDay } from '@/lib/utils/plantStage';
import { PlantSVG } from './PlantSVG';
import { HealthBar } from './HealthBar';
import { StreakBadge } from './StreakBadge';

interface PlantCardProps {
  habit: Habit;
  showWaterButton?: boolean;
  onWater?: () => void;
  onRelease?: (habitId: string) => void;
  onViewJournal?: (habitId: string) => void;
  reflectionCount?: number;
  isAnimating?: boolean;
}

export function PlantCard({ habit, showWaterButton, onWater, onRelease, onViewJournal, reflectionCount, isAnimating }: PlantCardProps) {
  const variant = getRareVariant(habit.streak_count);
  const [showMenu, setShowMenu] = useState(false);
  const [confirmRelease, setConfirmRelease] = useState(false);
  const [showIntention, setShowIntention] = useState(false);

  const isResting = isRestDay(habit.rest_days || []);
  const isWilting = habit.health_score < 40;
  const isDying = habit.health_score < 20;

  function handleRelease() {
    setConfirmRelease(false);
    setShowMenu(false);
    onRelease?.(habit.id);
  }

  // Display name: plant_name takes priority, then habit name
  const displayName = habit.plant_name || habit.name;
  const subtitle = habit.plant_name ? habit.name : null;

  return (
    <motion.div
      className="relative bg-[#141820] border border-[#252a38] rounded-xl p-4 flex flex-col items-center gap-2"
      animate={isAnimating ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      onMouseEnter={() => habit.intention && setShowIntention(true)}
      onMouseLeave={() => setShowIntention(false)}
    >
      <StreakBadge streakCount={habit.streak_count} />

      {/* Menu trigger */}
      {onRelease && (
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="absolute top-2 left-2 w-5 h-5 flex items-center justify-center text-[#8b95a8] hover:text-[#e0e6f0] transition-colors rounded"
          aria-label="Plant options"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
            <circle cx="8" cy="3" r="1.5" />
            <circle cx="8" cy="8" r="1.5" />
            <circle cx="8" cy="13" r="1.5" />
          </svg>
        </button>
      )}

      {/* Journal icon */}
      {reflectionCount && reflectionCount > 0 && (
        <button
          onClick={() => onViewJournal?.(habit.id)}
          className="absolute top-2 left-8 text-[#8b95a8] hover:text-[#e0e6f0] transition-colors"
          aria-label="View garden journal"
          title="Garden journal"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
          </svg>
        </button>
      )}

      {/* Context menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            className="absolute top-8 left-2 z-10 bg-[#1a1f28] border border-[#252a38] rounded-lg shadow-lg overflow-hidden"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            {!confirmRelease ? (
              <button
                onClick={() => setConfirmRelease(true)}
                className="px-4 py-2 text-xs text-[#e0a060] hover:bg-[#252a38] w-full text-left whitespace-nowrap"
              >
                🍃 Release to the wild
              </button>
            ) : (
              <div className="px-3 py-2 flex flex-col gap-1.5">
                <p className="text-[10px] text-[#8b95a8] leading-tight">
                  Let this plant grow freely?<br />You can replant within 7 days.
                </p>
                <div className="flex gap-1.5">
                  <button
                    onClick={handleRelease}
                    className="px-2 py-1 text-[10px] bg-[#e0a060]/20 text-[#e0a060] rounded hover:bg-[#e0a060]/30 transition-colors"
                  >
                    Release
                  </button>
                  <button
                    onClick={() => { setConfirmRelease(false); setShowMenu(false); }}
                    className="px-2 py-1 text-[10px] text-[#8b95a8] rounded hover:text-[#e0e6f0] transition-colors"
                  >
                    Keep
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Rest day indicator */}
      {isResting && (
        <div className="absolute top-10 right-2 text-xs" title="Rest day. Your plant is okay.">
          🌙
        </div>
      )}

      <div className="w-24 h-24">
        <PlantSVG
          stage={habit.plant_stage}
          healthScore={habit.health_score}
          variant={variant}
        />
      </div>

      {/* Plant name / habit name */}
      <p className="text-sm text-[#e0e6f0] font-medium text-center truncate w-full">
        {displayName}
      </p>
      {subtitle && (
        <p className="text-[10px] text-[#8b95a8] -mt-1 text-center truncate w-full">{subtitle}</p>
      )}

      {/* Compassionate wilting/dying copy */}
      {isDying && (
        <p className="text-[10px] text-[#c05030]/80 text-center">
          It&apos;s not too late. One day at a time.
        </p>
      )}
      {isWilting && !isDying && (
        <p className="text-[10px] text-[#e0a060]/80 text-center">
          Your plant is resting. It remembers you.
        </p>
      )}

      {/* Intention shown on wilting as gentle nudge */}
      {isWilting && habit.intention && (
        <p className="text-[10px] text-[#8b95a8] italic text-center truncate w-full">
          &ldquo;{habit.intention}&rdquo;
        </p>
      )}

      {/* Rest day message */}
      {isResting && !isWilting && (
        <p className="text-[10px] text-[#8b95a8] text-center">Rest day. Your plant is okay.</p>
      )}

      <HealthBar healthScore={habit.health_score} />

      {/* Intention tooltip on hover */}
      <AnimatePresence>
        {showIntention && !isWilting && habit.intention && (
          <motion.div
            className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-[#1a1f28] border border-[#252a38] rounded-md shadow-lg z-20 whitespace-nowrap"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
          >
            <p className="text-[10px] text-[#8b95a8] italic">&ldquo;{habit.intention}&rdquo;</p>
          </motion.div>
        )}
      </AnimatePresence>

      {showWaterButton && habit.health_score < 40 && (
        <button
          onClick={onWater}
          className="mt-1 px-3 py-1 text-xs rounded-full bg-cyan-900/50 text-cyan-300 hover:bg-cyan-800/60 transition-colors"
        >
          💧 Water
        </button>
      )}
    </motion.div>
  );
}
