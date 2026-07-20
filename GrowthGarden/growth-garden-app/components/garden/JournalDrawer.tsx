'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { getReflections } from '@/lib/actions/habits';
import { HabitReflection } from '@/types';

interface JournalDrawerProps {
  habitId: string;
  habitName: string;
  onClose: () => void;
}

export function JournalDrawer({ habitId, habitName, onClose }: JournalDrawerProps) {
  const [reflections, setReflections] = useState<HabitReflection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getReflections(habitId);
      setReflections(data);
      setLoading(false);
    }
    load();
  }, [habitId]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Drawer */}
      <motion.div
        className="relative w-full max-w-lg bg-[#141820] border-t border-[#252a38] rounded-t-2xl px-4 py-5 max-h-[70vh] overflow-y-auto"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-[#e0e6f0]">Your garden journal</p>
            <p className="text-xs text-[#8b95a8]">{habitName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-[#8b95a8] hover:text-[#e0e6f0] transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {loading && (
          <p className="text-xs text-[#8b95a8] text-center py-8">Loading...</p>
        )}

        {!loading && reflections.length === 0 && (
          <p className="text-xs text-[#8b95a8] text-center py-8">
            No reflections yet. They&apos;ll appear here after you mark done.
          </p>
        )}

        {!loading && reflections.length > 0 && (
          <div className="flex flex-col gap-3">
            {reflections.map((r) => (
              <div key={r.id} className="flex gap-3 items-start">
                <span className="text-[10px] text-[#8b95a8] whitespace-nowrap mt-0.5 min-w-[60px]">
                  {new Date(r.reflected_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
                <p className="text-xs text-[#e0e6f0] leading-relaxed">{r.note}</p>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
