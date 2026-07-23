'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { markHabitDone } from '@/lib/actions/habits';
import { Habit } from '@/types';
import { isRestDay } from '@/lib/utils/plantStage';

interface MarkDoneButtonProps {
  habit: Habit;
  isCompleted: boolean;
  onComplete: (updatedHabit: Habit, milestone?: number) => void;
}

export function MarkDoneButton({ habit, isCompleted, onComplete }: MarkDoneButtonProps) {
  const [loading, setLoading] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resting = isRestDay(habit.rest_days || []);

  async function handleMarkDone() {
    if (isCompleted || loading || resting) return;
    setLoading(true);
    setError(null);

    const result = await markHabitDone(habit.id);
    if ('error' in result) {
      setError(result.error);
      setLoading(false);
      setTimeout(() => setError(null), 3000);
      return;
    }

    const milestone = (result as any).milestone;
    setJustCompleted(true);
    onComplete(result as Habit, milestone);
    setLoading(false);

    setTimeout(() => setJustCompleted(false), 3000);
  }

  // Rest day display
  if (resting && !isCompleted) {
    return (
      <div className="flex items-center gap-3 w-full px-4 py-3 rounded-lg bg-[#ffffff] border border-[#e2e5da]">
        <span className="text-lg">🌙</span>
        <div>
          <span className="text-sm text-[#1F2A1F]">{habit.plant_name || habit.name}</span>
          <p className="text-[10px] text-[#6b7a6b]">Rest day. Your plant is okay.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.button
      onClick={handleMarkDone}
      disabled={isCompleted || loading}
      className={`
        relative flex items-center gap-3 w-full px-4 py-3 rounded-lg
        transition-colors duration-200
        ${isCompleted
          ? 'bg-[#f0f5f1] border border-[#c8e0cc]'
          : 'bg-[#ffffff] border border-[#e2e5da] hover:border-[#4A7C59]'
        }
      `}
      whileTap={!isCompleted ? { scale: 0.97 } : {}}
    >
      {/* Checkbox circle */}
      <motion.div
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0
          ${isCompleted ? 'border-[#4A7C59] bg-[#4A7C59]' : 'border-[#6b7a6b]'}
        `}
        animate={justCompleted ? {
          scale: [1, 1.3, 1],
          borderColor: ['#6b7a6b', '#4A7C59', '#4A7C59'],
        } : {}}
        transition={{ duration: 0.4 }}
      >
        {isCompleted && (
          <motion.svg
            viewBox="0 0 24 24"
            className="w-3.5 h-3.5 text-white"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <motion.path
              d="M5 13l4 4L19 7"
              stroke="currentColor"
              strokeWidth="3"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </motion.svg>
        )}
      </motion.div>

      {/* Habit name */}
      <div className="flex flex-col items-start min-w-0">
        <span className={`text-sm truncate ${isCompleted ? 'text-[#4A7C59]' : 'text-[#1F2A1F]'}`}>
          {habit.plant_name || habit.name}
        </span>
        {/* "You showed up today" micro-copy */}
        {justCompleted && (
          <motion.span
            className="text-[10px] text-[#4A7C59]"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            You showed up today.
          </motion.span>
        )}
      </div>

      {/* Growth animation burst */}
      <AnimatePresence>
        {justCompleted && (
          <motion.div
            className="absolute right-4 text-lg"
            initial={{ scale: 0, opacity: 0, y: 0 }}
            animate={{ scale: 1, opacity: 1, y: -10 }}
            exit={{ scale: 0, opacity: 0, y: -20 }}
            transition={{ duration: 0.6 }}
          >
            🌱
          </motion.div>
        )}
      </AnimatePresence>

      {loading && (
        <div className="absolute right-4">
          <div className="w-4 h-4 border-2 border-[#4A7C59] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error feedback */}
      {error && (
        <motion.span
          className="absolute right-4 text-[10px] text-[#c44030] max-w-[120px] text-right"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {error}
        </motion.span>
      )}
    </motion.button>
  );
}
