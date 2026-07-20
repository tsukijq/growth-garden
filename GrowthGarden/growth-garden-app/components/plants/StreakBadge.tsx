'use client';

import { getRareVariant } from '@/lib/utils/plantStage';

interface StreakBadgeProps {
  streakCount: number;
}

export function StreakBadge({ streakCount }: StreakBadgeProps) {
  if (streakCount === 0) return null;

  const variant = getRareVariant(streakCount);
  const bgColor = variant === 'black_moonflower' ? 'bg-purple-900/80' :
    variant === 'moonbell_orchid' ? 'bg-purple-700/80' :
    variant === 'crystal_sprout' ? 'bg-cyan-800/80' :
    'bg-[#252a38]';

  const textColor = variant ? 'text-purple-200' : 'text-[#8b95a8]';

  return (
    <div className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
      {streakCount}d 🔥
    </div>
  );
}
