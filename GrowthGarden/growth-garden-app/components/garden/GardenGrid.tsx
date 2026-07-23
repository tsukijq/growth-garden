'use client';

import { Habit } from '@/types';
import { PlantCard } from '@/components/plants/PlantCard';

interface GardenGridProps {
  habits: Habit[];
  readOnly?: boolean;
  onWater?: (habitId: string, userId: string) => void;
  onRelease?: (habitId: string) => void;
  onViewJournal?: (habitId: string) => void;
  reflectionCounts?: Record<string, number>;
  animatingHabitId?: string | null;
}

export function GardenGrid({ habits, readOnly, onWater, onRelease, onViewJournal, reflectionCounts, animatingHabitId }: GardenGridProps) {
  if (habits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-20 h-20 mb-4 opacity-50">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <ellipse cx="50" cy="80" rx="25" ry="8" fill="#3d2b1f" />
            <ellipse cx="50" cy="75" rx="5" ry="3" fill="#8b6914" opacity="0.5" />
          </svg>
        </div>
        <p className="text-[#1F2A1F] text-sm font-medium">Your garden is waiting</p>
        <p className="text-[#6b7a6b] text-xs mt-1 max-w-[240px]">
          Tap <span className="font-medium text-[#4A7C59]">+ Plant seed</span> above to grow your first habit.
          Every great garden starts with one seed.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {habits.map((habit) => (
        <PlantCard
          key={habit.id}
          habit={habit}
          showWaterButton={readOnly}
          onWater={() => onWater?.(habit.id, habit.user_id)}
          onRelease={!readOnly ? onRelease : undefined}
          onViewJournal={onViewJournal}
          reflectionCount={reflectionCounts?.[habit.id]}
          isAnimating={animatingHabitId === habit.id}
        />
      ))}
    </div>
  );
}
