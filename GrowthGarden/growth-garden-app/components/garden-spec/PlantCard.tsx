'use client';

import { useMemo } from 'react';
import { computeGrowthStage } from '@/lib/garden-engine';
import type { GrowthStage, Habit } from '@/lib/types';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface PlantCardProps {
  habit: Habit;
}

// ---------------------------------------------------------------------------
// Growth Stage Visual Configuration
// ---------------------------------------------------------------------------

interface StageVisual {
  emoji: string;
  label: string;
  bgColor: string;
  borderColor: string;
  description: string;
}

const STAGE_VISUALS: Record<GrowthStage, StageVisual> = {
  seed: {
    emoji: '🌰',
    label: 'Seed',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    description: 'A small seed resting in earth',
  },
  sprout: {
    emoji: '🌱',
    label: 'Sprout',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    description: 'A small green sprout emerging',
  },
  budding: {
    emoji: '🌿',
    label: 'Budding',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    description: 'A plant with buds and leaves growing',
  },
  blooming: {
    emoji: '🌸',
    label: 'Blooming',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-200',
    description: 'A fully blooming flower',
  },
  wilting: {
    emoji: '🥀',
    label: 'Wilting',
    bgColor: 'bg-stone-50',
    borderColor: 'border-stone-300',
    description: 'A drooping, faded plant',
  },
};

// ---------------------------------------------------------------------------
// PlantCard Component
// ---------------------------------------------------------------------------

/**
 * Displays an individual plant card with:
 * - Visually distinct representation for each growth stage (identifiable without text)
 * - Current streak count adjacent to the plant
 * - Habit name
 * - Growth stage label
 * - Smooth CSS transitions when growth stage changes
 *
 * Validates: Requirements 7.2, 7.4
 */
export function PlantCard({ habit }: PlantCardProps) {
  const growthStage = useMemo(
    () => computeGrowthStage(habit.current_streak, habit.is_wilting),
    [habit.current_streak, habit.is_wilting]
  );

  const visual = STAGE_VISUALS[growthStage];

  return (
    <div
      className={`
        relative flex flex-col items-center gap-2 p-4 rounded-xl border
        ${visual.bgColor} ${visual.borderColor}
        transition-all duration-500 ease-in-out
      `}
      role="article"
      aria-label={`${habit.name} - ${visual.label} stage, streak ${habit.current_streak}`}
    >
      {/* Streak count badge - adjacent to plant */}
      <div
        className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/80 border border-black/5 text-xs font-medium text-[#4A7C59]"
        aria-label={`Streak: ${habit.current_streak}`}
      >
        <span className="text-[10px]">🔥</span>
        <span>{habit.current_streak}</span>
      </div>

      {/* Plant visual representation - distinct per stage */}
      <div
        className="w-16 h-16 flex items-center justify-center text-4xl transition-transform duration-500 ease-in-out"
        role="img"
        aria-label={visual.description}
      >
        <span
          className={`
            inline-block transition-all duration-500 ease-in-out
            ${growthStage === 'seed' ? 'scale-75 opacity-80' : ''}
            ${growthStage === 'sprout' ? 'scale-90' : ''}
            ${growthStage === 'budding' ? 'scale-100' : ''}
            ${growthStage === 'blooming' ? 'scale-110' : ''}
            ${growthStage === 'wilting' ? 'scale-90 opacity-60 rotate-12' : ''}
          `}
        >
          {visual.emoji}
        </span>
      </div>

      {/* Habit name */}
      <p className="text-sm font-medium text-[#1F2A1F] text-center truncate w-full">
        {habit.name}
      </p>

      {/* Growth stage label */}
      <span className="text-[10px] uppercase tracking-wide text-[#6b7a6b] font-medium">
        {visual.label}
      </span>
    </div>
  );
}
