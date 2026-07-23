'use client';

import { motion } from 'framer-motion';
import { Habit, FlowerSpecies } from '@/types';
import { SpeciesPlantSVG } from '@/components/plants/SpeciesPlantSVG';
import { getSpeciesForHabit, getMoodTier, CATEGORY_TO_SPECIES } from '@/lib/utils/species';
import { markBloomRevealed } from '@/lib/actions/habits';

interface BloomRevealProps {
  habit: Habit;
  reflectionCount: number;
  onDismiss: () => void;
}

const SPECIES_DISPLAY_NAMES: Record<FlowerSpecies, string> = {
  sunflower: 'Sunflower',
  lotus: 'Lotus',
  iris: 'Iris',
  tulip: 'Tulip',
  carnation: 'Carnation',
  rose: 'Rose',
  peony: 'Peony',
  daisy: 'Daisy',
};

export function BloomReveal({ habit, reflectionCount, onDismiss }: BloomRevealProps) {
  const species = getSpeciesForHabit(habit.category);
  const speciesName = SPECIES_DISPLAY_NAMES[species];
  const moodTier = getMoodTier(reflectionCount);

  async function handleDismiss() {
    await markBloomRevealed(habit.id);
    onDismiss();
  }

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center px-6"
      style={{ background: 'rgba(247,248,242,0.95)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={handleDismiss}
    >
      <motion.div
        className="flex flex-col items-center text-center max-w-sm"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      >
        {/* Flower reveal */}
        <motion.div
          className="w-48 h-48 mb-6"
          initial={{ scale: 0.3, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
          style={{ filter: 'drop-shadow(0 12px 32px rgba(74,124,89,0.2))' }}
        >
          <SpeciesPlantSVG
            stage="flowering"
            healthScore={habit.health_score}
            species={species}
            moodTier={moodTier}
          />
        </motion.div>

        {/* Text */}
        <motion.p
          className="text-xl font-bold mb-2"
          style={{ color: '#1F2A1F' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          🌸 It bloomed!
        </motion.p>
        <motion.p
          className="text-sm"
          style={{ color: '#5a6a5a' }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.5 }}
        >
          Your <span className="font-medium" style={{ color: '#1F2A1F' }}>{habit.plant_name || habit.name}</span> habit bloomed into a{' '}
          <span className="font-semibold" style={{ color: '#4A7C59' }}>{speciesName}</span>
        </motion.p>

        {/* Dismiss hint */}
        <motion.p
          className="text-xs mt-8"
          style={{ color: '#6b7a6b' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          Tap anywhere to continue
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
