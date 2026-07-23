'use client';

import { useState } from 'react';
import { Habit, Profile } from '@/types';
import { GardenGrid } from '@/components/garden/GardenGrid';
import { waterFriendHabit } from '@/lib/actions/waterings';

interface FriendGardenClientProps {
  profile: Profile;
  habits: Habit[];
}

export function FriendGardenClient({ profile, habits: initialHabits }: FriendGardenClientProps) {
  const [habits, setHabits] = useState(initialHabits);
  const [waterError, setWaterError] = useState<string | null>(null);

  async function handleWater(habitId: string, userId: string) {
    setWaterError(null);
    const result = await waterFriendHabit(habitId, userId);
    if ('error' in result) {
      setWaterError(result.error);
      return;
    }
    setHabits((prev) => prev.map((h) => h.id === result.id ? result : h));
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="bg-[#ffffff] border border-[#e2e5da] rounded-lg px-4 py-3 mb-6">
        <p className="text-sm text-[#6b7a6b]">
          Visiting <span className="text-[#1F2A1F] font-medium">{profile.username}&apos;s garden</span>
        </p>
      </div>

      {waterError && (
        <p className="text-sm text-[#c44030] mb-4">{waterError}</p>
      )}

      <GardenGrid habits={habits} readOnly onWater={handleWater} />
    </div>
  );
}
