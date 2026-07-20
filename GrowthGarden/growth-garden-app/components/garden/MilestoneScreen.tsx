'use client';

import { motion } from 'framer-motion';
import { PlantSVG } from '@/components/plants/PlantSVG';
import { PlantStage } from '@/types';
import { getRareVariant } from '@/lib/utils/plantStage';

interface MilestoneScreenProps {
  streakCount: number;
  plantStage: PlantStage;
  onContinue: () => void;
}

const milestoneCopy: Record<number, string> = {
  7: '7 days of showing up for yourself.',
  30: 'A month of real consistency. This is rare.',
  100: '100 days. This plant exists because you kept coming back.',
};

export function MilestoneScreen({ streakCount, plantStage, onContinue }: MilestoneScreenProps) {
  const copy = milestoneCopy[streakCount] || `${streakCount} days of showing up for yourself.`;
  const variant = getRareVariant(streakCount);

  const bgColor = streakCount >= 100 ? '#0a0618' :
    streakCount >= 30 ? '#0d0820' : '#081210';

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center px-8"
      style={{ backgroundColor: bgColor }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Large plant */}
      <motion.div
        className="w-56 h-56 mb-8"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
      >
        <motion.div
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          <PlantSVG stage={plantStage} healthScore={100} variant={variant} />
        </motion.div>
      </motion.div>

      {/* Sparkle dots around the plant */}
      {Array.from({ length: 12 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-[#c0a0ff]"
          style={{
            top: `${30 + Math.sin(i * 0.52) * 20}%`,
            left: `${50 + Math.cos(i * 0.52) * 30}%`,
          }}
          animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.8, 1.2, 0.8] }}
          transition={{ duration: 2 + i * 0.3, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}

      {/* Copy */}
      <motion.p
        className="text-xl md:text-2xl text-center text-[#e0e6f0] font-light max-w-md leading-relaxed"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.8 }}
      >
        {copy}
      </motion.p>

      {/* Continue button */}
      <motion.button
        onClick={onContinue}
        className="mt-12 px-6 py-3 rounded-lg border border-[#252a38] text-[#8b95a8] hover:text-[#e0e6f0] hover:border-[#4a8a50] transition-colors text-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        Continue
      </motion.button>
    </motion.div>
  );
}
