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
      <div className="bg-[#141820] border border-[#252a38] rounded-lg px-4 py-3 mb-6">
        <p className="text-sm text-[#8b95a8]">
          Visiting <span className="text-[#e0e6f0] font-medium">{profile.username}&apos;s garden</span>
        </p>
      </div>

      {waterError && (
        <p className="text-sm text-[#c05030] mb-4">{waterError}</p>
      )}

      <GardenGrid habits={habits} readOnly onWater={handleWater} />
    </div>
  );
}
