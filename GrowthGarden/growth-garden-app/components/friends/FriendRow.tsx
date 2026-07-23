'use client';

import Link from 'next/link';
import { Profile, Habit } from '@/types';

interface FriendRowProps {
  profile: Profile;
  habits?: Habit[];
}

function getFriendStatus(habits?: Habit[]): { label: string; color: string } {
  if (!habits || habits.length === 0) return { label: 'Just planted', color: 'text-[#6b7a6b]' };

  const wiltingCount = habits.filter((h) => h.health_score < 40).length;
  if (wiltingCount >= 2) return { label: 'Needs encouragement', color: 'text-[#b08040]' };

  const hasRareBloom = habits.some((h) => h.plant_stage === 'fruiting');
  if (hasRareBloom) return { label: 'Unlocked a rare bloom', color: 'text-[#7c4dbd]' };

  const longestStreak = Math.max(...habits.map((h) => h.streak_count));
  if (longestStreak >= 3) return { label: `On a ${longestStreak}-day streak`, color: 'text-[#4A7C59]' };

  return { label: 'Growing steadily', color: 'text-[#6b7a6b]' };
}

export function FriendRow({ profile, habits }: FriendRowProps) {
  const status = getFriendStatus(habits);

  return (
    <Link
      href={`/garden/${profile.username}`}
      className="flex items-center gap-3 p-3 bg-[#ffffff] border border-[#e2e5da] rounded-lg hover:border-[#4A7C59] transition-colors"
    >
      <div className="w-10 h-10 rounded-full bg-[#e2e5da] flex items-center justify-center text-sm text-[#6b7a6b]">
        {profile.username.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#1F2A1F] font-medium truncate">{profile.username}</p>
        <p className={`text-xs ${status.color}`}>{status.label}</p>
      </div>
      <svg className="w-4 h-4 text-[#6b7a6b]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
