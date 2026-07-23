'use client';

import type { Habit } from '@/lib/types';
import { PlantCard } from './PlantCard';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface GardenGridProps {
  /** Active habits to render as plants (up to 20) */
  habits: Habit[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum number of plants displayed in the garden grid */
const MAX_PLANTS = 20;

// ---------------------------------------------------------------------------
// GardenGrid Component
// ---------------------------------------------------------------------------

/**
 * Renders up to 20 plants in a responsive grid layout.
 * Shows an empty state message when no active plants exist.
 *
 * Responsive grid:
 * - 2 columns on mobile
 * - 3 columns on tablet (md)
 * - 4 columns on large screens (lg)
 * - 5 columns on extra-large screens (xl)
 *
 * Validates: Requirements 7.1, 7.3, 7.5
 */
export function GardenGrid({ habits }: GardenGridProps) {
  // Limit to 20 active plants
  const visibleHabits = habits.slice(0, MAX_PLANTS);

  // Empty state
  if (visibleHabits.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 text-center"
        role="status"
        aria-label="Empty garden"
      >
        <div className="w-20 h-20 mb-4 flex items-center justify-center opacity-50">
          <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
            <ellipse cx="50" cy="80" rx="30" ry="10" fill="#8B7355" opacity="0.4" />
            <ellipse cx="50" cy="75" rx="6" ry="4" fill="#A0522D" opacity="0.6" />
            <line x1="50" y1="72" x2="50" y2="60" stroke="#6B8E23" strokeWidth="1.5" opacity="0.3" />
          </svg>
        </div>
        <p className="text-[#1F2A1F] text-sm font-medium">
          Your garden is empty
        </p>
        <p className="text-[#6b7a6b] text-xs mt-1 max-w-[260px]">
          Create a habit to plant your first seed and watch it grow with your consistency.
        </p>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3"
      role="list"
      aria-label={`Garden with ${visibleHabits.length} plant${visibleHabits.length === 1 ? '' : 's'}`}
    >
      {visibleHabits.map((habit) => (
        <div key={habit.id} role="listitem">
          <PlantCard habit={habit} />
        </div>
      ))}
    </div>
  );
}
