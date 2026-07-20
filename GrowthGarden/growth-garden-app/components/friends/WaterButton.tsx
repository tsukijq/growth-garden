'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { waterFriendHabit } from '@/lib/actions/waterings';

interface WaterButtonProps {
  habitId: string;
  toUserId: string;
  onWatered?: () => void;
}

export function WaterButton({ habitId, toUserId, onWatered }: WaterButtonProps) {
  const [loading, setLoading] = useState(false);
  const [watered, setWatered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleWater() {
    if (loading || watered) return;
    setLoading(true);
    setError(null);

    const result = await waterFriendHabit(habitId, toUserId);
    if ('error' in result) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setWatered(true);
    setLoading(false);
    onWatered?.();
  }

  return (
    <div className="flex flex-col items-center">
      <motion.button
        onClick={handleWater}
        disabled={loading || watered}
        className={`px-4 py-2 rounded-full text-sm font-medium transition-colors
          ${watered
            ? 'bg-cyan-900/30 text-cyan-400'
            : 'bg-cyan-900/50 text-cyan-300 hover:bg-cyan-800/60'
          }
        `}
        whileTap={{ scale: 0.92 }}
        animate={watered ? { scale: [1, 1.1, 1] } : {}}
      >
        {watered ? '💧 Watered!' : loading ? '💧...' : '💧 Water this plant'}
      </motion.button>
      {error && <p className="text-xs text-[#c05030] mt-1">{error}</p>}
    </div>
  );
}
